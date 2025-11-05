-- evaluationsテーブル用のRLSポリシー設定
-- このSQLをSupabaseのSQL Editorで実行してください

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Evaluations admin all" ON evaluations;
DROP POLICY IF EXISTS "Evaluations org scoped" ON evaluations;
DROP POLICY IF EXISTS "Evaluations department select" ON evaluations;
DROP POLICY IF EXISTS "Evaluations evaluator insert" ON evaluations;

-- 管理者は全権限
CREATE POLICY "Evaluations admin all" ON evaluations
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 組織ベースのアクセス制御: 同じ組織の実習生の評価にアクセス可能
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

-- 部署担当者は自部署の実習生の評価を参照可能
CREATE POLICY "Evaluations department select" ON evaluations
  FOR SELECT 
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 
      FROM trainees t
      JOIN users u ON u.id = auth.uid()
      WHERE t.id = evaluations.trainee_id
        AND u.role = 'DEPARTMENT'
        AND u.department = t.department
    )
  );

-- 評価者は自分の評価を追加・更新できる
CREATE POLICY "Evaluations evaluator insert" ON evaluations
  FOR INSERT
  WITH CHECK (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM trainees t
      JOIN user_organizations uo ON uo.organization_id = t.organization_id
      WHERE t.id = evaluations.trainee_id
        AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluations evaluator update" ON evaluations
  FOR UPDATE
  USING (evaluator_id = auth.uid())
  WITH CHECK (evaluator_id = auth.uid());

