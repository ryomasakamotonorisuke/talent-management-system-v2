-- evaluationsテーブルを作成するSQL
-- このSQLをSupabaseのSQL Editorで実行してください

-- ============================================
-- evaluationsテーブルの作成
-- ============================================

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES users(id),
  skill_id UUID NOT NULL REFERENCES skill_masters(id),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  comment TEXT,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  period TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainee_id, skill_id, period, evaluator_id)
);

-- ============================================
-- インデックスの作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_evaluations_trainee_id ON evaluations(trainee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_skill_id ON evaluations(skill_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluation_date ON evaluations(evaluation_date);

-- ============================================
-- RLS (Row Level Security) の設定
-- ============================================

-- RLSを有効化
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Evaluations admin all" ON evaluations;
DROP POLICY IF EXISTS "Evaluations org scoped" ON evaluations;
DROP POLICY IF EXISTS "Evaluations department select" ON evaluations;
DROP POLICY IF EXISTS "Evaluations evaluator insert" ON evaluations;
DROP POLICY IF EXISTS "Evaluations evaluator update" ON evaluations;
DROP POLICY IF EXISTS "Evaluations authenticated insert" ON evaluations;
DROP POLICY IF EXISTS "Evaluations authenticated select" ON evaluations;

-- 管理者は全権限
CREATE POLICY "Evaluations admin all" ON evaluations
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

-- 認証済みユーザーは評価を追加できる（簡易版）
CREATE POLICY "Evaluations authenticated insert" ON evaluations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND evaluator_id = auth.uid()
  );

-- 認証済みユーザーは評価を参照できる
CREATE POLICY "Evaluations authenticated select" ON evaluations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 評価者は自分の評価を更新できる
CREATE POLICY "Evaluations evaluator update" ON evaluations
  FOR UPDATE
  USING (evaluator_id = auth.uid())
  WITH CHECK (evaluator_id = auth.uid());

-- 組織ベースのアクセス制御（オプション）
CREATE POLICY "Evaluations org scoped" ON evaluations
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1
      FROM trainees t
      JOIN user_organizations uo ON uo.organization_id = t.organization_id
      WHERE t.id = evaluations.trainee_id
        AND uo.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM trainees t
      JOIN user_organizations uo ON uo.organization_id = t.organization_id
      WHERE t.id = evaluations.trainee_id
        AND uo.user_id = auth.uid()
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
WHERE table_name = 'evaluations'
  AND table_schema = 'public'
ORDER BY ordinal_position;

