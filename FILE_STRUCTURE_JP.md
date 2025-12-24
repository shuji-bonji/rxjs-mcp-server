# RxJS MCP Server ファイル構成

## 📁 プロジェクト構造

```
rxjs-mcp-server/
├── package.json          # プロジェクト設定・依存関係定義
├── tsconfig.json        # TypeScript設定
├── README.md           # プロジェクトドキュメント（英語）
├── LICENSE             # MITライセンス
├── src/                # ソースコード
│   ├── index.ts        # メインエントリーポイント
│   ├── types.ts        # 共通型定義
│   └── tools/          # MCPツール実装
│       ├── execute-stream.ts     # ストリーム実行ツール
│       ├── marble-diagram.ts     # マーブルダイアグラム生成
│       ├── analyze-operators.ts  # オペレーター分析
│       ├── memory-leak.ts        # メモリリーク検出
│       └── suggest-pattern.ts    # パターン提案
├── dist/               # ビルド成果物（自動生成）
│   ├── index.js        # コンパイル済みメインファイル
│   ├── index.js.map    # ソースマップ
│   ├── index.d.ts     # 型定義ファイル
│   ├── types.js        # コンパイル済み型定義
│   └── tools/          # コンパイル済みツール
│       ├── execute-stream.js
│       ├── marble-diagram.js
│       ├── analyze-operators.js
│       ├── memory-leak.js
│       └── suggest-pattern.js
└── node_modules/       # 依存パッケージ（npm install後）
```

## 📊 アーキテクチャ図

### 全体構成図

```mermaid
flowchart LR
    subgraph Client["MCPクライアント"]
        IDE["IDE / AI Assistant"]
    end

    subgraph Server["RxJS MCP Server"]
        direction TB
        Entry["index.ts<br/>エントリーポイント"]

        subgraph Core["コア"]
            MCPServer["MCP Server<br/>@modelcontextprotocol/sdk"]
            Transport["StdioServerTransport<br/>標準入出力通信"]
            Handlers["Request Handlers<br/>ツールリスト・実行"]
        end

        subgraph Tools["ツール群"]
            direction LR
            T1["execute_stream<br/>ストリーム実行"]
            T2["generate_marble<br/>マーブル生成"]
            T3["analyze_operators<br/>オペレーター分析"]
            T4["detect_memory_leak<br/>リーク検出"]
            T5["suggest_pattern<br/>パターン提案"]
        end

        Types["types.ts<br/>型定義"]
    end

    subgraph External["外部依存"]
        RxJS["RxJS"]
        Zod["Zod<br/>バリデーション"]
    end

    IDE <-->|"JSON-RPC over stdio"| Transport
    Transport <--> MCPServer
    MCPServer <--> Handlers
    Entry --> MCPServer
    Entry --> Transport
    Handlers --> Tools
    Tools --> Types
    Tools --> RxJS
    Tools --> Zod
```

### 型・インターフェース関係図（クラス図）

```mermaid
classDiagram
    class ToolResponse {
        +content TextContent[]
    }

    class TextContent {
        +type string
        +text string
    }

    class ToolHandler {
        <<function type>>
        +execute(args) ToolResponse
    }

    class ToolDefinition {
        +name string
        +description string
        +inputSchema ZodType
        +outputSchema any
        +annotations ToolAnnotations
    }

    class ToolAnnotations {
        +readOnlyHint boolean
        +destructiveHint boolean
        +idempotentHint boolean
        +openWorldHint boolean
    }

    class ToolImplementation {
        +definition ToolDefinition
        +handler ToolHandler
    }

    class OperatorInfo {
        +name string
        +category OperatorCategory
        +description string
        +marblePattern string
    }

    class StreamExecutionResult {
        +values any[]
        +errors any[]
        +completed boolean
        +timeline TimelineEvent[]
        +executionTime number
        +memoryUsage MemoryInfo
    }

    class TimelineEvent {
        +time number
        +type EventType
        +value any
    }

    class MemoryInfo {
        +before number
        +after number
        +peak number
    }

    class PatternSuggestion {
        +name string
        +description string
        +code string
        +useCase string
        +operators string[]
        +considerations string[]
    }

    class MemoryLeakResult {
        +hasLeak boolean
        +leakSources LeakSource[]
        +recommendations string[]
    }

    class LeakSource {
        +type LeakType
        +description string
        +severity Severity
        +suggestion string
    }

    class MarbleDiagramResult {
        +diagram string
        +explanation string
        +timeline MarbleEvent[]
    }

    ToolResponse *-- TextContent
    ToolImplementation *-- ToolDefinition
    ToolImplementation *-- ToolHandler
    ToolDefinition *-- ToolAnnotations
    StreamExecutionResult *-- TimelineEvent
    StreamExecutionResult *-- MemoryInfo
    MemoryLeakResult *-- LeakSource
```

