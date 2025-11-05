# 海外技能実習生タレントマネジメントシステム

## 🎯 プロジェクト概要

海外技能実習生の情報、資格、スキル、育成計画、評価履歴を一元管理するクラウドベースのタレントマネジメントシステムです。

## 🚀 技術スタック

- **Next.js 14** - React フレームワーク（App Router）
- **TypeScript** - 型安全な開発
- **Supabase** - バックエンド（認証・データベース・ストレージ）
- **Tailwind CSS** - モダンなUIデザイン
- **Vercel** - デプロイメントプラットフォーム

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseアカウント（無料プランでも可）

## 🛠️ セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトURLとAPIキーを取得

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を追加：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Supabaseデータベースのセットアップ

SupabaseダッシュボードでSQL Editorを開き、データベーススキーマを作成します。
（詳細は `docs/database-setup.md` を参照）

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスします。

## 🌐 Vercelデプロイ手順

### 1. GitHubリポジトリにプッシュ

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercelでプロジェクトをインポート

1. [Vercel](https://vercel.com) にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定
5. デプロイ

### 3. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📁 プロジェクト構造

```
talent/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   └── dashboard/
│   ├── components/       # Reactコンポーネント
│   ├── lib/              # ユーティリティ関数
│   │   └── supabase/     # Supabaseクライアント
│   └── types/            # TypeScript型定義
├── public/               # 静的ファイル
├── docs/                 # ドキュメント
└── package.json
```

## 🔧 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # リントチェック
npm run type-check  # 型チェック
```

## 📝 ライセンス

MIT License










