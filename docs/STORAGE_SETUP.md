# Supabase Storage セットアップガイド

## データの保存場所

このシステムでは、データは**Supabaseクラウド**に保存されます：

### 1. テキストデータ（データベース）
- **実習生情報**: `trainees`テーブル（PostgreSQL）
- **証明書情報**: `certificates`テーブル（PostgreSQL）
- **ユーザー情報**: `users`テーブル（PostgreSQL）
- **その他のデータ**: 各種テーブル（PostgreSQL）

### 2. ファイルデータ（Storage）
- **実習生の写真**: `trainee-media`バケット
- **証明書ファイル（PDFなど）**: `pdf-media`バケット

## 重要なポイント

✅ **ローカル環境でもデプロイ後でも同じデータにアクセス**
- ローカル環境（`localhost:3000`）とデプロイ環境（Vercel）で**同じSupabaseプロジェクト**を使用すれば、データは共有されます
- データはローカルファイルシステムには保存されません
- 全てSupabaseクラウドに保存されます

## Storageバケットの作成手順

### 1. Supabaseダッシュボードにアクセス

1. [Supabase](https://supabase.com) にログイン
2. プロジェクトを選択
3. 左サイドバーから「Storage」を選択

### 2. `trainee-media`バケットの作成

1. 「New bucket」をクリック
2. バケット名: `trainee-media`
3. **Public bucket**: ✅ **ON**（写真を公開するため）
4. 「Create bucket」をクリック

### 3. `pdf-media`バケットの作成

1. 「New bucket」をクリック
2. バケット名: `pdf-media`
3. **Public bucket**: ✅ **ON**（証明書ファイルを公開するため）
4. 「Create bucket」をクリック

### 4. Storageポリシーの設定（必須）

**重要**: バケットがパブリックでも、ファイルをアップロードするにはStorageポリシーの設定が必要です。

1. Supabaseダッシュボードで「SQL Editor」を選択
2. `docs/storage-policies.sql` のSQLをコピー＆ペースト
3. 「Run」をクリックして実行

このSQLにより、認証済みユーザーが以下の操作を実行できるようになります：
- **INSERT**: ファイルのアップロード
- **SELECT**: ファイルの読み取り
- **DELETE**: ファイルの削除（オプション）

より厳格なセキュリティが必要な場合は、ポリシーをカスタマイズしてください。

## 動作確認

### ローカル環境での確認

1. `.env.local`にSupabaseの認証情報を設定
2. `npm run dev`で開発サーバーを起動
3. 実習生登録や証明書アップロードを実行
4. Supabaseダッシュボードの「Storage」でファイルが保存されていることを確認

### デプロイ後の確認

1. Vercelの環境変数に同じSupabase認証情報を設定
2. デプロイ後、実習生登録や証明書アップロードを実行
3. **ローカル環境で登録したデータも表示される**ことを確認

## よくある質問

### Q: ローカル環境とデプロイ環境でデータは共有されますか？

**A: はい、共有されます。**
- 同じSupabaseプロジェクトを使用していれば、データは完全に共有されます
- ローカル環境で登録した実習生や証明書は、デプロイ環境でも表示されます
- 逆に、デプロイ環境で登録したデータも、ローカル環境で表示されます

### Q: データはローカルに保存されますか？

**A: いいえ、保存されません。**
- 全てのデータはSupabaseクラウドに保存されます
- ローカルファイルシステムには何も保存されません

### Q: 異なるSupabaseプロジェクトを使うとどうなりますか？

**A: データは別々になります。**
- ローカル環境でプロジェクトA、デプロイ環境でプロジェクトBを使用すると、データは共有されません
- **開発環境と本番環境を分けたい場合**は、異なるSupabaseプロジェクトを使用してください

### Q: Storageバケットが作成されていないとどうなりますか？

**A: ファイルアップロードでエラーが発生します。**
- エラーメッセージ: "Bucket not found" または "The resource was not found"
- この場合、上記の手順でStorageバケットを作成してください

## トラブルシューティング

### エラー: "Bucket not found"

**解決方法:**
1. Supabaseダッシュボードの「Storage」を確認
2. `trainee-media`と`pdf-media`バケットが存在するか確認
3. 存在しない場合は、上記の手順で作成

### エラー: "new row violates row-level security policy"

**解決方法:**
1. `docs/certificates-rls-policy.sql`を実行
2. RLSポリシーが正しく設定されているか確認

### エラー: "400 Bad Request" またはファイルがアップロードされない

**解決方法:**
1. **Storageポリシーが設定されているか確認**
   - `docs/storage-policies.sql` を実行しているか確認
   - Supabaseダッシュボードの「Storage」→ バケット名 → 「Policies」でポリシーが存在するか確認

2. **Storageバケットが存在するか確認**
   - `pdf-media` と `trainee-media` バケットが作成されているか確認

3. **バケットがパブリックに設定されているか確認**
   - バケットの設定で「Public bucket」がONになっているか確認

4. **環境変数が正しく設定されているか確認**
   - `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定されているか確認

5. **ブラウザのコンソールでエラーを確認**
   - エラーメッセージの詳細を確認

