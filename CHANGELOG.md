# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2026-09-02

### Changed

- **`eslint` を 9.39.5 → 10.9.1、`@eslint/js` を 9.39.5 → 10.0.1、`eslint-plugin-rxjs-x` を 0.7.7 → 1.0.6 へ** — この 3 つは同時にしか上げられない。`eslint-plugin-rxjs-x@1.0.6` の peer は `eslint ^10.0.1`、`@eslint/js@10.0.1` の peer は `eslint ^10.0.0` で、どれか 1 つだけを上げると `npm error Conflicting peer dependency` になる。dependabot は 3 つを別々の PR に分けており (#16 / #21、`@eslint/js` は PR 自体が無い)、単独ではいずれもマージできない。`eslint.config.js` (flat config) は eslint 10 で変更なしに動く。
- **`@types/node` を 20.19.43 → 26.4.1 へ** — `engines.node` は `>=22` なので、型定義が 20 系に留まっている状態を実態に合わせた。
- **`worker.on('error', ...)` のコールバック引数を `unknown` として扱う** — `@types/node` 26 で EventEmitter のオーバーロードが引数の型を `Error` と約束しなくなり、`error.message` が `TS18046: 'error' is of type 'unknown'` になる。`error instanceof Error` で絞ってから読む形にした。`@types/node` 20 でも同じ動作になる。

### Notes

- **`typescript` 7.0.2 (#18) は入れていない**。3 つ理由がある。(1) TS 7 は `@types/*` を自動で拾わないため `tsconfig.json` に `"types": ["node"]` が要る (無いと `Cannot find name 'process'` 等が 20 件出る)。(2) TS 7 のパッケージの main entry は `version` と `versionMajorMinor` しか export せず、コンパイラ API は `typescript/unstable/*` に移った。`src/data/patterns.test.ts` はその API を使っているため落ちる。(3) `eslint-plugin-rxjs-x@1.0.6` の peer が `typescript >=4.8.4 <6.1.0` で、上記の eslint 10 系と同時に入らない。(3) は上流が peer を広げるまで解決しない。
- **`lint_rxjs` のルール台帳と 1.0.6 の差** (この版では未対応、次で整理する) — 1.0.6 は `macro` / `no-compat` / `no-tap` を削除した (いずれも本サーバーは実装していないので影響なし)。1.0.6 の strict は `no-unnecessary-collection` を含むが、本サーバーの strict には無い。逆に本サーバーの strict にある `finnish` は、0.7.7 の strict にも 1.0.6 の strict にも入っていない (版の更新とは無関係の、元からのずれ)。recommended は 20 件で一致、strict は 0.7.7 が 26 件、1.0.6 が 28 件、本サーバーが 28 件。
- `eslint.config.js` が `src/tools/execute-stream.ts` と `execute-stream-worker.ts` に適用する rxjs-x のルールは 5 件で、0.7.7 と 1.0.6 で変わらない (`--print-config` で確認)。

### Infrastructure

- **`actions/checkout` と `actions/setup-node` を v4 から v7 へ** (#24 / #25) — `ci.yml` / `release.yml` / `url-validation.yml` の 3 ファイル、各 2 箇所。`release.yml` も対象なので、この版の publish が v7 での最初の実行になる。

## [0.5.1] - 2026-09-02

v0.5.0 をプラグイン経由で実際に呼んで見つかった 3 件の修正。ツールの入出力の形は変わらない。

### Fixed

- **`suggest_pattern` が構文として通らないコードを返していた** — framework 適応は、フレームワーク非依存のパターン本体を文字列としてクラス本体やフックの中に差し込んでいた。パターン本体の先頭には `import` 文があり、続くのは `const` 宣言と実行文なので、クラス本体に置けば宣言として解釈できず、関数本体に置けば `import` が module のトップレベル以外に来る。測ると、**21 通り (7 パターン × 3 framework) すべてで import が wrapper より後ろにあり、うち Angular の 7 件は `ts.transpileModule` が `Unexpected token. A constructor, method, accessor, or property was expected.` で落ちた**。React / Vue は構文解析は通るが、型検査が `TS1232: An import declaration can only be used at the top level of a namespace or module.` を返す。
  - `import` 文を本体から分離して wrapper の上に出し、同じ module への import は 1 行にまとめる（パターンが `'rxjs'` から複数回 import しており、wrapper 側の import と合わせると重複するため）。
  - 本体は Angular なら `start()` メソッド、React なら `useEffect`、Vue なら composable の関数本体に入れる。宣言と実行文はいずれの位置でも合法になる。
  - React / Vue の wrapper にあった `stream$.subscribe(setData)` を削除した。`stream$` はどのパターンにも存在しない名前で、コード上に定義のない識別子を書いていた。購読を書く位置はコメントで示す。
  - **本体そのものは書き換えない**。`document.getElementById` や `ajax` はラップ後も残る。出力の冒頭コメントで、DOM アクセスをテンプレート束縛に、`ajax` を HttpClient に置き換えるよう名指しする。パターンごとに framework 別の実装を持つまでは、Angular として完成しているように読めて通らないコードを返すより、どこを直すか書いてある方が使える。
- **`analyze_operators` の `shareReplay` の指摘が引数を見ていなかった** — `operators.includes('shareReplay')` が真なら常に「`shareReplay()` without buffer limit may cause memory issues」を出していた。`shareReplay(1)` にも `shareReplay({ bufferSize: 1, refCount: true })` にも同じ文が出る。バッファ上限の有無と refCount の有無は別の性質で、結果も別（前者は全発行値を保持し続ける、後者は購読者が 0 になっても元のソースの購読が残る）。`shareReplay(1)` は前者を満たし後者を満たさないので、この文は事実と食い違っていた。同じ対象について `detect_memory_leak` は refCount を、`lint_rxjs` の `no-sharereplay` は引数の形を見ており、3 つのツールが違うことを言う状態だった。
  - `src/shared/subscription-analysis.ts` に `analyzeShareReplay()` を追加し、括弧の対応を数えて最初の `shareReplay(...)` の引数を読む（正規表現だと入れ子の config object で切れる）。`{ present, bounded, refCount }` を返し、欠けている方だけを指摘する。
  - 既存の `hasUnsafeShareReplay()` はこの関数に委譲する形にした（`present && !refCount`）。判定は 1 箇所になる。
- **`generate_marble` が `a` を飛ばし、自明な凡例を出していた** — 記号の割り当てが `97 + Object.keys(valueMap).length` で、その `valueMap` には数字で描いた値も入る。`0` から始まるストリームは次の値が `b` になり、凡例には `0 = 0` という行が出た。
  - 割り当て済みの英字を数える専用のカウンタに変え、同じ値には同じ記号を割り当てる（同じ値が 2 回出ても凡例は 1 行）。
  - 記号が値をそのまま示している場合（`0`、`"a"`）は凡例に出さない。
  - `-` `|` `#` と空白は図が使う文字なので、1 文字の文字列値でもこれらは記号にせず英字を割り当てる。値 `'|'` が完了記号として描かれることが無くなる。
  - 既に使われている文字は英字割り当てでも飛ばす。値 `'a'` と複雑な値が同じ図にあっても衝突しない。
- **`generate_marble` の図が完了記号の後ろに 1 フレーム余っていた** — 図の長さが常に `maxTime + scale * 2` だったため、最後のイベントが `complete` / `error` のとき `|` や `#` の後ろに `-` が残った。終端するストリームは記号の 1 フレームだけを足すようにした。あわせて `duration || ...` を `duration !== undefined && duration > 0 ? ... : ...` に変え、`duration: 0` が既定値に落ちる経路をなくした。

### Added

- **`src/data/patterns.test.ts`** — framework 適応が出す TypeScript を `ts.transpileModule` に通し、21 通りすべてで構文エラーが 0 件であることを見る 6 ケース。既存のテストはすべて部分文字列の照合だったため、45 行のコードが 1 行も parse できない状態を誰も見ていなかった。**この検査は v0.5.0 の実装に対して 7/21 で落ちる**ことを確認済み。import の位置と 1 module 1 行も同時に検査する。
- `analyze_operators` の shareReplay について 4 ケース（引数なし / `shareReplay(1)` / `{ bufferSize, refCount }` / `{ refCount }` のみ）、`generate_marble` の記号割り当てと図の長さについて 7 ケースを追加。テストは 239 件から 255 件になった。

## [0.5.0] - 2026-09-02

### Changed

- **MCP TypeScript SDK を v1 から v2 へ移行** — 依存を `@modelcontextprotocol/sdk@^1.25.0` から `@modelcontextprotocol/server@^2.0.0` に差し替えた。v1 の単一パッケージは v2 で `server` / `client` / `core` / フレームワーク別アダプタに分割され、`@modelcontextprotocol/sdk/server/index.js` のような深いパスは解決しなくなった。本サーバーは stdio 専用なので `@modelcontextprotocol/server` 1 つで足りる。
- **stdio の起動を `serveStdio(factory)` に変更** — `new Server(...)` + `new StdioServerTransport()` + `server.connect(transport)` の手組みをやめた。`serveStdio` は transport とプロトコル世代の決定を持ち、接続ごとに factory から 1 インスタンスを固定する。返る `StdioServerHandle.close()` を SIGINT / SIGTERM のハンドラに置いた。
- **ツール登録を `registerTool()` に変更** — `setRequestHandler(ListToolsRequestSchema, ...)` と `setRequestHandler(CallToolRequestSchema, ...)` の 2 本立て、および `toolHandlers` の表引きを廃止し、6 ツールを `server.registerTool(name, config, handler)` で登録する。未知のツール名の判定と入力スキーマの検証は SDK 側が行うため、`McpError` / `ErrorCode` の使用箇所は無くなった。
- **`zod` を `^3.23.0` から `^4.2.0` へ** — v2 は zod 3 を受け付けない。zod 3 のままでも `npm install` も `tsc` も通り、サーバーは起動して接続まで成功するが、最初の `tools/list` が `fromJsonSchema()` を指すエラーを返す。型検査でもユニットテストでも捕まらない経路のため、宣言レンジごと更新した。4.0〜4.1 では変換に SDK 内蔵の zod が使われ、`.describe()` の説明文が JSON Schema から消えるため、下限は 4.2.0 以上が必要。
- **`zod-to-json-schema` を削除** — v2 は `inputSchema` に渡された zod オブジェクト（Standard Schema）から JSON Schema を生成する。`zodToJsonSchema(schema, { target: 'openApi3' })` の呼び出しは不要になった。実行時依存は 4 個から 2 個 (`@modelcontextprotocol/server`, `rxjs`, `zod`) に減った。
- **`ToolResponse` を interface から型エイリアスへ** — v2 のツール結果型は `_meta` の通過のために `[x: string]: unknown` を持つ。暗黙のインデックスシグネチャが付くのは型エイリアスだけで、interface のままでは `registerTool` のコールバック型に一致しない。
- **`ToolDefinition.outputSchema` を削除** — どのツールも宣言しておらず、v1 では `tools/list` に `undefined` が乗っているだけだった。v2 では登録側から渡さないため、残すと「書いても効かないフィールド」になる。`structuredContent` を返すかどうかは別途決める。

### Added

- **`src/server.ts`** — `createServer(): McpServer` を `src/index.ts` から切り出して export した。stdio の入口が `serveStdio` に渡す factory であると同時に、プロトコルテストが `createMcpHandler` 経由でプロセス内から叩く対象でもある。`src/index.ts` は stdio の起動とシャットダウンだけになった。
- **`instructions`** — `initialize` の応答としてクライアントへ返す射程の宣言を追加した。README はモデルが読まず、ツールの `description` はそのツールを検討する時点まで読まれない。`instructions` はツールを 1 つも呼ばないうちにクライアントのシステムコンテキストに載る。書いたのは「しないこと」で、(1) `execute_stream` は RxJS 以外のモジュールを持たない worker で動くため呼び出し元のプロジェクトのコードは動かない、(2) `lint_rxjs` と `detect_memory_leak` は型情報を持たない正規表現照合であり、指摘が 0 件であることはコードが正しいことの証拠にならない、(3) `analyze_operators` / `suggest_pattern` が参照するのは RxJS 7.8.2 に固定した同梱データで、報告されないオペレーターは「データに無い」であって「RxJS に無い」ではない、の 3 点。
- **`src/server.test.ts`** — 実物の `Client` を in-process で繋いで検証する 6 ケース。`tools/list` が 6 ツールを JSON Schema 付きで返すこと、`.describe()` の説明文が残ること、`annotations` が届くこと、`instructions` が `initialize` の応答に載ること、`z.enum` が拒否する引数がハンドラ到達前に `isError: true` で返ること、`tools/call` で実際にストリームが動くことを見る。zod 変換の失敗は `tsc` でも既存のユニットテストでも検出できないため、このファイルが移行の合格基準を担う。
- **`@modelcontextprotocol/client`** を devDependencies に追加（上記テスト用。実行時依存ではない）。
- **`.claude-plugin/plugin.json`** — shuji-bonji marketplace から `/plugin install` できるようにした。`mcpServers` のキーは `rxjs` で、`npx -y @shuji-bonji/rxjs-mcp@latest` を起動する。`claude_desktop_config.json` に手で書いていた設定と同じキー名なので、プラグイン経由に切り替えてもツール名は変わらない。

### Compatibility

- MCP クライアントから見た挙動は変わらない。ツール名 6 つ、入力スキーマ、`annotations`、返すテキストのいずれも変更なし。
- `serveStdio` は既定で 2025 世代のプロトコル改訂を話すクライアントも同じ factory から serve する（`legacy: 'serve'`）。`protocolVersion: '2024-11-05'` で `initialize` する既存の統合テスト（`src/tools/mcp-integration.test.ts` の 8 件、`test-mcp-server.mjs` の 7 件）は、いずれも `dist/index.js` を実際に spawn したまま無修正で通る。
- Node.js 要件は `>=22.0.0` のまま（v2 の下限は 20）。CI の Node 22 / 24 のマトリクスも変更なし。
- 各ツールのハンドラ内に残っている `inputSchema.parse(args)` は、SDK 側の検証と二重になる。ユニットテストがハンドラを直接呼び、`takeCount` や `timeout` の既定値をこの `parse` から得ているため残した。

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
