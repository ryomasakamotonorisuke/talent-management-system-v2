# Vercelデプロイガイド

## 前提条件

- GitHubリポジトリにコードがプッシュされていること
- Supabaseプロジェクトが作成されていること
- 環境変数が準備されていること

## デプロイ手順

### 1. Vercelアカウント作成

1. [https://vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 2. プロジェクトのインポート

1. Vercelダッシュボードで「Add New」→「Project」をクリック
2. GitHubリポジトリを選択
3. 「Import」をクリック

### 3. プロジェクト設定

Vercelは自動的にNext.jsプロジェクトを検出します。以下の設定を確認：

- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. 環境変数の設定

「Environment Variables」セクションで以下を追加：

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | VercelでデプロイされるURL（後で更新可） |

### 5. デプロイ実行

1. 「Deploy」ボタンをクリック
2. ビルドプロセスの進行状況を確認
3. ビルドが完了するとURLが表示されます

### 6. 本番環境URLの更新

デプロイ完了後：

1. 表示されたURLをコピー（例：`https://talent-management.vercel.app`）
2. Vercelダッシュボードの「Settings」→「Environment Variables」を開く
3. `NEXT_PUBLIC_APP_URL` を実際のURLに更新
4. 再度デプロイを実行

## 自動デプロイ

GitHubにプッシュすると自動的にデプロイされます：

- **mainブランチ**: 本番環境にデプロイ
- **その他のブランチ**: プレビュー環境にデプロイ

## カスタムドメイン設定

1. Vercelダッシュボードで「Settings」→「Domains」を選択
2. ドメイン名を入力
3. DNS設定を指示に従って実施
4. 設定完了後、カスタムドメインでアクセス可能

## 環境変数の管理

### 開発環境用

- `.env.local` ファイルを使用（ローカル開発）

### 本番環境用

- Vercelダッシュボードで環境変数を設定
- 機密情報は必ずVercelで管理

## パフォーマンス最適化

Vercelは自動的に以下を最適化します：

- ✅ 自動的なCDN配信
- ✅ 画像最適化
- ✅ コード分割
- ✅ サーバーサイドレンダリング（SSR）
- ✅ 静的生成（SSG）

## 監視とログ

### ログの確認

1. Vercelダッシュボードで「Deployments」を選択
2. デプロイメントをクリック
3. 「Functions」タブでログを確認

### エラーの監視

- Vercelの「Analytics」タブでパフォーマンスを確認
- エラーは自動的にログに記録されます

## トラブルシューティング

### ビルドエラー

- ビルドログを確認
- 環境変数が正しく設定されているか確認
- `package.json` の依存関係を確認

### ランタイムエラー

- 関数ログを確認
- Supabase接続を確認
- 環境変数が正しく読み込まれているか確認

### パフォーマンス問題

- Vercel Analyticsでボトルネックを特定
- 画像最適化を確認
- データベースクエリを最適化

---

**デプロイ完了！** 🚀

Vercelでアプリケーションが公開されました。














