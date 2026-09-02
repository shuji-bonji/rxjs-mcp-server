/**
 * Protocol-level tests: drive the shipped `createServer` factory through a real
 * MCP `Client`, in-process.
 *
 * These guard a failure that neither `tsc` nor the unit tests can see. When the
 * Zod schemas cannot be converted to JSON Schema — for example when a zod below
 * 4.2.0 is installed — registration still succeeds, the server still starts and
 * still accepts a connection, and only `tools/list` reports the error. Asserting
 * on `tools/list` here turns that into a test failure.
 */
import { describe, it, expect } from 'vitest';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { createServer } from './server.js';

async function connect(factory: () => McpServer): Promise<Client> {
  const handler = createMcpHandler(factory);
  const transport = new StreamableHTTPClientTransport(new URL('http://test.local/mcp'), {
    fetch: (url, init) => handler.fetch(new Request(url, init)),
  });
  const client = new Client(
    { name: 'rxjs-mcp-test-harness', version: '0.0.0' },
    { versionNegotiation: { mode: 'auto' } },
  );
  await client.connect(transport);
  return client;
}

describe('MCP protocol surface', () => {
  it('advertises all six tools with converted JSON Schemas', async () => {
    const client = await connect(createServer);
    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name).sort()).toEqual([
      'analyze_operators',
      'detect_memory_leak',
      'execute_stream',
      'generate_marble',
      'lint_rxjs',
      'suggest_pattern',
    ]);

    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.description).toBeTruthy();
    }

    await client.close();
  });

  it('keeps .describe() text in the advertised input schema', async () => {
    const client = await connect(createServer);
    const { tools } = await client.listTools();

    const executeStream = tools.find((t) => t.name === 'execute_stream');
    const properties = executeStream?.inputSchema.properties as
      | Record<string, { description?: string }>
      | undefined;

    expect(properties?.code?.description).toBe(
      'RxJS code to execute. Should return an Observable.',
    );
    expect(properties?.timeout?.description).toBe('Timeout in milliseconds');

    await client.close();
  });

  it('advertises the read-only annotations', async () => {
    const client = await connect(createServer);
    const { tools } = await client.listTools();

    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.idempotentHint).toBe(true);
    }

    await client.close();
  });

  it('reports the server instructions in the initialize response', async () => {
    const client = await connect(createServer);

    expect(client.getInstructions()).toContain('It does NOT run the caller');

    await client.close();
  });

  it('rejects arguments the schema refuses before the handler runs', async () => {
    const client = await connect(createServer);

    const result = await client.callTool({
      name: 'suggest_pattern',
      arguments: { useCase: 'no-such-use-case' },
    });

    expect(result.isError).toBe(true);

    await client.close();
  });

  it('runs a stream through tools/call', async () => {
    const client = await connect(createServer);

    const result = await client.callTool({
      name: 'execute_stream',
      arguments: { code: 'return of(1, 2, 3);', takeCount: 10, timeout: 5000 },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain('Values Emitted:** 3');

    await client.close();
  });
});
