/**
 * Subscription / completion pattern analysis.
 *
 * Shared helper used by `memory-leak` (and optionally `lint-rxjs`) so that the
 * "is this subscription managed?" check is consistent across tools.
 *
 * Historically, `memory-leak.ts` compared raw counts:
 *
 *     if (subscribeMatches.length > unsubscribeMatches.length) → leak
 *
 * This produced false positives on modern Angular (16+) where the idiomatic
 * code is `takeUntilDestroyed()` with no manual unsubscribe at all, and on
 * any code using `take(N)` / `first()` / async pipe.
 *
 * This module exposes a set of pure detection helpers + a higher-level
 * `analyzeSubscriptionSafety()` that decides whether a subscription
 * needs an explicit unsubscribe.
 */

export type Framework = 'angular' | 'react' | 'vue' | 'none';

/**
 * Raw subscription / unsubscription counts.
 *
 * Note: regex-based, so this only catches `.subscribe(` and `.unsubscribe()`
 * call sites — not destructured / aliased forms. That's an accepted
 * limitation of the heuristic.
 */
export interface SubscriptionCounts {
  subscribes: number;
  unsubscribes: number;
  completes: number;
  subjects: number;
}

export function countCalls(code: string): SubscriptionCounts {
  return {
    subscribes: (code.match(/\.subscribe\s*\(/g) ?? []).length,
    unsubscribes: (code.match(/\.unsubscribe\s*\(\s*\)/g) ?? []).length,
    completes: (code.match(/\.complete\s*\(\s*\)/g) ?? []).length,
    subjects: (code.match(/new\s+(Subject|BehaviorSubject|ReplaySubject|AsyncSubject)\b/g) ?? []).length,
  };
}

// ----------------------------------------------------------------------------
// Auto-cleanup pattern detection
// ----------------------------------------------------------------------------

/** `takeUntil(destroy$)` style — manual but standard. */
export function hasTakeUntil(code: string): boolean {
  return /\btakeUntil\s*\(/.test(code);
}

/** `takeUntilDestroyed()` — Angular 16+ idiomatic, requires no manual cleanup. */
export function hasTakeUntilDestroyed(code: string): boolean {
  return /\btakeUntilDestroyed\s*\(/.test(code);
}

/**
 * Bounded `take(N)`. Distinguished from `takeUntil` / `takeWhile` / `takeLast`
 * / `takeUntilDestroyed` because `\b` is a word boundary — `takeUntil` does
 * not match `\btake\s*\(` since `e` is followed by `U`, not `(`.
 */
export function hasBoundedTake(code: string): boolean {
  return /\btake\s*\(/.test(code);
}

/** `first()` / `last()` / `single()` — all auto-complete after one value. */
export function hasFirstLastSingle(code: string): boolean {
  return /\b(first|last|single)\s*\(/.test(code);
}

/** `takeWhile(...)` — auto-completes when predicate is false. */
export function hasTakeWhile(code: string): boolean {
  return /\btakeWhile\s*\(/.test(code);
}

/** Angular template async pipe (`| async`). Auto-managed by the framework. */
export function hasAsyncPipe(code: string): boolean {
  return /\|\s*async\b/.test(code);
}

/** Angular `DestroyRef` usage — same managed-lifetime contract as `takeUntilDestroyed`. */
export function hasDestroyRef(code: string): boolean {
  return /\bDestroyRef\b/.test(code);
}

/** React `useEffect` with a cleanup return. */
export function hasUseEffectCleanup(code: string): boolean {
  if (!/\buseEffect\s*\(/.test(code)) return false;
  // Look for `return () => ...` inside useEffect body. This is a heuristic,
  // not an AST check — but it does the right thing for the common shape.
  return /return\s*\(?\s*\(\s*\)\s*=>/.test(code);
}

/** Vue 3 lifecycle cleanup hooks. */
export function hasVueUnmountHook(code: string): boolean {
  return /\b(onUnmounted|onBeforeUnmount|beforeUnmount|beforeDestroy)\b/.test(code);
}

/** firstValueFrom / lastValueFrom — implicit single-emission consumption. */
export function hasValueFromHelper(code: string): boolean {
  return /\b(firstValueFrom|lastValueFrom)\s*\(/.test(code);
}

// ----------------------------------------------------------------------------
// Higher-level decision: does this code self-manage its subscriptions?
// ----------------------------------------------------------------------------

export interface SubscriptionSafetyReport {
  /** True if the code uses at least one pattern that makes manual unsubscribe unnecessary. */
  hasAutoCleanup: boolean;
  /** Human-readable names of the patterns found, for reporting. */
  detectedPatterns: string[];
  /** Framework-specific cleanup mechanism (if applicable). */
  frameworkPattern?: string;
}

/**
 * Decide whether the code uses an auto-cleanup pattern that makes a
 * raw subscribe / unsubscribe count mismatch a false alarm.
 *
 * This is intentionally generous: we'd rather under-report leaks than
 * over-report on modern, idiomatic code.
 */
export function analyzeSubscriptionSafety(
  code: string,
  framework: Framework = 'none',
): SubscriptionSafetyReport {
  const detected: string[] = [];
  let frameworkPattern: string | undefined;

  if (hasTakeUntilDestroyed(code)) {
    detected.push('takeUntilDestroyed()');
    frameworkPattern = 'takeUntilDestroyed (Angular 16+)';
  }
  if (hasDestroyRef(code)) {
    detected.push('DestroyRef');
  }
  if (hasTakeUntil(code)) detected.push('takeUntil(notifier$)');
  if (hasBoundedTake(code)) detected.push('take(N)');
  if (hasFirstLastSingle(code)) detected.push('first()/last()/single()');
  if (hasTakeWhile(code)) detected.push('takeWhile()');
  if (hasValueFromHelper(code)) detected.push('firstValueFrom/lastValueFrom');

  if (framework === 'angular') {
    if (hasAsyncPipe(code)) {
      detected.push('| async (Angular async pipe)');
      frameworkPattern ??= 'async pipe';
    }
  }
  if (framework === 'react' && hasUseEffectCleanup(code)) {
    detected.push('useEffect cleanup return');
    frameworkPattern = 'useEffect cleanup';
  }
  if (framework === 'vue' && hasVueUnmountHook(code)) {
    detected.push('onUnmounted/onBeforeUnmount');
    frameworkPattern = 'onUnmounted';
  }

  return {
    hasAutoCleanup: detected.length > 0,
    detectedPatterns: detected,
    frameworkPattern,
  };
}

/** `shareReplay` without explicit `refCount: true`. Memory-leak risk. */
export function hasUnsafeShareReplay(code: string): boolean {
  if (!/shareReplay\s*\(/.test(code)) return false;
  return !/refCount\s*:\s*true/.test(code);
}

/** `fromEvent(...)` — DOM listener that requires explicit cleanup. */
export function countFromEvent(code: string): number {
  return (code.match(/\bfromEvent\s*\(/g) ?? []).length;
}

/** Infinite `interval(...)` (no count argument). */
export function hasInfiniteInterval(code: string): boolean {
  return /\binterval\s*\(/.test(code);
}

/** `timer(initial, period)` — periodic, so infinite without limits. */
export function hasPeriodicTimer(code: string): boolean {
  return /\btimer\s*\([^,)]+,[^)]+\)/.test(code);
}