> **型の補足:**
> - `EventType`: `"next"` | `"error"` | `"complete"`
> - `LeakType`: `"subscription"` | `"subject"` | `"operator"`
> - `Severity`: `"low"` | `"medium"` | `"high"`
> - `OperatorCategory`: `"creation"` | `"transformation"` | `"filtering"` | `"combination"` | `"utility"` | `"error-handling"` | `"multicasting"`

### ツール実行シーケンス図

```mermaid
sequenceDiagram
    participant Client as MCPクライアント
    participant Transport as StdioTransport
    participant Server as MCP Server
    participant Handler as RequestHandler
    participant Tool as ToolHandler
    participant RxJS as RxJS

    Note over Client,RxJS: ツール一覧取得フロー
    Client->>Transport: ListToolsRequest
    Transport->>Server: parse request
    Server->>Handler: ListToolsRequestSchema
    Handler-->>Server: tools[]
    Server-->>Transport: ListToolsResponse
    Transport-->>Client: ツール一覧 (JSON)

    Note over Client,RxJS: ツール実行フロー (例: execute_stream)
    Client->>Transport: CallToolRequest<br/>{name: "execute_stream", args: {...}}
    Transport->>Server: parse request
    Server->>Handler: CallToolRequestSchema
    Handler->>Handler: ツールハンドラー検索
    Handler->>Tool: handler(args)
    Tool->>Tool: Zodでバリデーション
    Tool->>RxJS: Observable生成・実行
    RxJS-->>Tool: 値の放出
    Tool->>Tool: 結果フォーマット
    Tool-->>Handler: ToolResponse
    Handler-->>Server: 結果
    Server-->>Transport: CallToolResponse
    Transport-->>Client: 実行結果 (Markdown)

    Note over Client,RxJS: エラーハンドリング
    Client->>Transport: CallToolRequest (不正)
    Transport->>Server: parse request
    Server->>Handler: 検証
    Handler-->>Server: McpError
    Server-->>Transport: エラーレスポンス
    Transport-->>Client: エラー詳細
```

### コンポーネント関係図

```mermaid
flowchart LR
    subgraph EntryPoint["エントリーポイント"]
        index["index.ts"]
    end

    subgraph TypeDefs["型定義"]
        types["types.ts"]
    end

    subgraph ToolModules["ツールモジュール"]
        direction TB
        exec["execute-stream.ts"]
        marble["marble-diagram.ts"]
        analyze["analyze-operators.ts"]
        memleak["memory-leak.ts"]
        suggest["suggest-pattern.ts"]
    end

    subgraph Dependencies["依存関係"]
        sdk["@modelcontextprotocol/sdk"]
        rxjs["rxjs"]
        zod["zod"]
    end

    index --> exec
    index --> marble
    index --> analyze
    index --> memleak
    index --> suggest
    index --> types
    index --> sdk

    exec --> types
    exec --> rxjs
    exec --> zod

    marble --> types
    marble --> zod

    analyze --> types
    analyze --> zod

    memleak --> types
    memleak --> zod

    suggest --> types
    suggest --> zod
```

### オペレーターカテゴリ構成図

