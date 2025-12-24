import { z } from 'zod';
// RxJS 7.2+ modern import style - all from 'rxjs' except special modules
import {
  // Observable & Subject classes
  Observable,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject,
  connectable,

  // Creation Functions - basic
  of,
  from,
  fromEvent,
  interval,
  timer,

  // Creation Functions - loop
  range,
  generate,

  // Creation Functions - combination
  concat,
  merge,
  combineLatest,
  zip,
  forkJoin,

  // Creation Functions - selection
  race,
  partition,

  // Creation Functions - conditional
  iif,
  defer,

  // Creation Functions - control
  scheduled,

  // Other creation utilities
  throwError,
  EMPTY,
  NEVER,
  firstValueFrom,
  lastValueFrom,

  // Transformation operators
  map,
  scan,
  mergeScan,
  reduce,
  pairwise,
  groupBy,
  mergeMap,
  switchMap,
  concatMap,
  exhaustMap,
  expand,
  buffer,
  bufferTime,
  bufferCount,
  bufferWhen,
  bufferToggle,
  windowTime,
  window as windowOp,
  windowCount,
  windowToggle,
  windowWhen,

  // Filtering operators
  filter,
  take,
  takeLast,
  takeWhile,
  skip,
  skipLast,
  skipWhile,
  skipUntil,
  first,
  last,
  elementAt,
  find,
  findIndex,
  debounceTime,
  throttleTime,
  auditTime,
  audit,
  sampleTime,
  sample,
  ignoreElements,
  distinct,
  distinctUntilChanged,
  distinctUntilKeyChanged,

  // Combination operators (pipeable)
  concatWith,
  mergeWith,
  combineLatestWith,
  zipWith,
  raceWith,
  withLatestFrom,
  mergeAll,
  concatAll,
  switchAll,
  exhaustAll,
  combineLatestAll,
  zipAll,

  // Utility operators
  tap,
  delay,
  delayWhen,
  timeout,
  takeUntil,
  finalize,
  repeat,
  retry,
  startWith,
  endWith,
  toArray,
  materialize,
  dematerialize,
  observeOn,
  subscribeOn,
  timestamp,

  // Conditional operators
  defaultIfEmpty,
  every,
  isEmpty,

  // Error handling operators
  catchError,
  retryWhen,

  // Multicasting operators
  share,
  shareReplay,

  // Other useful operators
  pluck,
  mapTo,
  switchMapTo,
  mergeMapTo,
  concatMapTo,
  count,
  max,
  min,
  single,
  throwIfEmpty,
  connect,
  refCount,
} from 'rxjs';

// Special module imports (require separate paths)
import { ajax } from 'rxjs/ajax';

import { ToolImplementation, ToolResponse, StreamExecutionResult } from '../types.js';

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS code to execute. Should return an Observable.'),
  takeCount: z.number().optional().default(10).describe('Maximum number of values to take from the stream'),
  timeout: z.number().optional().default(5000).describe('Timeout in milliseconds'),
  captureTimeline: z.boolean().optional().default(true).describe('Whether to capture emission timeline'),
  captureMemory: z.boolean().optional().default(false).describe('Whether to capture memory usage'),
});

