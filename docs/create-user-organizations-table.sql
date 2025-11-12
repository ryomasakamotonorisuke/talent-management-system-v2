-- user_organizationsテーブルを作成するSQL
-- このSQLをSupabaseのSQL Editorで実行してください
-- 
-- 注意: このSQLを実行する前に、organizationsテーブルとusersテーブルが存在することを確認してください

-- ============================================
-- user_organizationsテーブルの作成
-- ============================================

CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DEPARTMENT', 'TRAINEE', 'HR', 'ACCOUNTING')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ============================================
-- インデックスの作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_role ON user_organizations(role);

-- ============================================
-- RLS (Row Level Security) の設定
-- ============================================

-- RLSを有効化
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "User organizations authenticated select" ON user_organizations;
DROP POLICY IF EXISTS "User organizations authenticated insert" ON user_organizations;
DROP POLICY IF EXISTS "User organizations authenticated update" ON user_organizations;
DROP POLICY IF EXISTS "User organizations authenticated delete" ON user_organizations;
DROP POLICY IF EXISTS "User organizations admin all" ON user_organizations;

-- 認証済みユーザーは自分の組織情報を参照できる
CREATE POLICY "User organizations authenticated select" ON user_organizations
  FOR SELECT
  USING (auth.uid() = user_id);

-- 認証済みユーザーは組織情報を追加できる（管理者のみ推奨）
CREATE POLICY "User organizations authenticated insert" ON user_organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 認証済みユーザーは自分の組織情報を更新できる
CREATE POLICY "User organizations authenticated update" ON user_organizations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーは自分の組織情報を削除できる
CREATE POLICY "User organizations authenticated delete" ON user_organizations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 管理者は全権限
CREATE POLICY "User organizations admin all" ON user_organizations
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

-- ============================================
-- 確認: テーブルが作成されたことを確認
-- ============================================

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_organizations'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 既存ユーザーをデフォルト組織に紐付ける（オプション）
-- ============================================

-- デフォルト組織を取得
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- デフォルト組織のIDを取得
  SELECT id INTO default_org_id
  FROM organizations
  WHERE code = 'DEFAULT'
  LIMIT 1;

  -- デフォルト組織が存在する場合、既存ユーザーを紐付ける
  IF default_org_id IS NOT NULL THEN
    -- 既存のユーザーで、user_organizationsに紐付けがない場合のみ追加
    INSERT INTO user_organizations (user_id, organization_id, role)
    SELECT 
      u.id,
      default_org_id,
      u.role
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 
      FROM user_organizations uo 
      WHERE uo.user_id = u.id
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    RAISE NOTICE '既存ユーザーをデフォルト組織に紐付けました';
  ELSE
    RAISE NOTICE 'デフォルト組織が存在しません。先にorganizationsテーブルにデフォルト組織を作成してください。';
  END IF;
END $$;

-- 確認: ユーザーと組織の紐付けを確認
SELECT 
  u.email,
  u.name,
  u.role,
  o.name as organization_name,
  uo.role as org_role
FROM user_organizations uo
JOIN users u ON u.id = uo.user_id
JOIN organizations o ON o.id = uo.organization_id
ORDER BY u.created_at DESC
LIMIT 10;

