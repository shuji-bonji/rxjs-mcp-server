import { z } from 'zod';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  ToolImplementation,
  ToolResponse,
  StreamExecutionResult,
  WorkerMessage,
} from '../types.js';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Determine the worker path - handle both src (vitest) and dist (production) scenarios
 */
function getWorkerPath(): string {
  if (__dirname.includes('/src/')) {
    // Running from src - look for compiled worker in dist
    return path.resolve(__dirname, '../../dist/tools/execute-stream-worker.js');
  }
  // Running from dist
  return path.join(__dirname, 'execute-stream-worker.js');
}

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS code to execute. Should return an Observable.'),
  takeCount: z.number().optional().default(10).describe('Maximum number of values to take from the stream'),
  timeout: z.number().optional().default(5000).describe('Timeout in milliseconds'),
  captureTimeline: z.boolean().optional().default(true).describe('Whether to capture emission timeline'),
  captureMemory: z.boolean().optional().default(false).describe('Whether to capture memory usage'),
});

/**
 * Create an empty/error result
 */
function createErrorResult(error: string, executionTime = 0): StreamExecutionResult {
  return {
    values: [],
    errors: [error],
    completed: false,
    timeline: [],
    executionTime,
    memoryUsage: { before: 0, after: 0, peak: 0 },
  };
}

/**
 * Execute RxJS code in an isolated Worker thread
 * This prevents any side effects from affecting the main process
 */
async function executeRxJSCodeInWorker(
  code: string,
  takeCount: number,
  timeoutMs: number
): Promise<StreamExecutionResult> {
  return new Promise((resolve) => {
    const workerPath = getWorkerPath();

    const worker = new Worker(workerPath, {
      workerData: { code, takeCount, timeoutMs },
    });

    // Set a hard timeout that will kill the worker
    const hardTimeout = setTimeout(() => {
      worker.terminate().then(() => {
        resolve(createErrorResult(
          `Execution forcefully terminated after ${timeoutMs}ms timeout`,
          timeoutMs
        ));
      });
    }, timeoutMs + 1000); // Give 1 extra second for graceful completion

    worker.on('message', (message: WorkerMessage) => {
      clearTimeout(hardTimeout);

      if (message.success && message.result) {
        const result = message.result;
        resolve({
          values: result.values,
          errors: result.errors,
          completed: result.completed && !result.hasError,
          timeline: result.timeline,
          executionTime: result.executionTime,
          memoryUsage: result.memoryUsage,
        });
      } else {
        resolve(createErrorResult(message.error || 'Unknown worker error'));
      }

      worker.terminate();
    });

    worker.on('error', (error) => {
      clearTimeout(hardTimeout);
      resolve(createErrorResult(error.message || 'Worker execution error'));
      worker.terminate();
    });

    worker.on('exit', (code) => {
      clearTimeout(hardTimeout);
      if (code !== 0) {
        resolve(createErrorResult(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * Format execution result for display
 */
function formatResult(
  result: StreamExecutionResult,
  captureTimeline: boolean,
  captureMemory: boolean
): string {
  const parts: string[] = [];
  const hasErrors = result.errors.length > 0;

  // Execution summary
  parts.push('## Stream Execution Result\n');

  // Status
  if (hasErrors && !result.completed) {
    parts.push('**Status:** ❌ Error');
  } else if (hasErrors && result.completed) {
    parts.push('**Status:** ⚠️ Completed with errors');
  } else if (result.completed) {
    parts.push('**Status:** ✅ Completed');
  } else {
    parts.push('**Status:** ⚠️ Not completed');
  }

  parts.push(`**Execution Time:** ${result.executionTime}ms`);
  parts.push(`**Values Emitted:** ${result.values.length}`);
  if (hasErrors) {
    parts.push(`**Errors:** ${result.errors.length}`);
  }
  parts.push('');

  // Emitted values
  if (result.values.length > 0) {
    parts.push('### Emitted Values');
    parts.push('```json');
    parts.push(JSON.stringify(result.values, null, 2));
    parts.push('```');
    parts.push('');
  }

  // Errors
  if (hasErrors) {
    parts.push('### Errors');
    result.errors.forEach((error, i) => {
      parts.push(`${i + 1}. ${error}`);
    });
    parts.push('');
  }

  // Timeline
  if (captureTimeline && result.timeline.length > 0) {
    parts.push('### Emission Timeline');
    parts.push('```');
    result.timeline.forEach(event => {
      const marker = event.type === 'next' ? '→' : event.type === 'error' ? '✗' : '|';
      const value = event.value !== undefined ? ` ${JSON.stringify(event.value)}` : '';
      parts.push(`${event.time.toString().padStart(5)}ms ${marker}${value}`);
    });
    parts.push('```');
    parts.push('');
  }

  // Memory usage
  if (captureMemory && result.memoryUsage) {
    parts.push('### Memory Usage');
    const beforeMB = (result.memoryUsage.before / 1024 / 1024).toFixed(2);
    const afterMB = (result.memoryUsage.after / 1024 / 1024).toFixed(2);
    const deltaMB = ((result.memoryUsage.after - result.memoryUsage.before) / 1024 / 1024).toFixed(2);
    parts.push(`- Before: ${beforeMB} MB`);
    parts.push(`- After: ${afterMB} MB`);
    parts.push(`- Delta: ${deltaMB} MB`);
  }

  return parts.join('\n');
}

// Tool implementation
export const executeStreamTool: ToolImplementation = {
  definition: {
    name: 'execute_stream',
    description: 'Execute RxJS code in an isolated environment and capture the stream emissions, timeline, and performance metrics. Code runs in a separate worker thread for security.',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);

    try {
      const result = await executeRxJSCodeInWorker(
        input.code,
        input.takeCount,
        input.timeout
      );

      const formatted = formatResult(result, input.captureTimeline, input.captureMemory);

      return {
        content: [{ type: 'text', text: formatted }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `## Execution Error\n\n${errorMessage}\n\n### Troubleshooting\n- Check syntax errors in the code\n- Ensure the code returns an Observable\n- Verify operator usage and imports`,
        }],
      };
    }
  },
};
