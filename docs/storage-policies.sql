-- Supabase Storageバケット用のポリシー設定
-- このSQLをSupabaseのSQL Editorで実行してください

-- ============================================
-- pdf-mediaバケット用のポリシー
-- ============================================

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "pdf-media authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "pdf-media authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "pdf-media authenticated delete" ON storage.objects;

-- 認証済みユーザーはファイルをアップロードできる
CREATE POLICY "pdf-media authenticated upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'pdf-media'
    AND auth.uid() IS NOT NULL
  );

-- 認証済みユーザーはファイルを読み取れる
CREATE POLICY "pdf-media authenticated read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pdf-media'
    AND auth.uid() IS NOT NULL
  );

-- 認証済みユーザーはファイルを削除できる（オプション）
CREATE POLICY "pdf-media authenticated delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'pdf-media'
    AND auth.uid() IS NOT NULL
  );

-- ============================================
-- trainee-mediaバケット用のポリシー
-- ============================================

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "trainee-media authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "trainee-media authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "trainee-media authenticated delete" ON storage.objects;

-- 認証済みユーザーはファイルをアップロードできる
CREATE POLICY "trainee-media authenticated upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trainee-media'
    AND auth.uid() IS NOT NULL
  );

-- 認証済みユーザーはファイルを読み取れる
CREATE POLICY "trainee-media authenticated read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'trainee-media'
    AND auth.uid() IS NOT NULL
  );

-- 認証済みユーザーはファイルを削除できる（オプション）
CREATE POLICY "trainee-media authenticated delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'trainee-media'
    AND auth.uid() IS NOT NULL
  );

