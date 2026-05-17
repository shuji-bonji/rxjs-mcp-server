// @ts-check
// ESLint flat config for rxjs-mcp itself.
//
// Notes on scope:
// - This project ANALYZES RxJS code, it does not USE RxJS as an application.
//   So eslint-plugin-rxjs-x would produce many false positives on our
//   data files (lint-rules.ts contains RxJS anti-patterns *as data*) and
//   our execution context (rxjs-context.ts intentionally imports
//   everything). We therefore apply rxjs-x only to `src/tools/` where
//   we ourselves write RxJS-shaped code, and exclude the rest.
// - Test files contain INTENTIONALLY-BAD code snippets used as fixtures
//   (e.g. `source$.subscribe(async () => {})`). They are excluded from
//   rxjs-x checks but still linted by core rules.

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import rxjsX from 'eslint-plugin-rxjs-x';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.mjs',
      '*.cjs',
      'test-mcp-server.mjs',
    ],
  },

  // Base config for all TS files
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // We have a `windowOp` rename for the RxJS `window` operator
      'no-restricted-globals': 'off',
    },
  },

  // Test files: relax rules — fixtures include deliberately bad code.
  {
    files: ['src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Data files: relax rules — these are pure data modules with intentional
  // RxJS anti-patterns documented in strings (lint-rules.ts) and broad
  // re-exports (rxjs-context.ts).
  {
    files: ['src/data/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Apply eslint-plugin-rxjs-x only where we author RxJS chains ourselves.
  // The execute-stream worker subscribes and pipes, so this is where the
  // rules actually carry meaning. rxjs-x rules are type-aware, so we
  // enable parserOptions.projectService for the affected files only.
  {
    // Note: avoid the `execute-stream*` glob — it would match
    // `execute-stream.test.ts`, which projectService can't parse without
    // additional tsconfig wiring. Listing each non-test file is safer.
    files: ['src/tools/execute-stream.ts', 'src/tools/execute-stream-worker.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'rxjs-x': rxjsX },
    rules: {
      'rxjs-x/no-async-subscribe': 'error',
      'rxjs-x/no-nested-subscribe': 'error',
      'rxjs-x/no-create': 'error',
      'rxjs-x/no-topromise': 'error',
      'rxjs-x/prefer-root-operators': 'error',
    },
  },
);
