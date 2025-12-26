import { z } from 'zod';

// Tool response structure
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Tool handler function type
export type ToolHandler = (args: any) => Promise<ToolResponse>;

// Tool definition structure
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  outputSchema?: any;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

// Tool implementation structure
export interface ToolImplementation {
  definition: ToolDefinition;
  handler: ToolHandler;
}

// Creation Function categories (based on https://shuji-bonji.github.io/RxJS-with-TypeScript/)
export type CreationFunctionCategory =
  | 'basic'        // of, from, fromEvent, interval, timer
  | 'loop'         // range, generate
  | 'http'         // ajax, fromFetch
  | 'combination'  // concat, merge, combineLatest, zip, forkJoin
  | 'selection'    // race, partition
  | 'conditional'  // iif, defer
  | 'control';     // scheduled, using

// Pipeable Operator categories (based on https://shuji-bonji.github.io/RxJS-with-TypeScript/)
export type PipeableOperatorCategory =
  | 'transformation'  // map, scan, switchMap, mergeMap, concatMap, etc.
  | 'filtering'       // filter, take, skip, debounceTime, throttleTime, etc.
  | 'combination'     // concatWith, mergeWith, combineLatestWith, zipWith, etc.
  | 'utility'         // tap, delay, timeout, takeUntil, finalize, etc.
  | 'conditional'     // defaultIfEmpty, every, isEmpty
  | 'error-handling'  // catchError, retry, retryWhen
  | 'multicasting';   // share, shareReplay

// Base URL for documentation
export const DOC_BASE_URL = 'https://shuji-bonji.github.io/RxJS-with-TypeScript/en/guide';

// Creation Function information
export interface CreationFunctionInfo {
  name: string;
  category: CreationFunctionCategory;
  description: string;
  docUrl: string;
  marblePattern?: string;
}

// Pipeable Operator information
export interface OperatorInfo {
  name: string;
  category: PipeableOperatorCategory;
  description: string;
  docUrl: string;
  marblePattern?: string;
}

// Legacy type alias for backward compatibility
export type LegacyOperatorCategory = 'creation' | 'transformation' | 'filtering' | 'combination' | 'utility' | 'error-handling' | 'multicasting';

// Stream execution result
export interface StreamExecutionResult {
  values: any[];
  errors: any[];
  completed: boolean;
  timeline: Array<{
    time: number;
    type: 'next' | 'error' | 'complete';
    value?: any;
  }>;
  executionTime: number;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

// Pattern suggestion
export interface PatternSuggestion {
  name: string;
  description: string;
  code: string;
  useCase: string;
  operators: string[];
  considerations: string[];
}

// Memory leak detection result
export interface MemoryLeakResult {
  hasLeak: boolean;
  leakSources: Array<{
    type: 'subscription' | 'subject' | 'operator';
    description: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  recommendations: string[];
}

// Marble diagram result
export interface MarbleDiagramResult {
  diagram: string;
  explanation: string;
  timeline: Array<{
    time: number;
    value?: any;
  }>;
}

// ============================================
// Worker Thread Types
// ============================================

/**
 * Timeline event in stream execution
 */
export interface TimelineEvent {
  time: number;
  type: 'next' | 'error' | 'complete';
  value?: unknown;
}

/**
 * Input data for Worker thread
 */
export interface WorkerInput {
  code: string;
  takeCount: number;
  timeoutMs: number;
}

/**
 * Result from Worker thread execution
 */
export interface WorkerResult {
  values: unknown[];
  errors: string[];
  completed: boolean;
  hasError: boolean;
  timeline: TimelineEvent[];
  executionTime: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
}

/**
 * Message sent from Worker to main thread
 */
export interface WorkerMessage {
  success: boolean;
  result?: WorkerResult;
  error?: string;
}
