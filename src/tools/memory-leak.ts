import { z } from 'zod';
import { ToolImplementation, ToolResponse, MemoryLeakResult } from '../types.js';

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS code to analyze for potential memory leaks'),
  componentLifecycle: z.enum(['angular', 'react', 'vue', 'none']).optional().default('none').describe('Component lifecycle context'),
});

// Analyze code for memory leaks
function analyzeMemoryLeaks(code: string, lifecycle: string): MemoryLeakResult {
  const result: MemoryLeakResult = {
    hasLeak: false,
    leakSources: [],
    recommendations: [],
  };
  
  // Check for unsubscribed subscriptions
  const subscribeRegex = /\.subscribe\s*\(/g;
  const unsubscribeRegex = /\.unsubscribe\s*\(\)/g;
  const subscribeMatches = code.match(subscribeRegex) || [];
  const unsubscribeMatches = code.match(unsubscribeRegex) || [];
  
  if (subscribeMatches.length > unsubscribeMatches.length) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'subscription',
      description: `Found ${subscribeMatches.length} subscribe() calls but only ${unsubscribeMatches.length} unsubscribe() calls`,
      severity: 'high',
      suggestion: 'Store subscriptions and unsubscribe in cleanup (ngOnDestroy, useEffect cleanup, etc.)',
    });
  }
  
  // Check for missing takeUntil
  const hasTakeUntil = /takeUntil\s*\(/.test(code);
  const hasTakeWhile = /takeWhile\s*\(/.test(code);
  const hasTake = /take\s*\(/.test(code);
  const hasFirst = /first\s*\(/.test(code);
  
  if (subscribeMatches.length > 0 && !hasTakeUntil && !hasTakeWhile && !hasTake && !hasFirst) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'subscription',
      description: 'Subscriptions without completion operators (takeUntil, take, first)',
      severity: 'medium',
      suggestion: 'Use takeUntil with a destroy$ subject for automatic cleanup',
    });
  }
  
  // Check for interval/timer without limits
  const hasInterval = /interval\s*\(/.test(code);
  const hasTimer = /timer\s*\([^,)]+,[^)]+\)/.test(code); // Timer with period
  
  if ((hasInterval || hasTimer) && !hasTake && !hasTakeUntil && !hasTakeWhile) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'operator',
      description: 'Infinite interval/timer without limiting operators',
      severity: 'high',
      suggestion: 'Add take() or takeUntil() to limit emissions',
    });
  }
  
  // Check for subjects not being completed
  const subjectRegex = /new\s+(Subject|BehaviorSubject|ReplaySubject|AsyncSubject)/g;
  const subjectMatches = code.match(subjectRegex) || [];
  const completeRegex = /\.complete\s*\(\)/g;
  const completeMatches = code.match(completeRegex) || [];
  
  if (subjectMatches.length > completeMatches.length) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'subject',
      description: `${subjectMatches.length} Subject(s) created but only ${completeMatches.length} complete() calls`,
      severity: 'medium',
      suggestion: 'Call complete() on Subjects in cleanup to release resources',
    });
  }
  
  // Check for shareReplay without refCount
  const hasShareReplay = /shareReplay\s*\(/.test(code);
  const hasRefCount = /refCount\s*:?\s*true/.test(code);
  
  if (hasShareReplay && !hasRefCount) {
    result.leakSources.push({
      type: 'operator',
      description: 'shareReplay() without refCount may keep subscriptions alive',
      severity: 'low',
      suggestion: 'Consider using shareReplay({ bufferSize: 1, refCount: true })',
    });
  }
  
  // Check for event listeners without removal
  const fromEventRegex = /fromEvent\s*\(/g;
  const fromEventMatches = code.match(fromEventRegex) || [];
  
  if (fromEventMatches.length > 0 && !hasTakeUntil) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'operator',
      description: 'fromEvent() creates DOM event listeners that may not be removed',
      severity: 'high',
      suggestion: 'Use takeUntil() to remove event listeners on cleanup',
    });
  }
  
  // Framework-specific checks
  if (lifecycle === 'angular') {
    // Check for async pipe usage (good practice)
    const hasAsyncPipe = /\|\s*async/.test(code);
    if (!hasAsyncPipe && subscribeMatches.length > 0) {
      result.recommendations.push('Consider using Angular\'s async pipe to auto-manage subscriptions');
    }
    
    // Check for ngOnDestroy
    const hasNgOnDestroy = /ngOnDestroy\s*\(/.test(code);
    if (!hasNgOnDestroy && subscribeMatches.length > 0) {
      result.recommendations.push('Implement OnDestroy lifecycle hook for cleanup');
    }
  } else if (lifecycle === 'react') {
    // Check for useEffect cleanup
    const hasUseEffect = /useEffect\s*\(/.test(code);
    // Match various cleanup return patterns:
    // - return () => { ... }
    // - return () => subscription.unsubscribe()
    // - return () => sub.unsubscribe();
    // - return cleanup;
    // - return function cleanup() { ... }
    const hasCleanupReturn = /return\s+(\(\s*\)\s*=>|function\s*\w*\s*\(|[a-zA-Z_$][\w$]*\s*;)/.test(code);
    const hasUnsubscribeInReturn = /return\s+\(\s*\)\s*=>\s*\w+\.unsubscribe\s*\(\s*\)/.test(code);

    if (hasUseEffect && subscribeMatches.length > 0 && !hasCleanupReturn && !hasUnsubscribeInReturn) {
      result.recommendations.push('Return cleanup function from useEffect to unsubscribe');
    }
  } else if (lifecycle === 'vue') {
    // Check for beforeDestroy/beforeUnmount
    const hasBeforeDestroy = /beforeDestroy|beforeUnmount|onBeforeUnmount/.test(code);
    
    if (!hasBeforeDestroy && subscribeMatches.length > 0) {
      result.recommendations.push('Use beforeUnmount/onBeforeUnmount for cleanup in Vue 3');
    }
  }
  
  // General recommendations
  if (result.hasLeak) {
    result.recommendations.push('Use a subscription management pattern (e.g., SubSink, subscription array)');
    result.recommendations.push('Consider using operators that auto-complete (first, take, takeUntil)');
    
    if (subscribeMatches.length > 3) {
      result.recommendations.push('With many subscriptions, consider combining streams with merge/combineLatest');
    }
  }
  
  return result;
}

// Generate code example for proper cleanup
function generateCleanupExample(lifecycle: string): string {
  const examples: Record<string, string> = {
    angular: `
// Angular Component with proper cleanup
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    // Method 1: takeUntil pattern
    this.myService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => console.log(data));
    
    // Method 2: Async pipe in template
    this.data$ = this.myService.getData();
    // Template: {{ data$ | async }}
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}`,
    react: `
// React Hook with proper cleanup
function MyComponent() {
  useEffect(() => {
    const subscription = dataStream$
      .pipe(/* operators */)
      .subscribe(data => setData(data));
    
    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, [/* dependencies */]);
}`,
    vue: `
// Vue 3 Composition API with proper cleanup
import { onBeforeUnmount } from 'vue';

export default {
  setup() {
    const destroy$ = new Subject();
    
    // Subscribe with takeUntil
    dataStream$
      .pipe(takeUntil(destroy$))
      .subscribe(data => state.data = data);
    
    onBeforeUnmount(() => {
      destroy$.next();
      destroy$.complete();
    });
  }
}`,
    none: `
// Generic cleanup pattern
class StreamManager {
  private subscriptions = new Subscription();
  
  init() {
    // Add subscriptions to composite
    this.subscriptions.add(
      stream1$.subscribe(/* ... */)
    );
    
    this.subscriptions.add(
      stream2$.subscribe(/* ... */)
    );
  }
  
  cleanup() {
    // Unsubscribe all at once
    this.subscriptions.unsubscribe();
  }
}`,
  };
  
  return examples[lifecycle] || examples.none;
}

// Tool implementation
export const detectMemoryLeakTool: ToolImplementation = {
  definition: {
    name: 'detect_memory_leak',
    description: 'Analyze RxJS code for potential memory leaks and subscription management issues',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);
    
    try {
      const result = analyzeMemoryLeaks(input.code, input.componentLifecycle);
      
      const parts: string[] = [
        '## Memory Leak Analysis',
        '',
        `**Status:** ${result.hasLeak ? '⚠️ Potential leaks detected' : '✅ No obvious leaks detected'}`,
        '',
      ];
      
      if (result.leakSources.length > 0) {
        parts.push('### Detected Issues');
        result.leakSources.forEach((leak, i) => {
          const severityIcon = leak.severity === 'high' ? '🔴' : leak.severity === 'medium' ? '🟡' : '🟢';
          parts.push(`${i + 1}. ${severityIcon} **${leak.type}** (${leak.severity} severity)`);
          parts.push(`   - ${leak.description}`);
          parts.push(`   - **Fix:** ${leak.suggestion}`);
          parts.push('');
        });
      }
      
      if (result.recommendations.length > 0) {
        parts.push('### Recommendations');
        result.recommendations.forEach(rec => {
          parts.push(`- ${rec}`);
        });
        parts.push('');
      }
      
      // Add cleanup example
      parts.push('### Proper Cleanup Pattern');
      parts.push('```typescript');
      parts.push(generateCleanupExample(input.componentLifecycle).trim());
      parts.push('```');
      
      // Add best practices
      parts.push('', '### Best Practices');
      parts.push('1. **Always unsubscribe** from infinite streams (interval, fromEvent, Subject)');
      parts.push('2. **Use limiting operators** (take, takeUntil, first) when possible');
      parts.push('3. **Complete Subjects** in cleanup to free resources');
      parts.push('4. **Prefer async pipe** (Angular) or hooks (React) for auto-cleanup');
      parts.push('5. **Use shareReplay carefully** with refCount: true for shared streams');
      
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
