# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-22

### BREAKING
- **Minimum Node.js version is now 22.** `engines.node` was raised from
  `>=18.0.0` to `>=22.0.0`. Node 18 / 20 are EOL or in Maintenance and are
  no longer supported. If you are on an older Node, stay on `0.1.x`
  (`npm install @shuji-bonji/rxjs-mcp@0.1` ) until you can upgrade.

### Fixed
- `execute_stream`: README examples and natural snippets like
  `interval(100).pipe(take(5))` or `const s$ = ...; s$` now run without
  requiring an explicit `return`. The tool auto-wraps the final top-level
  expression when no `return` is present. Explicit `return` keeps working
  (backward compatible).
- `execute_stream`: error message when the result is not an Observable now
  tells users both supported styles ("end with an Observable expression" or
  "add an explicit `return`").
- `analyze_operators`: the displayed operator chain now reflects the order
  operators actually appear in the source code. Previously they were listed
  in `operatorDatabase` insertion order, so
  `pipe(map, filter, switchMap, retry)` was rendered as
  `map → switchMap → filter → retry`.

### Added
- README updated with the three supported `execute_stream` snippet styles.
- Additional tests covering implicit-return behavior and chain-order
  preservation.

### Infrastructure
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) running
  build + unit tests on Node 22 (current LTS) and 24 (current Active LTS)
  for every push and PR. Matches `engines.node >= 22`.
- GitHub Actions Release workflow (`.github/workflows/release.yml`)
  publishing to npm via **Trusted Publisher (OIDC)** with provenance.
  No `NPM_TOKEN` secret required. Also auto-creates a GitHub Release
  using the matching `CHANGELOG.md` section.
- `RELEASING.md` documenting the one-time npm Trusted Publisher setup
  and the regular release procedure.

## [0.1.3] - 2025-12-27

### Changed
- Refactored codebase for better maintainability
  - Separated data (patterns, operators, RxJS context) from logic
  - Centralized RxJS execution context in `rxjs-context.ts`
  - Moved shared types to `types.ts`
  - Reduced code duplication in worker files

### Added
- `src/data/` directory for data-only modules
  - `patterns.ts` - RxJS pattern templates
  - `operators.ts` - Operator definitions
  - `creation-functions.ts` - Creation function definitions
  - `cleanup-examples.ts` - Framework-specific cleanup examples
  - `rxjs-context.ts` - RxJS execution context for Worker

## [0.1.2] - 2025-12-26

### Fixed
- Use `zod-to-json-schema` for proper JSON Schema conversion (MCP SDK compatibility)
- Added unofficial community notice to Japanese README

## [0.1.1] - 2025-12-25

### Added
- Unofficial community project notice in README

### Security
- Code execution now runs in isolated Worker threads
- Dangerous globals (process, require, fs, etc.) are explicitly blocked
- Hard timeout with forced worker termination prevents resource leaks

## [0.1.0] - 2025-12-25

### Added
- Initial release
- `execute_stream` - Execute RxJS code and capture emissions
- `generate_marble` - Generate ASCII marble diagrams
- `analyze_operators` - Analyze operator chains for performance
- `detect_memory_leak` - Detect potential memory leaks
- `suggest_pattern` - Suggest RxJS patterns for common use cases
- Support for Angular, React, Vue frameworks
- Comprehensive test suite (181 unit tests, 7 integration tests)
