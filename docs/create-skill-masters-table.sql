-- skill_mastersテーブルを作成するSQL
-- このSQLをSupabaseのSQL Editorで実行してください

-- ============================================
-- skill_mastersテーブルの作成
-- ============================================

CREATE TABLE IF NOT EXISTS skill_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  levels JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- インデックスの作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_skill_masters_category ON skill_masters(category);
CREATE INDEX IF NOT EXISTS idx_skill_masters_is_active ON skill_masters(is_active);

-- ============================================
-- RLS (Row Level Security) の設定
-- ============================================

-- RLSを有効化
ALTER TABLE skill_masters ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Skill masters authenticated select" ON skill_masters;
DROP POLICY IF EXISTS "Skill masters authenticated insert" ON skill_masters;
DROP POLICY IF EXISTS "Skill masters authenticated update" ON skill_masters;
DROP POLICY IF EXISTS "Skill masters authenticated delete" ON skill_masters;
DROP POLICY IF EXISTS "Skill masters admin all" ON skill_masters;

-- 認証済みユーザーはスキルマスターを参照できる
CREATE POLICY "Skill masters authenticated select" ON skill_masters
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 認証済みユーザーはスキルマスターを追加できる
CREATE POLICY "Skill masters authenticated insert" ON skill_masters
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 認証済みユーザーはスキルマスターを更新できる
CREATE POLICY "Skill masters authenticated update" ON skill_masters
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 認証済みユーザーはスキルマスターを削除できる
CREATE POLICY "Skill masters authenticated delete" ON skill_masters
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 管理者は全権限
CREATE POLICY "Skill masters admin all" ON skill_masters
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
WHERE table_name = 'skill_masters'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- サンプルデータの挿入（オプション）
-- ============================================

-- サンプルスキルマスターを追加（既に存在する場合はスキップ）
INSERT INTO skill_masters (name, category, description, is_active)
SELECT 'コミュニケーション', 'ソフトスキル', '日本語でのコミュニケーション能力', true
WHERE NOT EXISTS (SELECT 1 FROM skill_masters WHERE name = 'コミュニケーション' AND category = 'ソフトスキル');

INSERT INTO skill_masters (name, category, description, is_active)
SELECT '作業効率', '業務スキル', '作業の効率性と正確性', true
WHERE NOT EXISTS (SELECT 1 FROM skill_masters WHERE name = '作業効率' AND category = '業務スキル');

INSERT INTO skill_masters (name, category, description, is_active)
SELECT '安全意識', '安全', '作業現場での安全意識と行動', true
WHERE NOT EXISTS (SELECT 1 FROM skill_masters WHERE name = '安全意識' AND category = '安全');

-- 確認: 挿入されたデータを確認
SELECT id, name, category, description, is_active, created_at
FROM skill_masters
ORDER BY category, name;

