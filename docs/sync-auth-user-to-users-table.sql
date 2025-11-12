-- Supabase Authのユーザーをusersテーブルに同期するSQL
-- このSQLをSupabaseのSQL Editorで実行してください
-- 
-- 注意: このSQLは、Supabase Authに存在するがusersテーブルに存在しないユーザーを自動的に追加します

-- ============================================
-- 1. Supabase Authのユーザーをusersテーブルに同期
-- ============================================

-- 注意: Supabase Authのユーザー情報は直接SQLで取得できないため、
-- 手動でユーザーIDを指定する必要があります

-- 方法1: 特定のユーザーを追加
-- 以下のSQLで、Supabase AuthのユーザーIDを指定してusersテーブルに追加します
-- 
-- ステップ1: SupabaseダッシュボードでユーザーIDを確認
--   - Authentication → Users → ユーザーをクリック → UUIDをコピー
--
-- ステップ2: 以下のSQLでUUIDを置き換えて実行

INSERT INTO users (id, email, name, role, department, is_active)
SELECT 
  'ここにSupabase AuthのユーザーUUIDを貼り付け'::uuid,
  'ここにメールアドレスを入力',
  'ユーザー名',
  'ADMIN',  -- または 'DEPARTMENT', 'TRAINEE', 'HR', 'ACCOUNTING'
  '管理部',  -- 部署名（任意）
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = 'ここにSupabase AuthのユーザーUUIDを貼り付け'::uuid
);

-- ============================================
-- 2. デフォルト組織に紐付ける
-- ============================================

-- デフォルト組織を取得してユーザーを紐付け
DO $$
DECLARE
  default_org_id UUID;
  user_uuid UUID := 'ここにSupabase AuthのユーザーUUIDを貼り付け'::uuid;
BEGIN
  -- デフォルト組織のIDを取得
  SELECT id INTO default_org_id
  FROM organizations
  WHERE code = 'DEFAULT'
  LIMIT 1;

  -- デフォルト組織が存在する場合、ユーザーを紐付け
  IF default_org_id IS NOT NULL THEN
    INSERT INTO user_organizations (user_id, organization_id, role)
    SELECT 
      user_uuid,
      default_org_id,
      u.role
    FROM users u
    WHERE u.id = user_uuid
      AND NOT EXISTS (
        SELECT 1 
        FROM user_organizations uo 
        WHERE uo.user_id = user_uuid
          AND uo.organization_id = default_org_id
      )
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    RAISE NOTICE 'ユーザーをデフォルト組織に紐付けました';
  ELSE
    RAISE NOTICE 'デフォルト組織が存在しません。先にorganizationsテーブルにデフォルト組織を作成してください。';
  END IF;
END $$;

-- ============================================
-- 3. 確認: ユーザーが正しく登録されたか確認
-- ============================================

-- usersテーブルにユーザーが存在するか確認
SELECT 
  id,
  email,
  name,
  role,
  department,
  is_active,
  created_at
FROM users
WHERE id = 'ここにSupabase AuthのユーザーUUIDを貼り付け'::uuid;

-- user_organizationsテーブルに紐付けが存在するか確認
SELECT 
  uo.id,
  u.email,
  u.name,
  o.name as organization_name,
  uo.role as org_role
FROM user_organizations uo
JOIN users u ON u.id = uo.user_id
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.user_id = 'ここにSupabase AuthのユーザーUUIDを貼り付け'::uuid;

