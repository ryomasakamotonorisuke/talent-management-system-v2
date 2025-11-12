-- organization_idのNOT NULL制約エラーを解決するSQL
-- このSQLをSupabaseのSQL Editorで実行してください

-- ============================================
-- 1. デフォルト組織の作成（存在しない場合）
-- ============================================

-- デフォルト組織を作成（既に存在する場合はスキップ）
INSERT INTO organizations (id, name, code, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'デフォルト組織',
  'DEFAULT',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE code = 'DEFAULT'
);

-- 作成されたデフォルト組織のIDを取得
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- デフォルト組織のIDを取得（存在しない場合は作成）
  SELECT id INTO default_org_id
  FROM organizations
  WHERE code = 'DEFAULT'
  LIMIT 1;

  -- デフォルト組織が存在しない場合は作成
  IF default_org_id IS NULL THEN
    INSERT INTO organizations (id, name, code, is_active)
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'デフォルト組織', 'DEFAULT', true)
    RETURNING id INTO default_org_id;
  END IF;

  -- ============================================
  -- 2. 既存のNULL値をデフォルト組織に更新
  -- ============================================
  
  UPDATE trainees
  SET organization_id = default_org_id
  WHERE organization_id IS NULL;

  RAISE NOTICE 'デフォルト組織ID: %', default_org_id;
  RAISE NOTICE 'organization_idがNULLの実習生を更新しました';
END $$;

-- ============================================
-- 3. 確認: 更新結果を確認
-- ============================================

-- デフォルト組織が作成されたことを確認
SELECT id, name, code, is_active
FROM organizations
WHERE code = 'DEFAULT';

-- organization_idがNULLの実習生が存在しないことを確認
SELECT COUNT(*) as null_count
FROM trainees
WHERE organization_id IS NULL;

-- すべての実習生のorganization_idを確認
SELECT 
  t.id,
  t.trainee_id,
  t.last_name || ' ' || t.first_name as name,
  t.organization_id,
  o.name as organization_name
FROM trainees t
LEFT JOIN organizations o ON t.organization_id = o.id
ORDER BY t.created_at DESC
LIMIT 10;

