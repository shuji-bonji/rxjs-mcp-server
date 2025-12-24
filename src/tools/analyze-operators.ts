import { z } from 'zod';
import { ToolImplementation, ToolResponse, OperatorInfo } from '../types.js';

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS operator chain code to analyze'),
  includeAlternatives: z.boolean().optional().default(true).describe('Whether to suggest alternative approaches'),
  checkPerformance: z.boolean().optional().default(true).describe('Whether to check for performance issues'),
});

// Operator database
const operatorDatabase: Record<string, OperatorInfo> = {
  // Creation operators
  'of': { name: 'of', category: 'creation', description: 'Emits the arguments you provide, then completes' },
  'from': { name: 'from', category: 'creation', description: 'Creates an Observable from an Array, Promise, or Iterable' },
  'interval': { name: 'interval', category: 'creation', description: 'Emits incremental numbers at specified intervals' },
  'timer': { name: 'timer', category: 'creation', description: 'Emits after a delay, then optionally at intervals' },
  'range': { name: 'range', category: 'creation', description: 'Emits a sequence of numbers within a range' },
  
  // Transformation operators
  'map': { name: 'map', category: 'transformation', description: 'Transforms each value by applying a function' },
  'mapTo': { name: 'mapTo', category: 'transformation', description: 'Maps every emission to a constant value' },
  'pluck': { name: 'pluck', category: 'transformation', description: 'Plucks a nested property from emitted objects' },
  'switchMap': { name: 'switchMap', category: 'transformation', description: 'Projects values to inner Observable, cancelling previous', marblePattern: '-a---b---c--| → -A-B-C-D-E-F-|' },
  'mergeMap': { name: 'mergeMap', category: 'transformation', description: 'Projects values to inner Observable, running concurrently', marblePattern: '-a---b---c--| → -A-B-C-D-E-F-|' },
  'concatMap': { name: 'concatMap', category: 'transformation', description: 'Projects values to inner Observable, waiting for completion', marblePattern: '-a---b---c--| → -A-A-B-B-C-C-|' },
  'exhaustMap': { name: 'exhaustMap', category: 'transformation', description: 'Projects values to inner Observable, ignoring new while active', marblePattern: '-a---b---c--| → -A-A-A---C-C-|' },
  'scan': { name: 'scan', category: 'transformation', description: 'Accumulates values over time like reduce, but emits each step' },
  'reduce': { name: 'reduce', category: 'transformation', description: 'Accumulates values and emits final result on completion' },
  
  // Filtering operators
  'filter': { name: 'filter', category: 'filtering', description: 'Emits only values that pass a predicate test' },
  'take': { name: 'take', category: 'filtering', description: 'Emits only the first n values, then completes' },
  'takeUntil': { name: 'takeUntil', category: 'filtering', description: 'Emits until another Observable emits' },
  'takeWhile': { name: 'takeWhile', category: 'filtering', description: 'Emits while condition is true' },
  'skip': { name: 'skip', category: 'filtering', description: 'Skips the first n emissions' },
  'skipUntil': { name: 'skipUntil', category: 'filtering', description: 'Skips until another Observable emits' },
  'skipWhile': { name: 'skipWhile', category: 'filtering', description: 'Skips while condition is true' },
  'distinctUntilChanged': { name: 'distinctUntilChanged', category: 'filtering', description: 'Emits when value changes from previous' },
  'debounceTime': { name: 'debounceTime', category: 'filtering', description: 'Emits after a period of inactivity' },
  'throttleTime': { name: 'throttleTime', category: 'filtering', description: 'Emits first value, then ignores for duration' },
  'auditTime': { name: 'auditTime', category: 'filtering', description: 'Emits most recent value after duration' },
  'sampleTime': { name: 'sampleTime', category: 'filtering', description: 'Emits most recent value at intervals' },
  
  // Combination operators
  'merge': { name: 'merge', category: 'combination', description: 'Combines multiple Observables, emitting all values' },
  'concat': { name: 'concat', category: 'combination', description: 'Concatenates Observables in sequence' },
  'zip': { name: 'zip', category: 'combination', description: 'Combines values by index into arrays' },
  'combineLatest': { name: 'combineLatest', category: 'combination', description: 'Combines latest values from all Observables' },
  'forkJoin': { name: 'forkJoin', category: 'combination', description: 'Waits for all to complete, emits final values' },
  'withLatestFrom': { name: 'withLatestFrom', category: 'combination', description: 'Combines with latest value from another Observable' },
  
  // Utility operators
  'tap': { name: 'tap', category: 'utility', description: 'Performs side effects without altering emissions' },
  'delay': { name: 'delay', category: 'utility', description: 'Delays emissions by specified time' },
  'timeout': { name: 'timeout', category: 'utility', description: 'Errors if no emission within specified time' },
  'startWith': { name: 'startWith', category: 'utility', description: 'Emits specified values before source emissions' },
  'endWith': { name: 'endWith', category: 'utility', description: 'Emits specified values after source completes' },
  'finalize': { name: 'finalize', category: 'utility', description: 'Executes callback on completion or error' },
  
  // Error handling operators
  'catchError': { name: 'catchError', category: 'error-handling', description: 'Catches errors and returns new Observable' },
  'retry': { name: 'retry', category: 'error-handling', description: 'Retries the source Observable on error' },
  'retryWhen': { name: 'retryWhen', category: 'error-handling', description: 'Retries based on custom logic' },
  
  // Multicasting operators
  'share': { name: 'share', category: 'multicasting', description: 'Shares a single subscription among observers' },
  'shareReplay': { name: 'shareReplay', category: 'multicasting', description: 'Shares and replays specified emissions' },
};

