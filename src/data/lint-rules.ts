/**
 * RxJS Lint Rules Database
 *
 * Regex-based reimplementation of eslint-plugin-rxjs-x rules.
 * These rules work on code snippets without requiring ESLint runtime or TypeScript parser.
 *
 * Reference: https://github.com/JasonWeinzierl/eslint-plugin-rxjs-x
 */

export type LintSeverity = 'error' | 'warning' | 'info';
export type LintConfig = 'recommended' | 'strict';
export type FrameworkContext = 'angular' | 'react' | 'vue' | 'none';

export interface LintDiagnostic {
  rule: string;
  severity: LintSeverity;
  message: string;
  line?: number;
  suggestion?: string;
  docUrl: string;
}

export interface LintRule {
  name: string;
  description: string;
  severity: LintSeverity;
  config: LintConfig;
  /** Whether this rule requires type information (cannot be fully checked with regex) */
  requiresTypeInfo: boolean;
  docUrl: string;
  check: (code: string, framework: FrameworkContext) => LintDiagnostic[];
}

// Helper: find line number for a match index
function lineAt(code: string, index: number): number {
  return code.slice(0, index).split('\n').length;
}

// Helper: find all matches with indices
function findAll(code: string, regex: RegExp): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = re.exec(code)) !== null) {
    matches.push(m);
  }
  return matches;
}

const DOC_BASE = 'https://github.com/JasonWeinzierl/eslint-plugin-rxjs-x/blob/main/docs/rules';

// ============================================
// Recommended Rules (✅)
// ============================================

