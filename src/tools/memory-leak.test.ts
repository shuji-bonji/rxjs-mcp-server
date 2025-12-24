import { describe, it, expect } from 'vitest';
import { detectMemoryLeakTool } from './memory-leak.js';

describe('detect_memory_leak tool', () => {
  describe('definition', () => {
    it('should have correct name and description', () => {
      expect(detectMemoryLeakTool.definition.name).toBe('detect_memory_leak');
      expect(detectMemoryLeakTool.definition.description).toContain('memory leak');
    });

    it('should have correct annotations', () => {
      expect(detectMemoryLeakTool.definition.annotations?.readOnlyHint).toBe(true);
      expect(detectMemoryLeakTool.definition.annotations?.idempotentHint).toBe(true);
    });
  });

  describe('handler - subscription leaks', () => {
    it('should detect subscribe without unsubscribe', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(data => console.log(data));
        `,
      });

      expect(result.content[0].text).toContain('Potential leaks detected');
      expect(result.content[0].text).toContain('subscribe');
    });

    it('should not warn about subscription count when unsubscribe is present', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          const sub = source$.subscribe(data => console.log(data));
          sub.unsubscribe();
        `,
      });

      // The tool still warns about missing takeUntil, but subscription count should match
      expect(result.content[0].text).not.toContain('subscribe() calls but only 0 unsubscribe()');
    });

    it('should detect multiple subscribe without enough unsubscribe', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          a$.subscribe(x => console.log(x));
          b$.subscribe(x => console.log(x));
          c$.subscribe(x => console.log(x));
          sub.unsubscribe();
        `,
      });

      expect(result.content[0].text).toContain('3');
      expect(result.content[0].text).toContain('1');
    });
  });

  describe('handler - missing completion operators', () => {
    it('should warn about subscribe without takeUntil', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(data => console.log(data));
        `,
      });

      expect(result.content[0].text).toContain('takeUntil');
    });

    it('should not warn when takeUntil is present', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$
            .pipe(takeUntil(destroy$))
            .subscribe(data => console.log(data));
        `,
      });

      expect(result.content[0].text).not.toContain('without completion operators');
    });

    it('should not warn when take is present', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$
            .pipe(take(5))
            .subscribe(data => console.log(data));
        `,
      });

      expect(result.content[0].text).not.toContain('without completion operators');
    });

    it('should not warn when first is present', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$
            .pipe(first())
            .subscribe(data => console.log(data));
        `,
      });

      expect(result.content[0].text).not.toContain('without completion operators');
    });
  });

  describe('handler - infinite streams', () => {
    it('should warn about interval without limits', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          interval(1000).subscribe(x => console.log(x));
        `,
      });

      expect(result.content[0].text).toContain('interval');
      expect(result.content[0].text).toContain('high');
    });

    it('should warn about timer with period without limits', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          timer(0, 1000).subscribe(x => console.log(x));
        `,
      });

      expect(result.content[0].text).toContain('timer');
    });

    it('should not warn when interval has take', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          interval(1000)
            .pipe(take(10))
            .subscribe(x => console.log(x));
        `,
      });

      expect(result.content[0].text).not.toContain('Infinite interval');
    });

    it('should not warn when interval has takeUntil', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          interval(1000)
            .pipe(takeUntil(destroy$))
            .subscribe(x => console.log(x));
        `,
      });

      expect(result.content[0].text).not.toContain('Infinite interval');
    });
  });

  describe('handler - Subject leaks', () => {
    it('should warn about Subject without complete', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          const subject = new Subject();
          subject.next(1);
        `,
      });

      expect(result.content[0].text).toContain('Subject');
      expect(result.content[0].text).toContain('complete');
    });

    it('should warn about BehaviorSubject without complete', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          const subject = new BehaviorSubject(0);
          subject.next(1);
        `,
      });

      expect(result.content[0].text).toContain('Subject');
    });

    it('should warn about ReplaySubject without complete', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          const subject = new ReplaySubject(1);
          subject.next(1);
        `,
      });

      expect(result.content[0].text).toContain('Subject');
    });

    it('should not warn when complete is called', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          const subject = new Subject();
          subject.next(1);
          subject.complete();
        `,
      });

      expect(result.content[0].text).not.toContain('Subject(s) created but only');
    });
  });

  describe('handler - shareReplay issues', () => {
    it('should warn about shareReplay without refCount', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.pipe(shareReplay(1));
        `,
      });

      expect(result.content[0].text).toContain('shareReplay');
      expect(result.content[0].text).toContain('refCount');
    });

    it('should not warn when refCount is true', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
        `,
      });

      expect(result.content[0].text).not.toContain('without refCount');
    });
  });

  describe('handler - fromEvent leaks', () => {
    it('should warn about fromEvent without cleanup', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          fromEvent(document, 'click').subscribe(e => console.log(e));
        `,
      });

      expect(result.content[0].text).toContain('fromEvent');
      expect(result.content[0].text).toContain('high');
    });

    it('should not warn when fromEvent has takeUntil', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          fromEvent(document, 'click')
            .pipe(takeUntil(destroy$))
            .subscribe(e => console.log(e));
        `,
      });

      expect(result.content[0].text).not.toContain('fromEvent() creates DOM event');
    });
  });

  describe('handler - Angular lifecycle', () => {
    it('should suggest async pipe for Angular', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          this.data$.subscribe(data => this.data = data);
        `,
        componentLifecycle: 'angular',
      });

      expect(result.content[0].text).toContain('async pipe');
    });

    it('should suggest ngOnDestroy for Angular', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          this.service.getData().subscribe(data => console.log(data));
        `,
        componentLifecycle: 'angular',
      });

      expect(result.content[0].text).toContain('OnDestroy');
    });

    it('should show Angular cleanup example', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(x => console.log(x));
        `,
        componentLifecycle: 'angular',
      });

      expect(result.content[0].text).toContain('destroy$');
      expect(result.content[0].text).toContain('ngOnDestroy');
    });
  });

  describe('handler - React lifecycle', () => {
    it('should suggest useEffect cleanup for React', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          useEffect(() => {
            source$.subscribe(data => setData(data));
          }, []);
        `,
        componentLifecycle: 'react',
      });

      expect(result.content[0].text).toContain('useEffect');
    });

    it('should show React cleanup example', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(x => console.log(x));
        `,
        componentLifecycle: 'react',
      });

      expect(result.content[0].text).toContain('return');
      expect(result.content[0].text).toContain('unsubscribe');
    });
  });

  describe('handler - Vue lifecycle', () => {
    it('should suggest beforeUnmount for Vue', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(data => this.data = data);
        `,
        componentLifecycle: 'vue',
      });

      expect(result.content[0].text).toContain('beforeUnmount');
    });

    it('should show Vue cleanup example', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(x => console.log(x));
        `,
        componentLifecycle: 'vue',
      });

      expect(result.content[0].text).toContain('onBeforeUnmount');
    });
  });

  describe('handler - best practices', () => {
    it('should include best practices section', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(x => console.log(x));
        `,
      });

      expect(result.content[0].text).toContain('Best Practices');
    });

    it('should suggest subscription management pattern', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(x => console.log(x));
        `,
      });

      expect(result.content[0].text).toContain('subscription');
    });

    it('should suggest combining streams for many subscriptions', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          a$.subscribe(x => console.log(x));
          b$.subscribe(x => console.log(x));
          c$.subscribe(x => console.log(x));
          d$.subscribe(x => console.log(x));
        `,
      });

      expect(result.content[0].text).toContain('combining streams');
    });
  });

  describe('handler - severity levels', () => {
    it('should show high severity for subscription issues', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(x => x);
          source$.subscribe(y => y);
        `,
      });

      expect(result.content[0].text).toContain('high');
    });

    it('should show medium severity for Subject issues', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          const s = new Subject();
        `,
      });

      expect(result.content[0].text).toContain('medium');
    });

    it('should show low severity for shareReplay issues', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.pipe(shareReplay(1));
        `,
      });

      expect(result.content[0].text).toContain('low');
    });
  });

  describe('handler - edge cases', () => {
    it('should handle code with no subscriptions', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          const stream$ = source$.pipe(map(x => x * 2));
        `,
      });

      expect(result.content[0].text).toContain('No obvious leaks');
    });

    it('should handle empty code', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: '',
      });

      expect(result.content[0].text).toContain('No obvious leaks');
    });

    it('should show proper cleanup pattern section', async () => {
      const result = await detectMemoryLeakTool.handler({
        code: `
          source$.subscribe(x => x);
        `,
      });

      expect(result.content[0].text).toContain('Proper Cleanup Pattern');
    });
  });
});
