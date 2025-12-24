import { z } from 'zod';
import { ToolImplementation, ToolResponse, OperatorInfo, CreationFunctionInfo, DOC_BASE_URL } from '../types.js';

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS operator chain code to analyze'),
  includeAlternatives: z.boolean().optional().default(true).describe('Whether to suggest alternative approaches'),
  checkPerformance: z.boolean().optional().default(true).describe('Whether to check for performance issues'),
});

// Creation Functions database (based on https://shuji-bonji.github.io/RxJS-with-TypeScript/)
const creationFunctionDatabase: Record<string, CreationFunctionInfo> = {
  // basic
  'of': { name: 'of', category: 'basic', description: 'Emits the arguments you provide, then completes', docUrl: `${DOC_BASE_URL}/creation-functions/basic/of` },
  'from': { name: 'from', category: 'basic', description: 'Creates an Observable from an Array, Promise, or Iterable', docUrl: `${DOC_BASE_URL}/creation-functions/basic/from` },
  'fromEvent': { name: 'fromEvent', category: 'basic', description: 'Creates an Observable from DOM events', docUrl: `${DOC_BASE_URL}/creation-functions/basic/fromEvent` },
  'interval': { name: 'interval', category: 'basic', description: 'Emits incremental numbers at specified intervals', docUrl: `${DOC_BASE_URL}/creation-functions/basic/interval` },
  'timer': { name: 'timer', category: 'basic', description: 'Emits after a delay, then optionally at intervals', docUrl: `${DOC_BASE_URL}/creation-functions/basic/timer` },

  // loop
  'range': { name: 'range', category: 'loop', description: 'Emits a sequence of numbers within a range', docUrl: `${DOC_BASE_URL}/creation-functions/loop/range` },
  'generate': { name: 'generate', category: 'loop', description: 'Creates an Observable with custom iteration logic', docUrl: `${DOC_BASE_URL}/creation-functions/loop/generate` },

  // http
  'ajax': { name: 'ajax', category: 'http', description: 'Creates an Observable for AJAX requests', docUrl: `${DOC_BASE_URL}/creation-functions/http/ajax` },
  'fromFetch': { name: 'fromFetch', category: 'http', description: 'Creates an Observable from Fetch API', docUrl: `${DOC_BASE_URL}/creation-functions/http/fromFetch` },

  // combination
  'concat': { name: 'concat', category: 'combination', description: 'Concatenates Observables in sequence', docUrl: `${DOC_BASE_URL}/creation-functions/combination/concat` },
  'merge': { name: 'merge', category: 'combination', description: 'Combines multiple Observables, emitting all values', docUrl: `${DOC_BASE_URL}/creation-functions/combination/merge` },
  'combineLatest': { name: 'combineLatest', category: 'combination', description: 'Combines latest values from all Observables', docUrl: `${DOC_BASE_URL}/creation-functions/combination/combineLatest` },
  'zip': { name: 'zip', category: 'combination', description: 'Combines values by index into arrays', docUrl: `${DOC_BASE_URL}/creation-functions/combination/zip` },
  'forkJoin': { name: 'forkJoin', category: 'combination', description: 'Waits for all to complete, emits final values', docUrl: `${DOC_BASE_URL}/creation-functions/combination/forkJoin` },

  // selection
  'race': { name: 'race', category: 'selection', description: 'Emits from the Observable that emits first', docUrl: `${DOC_BASE_URL}/creation-functions/selection/race` },
  'partition': { name: 'partition', category: 'selection', description: 'Splits Observable into two based on predicate', docUrl: `${DOC_BASE_URL}/creation-functions/selection/partition` },

  // conditional
  'iif': { name: 'iif', category: 'conditional', description: 'Subscribes to one of two Observables based on condition', docUrl: `${DOC_BASE_URL}/creation-functions/conditional/iif` },
  'defer': { name: 'defer', category: 'conditional', description: 'Creates Observable lazily at subscription time', docUrl: `${DOC_BASE_URL}/creation-functions/conditional/defer` },

  // control
  'scheduled': { name: 'scheduled', category: 'control', description: 'Creates an Observable with a specific scheduler', docUrl: `${DOC_BASE_URL}/creation-functions/control/scheduled` },
  'using': { name: 'using', category: 'control', description: 'Creates Observable with resource management', docUrl: `${DOC_BASE_URL}/creation-functions/control/using` },
};

