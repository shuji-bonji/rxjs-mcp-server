# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-05-17

### Changed
- **`detect_memory_leak`**: 単純な subscribe/unsubscribe カウント比較を廃止し、`takeUntilDestroyed()`（Angular 16+）/ `take(N)` / `first()` / `firstValueFrom` / `useEffect` cleanup / `onUnmounted` 等の **自動クリーンアップパターンを認識** するように改修。これにより、Angular 16+ の `takeUntilDestroyed()` 等を使った現代的なコードに対する false positive を解消。
- **`detect_memory_leak`** の description に "Recognizes modern auto-cleanup patterns" を明記。
- **memory-leak と lint_rxjs の検出ロジック共通化**: `src/shared/subscription-analysis.ts` を新設し、サブスクリプション解析のヒューリスティクスを一元化。

### Fixed
- **`getWorkerPath()` の Windows 非互換**: `__dirname.includes('/src/')` というハードコードを `path.sep` 経由のセグメント走査に変更。Windows (`\src\`) でも src/dist 判定が正しく動作するように。
- **`marble-diagram.ts`**: 未使用変数 `index` 削除、case block の `const value` をブロック化、内部ヘルパー `parseMarbleSyntax` の名前を `_parseMarbleSyntax`（未使用許可・将来の marble syntax 入力対応用）に整理。

### Infrastructure
- **ESLint 自己適用**: `eslint.config.js`（flat config）を追加し、`@eslint/js` + `typescript-eslint` を全 `src/` に、`eslint-plugin-rxjs-x` を `execute-stream*.ts` のみに（type-aware）適用。`npm run lint` / `npm run lint:fix` を追加し、CI workflow にも `Lint` ステップを追加。
- **Dependabot**: `.github/dependabot.yml` を追加。npm 依存（dev/prod グループ分け、週次）と GitHub Actions（月次）を自動更新。
- **MCP integration test の vitest 化**: `src/tools/mcp-integration.test.ts` を新規追加。子プロセスとして `dist/index.js` を spawn し、JSON-RPC で全 6 ツールを実機テスト。`npm test` で一括実行可能（dist 未ビルド時は自動 skip）。既存の `test-mcp-server.mjs` は legacy 用に残存（`npm run test:mcp`）。

## [0.4.0] - 2026-05-17

### Added
- **`lint_rxjs` ツール**: eslint-plugin-rxjs-x の recommended/strict ルールを正規表現ベースで再実装。コードスニペットを渡すだけで即座にフィードバック（ESLint 不要）
  - **20 recommended ルール**: no-async-subscribe, no-create, no-nested-subscribe, no-sharereplay, prefer-root-operators, no-topromise, no-unsafe-takeuntil, throw-error 等
  - **8 strict ルール**: no-exposed-subjects, no-floating-observables, no-misused-observables, no-subclass, finnish 等
  - **フレームワーク固有ルール**: Angular (takeUntilDestroyed 推奨), React (useEffect 内 subscribe), Vue (onUnmounted cleanup)
  - `config` パラメータ: `recommended`（デフォルト）/ `strict`
  - `framework` パラメータ: `angular` / `react` / `vue` / `none`
  - `rules` パラメータ: 個別ルール指定可能

### Changed
- `DOC_BASE_URL` エイリアスを削除 (v0.3.0 で deprecated 告知済み)

## [0.3.0] - 2026-05-16

### BREAKING
- **`OperatorInfo` / `CreationFunctionInfo` 型変更**: `docUrl` フィールドを廃止し、3階層参照 (`officialUrl` / `sourceUrl` / `guideUrl`) に置き換え。`DOC_BASE_URL` は `GUIDE_BASE_URL` のエイリアスとして残存するが v0.4.0 で削除予定。

### Added
- **3階層ドキュメント参照システム**:
  - `officialUrl` — rxjs.dev (権威的、人間向け)
  - `sourceUrl` — GitHub ソース (tag `7.8.2` 固定、AI が読めるJSDoc + 実装)
  - `guideUrl` — バイリンガルガイドサイト (JP/EN 学習者向け)
- **Deprecation メタデータ** (`DeprecationInfo`): `deprecated` / `since` / `replacement` フィールドを追加。対象: `pluck` (7.2.0), `mapTo` (7.2.0), `retryWhen` (7.3.0)
- **URL ヘルパー関数**: `buildOfficialUrl()`, `buildSourceUrl()`, `buildGuideUrl()` を `types.ts` に追加
- **analyze_operators 出力強化**:
  - 各演算子に Official / Source / Guide の3階層リンクを表示
  - deprecated な演算子に⚠️警告と代替案を inline 表示
- **URL validation CI** (`.github/workflows/url-validation.yml`): push/PR/週次スケジュールで全 URL の HTTP ステータスを自動検証

### Changed
- `analyze_operators` のリファレンスリンク形式を `📖 [Documentation](...)` から `📖 [Official](...) | [Source](...) | [Guide](...)` に変更

## [0.2.2] - 2026-05-16

### Fixed
- **suggest_pattern**: パターンテンプレート内の `import { ... } from 'rxjs/operators'` を `from 'rxjs'` に修正。RxJS 7.2+ 推奨の統一インポートスタイルに合わせ、AI アシスタントが古い import を提案する問題を解消。対象パターン: `http-retry`, `search-typeahead`, `polling`, `websocket-reconnect`, `form-validation`, `state-management`, `cache-refresh`, `adaptPatternForFramework` (Vue)
- **analyze_operators**: `ajax` と `fromFetch` の `docUrl` のパスセグメント `creation-functions/http/` を `creation-functions/http-communication/` に修正。ガイドサイトへのリンクが 404 になっていた問題を解消

## [0.2.1] - 2026-05-09

### Build

- **build script に `chmod +x dist/index.js` を追加**: local dev で `./dist/index.js` を直接実行した際の `permission denied` を回避。npm install / npx 経由の通常利用には影響なし (npm が install 時に bin を chmod するため)。shuji 製 MCP 全体で build script を統一。

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
