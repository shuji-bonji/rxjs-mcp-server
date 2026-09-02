import { McpServer } from '@modelcontextprotocol/server';
import { createRequire } from 'node:module';
import { executeStreamTool } from './tools/execute-stream.js';
import { generateMarbleTool } from './tools/marble-diagram.js';
import { analyzeOperatorsTool } from './tools/analyze-operators.js';
import { detectMemoryLeakTool } from './tools/memory-leak.js';
import { suggestPatternTool } from './tools/suggest-pattern.js';
import { lintRxjsTool } from './tools/lint-rxjs.js';
import { ToolImplementation, RXJS_VERSION_TAG } from './types.js';

// Read version from package.json (single source of truth)
const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

export const SERVER_NAME = 'rxjs-mcp';
export const SERVER_VERSION = version;

/**
 * Returned to the client in the `initialize` response, so it is read before
 * any tool is chosen — earlier than the README and earlier than any tool
 * description. What it has to prevent is this server being read as an
 * authority on the caller's project: `execute_stream` runs a snippet in a
 * worker that has RxJS and nothing else, `lint_rxjs` and `detect_memory_leak`
 * match text rather than types, and the operator data is a bundled snapshot
 * rather than a live view of rxjs.dev. Each of those reads as a general
 * capability when only the tool names are seen.
 */
const INSTRUCTIONS = [
  'This server executes and inspects RxJS snippets in isolation. It does NOT run the caller\'s project.',
  '',
  'What it does NOT do:',
  `- It does not read, write, or import files from the caller's workspace. execute_stream evaluates the snippet in a worker thread whose only module is RxJS ${RXJS_VERSION_TAG} — no DOM, no network, no project dependencies. A snippet that imports from the project will not run here.`,
  '- lint_rxjs and detect_memory_leak match source text with regular expressions. They have no type information, so they do not replace running eslint-plugin-rxjs-x in the project, and a result with no findings is not evidence that the code is correct.',
  `- analyze_operators and suggest_pattern read a bundled dataset pinned to RxJS ${RXJS_VERSION_TAG}. An operator this server does not report is an operator the dataset does not carry, NOT an operator that does not exist in RxJS.`,
  '- It does not fetch rxjs.dev at call time. The Official / Source / Guide links in the output are built from the operator name.',
  '',
  'Tool results carry links to rxjs.dev (authoritative, for humans), the pinned GitHub source (JSDoc and implementation, readable by a model), and a bilingual guide. Follow the source link when the exact semantics of an operator decide the answer.',
].join('\n');

/**
 * Every tool this server exposes, in the order they are advertised.
 */
const tools: ToolImplementation[] = [
  executeStreamTool,
  generateMarbleTool,
  analyzeOperatorsTool,
  detectMemoryLeakTool,
  suggestPatternTool,
  lintRxjsTool,
];

/**
 * Create and configure the MCP server.
 *
 * This is the factory the stdio entry point hands to `serveStdio`, and the
 * same factory the protocol tests drive in-process through `createMcpHandler`.
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    { instructions: INSTRUCTIONS },
  );

  for (const { definition, handler } of tools) {
    server.registerTool(
      definition.name,
      {
        description: definition.description,
        inputSchema: definition.inputSchema,
        annotations: definition.annotations,
      },
      async (args) => handler(args),
    );
  }

  return server;
}