// Pipeable Operators database (based on https://shuji-bonji.github.io/RxJS-with-TypeScript/)
const operatorDatabase: Record<string, OperatorInfo> = {
  // Transformation operators
  'map': { name: 'map', category: 'transformation', description: 'Transforms each value by applying a function', docUrl: `${DOC_BASE_URL}/operators/transformation/map` },
  'scan': { name: 'scan', category: 'transformation', description: 'Accumulates values over time, emits each step', docUrl: `${DOC_BASE_URL}/operators/transformation/scan` },
  'mergeScan': { name: 'mergeScan', category: 'transformation', description: 'Like scan but with inner Observable merging', docUrl: `${DOC_BASE_URL}/operators/transformation/mergeScan` },
  'reduce': { name: 'reduce', category: 'transformation', description: 'Accumulates values and emits final result on completion', docUrl: `${DOC_BASE_URL}/operators/transformation/reduce` },
  'pairwise': { name: 'pairwise', category: 'transformation', description: 'Emits previous and current value as array', docUrl: `${DOC_BASE_URL}/operators/transformation/pairwise` },
  'groupBy': { name: 'groupBy', category: 'transformation', description: 'Groups emissions by key into separate Observables', docUrl: `${DOC_BASE_URL}/operators/transformation/groupBy` },
  'mergeMap': { name: 'mergeMap', category: 'transformation', description: 'Projects values to inner Observable, running concurrently', docUrl: `${DOC_BASE_URL}/operators/transformation/mergeMap`, marblePattern: '-a---b---c--| → -A-B-C-D-E-F-|' },
  'switchMap': { name: 'switchMap', category: 'transformation', description: 'Projects values to inner Observable, cancelling previous', docUrl: `${DOC_BASE_URL}/operators/transformation/switchMap`, marblePattern: '-a---b---c--| → -A-B-C-D-E-F-|' },
  'concatMap': { name: 'concatMap', category: 'transformation', description: 'Projects values to inner Observable, waiting for completion', docUrl: `${DOC_BASE_URL}/operators/transformation/concatMap`, marblePattern: '-a---b---c--| → -A-A-B-B-C-C-|' },
  'exhaustMap': { name: 'exhaustMap', category: 'transformation', description: 'Projects values to inner Observable, ignoring new while active', docUrl: `${DOC_BASE_URL}/operators/transformation/exhaustMap`, marblePattern: '-a---b---c--| → -A-A-A---C-C-|' },
  'expand': { name: 'expand', category: 'transformation', description: 'Recursively projects values to inner Observables', docUrl: `${DOC_BASE_URL}/operators/transformation/expand` },
  'buffer': { name: 'buffer', category: 'transformation', description: 'Buffers values until notifier emits', docUrl: `${DOC_BASE_URL}/operators/transformation/buffer` },
  'bufferTime': { name: 'bufferTime', category: 'transformation', description: 'Buffers values for specified time periods', docUrl: `${DOC_BASE_URL}/operators/transformation/bufferTime` },
  'bufferCount': { name: 'bufferCount', category: 'transformation', description: 'Buffers specified number of values', docUrl: `${DOC_BASE_URL}/operators/transformation/bufferCount` },
  'bufferWhen': { name: 'bufferWhen', category: 'transformation', description: 'Buffers values using closing selector', docUrl: `${DOC_BASE_URL}/operators/transformation/bufferWhen` },
  'bufferToggle': { name: 'bufferToggle', category: 'transformation', description: 'Buffers values based on opening and closing signals', docUrl: `${DOC_BASE_URL}/operators/transformation/bufferToggle` },
  'windowTime': { name: 'windowTime', category: 'transformation', description: 'Splits source into nested Observables by time', docUrl: `${DOC_BASE_URL}/operators/transformation/windowTime` },
  'window': { name: 'window', category: 'transformation', description: 'Splits source into nested Observable windows', docUrl: `${DOC_BASE_URL}/operators/transformation/window` },
  'windowCount': { name: 'windowCount', category: 'transformation', description: 'Splits source into nested Observables by count', docUrl: `${DOC_BASE_URL}/operators/transformation/windowCount` },
  'windowToggle': { name: 'windowToggle', category: 'transformation', description: 'Splits source based on opening and closing signals', docUrl: `${DOC_BASE_URL}/operators/transformation/windowToggle` },
  'windowWhen': { name: 'windowWhen', category: 'transformation', description: 'Splits source using closing selector', docUrl: `${DOC_BASE_URL}/operators/transformation/windowWhen` },

  // Filtering operators
  'filter': { name: 'filter', category: 'filtering', description: 'Emits only values that pass a predicate test', docUrl: `${DOC_BASE_URL}/operators/filtering/filter` },
  'take': { name: 'take', category: 'filtering', description: 'Emits only the first n values, then completes', docUrl: `${DOC_BASE_URL}/operators/filtering/take` },
  'takeLast': { name: 'takeLast', category: 'filtering', description: 'Emits only the last n values on completion', docUrl: `${DOC_BASE_URL}/operators/filtering/takeLast` },
  'takeWhile': { name: 'takeWhile', category: 'filtering', description: 'Emits while condition is true', docUrl: `${DOC_BASE_URL}/operators/filtering/takeWhile` },
  'skip': { name: 'skip', category: 'filtering', description: 'Skips the first n emissions', docUrl: `${DOC_BASE_URL}/operators/filtering/skip` },
  'skipLast': { name: 'skipLast', category: 'filtering', description: 'Skips the last n emissions', docUrl: `${DOC_BASE_URL}/operators/filtering/skipLast` },
  'skipWhile': { name: 'skipWhile', category: 'filtering', description: 'Skips while condition is true', docUrl: `${DOC_BASE_URL}/operators/filtering/skipWhile` },
  'skipUntil': { name: 'skipUntil', category: 'filtering', description: 'Skips until another Observable emits', docUrl: `${DOC_BASE_URL}/operators/filtering/skipUntil` },
  'first': { name: 'first', category: 'filtering', description: 'Emits only the first value (or first matching)', docUrl: `${DOC_BASE_URL}/operators/filtering/first` },
  'last': { name: 'last', category: 'filtering', description: 'Emits only the last value (or last matching)', docUrl: `${DOC_BASE_URL}/operators/filtering/last` },
  'elementAt': { name: 'elementAt', category: 'filtering', description: 'Emits only the value at specified index', docUrl: `${DOC_BASE_URL}/operators/filtering/elementAt` },
  'find': { name: 'find', category: 'filtering', description: 'Emits first value that matches predicate', docUrl: `${DOC_BASE_URL}/operators/filtering/find` },
  'findIndex': { name: 'findIndex', category: 'filtering', description: 'Emits index of first value that matches', docUrl: `${DOC_BASE_URL}/operators/filtering/findIndex` },
  'debounceTime': { name: 'debounceTime', category: 'filtering', description: 'Emits after a period of inactivity', docUrl: `${DOC_BASE_URL}/operators/filtering/debounceTime` },
  'throttleTime': { name: 'throttleTime', category: 'filtering', description: 'Emits first value, then ignores for duration', docUrl: `${DOC_BASE_URL}/operators/filtering/throttleTime` },
  'auditTime': { name: 'auditTime', category: 'filtering', description: 'Emits most recent value after duration', docUrl: `${DOC_BASE_URL}/operators/filtering/auditTime` },
  'audit': { name: 'audit', category: 'filtering', description: 'Emits most recent value when notifier emits', docUrl: `${DOC_BASE_URL}/operators/filtering/audit` },
  'sampleTime': { name: 'sampleTime', category: 'filtering', description: 'Emits most recent value at intervals', docUrl: `${DOC_BASE_URL}/operators/filtering/sampleTime` },
  'ignoreElements': { name: 'ignoreElements', category: 'filtering', description: 'Ignores all emissions, only passes complete/error', docUrl: `${DOC_BASE_URL}/operators/filtering/ignoreElements` },
  'distinct': { name: 'distinct', category: 'filtering', description: 'Emits only distinct values', docUrl: `${DOC_BASE_URL}/operators/filtering/distinct` },
  'distinctUntilChanged': { name: 'distinctUntilChanged', category: 'filtering', description: 'Emits when value changes from previous', docUrl: `${DOC_BASE_URL}/operators/filtering/distinctUntilChanged` },
  'distinctUntilKeyChanged': { name: 'distinctUntilKeyChanged', category: 'filtering', description: 'Emits when specific key value changes', docUrl: `${DOC_BASE_URL}/operators/filtering/distinctUntilKeyChanged` },

  // Combination operators (pipeable)
  'concatWith': { name: 'concatWith', category: 'combination', description: 'Concatenates with other Observables in sequence', docUrl: `${DOC_BASE_URL}/operators/combination/concatWith` },
  'mergeWith': { name: 'mergeWith', category: 'combination', description: 'Merges with other Observables concurrently', docUrl: `${DOC_BASE_URL}/operators/combination/mergeWith` },
  'combineLatestWith': { name: 'combineLatestWith', category: 'combination', description: 'Combines latest values with other Observables', docUrl: `${DOC_BASE_URL}/operators/combination/combineLatestWith` },
  'zipWith': { name: 'zipWith', category: 'combination', description: 'Zips with other Observables by index', docUrl: `${DOC_BASE_URL}/operators/combination/zipWith` },
  'raceWith': { name: 'raceWith', category: 'combination', description: 'Races with other Observables, first wins', docUrl: `${DOC_BASE_URL}/operators/combination/raceWith` },
  'withLatestFrom': { name: 'withLatestFrom', category: 'combination', description: 'Combines with latest value from another Observable', docUrl: `${DOC_BASE_URL}/operators/combination/withLatestFrom` },
  'mergeAll': { name: 'mergeAll', category: 'combination', description: 'Flattens higher-order Observable concurrently', docUrl: `${DOC_BASE_URL}/operators/combination/mergeAll` },
  'concatAll': { name: 'concatAll', category: 'combination', description: 'Flattens higher-order Observable in sequence', docUrl: `${DOC_BASE_URL}/operators/combination/concatAll` },
  'switchAll': { name: 'switchAll', category: 'combination', description: 'Flattens to latest inner Observable', docUrl: `${DOC_BASE_URL}/operators/combination/switchAll` },
  'exhaustAll': { name: 'exhaustAll', category: 'combination', description: 'Flattens, ignoring new while active', docUrl: `${DOC_BASE_URL}/operators/combination/exhaustAll` },
  'combineLatestAll': { name: 'combineLatestAll', category: 'combination', description: 'Flattens with combineLatest strategy', docUrl: `${DOC_BASE_URL}/operators/combination/combineLatestAll` },
  'zipAll': { name: 'zipAll', category: 'combination', description: 'Flattens with zip strategy', docUrl: `${DOC_BASE_URL}/operators/combination/zipAll` },

  // Utility operators
  'tap': { name: 'tap', category: 'utility', description: 'Performs side effects without altering emissions', docUrl: `${DOC_BASE_URL}/operators/utility/tap` },
  'delay': { name: 'delay', category: 'utility', description: 'Delays emissions by specified time', docUrl: `${DOC_BASE_URL}/operators/utility/delay` },
  'delayWhen': { name: 'delayWhen', category: 'utility', description: 'Delays emissions based on another Observable', docUrl: `${DOC_BASE_URL}/operators/utility/delayWhen` },
  'timeout': { name: 'timeout', category: 'utility', description: 'Errors if no emission within specified time', docUrl: `${DOC_BASE_URL}/operators/utility/timeout` },
  'takeUntil': { name: 'takeUntil', category: 'utility', description: 'Emits until another Observable emits', docUrl: `${DOC_BASE_URL}/operators/utility/takeUntil` },
  'finalize': { name: 'finalize', category: 'utility', description: 'Executes callback on completion or error', docUrl: `${DOC_BASE_URL}/operators/utility/finalize` },
  'repeat': { name: 'repeat', category: 'utility', description: 'Resubscribes to source on completion', docUrl: `${DOC_BASE_URL}/operators/utility/repeat` },
  'startWith': { name: 'startWith', category: 'utility', description: 'Emits specified values before source emissions', docUrl: `${DOC_BASE_URL}/operators/utility/startWith` },
  'endWith': { name: 'endWith', category: 'utility', description: 'Emits specified values after source completes', docUrl: `${DOC_BASE_URL}/operators/utility/endWith` },
  'toArray': { name: 'toArray', category: 'utility', description: 'Collects all emissions into an array', docUrl: `${DOC_BASE_URL}/operators/utility/toArray` },
  'materialize': { name: 'materialize', category: 'utility', description: 'Converts emissions to Notification objects', docUrl: `${DOC_BASE_URL}/operators/utility/materialize` },
  'dematerialize': { name: 'dematerialize', category: 'utility', description: 'Converts Notification objects to emissions', docUrl: `${DOC_BASE_URL}/operators/utility/dematerialize` },
  'observeOn': { name: 'observeOn', category: 'utility', description: 'Re-emits values on specified scheduler', docUrl: `${DOC_BASE_URL}/operators/utility/observeOn` },
  'subscribeOn': { name: 'subscribeOn', category: 'utility', description: 'Subscribes on specified scheduler', docUrl: `${DOC_BASE_URL}/operators/utility/subscribeOn` },
  'timestamp': { name: 'timestamp', category: 'utility', description: 'Attaches timestamp to each emission', docUrl: `${DOC_BASE_URL}/operators/utility/timestamp` },

  // Conditional operators
  'defaultIfEmpty': { name: 'defaultIfEmpty', category: 'conditional', description: 'Emits default value if source completes empty', docUrl: `${DOC_BASE_URL}/operators/conditional/defaultIfEmpty` },
  'every': { name: 'every', category: 'conditional', description: 'Emits true if all values pass predicate', docUrl: `${DOC_BASE_URL}/operators/conditional/every` },
  'isEmpty': { name: 'isEmpty', category: 'conditional', description: 'Emits true if source completes without emitting', docUrl: `${DOC_BASE_URL}/operators/conditional/isEmpty` },

  // Error handling operators
  'catchError': { name: 'catchError', category: 'error-handling', description: 'Catches errors and returns new Observable', docUrl: `${DOC_BASE_URL}/operators/error-handling/catchError` },
  'retry': { name: 'retry', category: 'error-handling', description: 'Retries the source Observable on error', docUrl: `${DOC_BASE_URL}/operators/error-handling/retry` },
  'retryWhen': { name: 'retryWhen', category: 'error-handling', description: 'Retries based on custom logic', docUrl: `${DOC_BASE_URL}/operators/error-handling/retryWhen` },

  // Multicasting operators
  'share': { name: 'share', category: 'multicasting', description: 'Shares a single subscription among observers', docUrl: `${DOC_BASE_URL}/operators/multicasting/share` },
  'shareReplay': { name: 'shareReplay', category: 'multicasting', description: 'Shares and replays specified emissions', docUrl: `${DOC_BASE_URL}/operators/multicasting/shareReplay` },

  // Legacy/deprecated but still commonly used
  'pluck': { name: 'pluck', category: 'transformation', description: 'Plucks a nested property from emitted objects (deprecated: use map)', docUrl: `${DOC_BASE_URL}/operators/transformation/pluck` },
  'mapTo': { name: 'mapTo', category: 'transformation', description: 'Maps every emission to a constant value (deprecated: use map)', docUrl: `${DOC_BASE_URL}/operators/transformation/mapTo` },
};

