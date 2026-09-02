#!/usr/bin/env node
import { serveStdio, type StdioServerHandle } from '@modelcontextprotocol/server/stdio';
import { createServer, SERVER_NAME, SERVER_VERSION } from './server.js';

/**
 * Handle returned by `serveStdio`. Closed on shutdown so the transport is torn
 * down before the process exits.
 */
let stdioHandle: StdioServerHandle | undefined;

/**
 * Start the server on stdio.
 *
 * `serveStdio` owns the transport and the protocol era decision: the opening
 * exchange selects the era, one instance from the factory is pinned for the
 * lifetime of the connection, and clients speaking the 2025 revisions are
 * served from the same factory (`legacy: 'serve'` is the default).
 */
function runStdio(): void {
  stdioHandle = serveStdio(() => createServer(), {
    onerror: (error) => console.error(`stdio transport error: ${error.message}`),
  });

  // stdout is the JSON-RPC channel, so every log line goes to stderr.
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

async function gracefulShutdown(signal: string): Promise<void> {
  console.error(`Received ${signal}, shutting down RxJS MCP Server...`);
  try {
    await stdioHandle?.close();
    process.exit(0);
  } catch (error) {
    console.error('Shutdown error:', error);
    process.exit(1);
  }
}

function main(): void {
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));

  try {
    runStdio();
  } catch (error) {
    console.error('Failed to start RxJS MCP Server:', error);
    process.exit(1);
  }
}

main();
