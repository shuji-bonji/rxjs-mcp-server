import { z } from 'zod';
import { ToolImplementation, ToolResponse, MemoryLeakResult } from '../types.js';
import { getCleanupExample } from '../data/cleanup-examples.js';
import {
  Framework,
  analyzeSubscriptionSafety,
  countCalls,
  countFromEvent,
  hasInfiniteInterval,
  hasPeriodicTimer,
  hasUnsafeShareReplay,
  hasAsyncPipe,
  hasUseEffectCleanup,
  hasVueUnmountHook,
} from '../shared/subscription-analysis.js';

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS code to analyze for potential memory leaks'),
  componentLifecycle: z.enum(['angular', 'react', 'vue', 'none']).optional().default('none').describe('Component lifecycle context'),
});

// Analyze code for memory leaks.
//
// Behaviour vs v0.4.0:
// - Subscription-count mismatch is no longer reported when the code uses
//   an auto-cleanup pattern (`takeUntilDestroyed()`, `take(N)`, `first()`,
//   `firstValueFrom()`, `useEffect` cleanup, `onUnmounted`, async pipe, etc.).
//   This fixes the false positive on modern Angular 16+ idioms.
// - The "missing completion operators" check now also considers `takeWhile`,
//   `takeUntilDestroyed`, and `firstValueFrom/lastValueFrom`.
// - All concrete pattern detection lives in `shared/subscription-analysis.ts`,
//   shared with other tools that may need it later.
function analyzeMemoryLeaks(code: string, lifecycle: Framework): MemoryLeakResult {
  const result: MemoryLeakResult = {
    hasLeak: false,
    leakSources: [],
    recommendations: [],
  };

  const counts = countCalls(code);
  const safety = analyzeSubscriptionSafety(code, lifecycle);

  // -------------------------------------------------------------------------
  // Subscription / unsubscription count mismatch
  // -------------------------------------------------------------------------
  // Only flag a mismatch when there is NO auto-cleanup pattern in the code.
  // takeUntilDestroyed() / take(N) / useEffect cleanup / etc. all imply
  // managed lifetime even without a manual `.unsubscribe()`.
  if (counts.subscribes > counts.unsubscribes && !safety.hasAutoCleanup) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'subscription',
      description: `Found ${counts.subscribes} subscribe() calls but only ${counts.unsubscribes} unsubscribe() calls`,
      severity: 'high',
      suggestion: 'Store subscriptions and unsubscribe in cleanup (ngOnDestroy, useEffect cleanup, etc.) — or use takeUntilDestroyed() / take() / async pipe.',
    });
  }

  // -------------------------------------------------------------------------
  // Missing completion operators
  // -------------------------------------------------------------------------
  // If there are subscribes but NO auto-cleanup pattern of any kind,
  // recommend adding one.
  if (counts.subscribes > 0 && !safety.hasAutoCleanup) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'subscription',
      description: 'Subscriptions without completion operators (takeUntil, takeUntilDestroyed, take, first)',
      severity: 'medium',
      suggestion: 'Use takeUntil with a destroy$ subject, takeUntilDestroyed() (Angular 16+), or take()/first() for auto cleanup',
    });
  }

  // -------------------------------------------------------------------------
  // Infinite interval/timer
  // -------------------------------------------------------------------------
  if ((hasInfiniteInterval(code) || hasPeriodicTimer(code)) && !safety.hasAutoCleanup) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'operator',
      description: 'Infinite interval/timer without limiting operators',
      severity: 'high',
      suggestion: 'Add take() or takeUntil() to limit emissions',
    });
  }

  // -------------------------------------------------------------------------
  // Subjects without complete
  // -------------------------------------------------------------------------
  if (counts.subjects > counts.completes) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'subject',
      description: `${counts.subjects} Subject(s) created but only ${counts.completes} complete() calls`,
      severity: 'medium',
      suggestion: 'Call complete() on Subjects in cleanup to release resources',
    });
  }

  // -------------------------------------------------------------------------
  // shareReplay without refCount
  // -------------------------------------------------------------------------
  if (hasUnsafeShareReplay(code)) {
    result.leakSources.push({
      type: 'operator',
      description: 'shareReplay() without refCount may keep subscriptions alive',
      severity: 'low',
      suggestion: 'Consider using shareReplay({ bufferSize: 1, refCount: true })',
    });
  }

  // -------------------------------------------------------------------------
  // fromEvent without explicit cleanup
  // -------------------------------------------------------------------------
  if (countFromEvent(code) > 0 && !safety.hasAutoCleanup) {
    result.hasLeak = true;
    result.leakSources.push({
      type: 'operator',
      description: 'fromEvent() creates DOM event listeners that may not be removed',
      severity: 'high',
      suggestion: 'Use takeUntil(), takeUntilDestroyed(), or store and unsubscribe the subscription',
    });
  }

  // -------------------------------------------------------------------------
  // Framework-specific recommendations
  // -------------------------------------------------------------------------
  if (lifecycle === 'angular') {
    if (!hasAsyncPipe(code) && counts.subscribes > 0) {
      result.recommendations.push("Consider using Angular's async pipe to auto-manage subscriptions");
    }
    const hasNgOnDestroy = /ngOnDestroy\s*\(/.test(code);
    const usesTakeUntilDestroyed = safety.detectedPatterns.includes('takeUntilDestroyed()');
    if (!hasNgOnDestroy && !usesTakeUntilDestroyed && counts.subscribes > 0) {
      result.recommendations.push('Implement OnDestroy lifecycle hook for cleanup, or use takeUntilDestroyed() (Angular 16+)');
    }
  } else if (lifecycle === 'react') {
    if (/useEffect\s*\(/.test(code) && counts.subscribes > 0 && !hasUseEffectCleanup(code)) {
      result.recommendations.push('Return cleanup function from useEffect to unsubscribe');
    }
  } else if (lifecycle === 'vue') {
    if (!hasVueUnmountHook(code) && counts.subscribes > 0) {
      result.recommendations.push('Use beforeUnmount/onBeforeUnmount for cleanup in Vue 3');
    }
  }

  // -------------------------------------------------------------------------
  // Acknowledge detected auto-cleanup so the user knows we saw it
  // -------------------------------------------------------------------------
  if (safety.hasAutoCleanup && counts.subscribes > 0 && !result.hasLeak) {
    result.recommendations.push(
      `Detected auto-cleanup pattern(s): ${safety.detectedPatterns.join(', ')}. No manual unsubscribe required.`,
    );
  }

  // General recommendations when leaks were found
  if (result.hasLeak) {
    result.recommendations.push('Use a subscription management pattern (e.g., SubSink, subscription array, takeUntilDestroyed)');
    result.recommendations.push('Consider using operators that auto-complete (first, take, takeUntil)');

    if (counts.subscribes > 3) {
      result.recommendations.push('With many subscriptions, consider combining streams with merge/combineLatest');
    }
  }

  return result;
}

// Tool implementation
export const detectMemoryLeakTool: ToolImplementation = {
  definition: {
    name: 'detect_memory_leak',
    description: 'Analyze RxJS code for potential memory leaks and subscription management issues. Recognizes modern auto-cleanup patterns (takeUntilDestroyed, async pipe, useEffect cleanup, onUnmounted) to avoid false positives.',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);

    try {
      const result = analyzeMemoryLeaks(input.code, input.componentLifecycle as Framework);

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
      parts.push(getCleanupExample(input.componentLifecycle).trim());
      parts.push('```');

      // Add best practices
      parts.push('', '### Best Practices');
      parts.push('1. **Always unsubscribe** from infinite streams (interval, fromEvent, Subject) — or use auto-cleanup');
      parts.push('2. **Use limiting operators** (take, takeUntil, takeUntilDestroyed, first) when possible');
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