// Extract creation functions from code
function extractCreationFunctions(code: string): string[] {
  const functions: string[] = [];

  Object.keys(creationFunctionDatabase).forEach(fn => {
    // Match standalone function calls like of(), from(), interval()
    const fnRegex = new RegExp(`\\b${fn}\\s*\\(`, 'g');
    if (fnRegex.test(code) && !functions.includes(fn)) {
      functions.push(fn);
    }
  });

  return functions;
}

// Extract operators from code
function extractOperators(code: string): string[] {
  const operators: string[] = [];

  // Match operators inside .pipe()
  const pipeRegex = /\.pipe\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)/gs;
  let pipeMatch;

  while ((pipeMatch = pipeRegex.exec(code)) !== null) {
    const pipeContent = pipeMatch[1];
    Object.keys(operatorDatabase).forEach(op => {
      const opRegex = new RegExp(`\\b${op}\\s*\\(`, 'g');
      if (opRegex.test(pipeContent) && !operators.includes(op)) {
        operators.push(op);
      }
    });
  }

  // Also check for operators used with method chaining (legacy style)
  Object.keys(operatorDatabase).forEach(op => {
    const standaloneRegex = new RegExp(`\\.${op}\\s*\\(`, 'g');
    if (standaloneRegex.test(code) && !operators.includes(op)) {
      operators.push(op);
    }
  });

  return operators;
}