const noAsyncSubscribe: LintRule = {
  name: 'no-async-subscribe',
  description: 'Disallow passing async functions to subscribe',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-async-subscribe.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // .subscribe(async (...) => ...) or .subscribe(async function
    const pattern = /\.subscribe\s*\(\s*async\b/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Passing async function to subscribe is not allowed. Use operators like switchMap/mergeMap instead.',
        line: lineAt(code, m.index),
        suggestion: 'Replace with: .pipe(switchMap(async () => ...)).subscribe()',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noCreate: LintRule = {
  name: 'no-create',
  description: 'Disallow Observable.create and Subject.create',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-create.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    const pattern = /\b(Observable|Subject)\.create\s*\(/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: `${m[1]}.create is deprecated. Use \`new Observable()\` constructor instead.`,
        line: lineAt(code, m.index),
        suggestion: 'Replace with: new Observable(subscriber => { ... })',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noIgnoredReplayBuffer: LintRule = {
  name: 'no-ignored-replay-buffer',
  description: 'Disallow using ReplaySubject, publishReplay or shareReplay without specifying buffer size',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: false,
  docUrl: `${DOC_BASE}/no-ignored-replay-buffer.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];

    // new ReplaySubject() without args
    const replaySubjectPattern = /new\s+ReplaySubject\s*\(\s*\)/g;
    for (const m of findAll(code, replaySubjectPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'ReplaySubject created without specifying buffer size. This buffers all emissions indefinitely.',
        line: lineAt(code, m.index),
        suggestion: 'Specify buffer size: new ReplaySubject(1)',
        docUrl: this.docUrl,
      });
    }

    // shareReplay() without args
    const shareReplayPattern = /shareReplay\s*\(\s*\)/g;
    for (const m of findAll(code, shareReplayPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'shareReplay() without config object may cause memory issues.',
        line: lineAt(code, m.index),
        suggestion: 'Use: shareReplay({ bufferSize: 1, refCount: true })',
        docUrl: this.docUrl,
      });
    }

    // publishReplay() without args
    const publishReplayPattern = /publishReplay\s*\(\s*\)/g;
    for (const m of findAll(code, publishReplayPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'publishReplay() without buffer size may cause memory issues.',
        line: lineAt(code, m.index),
        suggestion: 'Specify buffer size: publishReplay(1)',
        docUrl: this.docUrl,
      });
    }

    return diagnostics;
  },
};

const noIgnoredTakewhileValue: LintRule = {
  name: 'no-ignored-takewhile-value',
  description: 'Disallow ignoring the value within takeWhile',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: false,
  docUrl: `${DOC_BASE}/no-ignored-takewhile-value.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // takeWhile(() => someCondition) — callback ignores its parameter
    const pattern = /takeWhile\s*\(\s*\(\s*\)\s*=>/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'takeWhile callback ignores its value parameter. Consider using takeUntil instead.',
        line: lineAt(code, m.index),
        suggestion: 'If not using the emitted value, use takeUntil(notifier$) instead.',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noImplicitAnyCatch: LintRule = {
  name: 'no-implicit-any-catch',
  description: 'Disallow implicit any error parameters in catchError, subscribe, and tap',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-implicit-any-catch.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // catchError(err => ...) or catchError((err) => ...) without type annotation
    // Heuristic: parameter without `: Type`
    const pattern = /catchError\s*\(\s*\(?\s*(\w+)\s*\)?\s*=>/g;
    for (const m of findAll(code, pattern)) {
      // Check if there's a type annotation
      const paramArea = code.slice(m.index, m.index + m[0].length + 20);
      if (!paramArea.includes(':')) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: `Error parameter '${m[1]}' has implicit 'any' type in catchError.`,
          line: lineAt(code, m.index),
          suggestion: `Add type annotation: catchError((${m[1]}: unknown) => ...)`,
          docUrl: this.docUrl,
        });
      }
    }
    return diagnostics;
  },
};

const noIndex: LintRule = {
  name: 'no-index',
  description: 'Disallow importing index modules',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: false,
  docUrl: `${DOC_BASE}/no-index.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    const pattern = /from\s+['"]rxjs\/index['"]/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Do not import from rxjs/index. Import from rxjs directly.',
        line: lineAt(code, m.index),
        suggestion: "Replace with: import { ... } from 'rxjs'",
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noInternal: LintRule = {
  name: 'no-internal',
  description: 'Disallow importing internal modules',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: false,
  docUrl: `${DOC_BASE}/no-internal.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    const pattern = /from\s+['"]rxjs\/internal\b/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Do not import from rxjs/internal. These are private implementation details.',
        line: lineAt(code, m.index),
        suggestion: "Import from 'rxjs' or 'rxjs/operators' instead.",
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noNestedSubscribe: LintRule = {
  name: 'no-nested-subscribe',
  description: 'Disallow calling subscribe within a subscribe callback',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-nested-subscribe.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    const subscribePattern = /\.subscribe\s*\(/g;
    const matches = findAll(code, subscribePattern);

    if (matches.length < 2) return diagnostics;

    // For each subscribe call, find its balanced scope and check for inner subscribes
    for (let i = 0; i < matches.length; i++) {
      const outerStart = matches[i].index + matches[i][0].length - 1; // position of '('
      // Find balanced end of this subscribe(...)
      let depth = 0;
      let endIndex = -1;
      for (let j = outerStart; j < code.length; j++) {
        if (code[j] === '(') depth++;
        else if (code[j] === ')') {
          depth--;
          if (depth === 0) { endIndex = j; break; }
        }
      }
      if (endIndex === -1) continue;

      // Check if any other subscribe match falls inside this range
      const innerContent = code.slice(outerStart + 1, endIndex);
      const innerSubscribe = /\.subscribe\s*\(/.exec(innerContent);
      if (innerSubscribe) {
        const absolutePos = outerStart + 1 + innerSubscribe.index;
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: 'Nested subscribe detected. Use flattening operators (switchMap, mergeMap, concatMap) instead.',
          line: lineAt(code, absolutePos),
          suggestion: 'Refactor to: source$.pipe(switchMap(value => inner$)).subscribe()',
          docUrl: this.docUrl,
        });
        break; // Report once per code snippet
      }
    }
    return diagnostics;
  },
};

const noShareReplay: LintRule = {
  name: 'no-sharereplay',
  description: 'Disallow unsafe shareReplay usage (without config object)',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: false,
  docUrl: `${DOC_BASE}/no-sharereplay.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // shareReplay(number) without config object — only number arg
    const pattern = /shareReplay\s*\(\s*\d+\s*\)/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'shareReplay with number argument is unsafe. Use config object with refCount.',
        line: lineAt(code, m.index),
        suggestion: 'Replace with: shareReplay({ bufferSize: N, refCount: true })',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noSubjectUnsubscribe: LintRule = {
  name: 'no-subject-unsubscribe',
  description: 'Disallow calling unsubscribe on subjects',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-subject-unsubscribe.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // Heuristic: variable names containing 'subject' or 'Subject' followed by .unsubscribe()
    const pattern = /(\w*[Ss]ubject\w*)\.unsubscribe\s*\(\s*\)/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: `Do not call unsubscribe() on Subject '${m[1]}'. Use .complete() instead.`,
        line: lineAt(code, m.index),
        suggestion: 'Call .complete() to properly terminate the Subject.',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noSubscribeInPipe: LintRule = {
  name: 'no-subscribe-in-pipe',
  description: 'Disallow calling subscribe within pipe operators',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-subscribe-in-pipe.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // Look for .subscribe() inside .pipe()
    const pipePattern = /\.pipe\s*\(/g;
    for (const pipeMatch of findAll(code, pipePattern)) {
      const pipeStart = pipeMatch.index;
      // Find balanced content
      let depth = 0;
      let started = false;
      for (let j = pipeStart + pipeMatch[0].length - 1; j < code.length; j++) {
        if (code[j] === '(') { depth++; started = true; }
        else if (code[j] === ')') {
          depth--;
          if (started && depth === 0) {
            const pipeContent = code.slice(pipeStart, j + 1);
            const subInPipe = /\.subscribe\s*\(/g;
            const subMatches = findAll(pipeContent, subInPipe);
            for (const sm of subMatches) {
              diagnostics.push({
                rule: this.name,
                severity: this.severity,
                message: 'Do not call subscribe() inside pipe(). Use flattening operators instead.',
                line: lineAt(code, pipeStart + sm.index),
                suggestion: 'Use switchMap, mergeMap, or concatMap to handle inner Observables.',
                docUrl: this.docUrl,
              });
            }
            break;
          }
        }
      }
    }
    return diagnostics;
  },
};

const noToPromise: LintRule = {
  name: 'no-topromise',
  description: 'Disallow use of the deprecated toPromise method',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-topromise.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    const pattern = /\.toPromise\s*\(\s*\)/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'toPromise() is deprecated. Use firstValueFrom() or lastValueFrom() instead.',
        line: lineAt(code, m.index),
        suggestion: "Replace with: firstValueFrom(observable$) or lastValueFrom(observable$)",
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noUnsafeTakeuntil: LintRule = {
  name: 'no-unsafe-takeuntil',
  description: 'Disallow applying operators after takeUntil',
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-unsafe-takeuntil.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // Check if operators appear after takeUntil in a pipe
    // Safe operators after takeUntil: shareReplay, share, publishReplay, finalize
    const safeAfterTakeUntil = ['shareReplay', 'share', 'publishReplay', 'finalize', 'toArray', 'count', 'reduce'];
    const pipePattern = /\.pipe\s*\(/g;
    for (const pipeMatch of findAll(code, pipePattern)) {
      const pipeStart = pipeMatch.index + pipeMatch[0].length - 1;
      // Extract pipe content
      let depth = 0;
      let started = false;
      for (let j = pipeStart; j < code.length; j++) {
        if (code[j] === '(') { depth++; started = true; }
        else if (code[j] === ')') {
          depth--;
          if (started && depth === 0) {
            const pipeContent = code.slice(pipeStart + 1, j);
            // Find takeUntil position
            const takeUntilMatch = /takeUntil\s*\(/.exec(pipeContent);
            if (takeUntilMatch) {
              const afterTakeUntil = pipeContent.slice(takeUntilMatch.index + takeUntilMatch[0].length);
              // Find balanced end of takeUntil(...)
              let tuDepth = 1;
              let tuEnd = 0;
              for (let k = 0; k < afterTakeUntil.length; k++) {
                if (afterTakeUntil[k] === '(') tuDepth++;
                else if (afterTakeUntil[k] === ')') {
                  tuDepth--;
                  if (tuDepth === 0) { tuEnd = k + 1; break; }
                }
              }
              const remaining = afterTakeUntil.slice(tuEnd).trim();
              // Check if there are operators after takeUntil
              if (remaining.length > 0) {
                // Check if they're safe operators
                const operatorPattern = /\b(\w+)\s*\(/g;
                const ops = findAll(remaining, operatorPattern);
                for (const op of ops) {
                  if (!safeAfterTakeUntil.includes(op[1]) && op[1].length > 1) {
                    diagnostics.push({
                      rule: this.name,
                      severity: this.severity,
                      message: `Operator '${op[1]}' after takeUntil may cause issues. takeUntil should be the last operator before subscribe.`,
                      line: lineAt(code, pipeMatch.index + takeUntilMatch.index),
                      suggestion: 'Move takeUntil to the end of the pipe (before share/finalize only).',
                      docUrl: this.docUrl,
                    });
                    break;
                  }
                }
              }
            }
            break;
          }
        }
      }
    }
    return diagnostics;
  },
};

const preferObserver: LintRule = {
  name: 'prefer-observer',
  description: 'Disallow passing separate handlers to subscribe and tap',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/prefer-observer.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // .subscribe(fn, fn) — two or more function arguments
    const pattern = /\.subscribe\s*\(\s*(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*(?:=>.*?|(?:\{[^}]*\}))\s*,/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Passing separate callbacks to subscribe is deprecated. Use an Observer object instead.',
        line: lineAt(code, m.index),
        suggestion: 'Replace with: .subscribe({ next: fn, error: fn, complete: fn })',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const preferRootOperators: LintRule = {
  name: 'prefer-root-operators',
  description: "Disallow importing operators from 'rxjs/operators'",
  severity: 'error',
  config: 'recommended',
  requiresTypeInfo: false,
  docUrl: `${DOC_BASE}/prefer-root-operators.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    const pattern = /from\s+['"]rxjs\/operators['"]/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: "Import operators from 'rxjs' directly, not from 'rxjs/operators'.",
        line: lineAt(code, m.index),
        suggestion: "Replace with: import { map, filter, ... } from 'rxjs'",
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const throwError: LintRule = {
  name: 'throw-error',
  description: 'Enforce passing only Error values to throwError',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/throw-error.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // throwError('string') or throwError(() => 'string')
    const pattern = /throwError\s*\(\s*(?:\(\)\s*=>\s*)?['"`]/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Pass an Error instance to throwError, not a string.',
        line: lineAt(code, m.index),
        suggestion: "Replace with: throwError(() => new Error('message'))",
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noIgnoredNotifier: LintRule = {
  name: 'no-ignored-notifier',
  description: 'Disallow observables not composed from the repeatWhen or retryWhen notifier',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-ignored-notifier.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // retryWhen(() => timer(1000)) — ignoring the notifications parameter
    const pattern = /(retryWhen|repeatWhen)\s*\(\s*\(\s*\)\s*=>/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: `${m[1]} callback ignores its notifier parameter. The notifier should be used to compose the return value.`,
        line: lineAt(code, m.index),
        suggestion: `Use the notifier: ${m[1]}(notifications$ => notifications$.pipe(...))`,
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noRedundantNotify: LintRule = {
  name: 'no-redundant-notify',
  description: 'Disallow sending redundant notifications from completed or errored observables',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-redundant-notify.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // subject.complete(); subject.next() — next after complete
    const completeNextPattern = /\.complete\s*\(\s*\)\s*;[^}]*\.next\s*\(/g;
    for (const m of findAll(code, completeNextPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Calling next() after complete() has no effect. The subject is already closed.',
        line: lineAt(code, m.index),
        docUrl: this.docUrl,
      });
    }
    // subject.error(); subject.next()
    const errorNextPattern = /\.error\s*\([^)]*\)\s*;[^}]*\.next\s*\(/g;
    for (const m of findAll(code, errorNextPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Calling next() after error() has no effect. The subject is already closed.',
        line: lineAt(code, m.index),
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noUnsafeSubjectNext: LintRule = {
  name: 'no-unsafe-subject-next',
  description: 'Disallow unsafe optional next calls on Subjects',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-unsafe-subject-next.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // subject.next() without argument (when Subject has a type parameter)
    // Heuristic: new Subject<Type>() ... subject.next()
    const subjectDecl = /new\s+(?:Behavior|Replay|Async)?Subject\s*<\s*(?!void)[^>]+>/g;
    if (findAll(code, subjectDecl).length > 0) {
      const nextWithoutArg = /\.next\s*\(\s*\)/g;
      for (const m of findAll(code, nextWithoutArg)) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: 'Calling .next() without a value on a typed Subject is unsafe.',
          line: lineAt(code, m.index),
          suggestion: 'Pass a value: .next(value)',
          docUrl: this.docUrl,
        });
      }
    }
    return diagnostics;
  },
};

const noUnboundMethods: LintRule = {
  name: 'no-unbound-methods',
  description: 'Disallow passing unbound methods to subscribe or operators',
  severity: 'warning',
  config: 'recommended',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-unbound-methods.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // .subscribe(this.method) or tap(this.method)
    const pattern = /(?:\.subscribe|tap)\s*\(\s*this\.\w+\s*[,)]/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Passing unbound method may lose `this` context.',
        line: lineAt(code, m.index),
        suggestion: 'Bind the method: .subscribe(this.method.bind(this)) or use arrow: .subscribe(v => this.method(v))',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

// ============================================
// Strict Rules (🔒)
// ============================================

const noExposedSubjects: LintRule = {
  name: 'no-exposed-subjects',
  description: 'Disallow public and protected subjects',
  severity: 'warning',
  config: 'strict',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-exposed-subjects.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // public subject = new Subject() or public mySubject$
    const pattern = /\b(public|protected)\s+\w*(?:[Ss]ubject|\$)\w*\s*(?:[:=])/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: `${m[1]} subjects should be private. Expose as Observable using .asObservable().`,
        line: lineAt(code, m.index),
        suggestion: 'Make the subject private and expose a public observable: public obs$ = this.subject.asObservable()',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noFloatingObservables: LintRule = {
  name: 'no-floating-observables',
  description: 'Require Observables to be handled appropriately',
  severity: 'warning',
  config: 'strict',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-floating-observables.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // Heuristic: .pipe(...) at end of statement without .subscribe() or assignment
    // This is a simplified check
    const pattern = /^\s*\w+\$?\.pipe\s*\([^]*?\)\s*;/gm;
    for (const m of findAll(code, pattern)) {
      if (!m[0].includes('.subscribe') && !m[0].includes('return')) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: 'Observable is not subscribed or assigned. This creates a floating Observable.',
          line: lineAt(code, m.index),
          suggestion: 'Subscribe to the Observable or assign it to a variable.',
          docUrl: this.docUrl,
        });
      }
    }
    return diagnostics;
  },
};

const noIgnoredError: LintRule = {
  name: 'no-ignored-error',
  description: 'Disallow calling subscribe without specifying an error handler',
  severity: 'warning',
  config: 'strict',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-ignored-error.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // .subscribe({ next: ... }) without error handler  — observer style
    const observerPattern = /\.subscribe\s*\(\s*\{[^}]*\}\s*\)/g;
    for (const m of findAll(code, observerPattern)) {
      const content = m[0];
      if (content.includes('next') && !content.includes('error')) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: 'subscribe() is missing an error handler. Unhandled errors will be thrown.',
          line: lineAt(code, m.index),
          suggestion: 'Add error handler: .subscribe({ next: ..., error: err => ... })',
          docUrl: this.docUrl,
        });
      }
    }
    return diagnostics;
  },
};

const noIgnoredDefaultValue: LintRule = {
  name: 'no-ignored-default-value',
  description: 'Disallow using firstValueFrom/lastValueFrom/first/last without a default value',
  severity: 'warning',
  config: 'strict',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-ignored-default-value.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // firstValueFrom(obs$) without defaultValue option
    const fvfPattern = /firstValueFrom\s*\(\s*\w+\$?\s*\)/g;
    for (const m of findAll(code, fvfPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'firstValueFrom() without defaultValue will throw EmptyError if source completes empty.',
        line: lineAt(code, m.index),
        suggestion: 'Add defaultValue: firstValueFrom(obs$, { defaultValue: fallback })',
        docUrl: this.docUrl,
      });
    }
    // lastValueFrom(obs$)
    const lvfPattern = /lastValueFrom\s*\(\s*\w+\$?\s*\)/g;
    for (const m of findAll(code, lvfPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'lastValueFrom() without defaultValue will throw EmptyError if source completes empty.',
        line: lineAt(code, m.index),
        suggestion: 'Add defaultValue: lastValueFrom(obs$, { defaultValue: fallback })',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noShareReplayBeforeTakeuntil: LintRule = {
  name: 'no-sharereplay-before-takeuntil',
  description: 'Disallow using shareReplay({ refCount: false }) before takeUntil',
  severity: 'warning',
  config: 'strict',
  requiresTypeInfo: false,
  docUrl: `${DOC_BASE}/no-sharereplay-before-takeuntil.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // shareReplay followed by takeUntil in a pipe
    const pattern = /shareReplay\s*\([^)]*\)[^]*?takeUntil\s*\(/g;
    for (const m of findAll(code, pattern)) {
      if (m[0].includes('refCount: false') || !m[0].includes('refCount')) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: 'shareReplay without refCount: true before takeUntil will prevent unsubscription.',
          line: lineAt(code, m.index),
          suggestion: 'Move shareReplay after takeUntil, or use shareReplay({ refCount: true })',
          docUrl: this.docUrl,
        });
      }
    }
    return diagnostics;
  },
};

const noMisusedObservables: LintRule = {
  name: 'no-misused-observables',
  description: 'Disallow Observables in places not designed to handle them',
  severity: 'warning',
  config: 'strict',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-misused-observables.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // if (observable$) — using observable in boolean context
    const pattern = /\bif\s*\(\s*\w+\$\s*\)/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Observable used in boolean context. Observables are always truthy.',
        line: lineAt(code, m.index),
        suggestion: 'Did you mean to subscribe or use firstValueFrom()?',
        docUrl: this.docUrl,
      });
    }
    // await observable$ (without firstValueFrom)
    const awaitPattern = /\bawait\s+\w+\$(?!\s*\.)/g;
    for (const m of findAll(code, awaitPattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: 'Awaiting an Observable directly does not work as expected.',
        line: lineAt(code, m.index),
        suggestion: 'Use: await firstValueFrom(observable$)',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

const noSubclass: LintRule = {
  name: 'no-subclass',
  description: 'Disallow subclassing RxJS classes',
  severity: 'warning',
  config: 'strict',
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/no-subclass.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    const pattern = /\bclass\s+\w+\s+extends\s+(Observable|Subject|BehaviorSubject|ReplaySubject|AsyncSubject|Subscriber)\b/g;
    for (const m of findAll(code, pattern)) {
      diagnostics.push({
        rule: this.name,
        severity: this.severity,
        message: `Do not subclass ${m[1]}. Compose Observables instead.`,
        line: lineAt(code, m.index),
        suggestion: 'Use composition: create a service/class that wraps an Observable internally.',
        docUrl: this.docUrl,
      });
    }
    return diagnostics;
  },
};

// ============================================
// Additional Rules (not in configs, but useful)
// ============================================

const finnish: LintRule = {
  name: 'finnish',
  description: 'Enforce Finnish notation ($ suffix) for Observable variables',
  severity: 'info',
  config: 'strict', // Not in official recommended/strict, but commonly enabled
  requiresTypeInfo: true,
  docUrl: `${DOC_BASE}/finnish.md`,
  check(code) {
    const diagnostics: LintDiagnostic[] = [];
    // Variable assignments from Observable-returning patterns without $ suffix
    // Heuristic: const/let varName = something.pipe(...)  without $ in varName
    const pattern = /\b(?:const|let)\s+(\w+)\s*=\s*(?:\w+\.pipe\s*\(|new\s+(?:Observable|Subject|BehaviorSubject|ReplaySubject))/g;
    for (const m of findAll(code, pattern)) {
      if (!m[1].endsWith('$') && !m[1].startsWith('_')) {
        diagnostics.push({
          rule: this.name,
          severity: 'info',
          message: `Observable variable '${m[1]}' should have a '$' suffix (Finnish notation).`,
          line: lineAt(code, m.index),
          suggestion: `Rename to: ${m[1]}$`,
          docUrl: this.docUrl,
        });
      }
    }
    return diagnostics;
  },
};

// ============================================
// Framework-Specific Rules
// ============================================

const frameworkRules: LintRule[] = [
  {
    name: 'angular/prefer-takeuntil-destroy',
    description: 'Prefer takeUntilDestroyed or takeUntil(destroy$) pattern in Angular components',
    severity: 'warning',
    config: 'recommended',
    requiresTypeInfo: false,
    docUrl: 'https://github.com/JasonWeinzierl/eslint-plugin-rxjs-angular-x',
    check(code, framework) {
      if (framework !== 'angular') return [];
      const diagnostics: LintDiagnostic[] = [];

      // Check for subscribe in Angular-looking code without cleanup patterns
      const hasComponent = /@Component\s*\(/.test(code) || /implements\s+On(?:Init|Destroy)/.test(code) || /ngOnInit|ngOnDestroy/.test(code);
      if (!hasComponent) return [];

      const hasCleanup = /takeUntil|takeUntilDestroyed|DestroyRef|ngOnDestroy/.test(code);
      const subscribePattern = /\.subscribe\s*\(/g;
      const subscribeCount = findAll(code, subscribePattern).length;

      if (subscribeCount > 0 && !hasCleanup) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: `Found ${subscribeCount} subscribe() call(s) in Angular component without cleanup pattern.`,
          line: 1,
          suggestion: 'Use takeUntilDestroyed() (Angular 16+) or takeUntil(this.destroy$) with ngOnDestroy.',
          docUrl: this.docUrl,
        });
      }
      return diagnostics;
    },
  },
  {
    name: 'angular/no-async-pipe-with-subscribe',
    description: 'Avoid mixing async pipe and subscribe in same component',
    severity: 'info',
    config: 'strict',
    requiresTypeInfo: false,
    docUrl: 'https://github.com/JasonWeinzierl/eslint-plugin-rxjs-angular-x',
    check(code, framework) {
      if (framework !== 'angular') return [];
      const diagnostics: LintDiagnostic[] = [];

      const hasAsyncPipe = /\|\s*async/.test(code);
      const hasSubscribe = /\.subscribe\s*\(/.test(code);

      if (hasAsyncPipe && hasSubscribe) {
        diagnostics.push({
          rule: this.name,
          severity: 'info',
          message: 'Mixing async pipe and manual subscribe in the same component. Consider using one pattern consistently.',
          line: 1,
          suggestion: 'Prefer async pipe for template-consumed data, or use subscribe consistently with proper cleanup.',
          docUrl: this.docUrl,
        });
      }
      return diagnostics;
    },
  },
  {
    name: 'react/no-subscribe-in-component',
    description: 'Avoid manual subscribe in React components without cleanup',
    severity: 'warning',
    config: 'recommended',
    requiresTypeInfo: false,
    docUrl: 'https://github.com/JasonWeinzierl/eslint-plugin-rxjs-x',
    check(code, framework) {
      if (framework !== 'react') return [];
      const diagnostics: LintDiagnostic[] = [];

      const hasReact = /\buseEffect\b|\buseState\b|React\.FC|function\s+\w+.*return\s*\(/.test(code);
      if (!hasReact) return [];

      const hasUseEffect = /useEffect\s*\(/.test(code);
      const subscribePattern = /\.subscribe\s*\(/g;
      const subscribeMatches = findAll(code, subscribePattern);

      if (subscribeMatches.length > 0 && !hasUseEffect) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: 'subscribe() in React component without useEffect. Subscriptions will leak on re-renders.',
          line: lineAt(code, subscribeMatches[0].index),
          suggestion: 'Wrap subscribe in useEffect and return cleanup: useEffect(() => { const sub = obs$.subscribe(...); return () => sub.unsubscribe(); }, [])',
          docUrl: this.docUrl,
        });
      }
      return diagnostics;
    },
  },
  {
    name: 'vue/no-subscribe-without-unmount',
    description: 'Avoid subscribe without onUnmounted cleanup in Vue',
    severity: 'warning',
    config: 'recommended',
    requiresTypeInfo: false,
    docUrl: 'https://github.com/JasonWeinzierl/eslint-plugin-rxjs-x',
    check(code, framework) {
      if (framework !== 'vue') return [];
      const diagnostics: LintDiagnostic[] = [];

      const hasVue = /\bonMounted\b|\bsetup\s*\(|\bonUnmounted\b|\bdefineComponent/.test(code);
      if (!hasVue) return [];

      const hasCleanup = /onUnmounted|onBeforeUnmount/.test(code);
      const subscribePattern = /\.subscribe\s*\(/g;
      const subscribeMatches = findAll(code, subscribePattern);

      if (subscribeMatches.length > 0 && !hasCleanup) {
        diagnostics.push({
          rule: this.name,
          severity: this.severity,
          message: 'subscribe() in Vue component without onUnmounted cleanup.',
          line: lineAt(code, subscribeMatches[0].index),
          suggestion: 'Add cleanup: onUnmounted(() => subscription.unsubscribe())',
          docUrl: this.docUrl,
        });
      }
      return diagnostics;
    },
  },
];

// ============================================
// Rule Registry
// ============================================

export const allLintRules: LintRule[] = [
  // Recommended
  noAsyncSubscribe,
  noCreate,
  noIgnoredReplayBuffer,
  noIgnoredTakewhileValue,
  noImplicitAnyCatch,
  noIndex,
  noInternal,
  noNestedSubscribe,
  noIgnoredNotifier,
  noRedundantNotify,
  noShareReplay,
  noSubjectUnsubscribe,
  noSubscribeInPipe,
  noToPromise,
  noUnboundMethods,
  noUnsafeSubjectNext,
  noUnsafeTakeuntil,
  preferObserver,
  preferRootOperators,
  throwError,
  // Strict
  noExposedSubjects,
  noFloatingObservables,
  noIgnoredError,
  noIgnoredDefaultValue,
  noShareReplayBeforeTakeuntil,
  noMisusedObservables,
  noSubclass,
  finnish,
  // Framework-specific
  ...frameworkRules,
];

/** Get rules for a given config level */
export function getRulesForConfig(config: LintConfig): LintRule[] {
  if (config === 'strict') {
    return allLintRules;
  }
  // recommended: only rules with config === 'recommended'
  return allLintRules.filter(r => r.config === 'recommended');
}
