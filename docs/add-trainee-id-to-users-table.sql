-- usersテーブルにtrainee_idカラムを追加するSQLスクリプト
-- このSQLをSupabaseのSQL Editorで実行してください
-- 
-- 注意: このSQLを実行する前に、traineesテーブルが存在することを確認してください

-- ============================================
-- 1. usersテーブルにtrainee_idカラムを追加
-- ============================================

-- trainee_idカラムを追加（NULL許可、外部キー制約付き）
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trainee_id UUID REFERENCES trainees(id) ON DELETE SET NULL;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_users_trainee_id ON users(trainee_id);

-- ============================================
-- 2. 既存の実習生ユーザー（role = 'TRAINEE'）と実習生データを紐付ける（オプション）
-- ============================================
-- 注意: このセクションは、メールアドレスで自動的に紐付ける場合に使用します
-- メールアドレスが一致する実習生とユーザーを自動的に紐付けます

-- メールアドレスで一致する実習生とユーザーを紐付け
UPDATE users u
SET trainee_id = t.id
FROM trainees t
WHERE u.role = 'TRAINEE'
  AND u.email = t.email
  AND u.trainee_id IS NULL
  AND t.is_active = true;

-- ============================================
-- 3. 確認クエリ
-- ============================================

-- usersテーブルの構造を確認
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 実習生と紐づいているユーザーを確認
SELECT
  u.id as user_id,
  u.email,
  u.name as user_name,
  u.role,
  t.id as trainee_id,
  t.trainee_id as trainee_code,
  t.first_name,
  t.last_name
FROM users u
LEFT JOIN trainees t ON u.trainee_id = t.id
WHERE u.role = 'TRAINEE'
ORDER BY u.created_at DESC;