// Analyze creation functions
function analyzeCreationFunctions(functions: string[]) {
  return functions.map(fn => {
    const info = creationFunctionDatabase[fn];
    if (info) {
      return info;
    }
    return {
      name: fn,
      category: 'basic' as const,
      description: 'Unknown creation function',
      docUrl: '',
    };
  });
}

// Analyze operator chain
function analyzeOperatorChain(operators: string[], checkPerformance: boolean) {
  const analysis = {
    operators: operators.map(op => {
      const info = operatorDatabase[op];
      if (info) {
        return info;
      }
      return {
        name: op,
        category: 'utility' as const,
        description: 'Custom or unknown operator',
        docUrl: '',
      };
    }),
    categories: {} as Record<string, number>,
    performance: [] as string[],
    suggestions: [] as string[],
  };

  // Count categories
  analysis.operators.forEach(op => {
    analysis.categories[op.category] = (analysis.categories[op.category] || 0) + 1;
  });

  // Performance checks
  if (checkPerformance) {
    // Check for multiple switchMap/mergeMap
    const flatteningOps = operators.filter(op => ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'].includes(op));
    if (flatteningOps.length > 1) {
      analysis.performance.push(`⚠️ Multiple flattening operators (${flatteningOps.join(', ')}) may cause unnecessary complexity`);
    }

    // Check for filter after map
    for (let i = 0; i < operators.length - 1; i++) {
      if (operators[i] === 'map' && operators[i + 1] === 'filter') {
        analysis.performance.push('💡 Consider combining map + filter into a single operation');
      }
    }

    // Check for multiple subscriptions without share
    if (!operators.includes('share') && !operators.includes('shareReplay')) {
      if (operators.some(op => ['switchMap', 'mergeMap', 'concatMap'].includes(op))) {
        analysis.suggestions.push('Consider adding `share()` or `shareReplay()` if multiple subscriptions exist');
      }
    }

    // Check for missing error handling
    const hasErrorHandling = operators.some(op => ['catchError', 'retry', 'retryWhen'].includes(op));
    if (!hasErrorHandling && operators.some(op => ['switchMap', 'mergeMap', 'concatMap'].includes(op))) {
      analysis.suggestions.push('Consider adding error handling with `catchError()` or `retry()`');
    }

    // Check for potential memory leaks
    if (operators.includes('shareReplay')) {
      analysis.performance.push('⚠️ `shareReplay()` without buffer limit may cause memory issues');
    }

    // Check for missing takeUntil
    if (!operators.some(op => op.startsWith('take')) && operators.length > 3) {
      analysis.suggestions.push('Consider using `takeUntil()` for proper cleanup in components');
    }
  }

  return analysis;
}

// Suggest alternatives
function suggestAlternatives(operators: string[]): string[] {
  const suggestions: string[] = [];
  
  // switchMap vs mergeMap vs concatMap vs exhaustMap
  if (operators.includes('mergeMap')) {
    suggestions.push('- **mergeMap**: Concurrent execution (current choice)\n- **switchMap**: Cancel previous, good for searches\n- **concatMap**: Sequential, preserves order\n- **exhaustMap**: Ignore new while processing');
  }
  
  // debounceTime vs throttleTime vs auditTime
  if (operators.some(op => ['debounceTime', 'throttleTime', 'auditTime'].includes(op))) {
    suggestions.push('**Rate limiting options:**\n- **debounceTime**: Wait for pause in emissions\n- **throttleTime**: Emit first, then ignore\n- **auditTime**: Emit last value after duration\n- **sampleTime**: Emit at regular intervals');
  }
  
  return suggestions;
}

// Tool implementation
export const analyzeOperatorsTool: ToolImplementation = {
  definition: {
    name: 'analyze_operators',
    description: 'Analyze RxJS code for creation functions, operators, performance patterns, and best practices',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);

    try {
      const creationFunctions = extractCreationFunctions(input.code);
      const operators = extractOperators(input.code);

      if (creationFunctions.length === 0 && operators.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '## No RxJS code detected\n\nPlease provide code containing RxJS creation functions or operators to analyze.',
          }],
        };
      }

      const creationAnalysis = analyzeCreationFunctions(creationFunctions);
      const operatorAnalysis = analyzeOperatorChain(operators, input.checkPerformance);
      const alternatives = input.includeAlternatives ? suggestAlternatives(operators) : [];

      const parts: string[] = [
        '## RxJS Code Analysis',
        '',
      ];

      // Creation Functions section
      if (creationFunctions.length > 0) {
        parts.push('### Creation Functions');
        parts.push(`**Total:** ${creationFunctions.length}`);
        parts.push('');

        // Group by category
        const byCategory: Record<string, typeof creationAnalysis> = {};
        creationAnalysis.forEach(fn => {
          if (!byCategory[fn.category]) {
            byCategory[fn.category] = [];
          }
          byCategory[fn.category].push(fn);
        });

        Object.entries(byCategory).forEach(([category, fns]) => {
          parts.push(`**${category}:**`);
          fns.forEach(fn => {
            parts.push(`- **${fn.name}**: ${fn.description}`);
            if (fn.docUrl) {
              parts.push(`  - 📖 [Documentation](${fn.docUrl})`);
            }
          });
          parts.push('');
        });
      }

      // Pipeable Operators section
      if (operators.length > 0) {
        parts.push('### Pipeable Operators');
        parts.push(`**Total:** ${operators.length}`);
        parts.push(`**Chain:** \`${operators.join(' → ')}\``);
        parts.push('');

        // Categories summary
        parts.push('**Categories:**');
        Object.entries(operatorAnalysis.categories).forEach(([category, count]) => {
          parts.push(`- ${category}: ${count} operator(s)`);
        });
        parts.push('');

        // Operator details
        parts.push('**Details:**');
        operatorAnalysis.operators.forEach((op, i) => {
          parts.push(`${i + 1}. **${op.name}** (${op.category})`);
          parts.push(`   - ${op.description}`);
          if (op.marblePattern) {
            parts.push(`   - Pattern: \`${op.marblePattern}\``);
          }
          if (op.docUrl) {
            parts.push(`   - 📖 [Documentation](${op.docUrl})`);
          }
        });
        parts.push('');
      }

      // Performance section
      if (operatorAnalysis.performance.length > 0) {
        parts.push('### Performance Considerations');
        operatorAnalysis.performance.forEach(perf => parts.push(perf));
        parts.push('');
      }

      // Suggestions section
      if (operatorAnalysis.suggestions.length > 0) {
        parts.push('### Suggestions');
        operatorAnalysis.suggestions.forEach(sug => parts.push(`- ${sug}`));
        parts.push('');
      }

      // Alternatives section
      if (alternatives.length > 0) {
        parts.push('### Alternative Approaches');
        alternatives.forEach(alt => parts.push(alt));
        parts.push('');
      }

      // Documentation reference
      parts.push('---');
      parts.push(`📚 Reference: [RxJS with TypeScript](${DOC_BASE_URL})`);

      return {
        content: [{
          type: 'text',
          text: parts.join('\n'),
        }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `## Error analyzing code\n\n${errorMessage}`,
        }],
      };
    }
  },
};
