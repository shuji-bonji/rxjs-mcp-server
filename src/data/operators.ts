import { OperatorInfo, DOC_BASE_URL } from '../types.js';

/**
 * RxJS Pipeable Operators Database
 * Based on https://shuji-bonji.github.io/RxJS-with-TypeScript/
 */
export const operatorDatabase: Record<string, OperatorInfo> = {
  // Transformation operators
  'map': {
    name: 'map',
    category: 'transformation',
    description: 'Transforms each value by applying a function',
    docUrl: `${DOC_BASE_URL}/operators/transformation/map`,
  },
  'scan': {
    name: 'scan',
    category: 'transformation',
    description: 'Accumulates values over time, emits each step',
    docUrl: `${DOC_BASE_URL}/operators/transformation/scan`,
  },
  'mergeScan': {
    name: 'mergeScan',
    category: 'transformation',
    description: 'Like scan but with inner Observable merging',
    docUrl: `${DOC_BASE_URL}/operators/transformation/mergeScan`,
  },
  'reduce': {
    name: 'reduce',
    category: 'transformation',
    description: 'Accumulates values and emits final result on completion',
    docUrl: `${DOC_BASE_URL}/operators/transformation/reduce`,
  },
  'pairwise': {
    name: 'pairwise',
    category: 'transformation',
    description: 'Emits previous and current value as array',
    docUrl: `${DOC_BASE_URL}/operators/transformation/pairwise`,
  },
  'groupBy': {
    name: 'groupBy',
    category: 'transformation',
    description: 'Groups emissions by key into separate Observables',
    docUrl: `${DOC_BASE_URL}/operators/transformation/groupBy`,
  },
  'mergeMap': {
    name: 'mergeMap',
    category: 'transformation',
    description: 'Projects values to inner Observable, running concurrently',
    docUrl: `${DOC_BASE_URL}/operators/transformation/mergeMap`,
    marblePattern: '-a---b---c--| → -A-B-C-D-E-F-|',
  },
  'switchMap': {
    name: 'switchMap',
    category: 'transformation',
    description: 'Projects values to inner Observable, cancelling previous',
    docUrl: `${DOC_BASE_URL}/operators/transformation/switchMap`,
    marblePattern: '-a---b---c--| → -A-B-C-D-E-F-|',
  },
  'concatMap': {
    name: 'concatMap',
    category: 'transformation',
    description: 'Projects values to inner Observable, waiting for completion',
    docUrl: `${DOC_BASE_URL}/operators/transformation/concatMap`,
    marblePattern: '-a---b---c--| → -A-A-B-B-C-C-|',
  },
  'exhaustMap': {
    name: 'exhaustMap',
    category: 'transformation',
    description: 'Projects values to inner Observable, ignoring new while active',
    docUrl: `${DOC_BASE_URL}/operators/transformation/exhaustMap`,
    marblePattern: '-a---b---c--| → -A-A-A---C-C-|',
  },
  'expand': {
    name: 'expand',
    category: 'transformation',
    description: 'Recursively projects values to inner Observables',
    docUrl: `${DOC_BASE_URL}/operators/transformation/expand`,
  },
  'buffer': {
    name: 'buffer',
    category: 'transformation',
    description: 'Buffers values until notifier emits',
    docUrl: `${DOC_BASE_URL}/operators/transformation/buffer`,
  },
  'bufferTime': {
    name: 'bufferTime',
    category: 'transformation',
    description: 'Buffers values for specified time periods',
    docUrl: `${DOC_BASE_URL}/operators/transformation/bufferTime`,
  },
  'bufferCount': {
    name: 'bufferCount',
    category: 'transformation',
    description: 'Buffers specified number of values',
    docUrl: `${DOC_BASE_URL}/operators/transformation/bufferCount`,
  },
  'bufferWhen': {
    name: 'bufferWhen',
    category: 'transformation',
    description: 'Buffers values using closing selector',
    docUrl: `${DOC_BASE_URL}/operators/transformation/bufferWhen`,
  },
  'bufferToggle': {
    name: 'bufferToggle',
    category: 'transformation',
    description: 'Buffers values based on opening and closing signals',
    docUrl: `${DOC_BASE_URL}/operators/transformation/bufferToggle`,
  },
  'windowTime': {
    name: 'windowTime',
    category: 'transformation',
    description: 'Splits source into nested Observables by time',
    docUrl: `${DOC_BASE_URL}/operators/transformation/windowTime`,
  },
  'window': {
    name: 'window',
    category: 'transformation',
    description: 'Splits source into nested Observable windows',
    docUrl: `${DOC_BASE_URL}/operators/transformation/window`,
  },
  'windowCount': {
    name: 'windowCount',
    category: 'transformation',
    description: 'Splits source into nested Observables by count',
    docUrl: `${DOC_BASE_URL}/operators/transformation/windowCount`,
  },
  'windowToggle': {
    name: 'windowToggle',
    category: 'transformation',
    description: 'Splits source based on opening and closing signals',
    docUrl: `${DOC_BASE_URL}/operators/transformation/windowToggle`,
  },
  'windowWhen': {
    name: 'windowWhen',
    category: 'transformation',
    description: 'Splits source using closing selector',
    docUrl: `${DOC_BASE_URL}/operators/transformation/windowWhen`,
  },

  // Filtering operators
  'filter': {
    name: 'filter',
    category: 'filtering',
    description: 'Emits only values that pass a predicate test',
    docUrl: `${DOC_BASE_URL}/operators/filtering/filter`,
  },
  'take': {
    name: 'take',
    category: 'filtering',
    description: 'Emits only the first n values, then completes',
    docUrl: `${DOC_BASE_URL}/operators/filtering/take`,
  },
  'takeLast': {
    name: 'takeLast',
    category: 'filtering',
    description: 'Emits only the last n values on completion',
    docUrl: `${DOC_BASE_URL}/operators/filtering/takeLast`,
  },
  'takeWhile': {
    name: 'takeWhile',
    category: 'filtering',
    description: 'Emits while condition is true',
    docUrl: `${DOC_BASE_URL}/operators/filtering/takeWhile`,
  },
  'skip': {
    name: 'skip',
    category: 'filtering',
    description: 'Skips the first n emissions',
    docUrl: `${DOC_BASE_URL}/operators/filtering/skip`,
  },
  'skipLast': {
    name: 'skipLast',
    category: 'filtering',
    description: 'Skips the last n emissions',
    docUrl: `${DOC_BASE_URL}/operators/filtering/skipLast`,
  },
  'skipWhile': {
    name: 'skipWhile',
    category: 'filtering',
    description: 'Skips while condition is true',
    docUrl: `${DOC_BASE_URL}/operators/filtering/skipWhile`,
  },
  'skipUntil': {
    name: 'skipUntil',
    category: 'filtering',
    description: 'Skips until another Observable emits',
    docUrl: `${DOC_BASE_URL}/operators/filtering/skipUntil`,
  },
  'first': {
    name: 'first',
    category: 'filtering',
    description: 'Emits only the first value (or first matching)',
    docUrl: `${DOC_BASE_URL}/operators/filtering/first`,
  },
  'last': {
    name: 'last',
    category: 'filtering',
    description: 'Emits only the last value (or last matching)',
    docUrl: `${DOC_BASE_URL}/operators/filtering/last`,
  },
  'elementAt': {
    name: 'elementAt',
    category: 'filtering',
    description: 'Emits only the value at specified index',
    docUrl: `${DOC_BASE_URL}/operators/filtering/elementAt`,
  },
  'find': {
    name: 'find',
    category: 'filtering',
    description: 'Emits first value that matches predicate',
    docUrl: `${DOC_BASE_URL}/operators/filtering/find`,
  },
  'findIndex': {
    name: 'findIndex',
    category: 'filtering',
    description: 'Emits index of first value that matches',
    docUrl: `${DOC_BASE_URL}/operators/filtering/findIndex`,
  },
  'debounceTime': {
    name: 'debounceTime',
    category: 'filtering',
    description: 'Emits after a period of inactivity',
    docUrl: `${DOC_BASE_URL}/operators/filtering/debounceTime`,
  },
  'throttleTime': {
    name: 'throttleTime',
    category: 'filtering',
    description: 'Emits first value, then ignores for duration',
    docUrl: `${DOC_BASE_URL}/operators/filtering/throttleTime`,
  },
  'auditTime': {
    name: 'auditTime',
    category: 'filtering',
    description: 'Emits most recent value after duration',
    docUrl: `${DOC_BASE_URL}/operators/filtering/auditTime`,
  },
  'audit': {
    name: 'audit',
    category: 'filtering',
    description: 'Emits most recent value when notifier emits',
    docUrl: `${DOC_BASE_URL}/operators/filtering/audit`,
  },
  'sampleTime': {
    name: 'sampleTime',
    category: 'filtering',
    description: 'Emits most recent value at intervals',
    docUrl: `${DOC_BASE_URL}/operators/filtering/sampleTime`,
  },
  'ignoreElements': {
    name: 'ignoreElements',
    category: 'filtering',
    description: 'Ignores all emissions, only passes complete/error',
    docUrl: `${DOC_BASE_URL}/operators/filtering/ignoreElements`,
  },
  'distinct': {
    name: 'distinct',
    category: 'filtering',
    description: 'Emits only distinct values',
    docUrl: `${DOC_BASE_URL}/operators/filtering/distinct`,
  },
  'distinctUntilChanged': {
    name: 'distinctUntilChanged',
    category: 'filtering',
    description: 'Emits when value changes from previous',
    docUrl: `${DOC_BASE_URL}/operators/filtering/distinctUntilChanged`,
  },
  'distinctUntilKeyChanged': {
    name: 'distinctUntilKeyChanged',
    category: 'filtering',
    description: 'Emits when specific key value changes',
    docUrl: `${DOC_BASE_URL}/operators/filtering/distinctUntilKeyChanged`,
  },

  // Combination operators (pipeable)
  'concatWith': {
    name: 'concatWith',
    category: 'combination',
    description: 'Concatenates with other Observables in sequence',
    docUrl: `${DOC_BASE_URL}/operators/combination/concatWith`,
  },
  'mergeWith': {
    name: 'mergeWith',
    category: 'combination',
    description: 'Merges with other Observables concurrently',
    docUrl: `${DOC_BASE_URL}/operators/combination/mergeWith`,
  },
  'combineLatestWith': {
    name: 'combineLatestWith',
    category: 'combination',
    description: 'Combines latest values with other Observables',
    docUrl: `${DOC_BASE_URL}/operators/combination/combineLatestWith`,
  },
  'zipWith': {
    name: 'zipWith',
    category: 'combination',
    description: 'Zips with other Observables by index',
    docUrl: `${DOC_BASE_URL}/operators/combination/zipWith`,
  },
  'raceWith': {
    name: 'raceWith',
    category: 'combination',
    description: 'Races with other Observables, first wins',
    docUrl: `${DOC_BASE_URL}/operators/combination/raceWith`,
  },
  'withLatestFrom': {
    name: 'withLatestFrom',
    category: 'combination',
    description: 'Combines with latest value from another Observable',
    docUrl: `${DOC_BASE_URL}/operators/combination/withLatestFrom`,
  },
  'mergeAll': {
    name: 'mergeAll',
    category: 'combination',
    description: 'Flattens higher-order Observable concurrently',
    docUrl: `${DOC_BASE_URL}/operators/combination/mergeAll`,
  },
  'concatAll': {
    name: 'concatAll',
    category: 'combination',
    description: 'Flattens higher-order Observable in sequence',
    docUrl: `${DOC_BASE_URL}/operators/combination/concatAll`,
  },
  'switchAll': {
    name: 'switchAll',
    category: 'combination',
    description: 'Flattens to latest inner Observable',
    docUrl: `${DOC_BASE_URL}/operators/combination/switchAll`,
  },
  'exhaustAll': {
    name: 'exhaustAll',
    category: 'combination',
    description: 'Flattens, ignoring new while active',
    docUrl: `${DOC_BASE_URL}/operators/combination/exhaustAll`,
  },
  'combineLatestAll': {
    name: 'combineLatestAll',
    category: 'combination',
    description: 'Flattens with combineLatest strategy',
    docUrl: `${DOC_BASE_URL}/operators/combination/combineLatestAll`,
  },
  'zipAll': {
    name: 'zipAll',
    category: 'combination',
    description: 'Flattens with zip strategy',
    docUrl: `${DOC_BASE_URL}/operators/combination/zipAll`,
  },

  // Utility operators
  'tap': {
    name: 'tap',
    category: 'utility',
    description: 'Performs side effects without altering emissions',
    docUrl: `${DOC_BASE_URL}/operators/utility/tap`,
  },
  'delay': {
    name: 'delay',
    category: 'utility',
    description: 'Delays emissions by specified time',
    docUrl: `${DOC_BASE_URL}/operators/utility/delay`,
  },
  'delayWhen': {
    name: 'delayWhen',
    category: 'utility',
    description: 'Delays emissions based on another Observable',
    docUrl: `${DOC_BASE_URL}/operators/utility/delayWhen`,
  },
  'timeout': {
    name: 'timeout',
    category: 'utility',
    description: 'Errors if no emission within specified time',
    docUrl: `${DOC_BASE_URL}/operators/utility/timeout`,
  },
  'takeUntil': {
    name: 'takeUntil',
    category: 'utility',
    description: 'Emits until another Observable emits',
    docUrl: `${DOC_BASE_URL}/operators/utility/takeUntil`,
  },
  'finalize': {
    name: 'finalize',
    category: 'utility',
    description: 'Executes callback on completion or error',
    docUrl: `${DOC_BASE_URL}/operators/utility/finalize`,
  },
  'repeat': {
    name: 'repeat',
    category: 'utility',
    description: 'Resubscribes to source on completion',
    docUrl: `${DOC_BASE_URL}/operators/utility/repeat`,
  },
  'startWith': {
    name: 'startWith',
    category: 'utility',
    description: 'Emits specified values before source emissions',
    docUrl: `${DOC_BASE_URL}/operators/utility/startWith`,
  },
  'endWith': {
    name: 'endWith',
    category: 'utility',
    description: 'Emits specified values after source completes',
    docUrl: `${DOC_BASE_URL}/operators/utility/endWith`,
  },
  'toArray': {
    name: 'toArray',
    category: 'utility',
    description: 'Collects all emissions into an array',
    docUrl: `${DOC_BASE_URL}/operators/utility/toArray`,
  },
  'materialize': {
    name: 'materialize',
    category: 'utility',
    description: 'Converts emissions to Notification objects',
    docUrl: `${DOC_BASE_URL}/operators/utility/materialize`,
  },
  'dematerialize': {
    name: 'dematerialize',
    category: 'utility',
    description: 'Converts Notification objects to emissions',
    docUrl: `${DOC_BASE_URL}/operators/utility/dematerialize`,
  },
  'observeOn': {
    name: 'observeOn',
    category: 'utility',
    description: 'Re-emits values on specified scheduler',
    docUrl: `${DOC_BASE_URL}/operators/utility/observeOn`,
  },
  'subscribeOn': {
    name: 'subscribeOn',
    category: 'utility',
    description: 'Subscribes on specified scheduler',
    docUrl: `${DOC_BASE_URL}/operators/utility/subscribeOn`,
  },
  'timestamp': {
    name: 'timestamp',
    category: 'utility',
    description: 'Attaches timestamp to each emission',
    docUrl: `${DOC_BASE_URL}/operators/utility/timestamp`,
  },

  // Conditional operators
  'defaultIfEmpty': {
    name: 'defaultIfEmpty',
    category: 'conditional',
    description: 'Emits default value if source completes empty',
    docUrl: `${DOC_BASE_URL}/operators/conditional/defaultIfEmpty`,
  },
  'every': {
    name: 'every',
    category: 'conditional',
    description: 'Emits true if all values pass predicate',
    docUrl: `${DOC_BASE_URL}/operators/conditional/every`,
  },
  'isEmpty': {
    name: 'isEmpty',
    category: 'conditional',
    description: 'Emits true if source completes without emitting',
    docUrl: `${DOC_BASE_URL}/operators/conditional/isEmpty`,
  },

  // Error handling operators
  'catchError': {
    name: 'catchError',
    category: 'error-handling',
    description: 'Catches errors and returns new Observable',
    docUrl: `${DOC_BASE_URL}/operators/error-handling/catchError`,
  },
  'retry': {
    name: 'retry',
    category: 'error-handling',
    description: 'Retries the source Observable on error',
    docUrl: `${DOC_BASE_URL}/operators/error-handling/retry`,
  },
  'retryWhen': {
    name: 'retryWhen',
    category: 'error-handling',
    description: 'Retries based on custom logic',
    docUrl: `${DOC_BASE_URL}/operators/error-handling/retryWhen`,
  },

  // Multicasting operators
  'share': {
    name: 'share',
    category: 'multicasting',
    description: 'Shares a single subscription among observers',
    docUrl: `${DOC_BASE_URL}/operators/multicasting/share`,
  },
  'shareReplay': {
    name: 'shareReplay',
    category: 'multicasting',
    description: 'Shares and replays specified emissions',
    docUrl: `${DOC_BASE_URL}/operators/multicasting/shareReplay`,
  },

  // Legacy/deprecated but still commonly used
  'pluck': {
    name: 'pluck',
    category: 'transformation',
    description: 'Plucks a nested property from emitted objects (deprecated: use map)',
    docUrl: `${DOC_BASE_URL}/operators/transformation/pluck`,
  },
  'mapTo': {
    name: 'mapTo',
    category: 'transformation',
    description: 'Maps every emission to a constant value (deprecated: use map)',
    docUrl: `${DOC_BASE_URL}/operators/transformation/mapTo`,
  },
};
