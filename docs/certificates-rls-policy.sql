-- certificatesテーブル用のRLSポリシー設定
-- このSQLをSupabaseのSQL Editorで実行してください

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Certificates admin all" ON certificates;
DROP POLICY IF EXISTS "Certificates org scoped" ON certificates;
DROP POLICY IF EXISTS "Certificates department select" ON certificates;
DROP POLICY IF EXISTS "Certificates authenticated insert" ON certificates;
DROP POLICY IF EXISTS "Certificates authenticated select" ON certificates;

-- 管理者は全権限
CREATE POLICY "Certificates admin all" ON certificates
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 認証済みユーザーは証明書を追加できる（実習生が存在する場合）
CREATE POLICY "Certificates authenticated insert" ON certificates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM trainees WHERE id = certificates.trainee_id AND is_active = true
    )
  );

-- 認証済みユーザーは証明書を参照できる
CREATE POLICY "Certificates authenticated select" ON certificates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 組織ベースのアクセス制御: 同じ組織の実習生の証明書にアクセス可能（オプション）
CREATE POLICY "Certificates org scoped" ON certificates
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1
      FROM trainees t
      JOIN user_organizations uo ON uo.organization_id = t.organization_id
      WHERE t.id = certificates.trainee_id
        AND uo.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM trainees t
      JOIN user_organizations uo ON uo.organization_id = t.organization_id
      WHERE t.id = certificates.trainee_id
        AND uo.user_id = auth.uid()
    )
  );

-- 部署担当者は自部署の実習生の証明書を参照可能
CREATE POLICY "Certificates department select" ON certificates
  FOR SELECT 
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 
      FROM trainees t
      JOIN users u ON u.id = auth.uid()
      WHERE t.id = certificates.trainee_id
        AND u.role = 'DEPARTMENT'
        AND u.department = t.department
    )
  );

