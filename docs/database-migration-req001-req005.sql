-- REQ-001: 権限管理の拡張（HR・ACCOUNTINGロール追加）
-- REQ-005: 社宅・管理関連情報の追加

-- 1. user_organizationsテーブルのroleチェック制約を更新
ALTER TABLE user_organizations 
DROP CONSTRAINT IF EXISTS user_organizations_role_check;

ALTER TABLE user_organizations 
ADD CONSTRAINT user_organizations_role_check 
CHECK (role IN ('ADMIN', 'DEPARTMENT', 'TRAINEE', 'HR', 'ACCOUNTING'));

-- 2. usersテーブルのroleチェック制約を更新
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'DEPARTMENT', 'TRAINEE', 'HR', 'ACCOUNTING'));

-- 3. traineesテーブルに社宅・管理関連情報のカラムを追加
ALTER TABLE trainees 
ADD COLUMN IF NOT EXISTS supervising_organization TEXT,
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS management_company TEXT,
ADD COLUMN IF NOT EXISTS electric_provider TEXT,
ADD COLUMN IF NOT EXISTS gas_provider TEXT,
ADD COLUMN IF NOT EXISTS water_provider TEXT,
ADD COLUMN IF NOT EXISTS move_in_date DATE,
ADD COLUMN IF NOT EXISTS batch_period TEXT,
ADD COLUMN IF NOT EXISTS residence_address TEXT,
ADD COLUMN IF NOT EXISTS residence_card_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 4. certificatesテーブルにdocument_typeカラムを追加（REQ-009）
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS document_type TEXT 
CHECK (document_type IN ('CERTIFICATE', 'EMPLOYMENT_CONDITIONS', 'MINOR_CHANGE', 'TRAINING_PLAN_CERT') OR document_type IS NULL);

-- 5. notificationsテーブルに新しい通知タイプを追加（REQ-007, REQ-008）
-- 既存のtypeカラムがあることを確認し、必要に応じて更新
-- 注意: notificationsテーブルのスキーマを確認してから実行してください

-- RLSポリシーの更新（HR・ACCOUNTINGロール対応）
-- 既存のRLSポリシーを確認し、必要に応じて更新してください

-- HRロール用のヘルパー関数
CREATE OR REPLACE FUNCTION is_hr(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_organizations uo
    WHERE uo.user_id = p_uid
      AND uo.role = 'HR'
  );
$$;

-- ACCOUNTINGロール用のヘルパー関数
CREATE OR REPLACE FUNCTION is_accounting(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_organizations uo
    WHERE uo.user_id = p_uid
      AND uo.role = 'ACCOUNTING'
  );
$$;

