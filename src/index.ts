#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { executeStreamTool } from './tools/execute-stream.js';
import { generateMarbleTool } from './tools/marble-diagram.js';
import { analyzeOperatorsTool } from './tools/analyze-operators.js';
import { detectMemoryLeakTool } from './tools/memory-leak.js';
import { suggestPatternTool } from './tools/suggest-pattern.js';
import { ToolHandler, ToolDefinition } from './types.js';

// Server configuration
const server = new Server(
  {
    name: 'rxjs-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools: ToolDefinition[] = [
  executeStreamTool.definition,
  generateMarbleTool.definition,
  analyzeOperatorsTool.definition,
  detectMemoryLeakTool.definition,
  suggestPatternTool.definition,
];

// Tool handlers mapping
const toolHandlers: Record<string, ToolHandler> = {
  'execute_stream': executeStreamTool.handler,
  'generate_marble': generateMarbleTool.handler,
  'analyze_operators': analyzeOperatorsTool.handler,
  'detect_memory_leak': detectMemoryLeakTool.handler,
  'suggest_pattern': suggestPatternTool.handler,
};

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema, { target: 'openApi3' }),
      outputSchema: tool.outputSchema,
      annotations: tool.annotations,
    })),
  };
});

// Handle tool execution request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolHandlers[name];
  if (!handler) {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Tool "${name}" not found. Available tools: ${Object.keys(toolHandlers).join(', ')}`
    );
  }

  try {
    const result = await handler(args);
    return {
      content: result.content,
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new McpError(
      ErrorCode.InternalError,
      `Tool "${name}" failed: ${errorMessage}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  
  try {
    await server.connect(transport);
    console.error('RxJS MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start RxJS MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down RxJS MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down RxJS MCP Server...');
  process.exit(0);
});

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
