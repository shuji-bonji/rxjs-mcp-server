import { describe, it, expect } from 'vitest';
import { executeStreamTool } from './execute-stream.js';

describe('execute_stream tool', () => {
  describe('definition', () => {
    it('should have correct name and description', () => {
      expect(executeStreamTool.definition.name).toBe('execute_stream');
      expect(executeStreamTool.definition.description).toContain('Execute RxJS code');
    });

    it('should have correct annotations', () => {
      expect(executeStreamTool.definition.annotations?.readOnlyHint).toBe(true);
      expect(executeStreamTool.definition.annotations?.idempotentHint).toBe(true);
    });
  });

  describe('handler', () => {
    it('should execute simple of() observable', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3);',
        takeCount: 10,
        timeout: 5000,
        captureTimeline: true,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Completed');
      expect(result.content[0].text).toContain('[');
      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('3');
    });

    it('should execute from() with array', async () => {
      const result = await executeStreamTool.handler({
        code: 'return from(["a", "b", "c"]);',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('Completed');
      expect(result.content[0].text).toContain('"a"');
      expect(result.content[0].text).toContain('"b"');
      expect(result.content[0].text).toContain('"c"');
    });

    it('should execute interval with take limit', async () => {
      const result = await executeStreamTool.handler({
        code: 'return interval(10).pipe(take(3));',
        takeCount: 10,
        timeout: 5000,
        captureTimeline: true,
      });

      expect(result.content[0].text).toContain('Completed');
      expect(result.content[0].text).toContain('0');
      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('2');
    });

    it('should execute map operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3).pipe(map(x => x * 2));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('4');
      expect(result.content[0].text).toContain('6');
    });

    it('should execute filter operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3, 4, 5).pipe(filter(x => x % 2 === 0));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('4');
    });

    it('should execute scan operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3).pipe(scan((acc, val) => acc + val, 0));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('3');
      expect(result.content[0].text).toContain('6');
    });

    it('should execute mergeMap operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2).pipe(mergeMap(x => of(x, x * 10)));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('10');
      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('20');
    });

    it('should handle combineLatest', async () => {
      const result = await executeStreamTool.handler({
        code: 'return combineLatest([of(1), of(2)]);',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('2');
    });

    it('should handle forkJoin', async () => {
      const result = await executeStreamTool.handler({
        code: 'return forkJoin([of("a"), of("b")]);',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('a');
      expect(result.content[0].text).toContain('b');
    });

    it('should respect takeCount limit', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);',
        takeCount: 3,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('3');
    });

    it('should handle errors in stream', async () => {
      const result = await executeStreamTool.handler({
        code: 'return throwError(() => new Error("Test error"));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('Error');
    });

    it('should handle catchError operator', async () => {
      const result = await executeStreamTool.handler({
        code: `return throwError(() => new Error("Test")).pipe(
          catchError(() => of("recovered"))
        );`,
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('recovered');
    });

    it('should handle EMPTY observable', async () => {
      const result = await executeStreamTool.handler({
        code: 'return EMPTY;',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('Completed');
      expect(result.content[0].text).toContain('Values Emitted:** 0');
    });

    it('should handle range creation function', async () => {
      const result = await executeStreamTool.handler({
        code: 'return range(1, 5);',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('5');
    });

    it('should handle timer observable', async () => {
      const result = await executeStreamTool.handler({
        code: 'return timer(0).pipe(map(() => "done"));',
        takeCount: 1,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('done');
    });

    it('should handle Subject', async () => {
      const result = await executeStreamTool.handler({
        code: `
          const subject = new Subject();
          const obs$ = subject.pipe(take(3));
          setTimeout(() => {
            subject.next(1);
            subject.next(2);
            subject.next(3);
          }, 10);
          return obs$;
        `,
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('3');
    });

    it('should handle BehaviorSubject', async () => {
      const result = await executeStreamTool.handler({
        code: `
          const subject = new BehaviorSubject("initial");
          setTimeout(() => subject.next("updated"), 10);
          return subject.pipe(take(2));
        `,
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('initial');
      expect(result.content[0].text).toContain('updated');
    });

    it('should capture timeline when enabled', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3);',
        takeCount: 10,
        timeout: 5000,
        captureTimeline: true,
      });

      expect(result.content[0].text).toContain('Timeline');
      expect(result.content[0].text).toContain('ms');
    });

    it('should capture memory when enabled', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3);',
        takeCount: 10,
        timeout: 5000,
        captureMemory: true,
      });

      expect(result.content[0].text).toContain('Memory');
      expect(result.content[0].text).toContain('MB');
    });

    it('should handle invalid code', async () => {
      const result = await executeStreamTool.handler({
        code: 'return invalidFunction();',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('Error');
    });

    it('should error when code does not return Observable', async () => {
      const result = await executeStreamTool.handler({
        code: 'return "not an observable";',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('Error');
      expect(result.content[0].text).toContain('Observable');
    });

    it('should handle complex pipe chains', async () => {
      const result = await executeStreamTool.handler({
        code: `
          return of(1, 2, 3, 4, 5).pipe(
            filter(x => x > 2),
            map(x => x * 10),
            scan((acc, val) => acc + val, 0)
          );
        `,
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('30');
      expect(result.content[0].text).toContain('70');
      expect(result.content[0].text).toContain('120');
    });

    it('should handle debounceTime-like delays', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1).pipe(delay(10));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('Completed');
    });

    it('should handle startWith operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(2, 3).pipe(startWith(1));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('3');
    });

    it('should handle distinctUntilChanged', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 1, 2, 2, 3).pipe(distinctUntilChanged());',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('Values Emitted:** 3');
    });

    it('should handle pairwise operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3).pipe(pairwise());',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('[1,2]');
      expect(result.content[0].text).toContain('[2,3]');
    });

    it('should handle toArray operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3).pipe(toArray());',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('[1,2,3]');
    });

    it('should handle reduce operator', async () => {
      const result = await executeStreamTool.handler({
        code: 'return of(1, 2, 3, 4).pipe(reduce((acc, val) => acc + val, 0));',
        takeCount: 10,
        timeout: 5000,
      });

      expect(result.content[0].text).toContain('10');
    });
  });
});
