-- certificatesテーブルにdocument_typeカラムを追加
-- このSQLをSupabaseのSQL Editorで実行してください

-- document_typeカラムを追加（REQ-009）
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS document_type TEXT;

-- 既存のCHECK制約を削除（存在する場合）
ALTER TABLE certificates
DROP CONSTRAINT IF EXISTS certificates_document_type_check;

-- document_typeのCHECK制約を追加
ALTER TABLE certificates
ADD CONSTRAINT certificates_document_type_check
CHECK (
  document_type IS NULL 
  OR document_type IN ('CERTIFICATE', 'EMPLOYMENT_CONDITIONS', 'MINOR_CHANGE', 'TRAINING_PLAN_CERT')
);

