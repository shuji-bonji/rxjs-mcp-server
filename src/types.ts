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

// ============================================
// URL Constants
// ============================================

/** Bilingual guide repository (JP/EN) — raw markdown, AI-readable */
export const GUIDE_BASE_URL = 'https://github.com/shuji-bonji/RxJS-with-TypeScript/blob/main/docs/en/guide';

/** Official RxJS documentation (SPA — not AI-readable, but authoritative for humans) */
export const OFFICIAL_BASE_URL = 'https://rxjs.dev';

/** GitHub source pinned at stable tag (AI-readable, contains JSDoc + implementation) */
export const RXJS_VERSION_TAG = '7.8.2';
export const SOURCE_BASE_URL = `https://github.com/ReactiveX/rxjs/blob/${RXJS_VERSION_TAG}/src/internal`;

/**
 * @deprecated Use GUIDE_BASE_URL instead. Will be removed in v0.4.0.
 */
export const DOC_BASE_URL = GUIDE_BASE_URL;

// ============================================
// URL Helpers
// ============================================

/** Build official rxjs.dev URL for an operator or creation function */
export function buildOfficialUrl(type: 'operator' | 'creation', name: string): string {
  if (type === 'creation') {
    return `${OFFICIAL_BASE_URL}/api/index/function/${name}`;
  }
  return `${OFFICIAL_BASE_URL}/api/operators/${name}`;
}

/** Build GitHub source URL for an operator */
export function buildSourceUrl(path: string): string {
  return `${SOURCE_BASE_URL}/${path}`;
}

/** Build guide repository URL (raw markdown on GitHub) */
export function buildGuideUrl(path: string): string {
  return `${GUIDE_BASE_URL}/${path}.md`;
}

// ============================================
// Deprecation Metadata
// ============================================

export interface DeprecationInfo {
  /** Whether this API is deprecated */
  deprecated: true;
  /** RxJS version when deprecated (e.g., '7.2.0') */
  since: string;
  /** Recommended replacement (e.g., 'map' or 'retry({ delay })') */
  replacement: string;
}

// ============================================
// Data Interfaces
// ============================================

// Creation Function information
export interface CreationFunctionInfo {
  name: string;
  category: CreationFunctionCategory;
  description: string;
  /** Official rxjs.dev URL (authoritative, human-readable) */
  officialUrl: string;
  /** GitHub source URL pinned at tag (AI-readable) */
  sourceUrl?: string;
  /** Bilingual guide URL (JP/EN learner-friendly) */
  guideUrl?: string;
  marblePattern?: string;
  deprecation?: DeprecationInfo;
}

// Pipeable Operator information
export interface OperatorInfo {
  name: string;
  category: PipeableOperatorCategory;
  description: string;
  /** Official rxjs.dev URL (authoritative, human-readable) */
  officialUrl: string;
  /** GitHub source URL pinned at tag (AI-readable) */
  sourceUrl?: string;
  /** Bilingual guide URL (JP/EN learner-friendly) */
  guideUrl?: string;
  marblePattern?: string;
  deprecation?: DeprecationInfo;
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
