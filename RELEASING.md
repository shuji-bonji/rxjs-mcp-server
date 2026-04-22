# Releasing

このプロジェクトは **npm Trusted Publisher (OIDC)** を使って publish します。
静的な `NPM_TOKEN` シークレットは使用しません（≒ トークンが流出しても悪用されない）。

---

## 初回セットアップ（一度だけ）

npm 側で「このリポジトリの、この workflow からの publish を信頼する」という設定を一度行う必要があります。

### 1. パッケージが既に公開済みの場合

1. <https://www.npmjs.com/package/@shuji-bonji/rxjs-mcp> にログイン状態でアクセス
2. **Settings** → **Trusted Publishers** → **Add Trusted Publisher**
3. 以下を入力:
   | 項目 | 値 |
   |---|---|
   | Publisher | `GitHub Actions` |
   | Organization or user | `shuji-bonji` |
   | Repository | `rxjs-mcp-server` |
   | Workflow filename | `release.yml` |
   | Environment name | *(空欄でOK。使う場合は `npm` などを設定)* |
4. **Add** を押して確定

### 2. まだ公開していない新規パッケージの場合

1. <https://www.npmjs.com/> にログイン
2. **Account** → **Packages** → **Add Trusted Publisher（パッケージ事前登録）**
3. 同じ情報を入力。publish 時に初めてパッケージが作成されます。

### 3. GitHub 側の準備

GitHub 側は特別な設定不要です。workflow で `permissions: id-token: write` を宣言すれば OIDC トークンが自動で発行されます。

> 💡 **Organization を有効にする必要はありません**。個人アカウント `shuji-bonji` のリポジトリから直接 publish できます。

---

## 通常のリリース手順

```bash
# 1. main を最新に
git checkout main
git pull

# 2. テストが通ることを確認
npm ci
npm run build
npm test

# 3. version を上げる（patch / minor / major）
#    これで package.json と package-lock.json が更新され、
#    "v0.1.5" のような tag 付き commit が自動生成される
npm version patch -m "chore(release): %s"

# 4. CHANGELOG.md に今回の version のエントリが入っていることを確認
#    入っていなければ手動で追記し、amend してから tag を付け直す

# 5. push（commit と tag の両方）
git push && git push --tags
```

`git push --tags` で `v*` タグが push されると、
`.github/workflows/release.yml` が自動で:

1. ubuntu-latest + Node 22 で `npm ci && npm run build && npm test`
2. tag (`v0.1.5`) と `package.json` の `version` (`0.1.5`) が一致するかを検証
3. `npm publish --provenance --access public` で npm に公開（OIDC 経由）
4. `CHANGELOG.md` から該当セクションを抽出して GitHub Release を自動作成

公開された package の詳細ページには **"Provenance ✓"** バッジが付き、どの commit・どの workflow run から publish されたかが改ざん不可能な形で記録されます。

---

## 手動実行（ドライラン）

「本当に publish できる状態か、タグを切る前に確認したい」ときは:

1. GitHub リポジトリの **Actions** タブを開く
2. **Release** workflow を選択
3. **Run workflow** を押す
4. `dry_run` にチェック → **Run workflow**

`npm publish --dry-run` だけが走るので、実際の公開は発生しません。

---

## トラブルシューティング

### `404 Not Found - PUT https://registry.npmjs.org/...` が出る（provenance 署名は成功）

これは ほぼ確実に **npm CLI のバージョンが古いケース**です。

- Trusted Publisher は **npm >= 11.5.1** を必要とします
- Node 22 に同梱される npm は **10.x** なので、workflow で `npm publish` を直接呼ぶと OIDC 交換できず 401 相当になり、npm サーバは 404 で返してきます
- `sigstore` への provenance 署名は npm 10.x でも通るため、ログ上は「Signed provenance statement... published to transparency log」まで成功してから PUT だけコケる、という紛らわしい症状になります

**修正**: workflow で `npx -y npm@latest publish` を使う（release.yml 参照）。`npm install -g npm@latest` は Actions ランナー上で self-overwrite レースにより `MODULE_NOT_FOUND` で失敗するケースがあるため、`npx` でこのステップだけ新しい npm を呼び出すのが安全です。

### `ENEEDAUTH` / `403 Forbidden` が出る

- npm 側の Trusted Publisher 設定で、**Repository** と **Workflow filename** が一字一句合っているか確認
- `release.yml` の `permissions:` に `id-token: write` があるか確認
- `actions/setup-node` に `registry-url: 'https://registry.npmjs.org'` が指定されているか確認
- **Publishing access** が `Require 2FA and disallow tokens` になっていると OIDC token も弾かれるので、`Require 2FA or granular access token with bypass 2fa enabled` に変更

### Tag と package.json の version 不一致でコケる

これは正しい動作です。`npm version patch` を使わずに手動でタグを打った場合、先に `package.json` のバージョンを上げて commit してから tag を打ち直してください。

```bash
git tag -d v0.1.5            # ローカルの誤ったタグを削除
git push --delete origin v0.1.5  # リモートの誤ったタグを削除
# package.json を修正・commit
git tag v0.1.5
git push --tags
```

### Provenance が付かない

- `npm publish --provenance` になっているか
- Node バージョンが 20+ か（`--provenance` は Node 20+ でのみ動作）
- OIDC token 発行に失敗している可能性 → Actions のログで `id-token` 関連エラーを確認
