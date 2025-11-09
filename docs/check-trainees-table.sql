-- traineesテーブルの存在確認と構造確認用SQL

-- 1. テーブルの存在確認
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
AND table_name LIKE '%trainee%'
ORDER BY table_schema, table_name;

-- 2. traineesテーブルの構造確認（テーブルが存在する場合）
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'trainees'
ORDER BY ordinal_position;

-- 3. すべてのテーブル一覧（デバッグ用）
SELECT 
  table_schema,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

