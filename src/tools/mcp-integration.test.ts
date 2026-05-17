/**
 * MCP Server Integration Test (vitest port of test-mcp-server.mjs).
 *
 * Spawns the built `dist/index.js` as an MCP stdio server, speaks JSON-RPC
 * over stdin/stdout, and verifies each tool through the actual MCP surface.
 *
 * Requires that `dist/` is built. CI runs `npm run build` before `npm test`,
 * and the npm `prepare` script handles the local case.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_PATH = path.resolve(__dirname, '..', '..', 'dist', 'index.js');

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface CallToolResult {
  content: Array<{ type: 'text'; text: string }>;
}

interface ListToolsResult {
  tools: Array<{ name: string; description: string }>;
}

/** Minimal stdio JSON-RPC client tied to a single child process. */
class McpStdioClient {
  private server: ChildProcessWithoutNullStreams;
  private buffer = '';
  private pending = new Map<number, (response: JsonRpcResponse) => void>();
  private nextId = 1;

  constructor(serverPath: string) {
    this.server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.server.stdout.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed) as JsonRpcResponse;
          const resolver = this.pending.get(msg.id);
          if (resolver) {
            this.pending.delete(msg.id);
            resolver(msg);
          }
        } catch {
          // Partial chunk or non-JSON log — ignore.
        }
      }
    });

    // Keep stderr quiet during tests (server logs go here).
    this.server.stderr.on('data', () => { /* swallow */ });
  }

  async request<T>(method: string, params: unknown = {}, timeoutMs = 10_000): Promise<T> {
    const id = this.nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request "${method}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending.set(id, (response) => {
        clearTimeout(timer);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result as T);
        }
      });

      this.server.stdin.write(payload);
    });
  }

  kill(): void {
    this.server.kill();
  }
}

describe('MCP Server Integration', () => {
  // Skip the whole suite gracefully if dist hasn't been built yet (rather than
  // failing with an opaque ENOENT). CI always builds first, so this branch
  // only matters for local dev forgetting `npm run build`.
  if (!existsSync(SERVER_PATH)) {
    it.skip('skipped: dist/index.js not found — run `npm run build` first', () => {});
    return;
  }

  let client: McpStdioClient;

  beforeAll(async () => {
    client = new McpStdioClient(SERVER_PATH);
    await client.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'vitest-integration', version: '1.0.0' },
    });
  }, 15_000);

  afterAll(() => {
    client?.kill();
  });

  it('lists all 6 tools', async () => {
    const result = await client.request<ListToolsResult>('tools/list', {});
    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'analyze_operators',
      'detect_memory_leak',
      'execute_stream',
      'generate_marble',
      'lint_rxjs',
      'suggest_pattern',
    ]);
  });

  it('execute_stream — of(1,2,3) emits three values', async () => {
    const result = await client.request<CallToolResult>('tools/call', {
      name: 'execute_stream',
      arguments: {
        code: 'return of(1, 2, 3);',
        takeCount: 10,
        timeout: 5000,
      },
    });
    const text = result.content[0].text;
    expect(text).toContain('Status:** ✅ Completed');
    expect(text).toContain('Values Emitted:** 3');
  });

  it('analyze_operators — recognizes map and filter', async () => {
    const result = await client.request<CallToolResult>('tools/call', {
      name: 'analyze_operators',
      arguments: { code: 'source$.pipe(map(x => x * 2)).pipe(filter(x => x > 0));' },
    });
    const text = result.content[0].text;
    expect(text).toContain('map');
    expect(text).toContain('filter');
  });

  it('generate_marble — produces a diagram', async () => {
    const result = await client.request<CallToolResult>('tools/call', {
      name: 'generate_marble',
      arguments: {
        events: [
          { time: 0, value: 1, type: 'next' },
          { time: 100, value: 2, type: 'next' },
          { time: 200, value: 3, type: 'next' },
        ],
      },
    });
    expect(result.content[0].text).toContain('Marble Diagram');
  });

  it('detect_memory_leak — flags infinite interval', async () => {
    const result = await client.request<CallToolResult>('tools/call', {
      name: 'detect_memory_leak',
      arguments: { code: 'interval(1000).subscribe(x => console.log(x));' },
    });
    expect(result.content[0].text).toContain('Infinite interval');
  });

  it('suggest_pattern — returns search-typeahead pattern', async () => {
    const result = await client.request<CallToolResult>('tools/call', {
      name: 'suggest_pattern',
      arguments: { useCase: 'search-typeahead', framework: 'angular' },
    });
    expect(result.content[0].text).toContain('typeahead');
    expect(result.content[0].text).toContain('debounceTime');
  });

  it('lint_rxjs — flags prefer-root-operators', async () => {
    const result = await client.request<CallToolResult>('tools/call', {
      name: 'lint_rxjs',
      arguments: { code: "import { map } from 'rxjs/operators';" },
    });
    expect(result.content[0].text).toContain('prefer-root-operators');
  });

  it('returns a clear error for an unknown tool', async () => {
    await expect(
      client.request('tools/call', {
        name: 'no_such_tool',
        arguments: {},
      }),
    ).rejects.toThrow(/no_such_tool/);
  });
});