> 参考: [Learn RxJS - Operators](https://www.learnrxjs.io/learn-rxjs/operators) / [RxJS公式リポジトリ](https://github.com/ReactiveX/rxjs)

```mermaid
mindmap
  root((RxJS<br/>オペレーター))
    Creation 作成
      of ⭐
      from ⭐
      fromEvent
      interval
      timer
      range
      ajax ⭐
      defer
      generate
      throwError
      EMPTY
    Transformation 変換
      map ⭐
      switchMap ⭐
      mergeMap ⭐
      concatMap ⭐
      exhaustMap
      scan ⭐
      reduce
      pluck
      bufferTime ⭐
      bufferCount
      groupBy
      expand
      toArray
    Filtering フィルタリング
      filter ⭐
      take ⭐
      takeUntil ⭐
      first
      last
      skip
      skipUntil
      distinctUntilChanged ⭐
      debounceTime ⭐
      throttleTime
      auditTime
      sampleTime
    Combination 結合
      merge ⭐
      concat ⭐
      combineLatest ⭐
      forkJoin
      zip
      race
      withLatestFrom ⭐
      startWith ⭐
      endWith
    Error Handling エラー処理
      catchError ⭐
      retry
      retryWhen
    Multicasting マルチキャスト
      share ⭐
      shareReplay ⭐
      publish
      multicast
    Utility ユーティリティ
      tap ⭐
      delay
      finalize
      timeout
      repeat
      toPromise
```

> ⭐ は頻繁に使用されるオペレーターを示しています

### RxJS リポジトリ構造

> 参考: [ReactiveX/rxjs](https://github.com/ReactiveX/rxjs)

```mermaid
flowchart TB
    subgraph Monorepo["RxJS Monorepo"]
        direction TB
        subgraph Packages["/packages"]
            direction LR
            RxJSPkg["rxjs/"]
            subgraph RxJSSrc["src/"]
                Internal["internal/<br/>内部実装"]
                Operators["operators/<br/>オペレーター"]
                Ajax["ajax/"]
                Fetch["fetch/"]
                WebSocket["webSocket/"]
                Testing["testing/"]
            end
        end
        subgraph Apps["/apps"]
            Docs["rxjs.dev<br/>ドキュメントサイト"]
        end
    end

    RxJSPkg --> RxJSSrc
```

### パターン提案のデータフロー

```mermaid
flowchart TD
    subgraph Input["入力"]
        UseCase["ユースケース選択"]
        Framework["フレームワーク選択<br/>(Angular/React/Vue/Vanilla)"]
    end

    subgraph PatternDB["パターンデータベース"]
        P1["http-retry"]
        P2["search-typeahead"]
        P3["polling"]
        P4["websocket-reconnect"]
        P5["form-validation"]
        P6["state-management"]
        P7["cache-refresh"]
        P8["その他..."]
    end

    subgraph Processing["処理"]
        Match["パターンマッチング"]
        CodeGen["コード生成"]
        DocGen["ドキュメント生成"]
    end

    subgraph Output["出力"]
        Code["実装コード"]
        Operators["使用オペレーター一覧"]
        Considerations["考慮事項"]
        UseCaseDesc["ユースケース説明"]
    end

    UseCase --> Match
    Framework --> CodeGen
    Match --> PatternDB
    PatternDB --> CodeGen
    CodeGen --> Code
    CodeGen --> DocGen
    DocGen --> Operators
    DocGen --> Considerations
    DocGen --> UseCaseDesc
```

## 📄 主要ファイルの説明

### 設定ファイル

#### `package.json`
プロジェクトのメタデータと設定を管理
- **name**: `@shuji-bonji/rxjs-mcp` - パッケージ名
- **version**: `0.1.0` - 現在のバージョン
- **dependencies**: 実行時に必要なパッケージ
  - `@modelcontextprotocol/sdk` - MCP SDK
  - `rxjs` - RxJSライブラリ
  - `zod` - スキーマバリデーション
- **devDependencies**: 開発時に必要なパッケージ
  - `typescript` - TypeScriptコンパイラ
  - `tsx` - TypeScript実行環境
  - `@types/node` - Node.js型定義
- **scripts**: npm スクリプト
  - `build` - TypeScriptをコンパイル
  - `dev` - 開発モード（ホットリロード）
  - `test` - MCP Inspectorでテスト
  - `clean` - ビルド成果物を削除

#### `tsconfig.json`
TypeScriptコンパイラの設定
- **target**: ES2022 - 出力するJavaScriptのバージョン
- **module**: Node16 - モジュールシステム
- **strict**: true - 厳格な型チェック有効
- **outDir**: ./dist - 出力ディレクトリ
- **rootDir**: ./src - ソースディレクトリ

### ソースコード（src/）

#### `index.ts`
MCPサーバーのメインエントリーポイント
- サーバーインスタンスの初期化
- ツールの登録と管理
- リクエストハンドラーの設定
- stdio通信の確立
- グレースフルシャットダウンの処理

主な責務：
1. MCPサーバーの起動
2. ツールリストの提供
3. ツール実行のルーティング
4. エラーハンドリング

#### `types.ts`
プロジェクト全体で使用する型定義
- `ToolResponse` - ツールレスポンスの構造
- `ToolHandler` - ツールハンドラー関数の型
- `ToolDefinition` - ツール定義の構造
- `ToolImplementation` - ツール実装の構造
- `StreamExecutionResult` - ストリーム実行結果
- `PatternSuggestion` - パターン提案の構造
- `MemoryLeakResult` - メモリリーク検出結果
- `MarbleDiagramResult` - マーブルダイアグラム結果
- `OperatorInfo` - オペレーター情報

### ツール実装（src/tools/）

#### `execute-stream.ts`
**RxJSストリーム実行ツール**

主な機能：
- RxJSコードの動的実行
- ストリームの値をキャプチャ
- タイムライン記録
- メモリ使用量の測定
- エラーハンドリング

入力パラメータ：
- `code` - 実行するRxJSコード
- `takeCount` - 取得する最大値数
- `timeout` - タイムアウト時間（ミリ秒）
- `captureTimeline` - タイムライン記録の有無
- `captureMemory` - メモリ使用量記録の有無

#### `marble-diagram.ts`
**マーブルダイアグラム生成ツール**

主な機能：
- ASCIIマーブルダイアグラムの生成
- イベントの時系列可視化
- パターン分析（規則的/不規則的な間隔）
- 値のマッピングと凡例生成

入力パラメータ：
- `events` - イベント配列（時間、値、タイプ）
- `duration` - 表示する総時間
- `scale` - 時間スケール（ms/文字）
- `showValues` - 値の表示有無

出力形式：
```
--A--B--C--D--|
Values:
  A = 1
  B = 2
  C = 3
  D = 4
```

#### `analyze-operators.ts`
**オペレーターチェーン分析ツール**

主な機能：
- オペレーターの抽出と分類
- パフォーマンス問題の検出
- 代替アプローチの提案
- ベストプラクティスのチェック

検出する問題：
- 複数のflatteningオペレーター
- map + filter の非効率な組み合わせ
- shareReplayの不適切な使用
- エラーハンドリングの欠如
- クリーンアップの欠如

オペレーターデータベース：
- 作成系（of, from, interval等）
- 変換系（map, switchMap, scan等）
- フィルター系（filter, take, debounceTime等）
- 結合系（merge, concat, zip等）
- ユーティリティ系（tap, delay, timeout等）
- エラーハンドリング系（catchError, retry等）

#### `memory-leak.ts`
**メモリリーク検出ツール**

主な機能：
- unsubscribeされていないサブスクリプション検出
- 無限ストリームの検出（interval, timer）
- 未完了のSubject検出
- fromEventのリスナーリーク検出
- フレームワーク固有の問題検出

フレームワーク対応：
- **Angular**: ngOnDestroy、async pipeのチェック
- **React**: useEffectクリーンアップのチェック
- **Vue**: beforeUnmount/onBeforeUnmountのチェック

重要度レベル：
- 🔴 **high** - 確実にリークする問題
- 🟡 **medium** - リークの可能性がある問題
- 🟢 **low** - パフォーマンスへの影響が小さい問題

#### `suggest-pattern.ts`
**RxJSパターン提案ツール**

利用可能なパターン：
1. **http-retry** - HTTPリトライ（指数バックオフ）
2. **search-typeahead** - 検索入力（デバウンス付き）
3. **polling** - スマートポーリング
4. **websocket-reconnect** - WebSocket自動再接続
5. **form-validation** - リアクティブフォーム検証
6. **state-management** - シンプルな状態管理
7. **cache-refresh** - キャッシュとリフレッシュ
8. **drag-drop** - ドラッグ＆ドロップ
9. **infinite-scroll** - 無限スクロール
10. **auto-save** - 自動保存
11. **rate-limiting** - レート制限
12. **error-recovery** - エラーリカバリ
13. **loading-states** - ローディング状態管理
14. **data-sync** - データ同期
15. **event-aggregation** - イベント集約

各パターンには以下が含まれます：
- 実装コード（フレームワーク別）
- 使用するオペレーター一覧
- 重要な考慮事項
- ユースケースの説明

### ビルド成果物（dist/）

TypeScriptコンパイル後に生成される実行可能なJavaScriptファイル群：
- `.js` - 実行可能なJavaScriptコード
- `.js.map` - デバッグ用ソースマップ
- `.d.ts` - TypeScript型定義（他のプロジェクトから利用時）
- `.d.ts.map` - 型定義のソースマップ

## 🔧 開発フロー

### 1. セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/shuji-bonji/rxjs-mcp-server
cd rxjs-mcp-server

# 依存関係のインストール
npm install
```

### 2. 開発
```bash
# 開発モード（ファイル監視＋自動再起動）
npm run dev

# TypeScriptのビルド
npm run build

# ビルド成果物のクリーン
npm run clean
```

### 3. テスト
```bash
# MCP Inspectorでのテスト
npm test

# または直接実行
npx @modelcontextprotocol/inspector dist/index.js
```

### 4. デプロイ準備
```bash
# プロダクションビルド
npm run build

# パッケージ公開準備
npm pack
```

## 📦 パッケージ構成

### 公開されるファイル
`package.json`の`files`フィールドで定義：
- `dist/` - コンパイル済みJavaScriptコード
- `README.md` - ドキュメント
- `LICENSE` - ライセンスファイル

### 除外されるファイル
- `src/` - TypeScriptソースコード（型定義は含まれる）
- `node_modules/` - 依存パッケージ
- `*.test.ts` - テストファイル
- 設定ファイル（.gitignore, .npmignore等）

## 🎯 設計思想

### モジュール性
各ツールは独立したモジュールとして実装され、以下の構造を持ちます：
1. **入力スキーマ** - Zodによる厳密な型定義
2. **処理ロジック** - 単一責任の原則に従った実装
3. **出力フォーマット** - 一貫したMarkdown形式

### 拡張性
新しいツールの追加が容易：
1. `src/tools/`に新しいツールファイルを作成
2. `ToolImplementation`インターフェースを実装
3. `index.ts`でツールを登録

### 型安全性
TypeScriptとZodを使用した完全な型安全性：
- コンパイル時の型チェック
- ランタイムでのスキーマバリデーション
- 型定義ファイルの自動生成

## 🚀 今後の拡張予定

1. **追加ツール**
   - ストリームのビジュアライゼーション
   - カスタムオペレーターの作成支援
   - パフォーマンスプロファイリング

2. **統合機能**
   - Angular MCPとの連携
   - TypeScript MCPとの統合
   - Meta-MCPサポート

3. **開発者体験の向上**
   - VSCode拡張機能
   - インタラクティブなプレイグラウンド
   - より詳細なドキュメント

## 📝 貢献ガイドライン

1. **新機能の追加**
   - Issueで議論
   - フィーチャーブランチで開発
   - テストの追加
   - プルリクエストの作成

2. **バグ修正**
   - Issueの報告
   - 最小限の再現コード
   - 修正とテスト
   - プルリクエスト

3. **ドキュメント改善**
   - README.mdの更新
   - コード内コメントの追加
   - 使用例の追加
