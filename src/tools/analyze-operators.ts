import { z } from 'zod';
import { ToolImplementation, ToolResponse, CreationFunctionInfo, DOC_BASE_URL } from '../types.js';
import { creationFunctionDatabase } from '../data/creation-functions.js';
import { operatorDatabase } from '../data/operators.js';

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS operator chain code to analyze'),
  includeAlternatives: z.boolean().optional().default(true).describe('Whether to suggest alternative approaches'),
  checkPerformance: z.boolean().optional().default(true).describe('Whether to check for performance issues'),
});

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

// Extract content from balanced parentheses (handles nested parens)
function extractBalancedContent(code: string, startIndex: number): string {
  let depth = 0;
  let start = -1;
  let i = startIndex;

  while (i < code.length) {
    if (code[i] === '(') {
      if (depth === 0) {
        start = i + 1;
      }
      depth++;
    } else if (code[i] === ')') {
      depth--;
      if (depth === 0) {
        return code.slice(start, i);
      }
    }
    i++;
  }
  return '';
}

// Extract operators from code
function extractOperators(code: string): string[] {
  const operators: string[] = [];

  // Find all .pipe( occurrences and extract their balanced content
  const pipePattern = /\.pipe\s*\(/g;
  let match;

  while ((match = pipePattern.exec(code)) !== null) {
    const pipeContent = extractBalancedContent(code, match.index + match[0].length - 1);

    // Now search for operators in the pipe content
    Object.keys(operatorDatabase).forEach(op => {
      // Match operator name followed by ( with possible whitespace
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
function analyzeCreationFunctions(functions: string[]): CreationFunctionInfo[] {
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
        const byCategory: Record<string, CreationFunctionInfo[]> = {};
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
