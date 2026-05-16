import { describe, it, expect } from 'vitest';
import { lintRxjsTool } from './lint-rxjs.js';

describe('lint_rxjs tool', () => {
  describe('definition', () => {
    it('should have correct name and description', () => {
      expect(lintRxjsTool.definition.name).toBe('lint_rxjs');
      expect(lintRxjsTool.definition.description).toContain('Lint RxJS code');
    });

    it('should have correct annotations', () => {
      expect(lintRxjsTool.definition.annotations?.readOnlyHint).toBe(true);
      expect(lintRxjsTool.definition.annotations?.idempotentHint).toBe(true);
    });
  });

  describe('handler - no issues', () => {
    it('should report no issues for clean code', async () => {
      const result = await lintRxjsTool.handler({
        code: `
import { interval } from 'rxjs';
import { take, map } from 'rxjs';

const result$ = interval(1000).pipe(
  take(5),
  map(x => x * 2),
);
result$.subscribe({ next: v => console.log(v), error: err => console.error(err) });
`,
      });
      expect(result.content[0].text).toContain('No issues found');
    });
  });

  describe('handler - recommended rules', () => {
    it('should detect no-async-subscribe', async () => {
      const result = await lintRxjsTool.handler({
        code: `source$.subscribe(async (value) => { await fetch(url); });`,
      });
      expect(result.content[0].text).toContain('no-async-subscribe');
      expect(result.content[0].text).toContain('async');
    });

    it('should detect no-create', async () => {
      const result = await lintRxjsTool.handler({
        code: `const obs$ = Observable.create(observer => { observer.next(1); });`,
      });
      expect(result.content[0].text).toContain('no-create');
      expect(result.content[0].text).toContain('deprecated');
    });

    it('should detect no-nested-subscribe', async () => {
      const result = await lintRxjsTool.handler({
        code: `
source$.subscribe(value => {
  inner$.subscribe(inner => {
    console.log(inner);
  });
});`,
      });
      expect(result.content[0].text).toContain('no-nested-subscribe');
      expect(result.content[0].text).toContain('Nested subscribe');
    });

    it('should detect no-ignored-replay-buffer (ReplaySubject)', async () => {
      const result = await lintRxjsTool.handler({
        code: `const subject = new ReplaySubject();`,
      });
      expect(result.content[0].text).toContain('no-ignored-replay-buffer');
      expect(result.content[0].text).toContain('buffer size');
    });

    it('should detect no-ignored-replay-buffer (shareReplay)', async () => {
      const result = await lintRxjsTool.handler({
        code: `const shared$ = source$.pipe(shareReplay());`,
      });
      expect(result.content[0].text).toContain('no-ignored-replay-buffer');
    });

    it('should detect no-sharereplay with number arg', async () => {
      const result = await lintRxjsTool.handler({
        code: `const shared$ = source$.pipe(shareReplay(1));`,
      });
      expect(result.content[0].text).toContain('no-sharereplay');
      expect(result.content[0].text).toContain('config object');
    });

    it('should detect prefer-root-operators', async () => {
      const result = await lintRxjsTool.handler({
        code: `import { map, filter } from 'rxjs/operators';`,
      });
      expect(result.content[0].text).toContain('prefer-root-operators');
    });

    it('should detect no-index', async () => {
      const result = await lintRxjsTool.handler({
        code: `import { Observable } from 'rxjs/index';`,
      });
      expect(result.content[0].text).toContain('no-index');
    });

    it('should detect no-internal', async () => {
      const result = await lintRxjsTool.handler({
        code: `import { Subscriber } from 'rxjs/internal/Subscriber';`,
      });
      expect(result.content[0].text).toContain('no-internal');
    });

    it('should detect no-topromise', async () => {
      const result = await lintRxjsTool.handler({
        code: `const value = await source$.toPromise();`,
      });
      expect(result.content[0].text).toContain('no-topromise');
      expect(result.content[0].text).toContain('firstValueFrom');
    });

    it('should detect throw-error with string', async () => {
      const result = await lintRxjsTool.handler({
        code: `const error$ = throwError('something went wrong');`,
      });
      expect(result.content[0].text).toContain('throw-error');
      expect(result.content[0].text).toContain('Error instance');
    });

    it('should detect no-unsafe-takeuntil', async () => {
      const result = await lintRxjsTool.handler({
        code: `
source$.pipe(
  takeUntil(destroy$),
  map(x => x * 2),
  filter(x => x > 5),
).subscribe();`,
      });
      expect(result.content[0].text).toContain('no-unsafe-takeuntil');
    });

    it('should detect no-ignored-takewhile-value', async () => {
      const result = await lintRxjsTool.handler({
        code: `source$.pipe(takeWhile(() => this.isAlive)).subscribe();`,
      });
      expect(result.content[0].text).toContain('no-ignored-takewhile-value');
    });

    it('should detect no-unbound-methods', async () => {
      const result = await lintRxjsTool.handler({
        code: `source$.subscribe(this.handleValue)`,
      });
      expect(result.content[0].text).toContain('no-unbound-methods');
    });
  });

  describe('handler - strict rules', () => {
    it('should detect no-exposed-subjects in strict mode', async () => {
      const result = await lintRxjsTool.handler({
        code: `public dataSubject = new Subject<string>();`,
        config: 'strict',
      });
      expect(result.content[0].text).toContain('no-exposed-subjects');
    });

    it('should NOT detect no-exposed-subjects in recommended mode', async () => {
      const result = await lintRxjsTool.handler({
        code: `public dataSubject = new Subject<string>();`,
        config: 'recommended',
      });
      expect(result.content[0].text).not.toContain('no-exposed-subjects');
    });

    it('should detect no-subclass in strict mode', async () => {
      const result = await lintRxjsTool.handler({
        code: `class MySubject extends Subject<number> {}`,
        config: 'strict',
      });
      expect(result.content[0].text).toContain('no-subclass');
    });

    it('should detect no-misused-observables (await)', async () => {
      const result = await lintRxjsTool.handler({
        code: `const value = await data$;`,
        config: 'strict',
      });
      expect(result.content[0].text).toContain('no-misused-observables');
    });
  });

  describe('handler - framework rules', () => {
    it('should detect Angular component without cleanup', async () => {
      const result = await lintRxjsTool.handler({
        code: `
@Component({ selector: 'app-test' })
export class TestComponent implements OnInit {
  ngOnInit() {
    this.service.data$.subscribe(data => this.data = data);
  }
}`,
        framework: 'angular',
      });
      expect(result.content[0].text).toContain('angular/prefer-takeuntil-destroy');
    });

    it('should NOT flag Angular component with takeUntilDestroyed', async () => {
      const result = await lintRxjsTool.handler({
        code: `
@Component({ selector: 'app-test' })
export class TestComponent {
  constructor() {
    this.service.data$.pipe(takeUntilDestroyed()).subscribe(data => this.data = data);
  }
}`,
        framework: 'angular',
      });
      expect(result.content[0].text).not.toContain('angular/prefer-takeuntil-destroy');
    });

    it('should detect React subscribe without useEffect', async () => {
      const result = await lintRxjsTool.handler({
        code: `
function MyComponent() {
  const [data, setData] = useState(null);
  source$.subscribe(v => setData(v));
  return <div>{data}</div>;
}`,
        framework: 'react',
      });
      expect(result.content[0].text).toContain('react/no-subscribe-in-component');
    });

    it('should detect Vue subscribe without onUnmounted', async () => {
      const result = await lintRxjsTool.handler({
        code: `
export default defineComponent({
  setup() {
    const data = ref(null);
    onMounted(() => {
      source$.subscribe(v => { data.value = v; });
    });
    return { data };
  }
});`,
        framework: 'vue',
      });
      expect(result.content[0].text).toContain('vue/no-subscribe-without-unmount');
    });

    it('should NOT apply framework rules when framework is none', async () => {
      const result = await lintRxjsTool.handler({
        code: `
@Component({ selector: 'app-test' })
export class TestComponent implements OnInit {
  ngOnInit() {
    this.service.data$.subscribe(data => this.data = data);
  }
}`,
        framework: 'none',
      });
      expect(result.content[0].text).not.toContain('angular/prefer-takeuntil-destroy');
    });
  });

  describe('handler - rule filter', () => {
    it('should only check specified rules', async () => {
      const result = await lintRxjsTool.handler({
        code: `
import { map } from 'rxjs/operators';
source$.subscribe(async () => {});`,
        rules: ['prefer-root-operators'],
      });
      expect(result.content[0].text).toContain('prefer-root-operators');
      expect(result.content[0].text).not.toContain('no-async-subscribe');
    });

    it('should return error for unknown rules', async () => {
      const result = await lintRxjsTool.handler({
        code: `source$.subscribe();`,
        rules: ['nonexistent-rule'],
      });
      expect(result.content[0].text).toContain('No matching rules found');
    });
  });

  describe('handler - output format', () => {
    it('should include severity icons', async () => {
      const result = await lintRxjsTool.handler({
        code: `source$.subscribe(async () => {});`,
      });
      expect(result.content[0].text).toContain('🔴');
    });

    it('should include line numbers', async () => {
      const result = await lintRxjsTool.handler({
        code: `source$.subscribe(async () => {});`,
      });
      expect(result.content[0].text).toMatch(/line \d+/);
    });

    it('should include doc links', async () => {
      const result = await lintRxjsTool.handler({
        code: `source$.subscribe(async () => {});`,
      });
      expect(result.content[0].text).toContain('Rule docs');
      expect(result.content[0].text).toContain('eslint-plugin-rxjs-x');
    });

    it('should include summary counts', async () => {
      const result = await lintRxjsTool.handler({
        code: `
import { map } from 'rxjs/operators';
source$.subscribe(async () => {});`,
      });
      expect(result.content[0].text).toContain('error(s)');
    });
  });
});
