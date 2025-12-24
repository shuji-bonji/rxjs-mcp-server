/**
 * Worker thread for isolated RxJS code execution
 * This runs in a separate thread to prevent main process pollution
 */
import { parentPort, workerData } from 'worker_threads';
import {
  Observable,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject,
  connectable,
  of,
  from,
  interval,
  timer,
  range,
  generate,
  concat,
  merge,
  combineLatest,
  zip,
  forkJoin,
  race,
  partition,
  iif,
  defer,
  scheduled,
  throwError,
  EMPTY,
  NEVER,
  firstValueFrom,
  lastValueFrom,
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
  defaultIfEmpty,
  every,
  isEmpty,
  catchError,
  retryWhen,
  share,
  shareReplay,
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

interface WorkerInput {
  code: string;
  takeCount: number;
  timeoutMs: number;
}

interface TimelineEvent {
  time: number;
  type: 'next' | 'error' | 'complete';
  value?: any;
}

interface WorkerResult {
  values: any[];
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

async function executeCode(input: WorkerInput): Promise<WorkerResult> {
  const result: WorkerResult = {
    values: [],
    errors: [],
    completed: false,
    hasError: false,
    timeline: [],
    executionTime: 0,
    memoryUsage: {
      before: 0,
      after: 0,
      peak: 0,
    },
  };

  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  result.memoryUsage.before = startMemory;

  try {
    // Create a safe execution context with RxJS imports
    // Note: We deliberately exclude process, require, import, fs, etc.
    const context = {
      Observable,
      Subject,
      BehaviorSubject,
      ReplaySubject,
      AsyncSubject,
      of,
      from,
      interval,
      timer,
      range,
      generate,
      concat,
      merge,
      combineLatest,
      zip,
      forkJoin,
      race,
      partition,
      iif,
      defer,
      scheduled,
      throwError,
      EMPTY,
      NEVER,
      firstValueFrom,
      lastValueFrom,
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
      defaultIfEmpty,
      every,
      isEmpty,
      catchError,
      retryWhen,
      share,
      shareReplay,
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
      // Safe globals only
      console: {
        log: (...args: any[]) => {},
        error: (...args: any[]) => {},
        warn: (...args: any[]) => {},
      },
      setTimeout,
      clearTimeout,
      Date,
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Promise,
      // Explicitly undefined dangerous globals
      process: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
      __dirname: undefined,
      __filename: undefined,
      global: undefined,
      globalThis: undefined,
    };

    // Create function with context
    const func = new Function(...Object.keys(context), `
      "use strict";
      ${input.code}
    `);

    // Execute the function with context
    const observable$ = func(...Object.values(context));

    if (!(observable$ instanceof Observable)) {
      throw new Error('Code must return an Observable');
    }

    // Execute the observable with limits
    await new Promise<void>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Stream execution timeout after ${input.timeoutMs}ms`));
      }, input.timeoutMs);

      let errorOccurred = false;

      const subscription = observable$
        .pipe(
          take(input.takeCount),
          tap(value => {
            const time = Date.now() - startTime;
            result.values.push(value);
            result.timeline.push({ time, type: 'next', value });
          }),
          catchError(error => {
            const time = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(errorMessage);
            result.timeline.push({ time, type: 'error', value: errorMessage });
            result.hasError = true;
            errorOccurred = true;
            return EMPTY;
          }),
          finalize(() => {
            clearTimeout(timeoutHandle);
            if (!errorOccurred) {
              result.completed = true;
            }
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
      }, input.timeoutMs);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    result.hasError = true;
  }

  result.executionTime = Date.now() - startTime;

  const endMemory = process.memoryUsage().heapUsed;
  result.memoryUsage.after = endMemory;
  result.memoryUsage.peak = Math.max(startMemory, endMemory);

  return result;
}

// Main worker entry point
const input = workerData as WorkerInput;

executeCode(input)
  .then(result => {
    parentPort?.postMessage({ success: true, result });
  })
  .catch(error => {
    parentPort?.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });
