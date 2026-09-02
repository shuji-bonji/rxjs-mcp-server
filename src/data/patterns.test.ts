/**
 * The framework adaptations emit TypeScript, so the test that matters is
 * whether that TypeScript parses.
 *
 * Until v0.5.1 the adapters interpolated the framework-neutral pattern into a
 * class body or a hook body without moving its `import` lines out first. Every
 * Angular and Vue result therefore had `import` and `const` declarations where
 * only class members or statements are allowed, and none of the 45 outputs
 * parsed. No existing test noticed, because they all asserted on substrings.
 */
import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { patterns, adaptPatternForFramework } from './patterns.js';

const FRAMEWORKS = ['angular', 'react', 'vue'] as const;

/** Syntactic diagnostics only — this asks whether the code parses, not whether it type-checks. */
function syntaxErrors(code: string): string[] {
  const result = ts.transpileModule(code, {
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return (result.diagnostics ?? []).map(d =>
    ts.flattenDiagnosticMessageText(d.messageText, ' '),
  );
}

describe('adaptPatternForFramework', () => {
  it('parses as TypeScript for every pattern and framework', () => {
    const failures: string[] = [];

    for (const [name, pattern] of Object.entries(patterns)) {
      for (const framework of FRAMEWORKS) {
        const adapted = adaptPatternForFramework(pattern, framework);
        const errors = syntaxErrors(adapted.code);
        if (errors.length > 0) {
          failures.push(`${name} / ${framework}: ${errors.join(' | ')}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('hoists every import above the wrapper', () => {
    for (const [name, pattern] of Object.entries(patterns)) {
      for (const framework of FRAMEWORKS) {
        const lines = adaptPatternForFramework(pattern, framework).code.split('\n');
        const lastImport = lines.findLastIndex(l => /^import\s/.test(l));
        const firstDeclaration = lines.findIndex(l => /^(@Injectable|export (function|class))/.test(l));

        expect(firstDeclaration, `${name} / ${framework}`).toBeGreaterThan(-1);
        expect(lastImport, `${name} / ${framework}`).toBeLessThan(firstDeclaration);
      }
    }
  });

  it('emits one import line per module', () => {
    for (const [name, pattern] of Object.entries(patterns)) {
      for (const framework of FRAMEWORKS) {
        const modules = [...adaptPatternForFramework(pattern, framework).code.matchAll(
          /^import .* from '([^']+)';$/gm,
        )].map(m => m[1]);

        expect(new Set(modules).size, `${name} / ${framework}`).toBe(modules.length);
      }
    }
  });

  it('keeps the pattern body — the adapter wraps, it does not drop code', () => {
    const pattern = patterns['search-typeahead'];
    const angular = adaptPatternForFramework(pattern, 'angular').code;

    expect(angular).toContain('debounceTime(300)');
    expect(angular).toContain('distinctUntilChanged()');
    expect(angular).toContain('switchMap(query =>');
  });

  it('declares destroy$ in Angular and tears it down in ngOnDestroy', () => {
    const angular = adaptPatternForFramework(patterns['polling'], 'angular').code;

    expect(angular).toContain('private readonly destroy$ = new Subject<void>();');
    expect(angular).toContain('this.destroy$.complete();');
    expect(angular).toMatch(/import \{[^}]*\bSubject\b[^}]*\} from 'rxjs';/);
  });

  it('leaves the pattern untouched for an unknown framework', () => {
    const adapted = adaptPatternForFramework(patterns['polling'], 'vanilla');
    expect(adapted.code).toBe(patterns['polling'].code);
  });
  // `takeUntil` used to be imported by the Vue wrapper although it appeared only
  // in the commented-out subscription, and the Angular wrapper's comment named it
  // without importing it. An unused import is an error under most projects'
  // no-unused-vars, so the wrapper must not add a binding the emitted code does
  // not use.
  it('uses every binding the wrapper itself imports', () => {
    const WRAPPER_IMPORTS: Record<string, string[]> = {
      angular: ['Injectable', 'OnDestroy', 'Subject'],
      react: ['useEffect', 'useState', 'useRef', 'Subscription'],
      vue: ['ref', 'onBeforeUnmount', 'Subject'],
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      for (const framework of FRAMEWORKS) {
        const code = adaptPatternForFramework(pattern, framework).code;
        // Drop comments and the import block: what is left is the code that runs.
        const body = code
          .split('\n')
          .filter(line => !/^\s*\/\//.test(line) && !/^import\s/.test(line))
          .join('\n');

        for (const binding of WRAPPER_IMPORTS[framework]) {
          expect(
            new RegExp(`\\b${binding}\\b`).test(body),
            `${name} / ${framework}: ${binding} is imported but never used`,
          ).toBe(true);
        }
      }
    }
  });

  it('does not import takeUntil, which only appears in guidance comments', () => {
    for (const [name, pattern] of Object.entries(patterns)) {
      for (const framework of FRAMEWORKS) {
        const code = adaptPatternForFramework(pattern, framework).code;
        const importsTakeUntil = code
          .split('\n')
          .filter(line => /^import\s/.test(line))
          .some(line => /\btakeUntil\b/.test(line));

        // A pattern that uses takeUntil in its own body still imports it — this
        // only asserts the wrapper does not add the binding on its own.
        const usesTakeUntil = code
          .split('\n')
          .filter(line => !/^\s*\/\//.test(line) && !/^import\s/.test(line))
          .some(line => /\btakeUntil\b/.test(line));

        expect(importsTakeUntil && !usesTakeUntil, `${name} / ${framework}`).toBe(false);
      }
    }
  });
});