// Helper function to safely evaluate RxJS code
async function executeRxJSCode(code: string, takeCount: number, timeoutMs: number): Promise<StreamExecutionResult> {
  const result: StreamExecutionResult = {
    values: [],
    errors: [],
    completed: false,
    timeline: [],
    executionTime: 0,
  };

  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    // Create a safe execution context with RxJS imports
    const context = {
      // Observable and Subject classes
      Observable,
      Subject,
      BehaviorSubject,
      ReplaySubject,
      AsyncSubject,

      // Creation Functions - basic
      of,
      from,
      fromEvent,
      interval,
      timer,

      // Creation Functions - loop
      range,
      generate,

      // Creation Functions - http
      ajax,

      // Creation Functions - combination
      concat,
      merge,
      combineLatest,
      zip,
      forkJoin,

      // Creation Functions - selection
      race,
      partition,

      // Creation Functions - conditional
      iif,
      defer,

      // Creation Functions - control
      scheduled,

      // Other creation utilities
      throwError,
      EMPTY,
      NEVER,
      firstValueFrom,
      lastValueFrom,

      // Transformation operators
      map,
      scan,
      mergeScan,
      reduce,
      pairwise,
      groupBy,
      mergeMap,
      switchMap,
      concatMap,
      exhaustMap,
      expand,
      buffer,
      bufferTime,
      bufferCount,
      bufferWhen,
      bufferToggle,
      windowTime,
      window: windowOp,
      windowCount,
      windowToggle,
      windowWhen,

      // Filtering operators
      filter,
      take,
      takeLast,
      takeWhile,
      skip,
      skipLast,
      skipWhile,
      skipUntil,
      first,
      last,
      elementAt,
      find,
      findIndex,
      debounceTime,
      throttleTime,
      auditTime,
      audit,
      sampleTime,
      sample,
      ignoreElements,
      distinct,
      distinctUntilChanged,
      distinctUntilKeyChanged,

      // Combination operators (pipeable)
      concatWith,
      mergeWith,
      combineLatestWith,
      zipWith,
      raceWith,
      withLatestFrom,
      mergeAll,
      concatAll,
      switchAll,
      exhaustAll,
      combineLatestAll,
      zipAll,

      // Utility operators
      tap,
      delay,
      delayWhen,
      timeout,
      takeUntil,
      finalize,
      repeat,
      retry,
      startWith,
      endWith,
      toArray,
      materialize,
      dematerialize,
      observeOn,
      subscribeOn,
      timestamp,

      // Conditional operators
      defaultIfEmpty,
      every,
      isEmpty,

      // Error handling operators
      catchError,
      retryWhen,

      // Multicasting operators
      share,
      shareReplay,

      // Other useful operators
      pluck,
      mapTo,
      switchMapTo,
      mergeMapTo,
      concatMapTo,
      count,
      max,
      min,
      single,
      throwIfEmpty,
      connect,
      connectable,
      refCount,
    };

    // Create function with context
    const func = new Function(...Object.keys(context), `
      ${code}
    `);

    // Execute the function with context
    const observable$ = func(...Object.values(context));

    if (!(observable$ instanceof Observable)) {
      throw new Error('Code must return an Observable');
    }

    // Execute the observable with limits
    await new Promise<void>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Stream execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const subscription = observable$
        .pipe(
          take(takeCount),
          tap(value => {
            const time = Date.now() - startTime;
            result.values.push(value);
            result.timeline.push({ time, type: 'next', value });
          }),
          catchError(error => {
            const time = Date.now() - startTime;
            result.errors.push(error.message || error);
            result.timeline.push({ time, type: 'error', value: error.message });
            return EMPTY;
          }),
          finalize(() => {
            clearTimeout(timeoutHandle);
            result.completed = true;
            const time = Date.now() - startTime;
            result.timeline.push({ time, type: 'complete' });
          })
        )
        .subscribe({
          complete: () => resolve(),
          error: (err) => {
            clearTimeout(timeoutHandle);
            reject(err);
          }
        });

      // Clean up on timeout
      setTimeout(() => {
        subscription.unsubscribe();
      }, timeoutMs);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
  }

  result.executionTime = Date.now() - startTime;
  
  if (result.timeline.length === 0 && result.values.length === 0 && result.errors.length === 0) {
    result.errors.push('No emissions from the stream');
  }

  // Capture memory usage if requested
  const endMemory = process.memoryUsage().heapUsed;
  result.memoryUsage = {
    before: startMemory,
    after: endMemory,
    peak: Math.max(startMemory, endMemory),
  };

  return result;
}

// Format result for display
function formatResult(result: StreamExecutionResult, captureTimeline: boolean, captureMemory: boolean): string {
  const parts: string[] = [];

  // Execution summary
  parts.push('## Stream Execution Result\n');
  parts.push(`**Status:** ${result.completed ? '✅ Completed' : '⚠️ Not completed'}`);
  parts.push(`**Execution Time:** ${result.executionTime}ms`);
  parts.push(`**Values Emitted:** ${result.values.length}`);
  if (result.errors.length > 0) {
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
  if (result.errors.length > 0) {
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
    description: 'Execute RxJS code and capture the stream emissions, timeline, and performance metrics',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);
    
    try {
      const result = await executeRxJSCode(
        input.code,
        input.takeCount,
        input.timeout
      );
      
      const formatted = formatResult(result, input.captureTimeline, input.captureMemory);
      
      return {
        content: [{
          type: 'text',
          text: formatted,
        }],
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
