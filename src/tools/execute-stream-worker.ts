/**
 * Worker thread for isolated RxJS code execution
 * This runs in a separate thread to prevent main process pollution
 */
import { parentPort, workerData } from 'worker_threads';
import { WorkerInput, WorkerResult } from '../types.js';
import { createExecutionContext, Observable, EMPTY } from '../data/rxjs-context.js';
import { take, tap, catchError, finalize } from 'rxjs';

/**
 * Find the position of the last top-level semicolon in a code string.
 * Skips semicolons inside strings, template literals, comments, and brackets.
 * Returns -1 if no top-level semicolon is found.
 *
 * Note: template literal `${...}` interpolations are treated as opaque — we
 * simply skip to the closing backtick. This is a pragmatic simplification;
 * a `;` inside `${...}` would not be considered top-level anyway.
 */
function findTopLevelLastSemicolon(code: string): number {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let lastPos = -1;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        stringChar = '';
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') {
      depth++;
    } else if (ch === '}' || ch === ')' || ch === ']') {
      depth--;
    } else if (ch === ';' && depth === 0) {
      lastPos = i;
    }
  }

  return lastPos;
}

/**
 * Ensure the user-provided code returns an Observable.
 *
 * If the code does not contain a top-level `return` statement, we try to
 * interpret the last top-level expression as the value to return. This lets
 * users write natural code like:
 *   ```
 *   const s$ = interval(100).pipe(take(3));
 *   s$
 *   ```
 * without having to explicitly write `return`.
 *
 * Existing code that uses `return` explicitly is left untouched (backward compat).
 */
export function ensureReturn(code: string): string {
  const trimmed = code.trim();
  if (trimmed.length === 0) return code;

  // If the code already contains a top-level `return` statement, leave it alone.
  // The heuristic here is: `return` preceded by start-of-string, ;, {, }, or newline.
  if (/(^|[;{}\n])\s*return(\s|;|\()/.test(trimmed)) {
    return code;
  }

  // Strip trailing semicolons/whitespace so that we can locate the *last actual
  // statement*. Without this, code like `a; b;` would leave an empty slice
  // after the final `;` and we'd give up.
  const withoutTrailingSemi = trimmed.replace(/[;\s]+$/, '');
  if (withoutTrailingSemi.length === 0) {
    return code;
  }

  const lastSemi = findTopLevelLastSemicolon(withoutTrailingSemi);
  const lastStmt = (
    lastSemi >= 0 ? withoutTrailingSemi.slice(lastSemi + 1) : withoutTrailingSemi
  ).trim();

  if (lastStmt.length === 0) {
    // Nothing meaningful found; leave code untouched. The worker will surface
    // a proper "Code must return an Observable" error.
    return code;
  }

  // Avoid rewriting statements that are declarations or control-flow keywords.
  if (
    /^(const|let|var|function|class|if|for|while|switch|try|throw|import|export|async|await|do)\b/.test(
      lastStmt
    )
  ) {
    return code;
  }

  const prefix = lastSemi >= 0 ? withoutTrailingSemi.slice(0, lastSemi + 1) : '';
  // Wrap the final expression in parentheses so that commas / arrows don't break parsing.
  return `${prefix}\nreturn (${lastStmt});`;
}

/**
 * Execute user-provided RxJS code in an isolated context
 */
async function executeCode(input: WorkerInput): Promise<WorkerResult> {
  const result: WorkerResult = {
    values: [],
    errors: [],
    completed: false,
    hasError: false,
    timeline: [],
    executionTime: 0,
    memoryUsage: {
      before: 0,
      after: 0,
      peak: 0,
    },
  };

  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  result.memoryUsage.before = startMemory;

  try {
    // Create safe execution context with RxJS imports
    const context = createExecutionContext();

    // Normalize the code so users can optionally omit an explicit `return`.
    // `ensureReturn` leaves existing `return` statements untouched.
    const normalizedCode = ensureReturn(input.code);

    // Create function with context
    const func = new Function(...Object.keys(context), `
      "use strict";
      ${normalizedCode}
    `);

    // Execute the function with context
    const observable$ = func(...Object.values(context));

    if (!(observable$ instanceof Observable)) {
      throw new Error(
        'Code must evaluate to an Observable. ' +
        'Either end your snippet with an Observable expression (e.g. `source$`), ' +
        'or add an explicit `return` (e.g. `return of(1, 2, 3);`).'
      );
    }

    // Execute the observable with limits
    await new Promise<void>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Stream execution timeout after ${input.timeoutMs}ms`));
      }, input.timeoutMs);

      let errorOccurred = false;

      const subscription = observable$
        .pipe(
          take(input.takeCount),
          tap(value => {
            const time = Date.now() - startTime;
            result.values.push(value);
            result.timeline.push({ time, type: 'next', value });
          }),
          catchError(error => {
            const time = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(errorMessage);
            result.timeline.push({ time, type: 'error', value: errorMessage });
            result.hasError = true;
            errorOccurred = true;
            return EMPTY;
          }),
          finalize(() => {
            clearTimeout(timeoutHandle);
            if (!errorOccurred) {
              result.completed = true;
            }
            const time = Date.now() - startTime;
            result.timeline.push({ time, type: 'complete' });
          })
        )
        .subscribe({
          complete: () => resolve(),
          error: (err) => {
            clearTimeout(timeoutHandle);
            reject(err);
          }
        });

      // Clean up on timeout
      setTimeout(() => {
        subscription.unsubscribe();
      }, input.timeoutMs);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    result.hasError = true;
  }

  result.executionTime = Date.now() - startTime;

  const endMemory = process.memoryUsage().heapUsed;
  result.memoryUsage.after = endMemory;
  result.memoryUsage.peak = Math.max(startMemory, endMemory);

  return result;
}

// Main worker entry point
const input = workerData as WorkerInput;

executeCode(input)
  .then(result => {
    parentPort?.postMessage({ success: true, result });
  })
  .catch(error => {
    parentPort?.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });
