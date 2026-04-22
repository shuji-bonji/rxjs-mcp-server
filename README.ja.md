# RxJS MCP Server

<!-- Package meta -->

[![npm version](https://img.shields.io/npm/v/@shuji-bonji/rxjs-mcp.svg?logo=npm)](https://www.npmjs.com/package/@shuji-bonji/rxjs-mcp)
[![npm downloads](https://img.shields.io/npm/dw/@shuji-bonji/rxjs-mcp.svg?logo=npm)](https://www.npmjs.com/package/@shuji-bonji/rxjs-mcp)
[![license](https://img.shields.io/npm/l/@shuji-bonji/rxjs-mcp.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@shuji-bonji/rxjs-mcp.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

<!-- Build / trust -->

[![CI](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/ci.yml)
[![Release](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/release.yml/badge.svg)](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/release.yml)
[![Provenance](https://img.shields.io/badge/npm-provenance-blue?logo=npm)](https://docs.npmjs.com/generating-provenance-statements)
[![Trusted Publisher](https://img.shields.io/badge/npm-Trusted%20Publisher-cb3837?logo=npm)](https://docs.npmjs.com/trusted-publishers)

<!-- Tech stack -->

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RxJS](https://img.shields.io/badge/RxJS-7.x-B7178C.svg?logo=reactivex&logoColor=white)](https://rxjs.dev)
[![MCP](https://img.shields.io/badge/MCP-compatible-6C4BFF.svg)](https://modelcontextprotocol.io)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./README.ja.md#コントリビューション)

> ⚠️ これは非公式のコミュニティプロジェクトです。RxJSチームとは関係ありません。

ClaudeなどのAIアシスタントから直接RxJSストリームを実行、デバッグ、可視化できます。

## 機能

### 🚀 ストリーム実行
- RxJSコードを実行し、発行された値をキャプチャ
- タイムスタンプ付きタイムライン可視化
- メモリ使用量トラッキング
- 主要なRxJSオペレーターをすべてサポート

### 📊 マーブルダイアグラム
- ASCIIマーブルダイアグラムを生成
- 時間経過に沿ったストリームの動作を可視化
- パターンの自動検出
- 凡例と説明を表示

### 🔍 オペレーター分析
- オペレーターチェーンのパフォーマンスを分析
- 潜在的な問題やボトルネックを検出
- 代替アプローチを提案
- オペレーターを機能別に分類

### 🛡️ メモリリーク検出
- 解除されていないサブスクリプションを特定
- クリーンアップパターンの欠落を検出
- フレームワーク固有の推奨事項（Angular、React、Vue）
- 適切なクリーンアップ例を提供

### 💡 パターン提案
- 実戦で検証済みのRxJSパターンを取得
- フレームワーク固有の実装
- 一般的なユースケースをカバー：
  - バックオフ付きHTTPリトライ
  - 検索タイプアヘッド
  - WebSocket再接続
  - フォームバリデーション
  - 状態管理
  - その他多数...

## インストール

```bash
# グローバルインストール
npm install -g @shuji-bonji/rxjs-mcp

# またはnpxで使用
npx @shuji-bonji/rxjs-mcp
```

## 設定

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` に追加：

```json
{
  "mcpServers": {
    "rxjs": {
      "command": "npx",
      "args": ["@shuji-bonji/rxjs-mcp"]
    }
  }
}
```

### VS Code（Continue/Copilot）

`.vscode/mcp.json` に追加：

```json
{
  "mcpServers": {
    "rxjs": {
      "command": "npx",
      "args": ["@shuji-bonji/rxjs-mcp"]
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json` に追加：

```json
{
  "mcpServers": {
    "rxjs": {
      "command": "npx",
      "args": ["@shuji-bonji/rxjs-mcp"]
    }
  }
}
```

## 利用可能なツール

### execute_stream

RxJSコードを実行し、タイムライン付きでストリームの発行をキャプチャします。

Observable に評価される式、または末尾がそのような式で終わるスニペットを受け付けます。`return` の記述は任意です。

```typescript
// ✅ 末尾の式で返す（v0.2.0 以降、自動的に return されます）
interval(100).pipe(
  take(5),
  map(x => x * 2)
)

// ✅ 宣言 + 末尾で参照
const stream$ = interval(100).pipe(take(5), map(x => x * 2));
stream$

// ✅ 明示的な return（従来通り動作します）
return interval(100).pipe(take(5), map(x => x * 2));
```

### generate_marble

イベントデータからASCIIマーブルダイアグラムを生成します。

```typescript
// 入力：タイムスタンプ付きイベントの配列
[
  { time: 0, value: 'A' },
  { time: 50, value: 'B' },
  { time: 100, value: 'C' }
]

// 出力: A----B----C--|
```

### analyze_operators

RxJSオペレーターチェーンのパフォーマンスとベストプラクティスを分析します。

```typescript
// 以下のようなチェーンを分析：
source$.pipe(
  map(x => x * 2),
  filter(x => x > 10),
  switchMap(x => fetchData(x)),
  retry(3)
)
```

### detect_memory_leak

潜在的なメモリリークとクリーンアップ漏れを検出します。

```typescript
// 以下のような問題を検出：
- unsubscribeの欠落
- takeUntilオペレーターの未使用
- 完了しないSubject
- 無限interval
```

### suggest_pattern

一般的なユースケース向けの本番環境対応パターンを取得します。

利用可能なパターン：
- `http-retry` - リトライ付き堅牢なHTTP
- `search-typeahead` - デバウンス付き検索
- `polling` - バックオフ付きスマートポーリング
- `websocket-reconnect` - 自動再接続WebSocket
- `form-validation` - リアクティブフォームバリデーション
- `state-management` - シンプルな状態ストア
- `cache-refresh` - リフレッシュ戦略付きキャッシュ
- その他多数...

## 使用例

### Claudeでの使用

```
ユーザー: 「このRxJSストリームを実行して出力を見せて」

Claude: RxJSストリームを実行します。

[execute_streamツールを使用]

## ストリーム実行結果
✅ 完了
実行時間: 523ms
発行された値: 5

### 発行された値
[0, 2, 4, 6, 8]
```

### メモリリークのデバッグ

```
ユーザー: 「このAngularコンポーネントのメモリリークをチェックして」

Claude: コンポーネントの潜在的なメモリリークを分析します。

[detect_memory_leakツールを使用]

## メモリリーク分析
⚠️ 潜在的なリークを検出

1. 🔴 subscription（重大度：高）
   - subscribe()が3回見つかりましたが、unsubscribe()は1回のみ
   - 修正：destroy$ subjectでtakeUntilパターンを使用
```

### パターンの取得

```
ユーザー: 「RxJSで検索を実装する方法を教えて」

Claude: 検索タイプアヘッドパターンを紹介します。

[suggest_patternツールを useCase: 'search-typeahead' で使用]

## デバウンス付き検索タイプアヘッド
[説明付きの完全な実装]
```

## 開発

```bash
# リポジトリをクローン
git clone https://github.com/shuji-bonji/rxjs-mcp-server
cd rxjs-mcp-server

# 依存関係をインストール
npm install

# ビルド
npm run build

# 開発モードで実行
npm run dev

# MCP Inspectorでテスト
npm test
```

## リリース

リリースは GitHub Actions で自動化されており、npm への publish は
**Trusted Publisher (OIDC)** を使用します（静的トークン不要、
provenance attestation 付き）。手順は [RELEASING.md](./RELEASING.md) を参照してください。

## 他のMCPサーバーとの連携

RxJS MCP Serverは以下と組み合わせて使用できます：
- **Angular MCP** - Angularプロジェクトのスキャフォールディング用
- **TypeScript MCP** - 型チェック用
- **ESLint MCP** - コード品質用

将来的なMeta-MCP統合により、これらのツール間のシームレスな連携が可能になります。

## アーキテクチャ

```
┌─────────────────┐
│   AIアシスタント  │
│  (Claude など)   │
└────────┬────────┘
         │
    MCPプロトコル
         │
┌────────┴────────┐
│  RxJS MCP Server│
├─────────────────┤
│ • execute_stream│
│ • generate_marble│
│ • analyze_operators│
│ • detect_memory_leak│
│ • suggest_pattern│
└─────────────────┘
```

## コントリビューション

コントリビューションを歓迎します！お気軽にPRを送ってください。

## ライセンス

MIT

## 作者

Shuji Bonji

## リンク

- [GitHubリポジトリ](https://github.com/shuji-bonji/rxjs-mcp-server)
- [RxJSドキュメント](https://rxjs.dev)
- [Model Context Protocol](https://modelcontextprotocol.io)
