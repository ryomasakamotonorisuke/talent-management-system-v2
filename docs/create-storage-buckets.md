# Storageバケット作成手順

## エラー: "Bucket not found"

このエラーは、Supabase Storageのバケットが作成されていない場合に発生します。

## 解決方法

### 方法1: Supabaseダッシュボードから作成（推奨）

#### ステップ1: Storageページを開く

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. プロジェクトを選択
3. 左サイドバーから「Storage」をクリック

#### ステップ2: `trainee-media`バケットを作成

1. 「New bucket」ボタンをクリック
2. 以下の設定を入力：
   - **Name**: `trainee-media`
   - **Public bucket**: ✅ **ON**（チェックを入れる）
3. 「Create bucket」をクリック

#### ステップ3: `pdf-media`バケットを作成

1. 再度「New bucket」ボタンをクリック
2. 以下の設定を入力：
   - **Name**: `pdf-media`
   - **Public bucket**: ✅ **ON**（チェックを入れる）
3. 「Create bucket」をクリック

#### ステップ4: Storageポリシーを設定

バケットを作成した後、**必ず**Storageポリシーを設定してください。

1. Supabaseダッシュボードで「SQL Editor」を選択
2. `docs/storage-policies.sql` の内容をコピーして実行

または、以下のSQLを実行：

```sql
-- trainee-mediaバケット用のポリシー
CREATE POLICY "trainee-media authenticated upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trainee-media'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "trainee-media authenticated read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'trainee-media'
    AND auth.uid() IS NOT NULL
  );

-- pdf-mediaバケット用のポリシー
CREATE POLICY "pdf-media authenticated upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'pdf-media'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "pdf-media authenticated read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pdf-media'
    AND auth.uid() IS NOT NULL
  );
```

### 方法2: SQLでバケットを作成（上級者向け）

**注意**: この方法はSupabaseのバージョンによっては動作しない場合があります。方法1を推奨します。

```sql
-- trainee-mediaバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('trainee-media', 'trainee-media', true)
ON CONFLICT (id) DO NOTHING;

-- pdf-mediaバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-media', 'pdf-media', true)
ON CONFLICT (id) DO NOTHING;
```

## 確認方法

### バケットが作成されたか確認

1. Supabaseダッシュボードで「Storage」を開く
2. 以下のバケットが表示されていることを確認：
   - ✅ `trainee-media`
   - ✅ `pdf-media`

### ポリシーが設定されたか確認

1. 各バケットをクリック
2. 「Policies」タブを開く
3. 以下のポリシーが存在することを確認：
   - `trainee-media authenticated upload`
   - `trainee-media authenticated read`
   - `pdf-media authenticated upload`
   - `pdf-media authenticated read`

## トラブルシューティング

### エラー: "permission denied for schema storage"

**原因**: SQLでバケットを作成しようとしたが、権限がない

**解決方法**: 方法1（ダッシュボードから作成）を使用してください

### エラー: "new row violates row-level security policy"

**原因**: Storageポリシーが設定されていない

**解決方法**: `docs/storage-policies.sql` を実行してください

### エラー: "Bucket is not public"

**原因**: バケットがパブリックに設定されていない

**解決方法**: 
1. バケットの設定を開く
2. 「Public bucket」をONにする

## 完了

バケットとポリシーを設定したら、実習生新規登録や証明書アップロードが正常に動作するはずです。

