-- certificatesテーブルを作成するSQL
-- このSQLをSupabaseのSQL Editorで実行してください
-- 
-- 注意: このSQLを実行する前に、traineesテーブルが存在することを確認してください

-- certificatesテーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_body TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_path TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('CERTIFICATE', 'EMPLOYMENT_CONDITIONS', 'MINOR_CHANGE', 'TRAINING_PLAN_CERT') OR document_type IS NULL),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_certificates_trainee_id ON certificates(trainee_id);
CREATE INDEX IF NOT EXISTS idx_certificates_is_active ON certificates(is_active);
CREATE INDEX IF NOT EXISTS idx_certificates_expiry_date ON certificates(expiry_date);

-- RLS (Row Level Security) を有効化
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Certificates admin all" ON certificates;
DROP POLICY IF EXISTS "Certificates authenticated insert" ON certificates;
DROP POLICY IF EXISTS "Certificates authenticated select" ON certificates;
DROP POLICY IF EXISTS "Certificates org scoped" ON certificates;
DROP POLICY IF EXISTS "Certificates department select" ON certificates;

-- 管理者は全権限
CREATE POLICY "Certificates admin all" ON certificates
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
        AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
        AND users.is_active = true
    )
  );

-- 認証済みユーザーは証明書を追加できる（実習生が存在する場合）
CREATE POLICY "Certificates authenticated insert" ON certificates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM trainees 
      WHERE id = certificates.trainee_id 
        AND is_active = true
    )
  );

-- 認証済みユーザーは証明書を参照できる
CREATE POLICY "Certificates authenticated select" ON certificates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 確認: テーブルが作成されたことを確認
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'certificates'
  AND table_schema = 'public'
ORDER BY ordinal_position;

