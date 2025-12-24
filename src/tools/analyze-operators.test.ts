import { describe, it, expect } from 'vitest';
import { analyzeOperatorsTool } from './analyze-operators.js';

describe('analyze_operators tool', () => {
  describe('definition', () => {
    it('should have correct name and description', () => {
      expect(analyzeOperatorsTool.definition.name).toBe('analyze_operators');
      expect(analyzeOperatorsTool.definition.description).toContain('Analyze RxJS code');
    });

    it('should have correct annotations', () => {
      expect(analyzeOperatorsTool.definition.annotations?.readOnlyHint).toBe(true);
      expect(analyzeOperatorsTool.definition.annotations?.idempotentHint).toBe(true);
    });
  });

  describe('handler - creation functions', () => {
    it('should detect of() creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = of(1, 2, 3);',
      });

      expect(result.content[0].text).toContain('of');
      expect(result.content[0].text).toContain('Creation Functions');
    });

    it('should detect from() creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = from([1, 2, 3]);',
      });

      expect(result.content[0].text).toContain('from');
      expect(result.content[0].text).toContain('basic');
    });

    it('should detect interval() creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = interval(1000);',
      });

      expect(result.content[0].text).toContain('interval');
    });

    it('should detect timer() creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = timer(1000, 500);',
      });

      expect(result.content[0].text).toContain('timer');
    });

    it('should detect combineLatest creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = combineLatest([a$, b$]);',
      });

      expect(result.content[0].text).toContain('combineLatest');
      expect(result.content[0].text).toContain('combination');
    });

    it('should detect merge creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = merge(a$, b$);',
      });

      expect(result.content[0].text).toContain('merge');
    });

    it('should detect forkJoin creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = forkJoin([a$, b$]);',
      });

      expect(result.content[0].text).toContain('forkJoin');
    });

    it('should detect range creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = range(1, 10);',
      });

      expect(result.content[0].text).toContain('range');
      expect(result.content[0].text).toContain('loop');
    });

    it('should detect defer creation function', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const stream$ = defer(() => of(1));',
      });

      expect(result.content[0].text).toContain('defer');
      expect(result.content[0].text).toContain('conditional');
    });

    it('should detect multiple creation functions', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: `
          const a$ = of(1);
          const b$ = interval(1000);
          const c$ = merge(a$, b$);
        `,
      });

      expect(result.content[0].text).toContain('of');
      expect(result.content[0].text).toContain('interval');
      expect(result.content[0].text).toContain('merge');
    });
  });

  describe('handler - pipeable operators', () => {
    it('should detect map operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(map(x => x * 2));',
      });

      expect(result.content[0].text).toContain('map');
      expect(result.content[0].text).toContain('transformation');
    });

    it('should detect filter operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(filter(x => x > 0));',
      });

      expect(result.content[0].text).toContain('filter');
      expect(result.content[0].text).toContain('filtering');
    });

    it('should detect switchMap operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(switchMap(x => of(x)));',
      });

      expect(result.content[0].text).toContain('switchMap');
    });

    it('should detect mergeMap operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(mergeMap(x => of(x)));',
      });

      expect(result.content[0].text).toContain('mergeMap');
    });

    it('should detect concatMap operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(concatMap(x => of(x)));',
      });

      expect(result.content[0].text).toContain('concatMap');
    });

    it('should detect debounceTime operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(debounceTime(300));',
      });

      expect(result.content[0].text).toContain('debounceTime');
    });

    it('should detect throttleTime operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(throttleTime(300));',
      });

      expect(result.content[0].text).toContain('throttleTime');
    });

    it('should detect distinctUntilChanged operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(distinctUntilChanged());',
      });

      expect(result.content[0].text).toContain('distinctUntilChanged');
    });

    it('should detect catchError operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(catchError(err => of(null)));',
      });

      expect(result.content[0].text).toContain('catchError');
      expect(result.content[0].text).toContain('error-handling');
    });

    it('should detect retry operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(retry(3));',
      });

      expect(result.content[0].text).toContain('retry');
    });

    it('should detect share operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(share());',
      });

      expect(result.content[0].text).toContain('share');
      expect(result.content[0].text).toContain('multicasting');
    });

    it('should detect shareReplay operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(shareReplay(1));',
      });

      expect(result.content[0].text).toContain('shareReplay');
    });

    it('should detect takeUntil operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(takeUntil(destroy$));',
      });

      expect(result.content[0].text).toContain('takeUntil');
    });

    it('should detect take operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(take(5));',
      });

      expect(result.content[0].text).toContain('take');
    });

    it('should detect tap operator', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(tap(console.log));',
      });

      expect(result.content[0].text).toContain('tap');
      expect(result.content[0].text).toContain('utility');
    });

    it('should show operator chain', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(filter(x => x > 0)).pipe(map(x => x * 2)).pipe(take(5));',
      });

      expect(result.content[0].text).toContain('Chain');
      expect(result.content[0].text).toContain('filter');
      expect(result.content[0].text).toContain('map');
      expect(result.content[0].text).toContain('take');
    });
  });

  describe('handler - performance checks', () => {
    it('should warn about multiple flattening operators', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(switchMap(x => of(x))).pipe(mergeMap(y => of(y)));',
        checkPerformance: true,
      });

      expect(result.content[0].text).toContain('flattening operators');
    });

    it('should suggest adding share when using flattening operators', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(switchMap(x => httpCall(x)));',
        checkPerformance: true,
      });

      expect(result.content[0].text).toContain('share');
    });

    it('should suggest error handling when missing', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(switchMap(x => httpCall(x)));',
        checkPerformance: true,
      });

      expect(result.content[0].text).toContain('error handling');
    });

    it('should warn about shareReplay without buffer limit', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(shareReplay());',
        checkPerformance: true,
      });

      expect(result.content[0].text).toContain('shareReplay');
      expect(result.content[0].text).toContain('memory');
    });

    it('should suggest takeUntil for cleanup with many operators', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(map(x => x)).pipe(filter(y => y)).pipe(switchMap(z => of(z))).pipe(tap(console.log));',
        checkPerformance: true,
      });

      // The tool suggests takeUntil when there are many operators (> 3)
      expect(result.content[0].text).toContain('takeUntil');
    });

    it('should not warn when take operators are present', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(map(x => x), takeUntil(destroy$));',
        checkPerformance: true,
      });

      expect(result.content[0].text).not.toContain('Consider using `takeUntil()`');
    });

    it('should not suggest share when already present', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(switchMap(x => of(x))).pipe(share());',
        checkPerformance: true,
      });

      expect(result.content[0].text).not.toContain('Consider adding `share()`');
    });

    it('should not suggest error handling when catchError present', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(switchMap(x => of(x))).pipe(catchError(() => EMPTY));',
        checkPerformance: true,
      });

      expect(result.content[0].text).not.toContain('Consider adding error handling');
    });
  });

  describe('handler - alternatives', () => {
    it('should suggest alternatives for mergeMap', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(mergeMap(x => of(x)));',
        includeAlternatives: true,
      });

      expect(result.content[0].text).toContain('Alternative');
      expect(result.content[0].text).toContain('switchMap');
      expect(result.content[0].text).toContain('concatMap');
      expect(result.content[0].text).toContain('exhaustMap');
    });

    it('should suggest alternatives for rate limiting operators', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(debounceTime(300));',
        includeAlternatives: true,
      });

      expect(result.content[0].text).toContain('throttleTime');
      expect(result.content[0].text).toContain('auditTime');
      expect(result.content[0].text).toContain('sampleTime');
    });

    it('should not show alternatives when disabled', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(mergeMap(x => of(x)));',
        includeAlternatives: false,
      });

      expect(result.content[0].text).not.toContain('Alternative Approaches');
    });
  });

  describe('handler - edge cases', () => {
    it('should handle empty code', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: '',
      });

      expect(result.content[0].text).toContain('No RxJS code detected');
    });

    it('should handle code without RxJS', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'const x = 1 + 2;',
      });

      expect(result.content[0].text).toContain('No RxJS code detected');
    });

    it('should include documentation links', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(map(x => x));',
      });

      expect(result.content[0].text).toContain('Documentation');
      expect(result.content[0].text).toContain('https://');
    });

    it('should show categories summary', async () => {
      const result = await analyzeOperatorsTool.handler({
        code: 'source$.pipe(map(x => x)).pipe(filter(y => y)).pipe(tap(console.log));',
      });

      expect(result.content[0].text).toContain('Categories');
      expect(result.content[0].text).toContain('transformation');
      expect(result.content[0].text).toContain('filtering');
      expect(result.content[0].text).toContain('utility');
    });
  });
});