// Extract operators from code
function extractOperators(code: string): string[] {
  const operators: string[] = [];
  const operatorRegex = /\.pipe\s*\([^)]*\)/gs;
  const pipeMatches = code.match(operatorRegex);
  
  if (pipeMatches) {
    pipeMatches.forEach(pipeBlock => {
      Object.keys(operatorDatabase).forEach(op => {
        const opRegex = new RegExp(`\\b${op}\\s*\\(`, 'g');
        if (opRegex.test(pipeBlock)) {
          operators.push(op);
        }
      });
    });
  }
  
  // Also check for operators used without pipe
  Object.keys(operatorDatabase).forEach(op => {
    const standaloneRegex = new RegExp(`\\.${op}\\s*\\(`, 'g');
    if (standaloneRegex.test(code) && !operators.includes(op)) {
      operators.push(op);
    }
  });
  
  return operators;
}

// Analyze operator chain
function analyzeOperatorChain(operators: string[], checkPerformance: boolean) {
  const analysis = {
    operators: operators.map(op => operatorDatabase[op] || { name: op, category: 'utility' as const, description: 'Custom or unknown operator' }),
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
    description: 'Analyze RxJS operator chains for performance, patterns, and best practices',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);
    
    try {
      const operators = extractOperators(input.code);
      
      if (operators.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '## No RxJS operators detected\n\nPlease provide code containing RxJS operators to analyze.',
          }],
        };
      }
      
      const analysis = analyzeOperatorChain(operators, input.checkPerformance);
      const alternatives = input.includeAlternatives ? suggestAlternatives(operators) : [];
      
      const parts: string[] = [
        '## Operator Chain Analysis',
        '',
        `**Total Operators:** ${operators.length}`,
        `**Chain:** \`${operators.join(' → ')}\``,
        '',
        '### Categories',
      ];
      
      Object.entries(analysis.categories).forEach(([category, count]) => {
        parts.push(`- **${category}**: ${count} operator(s)`);
      });
      
      parts.push('', '### Operator Details');
      analysis.operators.forEach((op, i) => {
        parts.push(`${i + 1}. **${op.name}** (${op.category})`);
        parts.push(`   - ${op.description}`);
        if (op.marblePattern) {
          parts.push(`   - Pattern: \`${op.marblePattern}\``);
        }
      });
      
      if (analysis.performance.length > 0) {
        parts.push('', '### Performance Considerations');
        analysis.performance.forEach(perf => parts.push(perf));
      }
      
      if (analysis.suggestions.length > 0) {
        parts.push('', '### Suggestions');
        analysis.suggestions.forEach(sug => parts.push(`- ${sug}`));
      }
      
      if (alternatives.length > 0) {
        parts.push('', '### Alternative Approaches');
        alternatives.forEach(alt => parts.push(alt));
      }
      
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
          text: `## Error analyzing operators\n\n${errorMessage}`,
        }],
      };
    }
  },
};
