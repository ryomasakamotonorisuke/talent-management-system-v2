# セットアップ完全ガイド

このガイドでは、Node.js + Supabase + Vercel環境でシステムを構築する全手順を説明します。

## 📋 前提条件

- Node.js 18以上がインストールされていること
- npmまたはyarnが利用可能であること
- Supabaseアカウント（無料プランでも可）
- Vercelアカウント（GitHubアカウントでサインアップ可能）
- GitHubアカウント（Vercelデプロイ用）

## ステップ1: Supabaseプロジェクトの作成

### 1.1 Supabaseアカウント作成

1. [https://supabase.com](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 1.2 プロジェクト作成

1. ダッシュボードで「New Project」をクリック
2. プロジェクト情報を入力：
   - **Name**: talent-management-system（任意）
   - **Database Password**: 強力なパスワードを設定（忘れないようにメモ）
   - **Region**: 日本（Tokyo/NRT）を選択（推奨）
3. 「Create new project」をクリック
4. プロジェクトの作成が完了するまで待機（2-3分）

### 1.3 APIキーの取得

1. プロジェクトダッシュボードの左サイドバーから「Settings」→「API」を選択
2. 以下の情報をコピー：
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   https://kotnetvgvsyglwivbuzu.supabase.co
   - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdG5ldHZndnN5Z2x3aXZidXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjY4NzQsImV4cCI6MjA3NzMwMjg3NH0.jfY91CY5Np6sBEFWpmR5KnTXlanU1rbL43hshKMimBs
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) - **注意**: これは秘密にしてください
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdG5ldHZndnN5Z2x3aXZidXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcyNjg3NCwiZXhwIjoyMDc3MzAyODc0fQ.avSKRkD1Bq2WN_0aFRu0I0K-IUWmN98nCL63qe8ZJJI

## ステップ2: データベースセットアップ

### 2.1 SQL Editorでスキーマ作成

1. Supabaseダッシュボードで「SQL Editor」を選択
2. 「New query」をクリック
3. `docs/database-setup.md` のSQLをコピー＆ペースト
4. 「Run」をクリックして実行
5. エラーがないことを確認

### 2.2 Row Level Security (RLS) の設定

セキュリティポリシーも `database-setup.md` に含まれています。実行してください。

### 2.3 Storageバケットの作成

ファイルアップロード機能を使用するために、Supabase Storageバケットを作成します：

1. Supabaseダッシュボードで「Storage」を選択
2. 「New bucket」をクリック
3. 以下のバケットを作成：

   **`trainee-media`バケット**:
   - バケット名: `trainee-media`
   - Public bucket: ✅ **ON**（写真を公開するため）
   - 「Create bucket」をクリック

   **`pdf-media`バケット**:
   - バケット名: `pdf-media`
   - Public bucket: ✅ **ON**（証明書ファイルを公開するため）
   - 「Create bucket」をクリック

### 2.4 Storageポリシーの設定（必須）

**重要**: バケットを作成した後、Storageポリシーを設定する必要があります。

1. Supabaseダッシュボードで「SQL Editor」を選択
2. `docs/storage-policies.sql` のSQLをコピー＆ペースト
3. 「Run」をクリックして実行

これにより、認証済みユーザーがファイルをアップロード・読み取りできるようになります。

詳細は `docs/STORAGE_SETUP.md` を参照してください。

## ステップ3: ローカル環境のセットアップ

### 3.1 プロジェクトのクローンまたは準備

```bash
# 既にプロジェクトがある場合は
cd talent

# 依存関係のインストール
npm install
```

### 3.2 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**重要**: `.env.local` は `.gitignore` に含まれているため、Gitにコミットされません。

### 3.3 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスして動作確認。

## ステップ4: Supabase Authでのユーザー作成

### 4.1 認証ユーザーの作成

1. Supabaseダッシュボードで「Authentication」→「Users」を選択
2. 「Add user」→「Create new user」をクリック
3. メールアドレスとパスワードを設定（例：admin@example.com）
4. 「Auto Confirm User」をONにする（開発環境用）
5. 「Create user」をクリック

### 4.2 ユーザー情報の登録

作成したユーザーのUUIDをコピーし、SQL Editorで以下を実行：

```sql
INSERT INTO users (id, email, name, role, department)
VALUES (
  'your-user-uuid-here',  -- 作成したユーザーのUUID
  'admin@example.com',
  '管理者',
  'ADMIN',
  '管理部'
);
```

## ステップ5: Vercelへのデプロイ

### 5.1 GitHubリポジトリの準備

```bash
# Gitリポジトリの初期化（まだの場合）
git init

# ファイルをステージング
git add .

# コミット
git commit -m "Initial commit: Talent Management System"

# GitHubリポジトリを作成し、プッシュ
git remote add origin https://github.com/yourusername/talent-management.git
git branch -M main
git push -u origin main
```

### 5.2 Vercelプロジェクトの作成

1. [https://vercel.com](https://vercel.com) にアクセス
2. GitHubアカウントでサインアップ/ログイン
3. 「Add New」→「Project」をクリック
4. GitHubリポジトリを選択
5. プロジェクト設定：
   - **Framework Preset**: Next.js（自動検出）
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`（自動設定）
   - **Output Directory**: `.next`（自動設定）

### 5.3 環境変数の設定

Vercelダッシュボードで：

1. 「Settings」→「Environment Variables」を選択
2. 以下の環境変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

3. 「Save」をクリック

### 5.4 デプロイ

1. 「Deploy」タブに戻る
2. 「Deploy」ボタンをクリック
3. ビルド完了を待機（2-3分）
4. デプロイ完了後、URLが表示されます

## ステップ6: 動作確認

### 6.1 ログイン確認

1. デプロイされたURLにアクセス
2. `/login` ページで作成したユーザーでログイン
3. ダッシュボードが表示されることを確認

### 6.2 機能確認

- ✅ ログイン/ログアウト
- ✅ ダッシュボード表示
- ✅ 実習生一覧表示
- ✅ 実習生新規登録

## トラブルシューティング

### エラー: "Missing Supabase environment variables"

- `.env.local` ファイルが正しく作成されているか確認
- 環境変数の値が正しいか確認
- Vercelの環境変数が設定されているか確認

### エラー: "relation does not exist"

- データベーススキーマが正しく作成されているか確認
- SQL Editorでテーブル一覧を確認

### ログインできない

- Supabase Authでユーザーが作成されているか確認
- `users` テーブルにレコードが存在するか確認
- パスワードが正しいか確認

### Vercelデプロイエラー

- ビルドログを確認
- 環境変数が設定されているか確認
- `package.json` のスクリプトが正しいか確認

## 次のステップ

- [ ] 実習生の詳細機能を実装
- [ ] 資格管理機能を実装
- [ ] 評価機能を実装
- [ ] 通知機能を実装
- [ ] ファイルアップロード機能（Supabase Storage）を実装

## サポート

問題が発生した場合は：

1. エラーメッセージを確認
2. ビルドログを確認
3. Supabaseログを確認（ダッシュボード → Logs）
4. Vercelログを確認（ダッシュボード → Deployments → ログ）

---

**構築完了！** 🎉

Node.js + Supabase + Vercel環境でのシステム構築が完了しました。


