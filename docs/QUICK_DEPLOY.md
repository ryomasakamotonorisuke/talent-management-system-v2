# Vercelデプロイ クイックガイド

## 📋 デプロイ前の確認事項

### ✅ 1. Supabaseプロジェクトの準備

- [ ] Supabaseプロジェクトが作成されている
- [ ] データベーススキーマが実行されている（`docs/database-setup.md`）
- [ ] Storageバケットが作成されている（`pdf-media`, `trainee-media`）
- [ ] Storageポリシーが設定されている（`docs/storage-policies.sql`）
- [ ] RLSポリシーが設定されている（`docs/certificates-rls-policy.sql`）

### ✅ 2. 環境変数の準備

以下の値をメモしておいてください：

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### ✅ 3. GitHubリポジトリの準備

ローカルでGitリポジトリが初期化されていることを確認：

```bash
# リポジトリの状態を確認
git status

# まだ初期化されていない場合
git init
git add .
git commit -m "Initial commit: Talent Management System"
```

## 🚀 デプロイ手順

### ステップ1: GitHubにプッシュ

```bash
# GitHubリポジトリを作成（GitHubで手動で作成するか、以下を使用）
# リモートリポジトリを追加
git remote add origin https://github.com/yourusername/talent-management.git

# ブランチ名をmainに変更
git branch -M main

# プッシュ
git push -u origin main
```

**注意**: GitHubリポジトリがまだない場合は、先にGitHubでリポジトリを作成してください。

### ステップ2: Vercelアカウント作成

1. [https://vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」をクリック
3. **GitHubアカウントでサインアップ**（推奨）

### ステップ3: プロジェクトのインポート

1. Vercelダッシュボードで「Add New」→「Project」をクリック
2. GitHubリポジトリを選択（`talent-management`など）
3. 「Import」をクリック

### ステップ4: プロジェクト設定

Vercelは自動的にNext.jsプロジェクトを検出します。以下の設定を確認：

- **Framework Preset**: Next.js（自動検出）
- **Root Directory**: `./`（デフォルト）
- **Build Command**: `npm run build`（自動設定）
- **Output Directory**: `.next`（自動設定）
- **Install Command**: `npm install`（自動設定）

**変更不要**でOKです。

### ステップ5: 環境変数の設定（重要）

**デプロイ前に必ず設定してください！**

1. 「Environment Variables」セクションを開く
2. 以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase service role key（秘密） |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | デプロイ後のURL（後で更新可） |

**重要**: 
- `NEXT_PUBLIC_APP_URL`は最初は仮の値でOK（例：`https://talent-management.vercel.app`）
- デプロイ後に実際のURLが表示されるので、そのURLに更新してください

3. 各環境変数を追加後、「Save」をクリック

### ステップ6: デプロイ実行

1. 「Deploy」ボタンをクリック
2. ビルドプロセスの進行状況を確認
3. ビルドが完了するとURLが表示されます（2-3分）

### ステップ7: デプロイ後の設定

#### 7.1 本番環境URLの更新

1. デプロイ完了後、表示されたURLをコピー（例：`https://talent-management-abc123.vercel.app`）
2. Vercelダッシュボードの「Settings」→「Environment Variables」を開く
3. `NEXT_PUBLIC_APP_URL` を実際のURLに更新
4. 「Save」をクリック
5. 「Deployments」タブで最新のデプロイメントを選択し、「Redeploy」をクリック

#### 7.2 Supabaseの認証設定（オプション）

Supabaseダッシュボードで：
1. 「Authentication」→「URL Configuration」を開く
2. 「Redirect URLs」に以下を追加：
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/login`

### ステップ8: 動作確認

1. デプロイされたURLにアクセス
2. `/login` ページでログイン
3. ダッシュボードが表示されることを確認
4. 各機能をテスト：
   - ✅ 実習生一覧表示
   - ✅ 証明書アップロード
   - ✅ スキル評価追加

## 🔄 自動デプロイ

GitHubにプッシュすると自動的にデプロイされます：

- **mainブランチ**: 本番環境にデプロイ
- **その他のブランチ**: プレビュー環境にデプロイ

## 🐛 トラブルシューティング

### ビルドエラー

1. Vercelダッシュボードの「Deployments」→ デプロイメントをクリック
2. 「Build Logs」を確認
3. エラーメッセージに基づいて修正

**よくあるエラー**:
- `Missing environment variables`: 環境変数が設定されていない
- `Module not found`: 依存関係の問題（`package.json`を確認）

### ランタイムエラー

1. 「Functions」タブでログを確認
2. ブラウザのコンソールでエラーを確認
3. Supabase接続を確認

### 環境変数の確認

1. Vercelダッシュボードの「Settings」→「Environment Variables」
2. すべての環境変数が設定されているか確認
3. 値が正しいか確認（特にURLとキー）

## 📝 チェックリスト

デプロイ前：
- [ ] GitHubリポジトリにコードがプッシュされている
- [ ] Supabaseプロジェクトが準備されている
- [ ] 環境変数が準備されている
- [ ] Vercelアカウントが作成されている

デプロイ後：
- [ ] 環境変数が正しく設定されている
- [ ] デプロイが成功している
- [ ] アプリケーションにアクセスできる
- [ ] ログインができる
- [ ] 各機能が動作している

## 🎉 デプロイ完了！

デプロイが完了したら、アプリケーションが世界中からアクセス可能になります！

**次回のデプロイ**: GitHubにプッシュするだけで自動的にデプロイされます。

