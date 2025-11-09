-- traineesテーブルに不足しているカラムを追加するSQL
-- このSQLは、既存のtraineesテーブルに新しいカラムを追加します
-- 実行前にバックアップを取得してください

-- 1. テーブルの存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'trainees';

-- 2. 既存のカラム確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trainees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 不足しているカラムを追加
DO $$
BEGIN
  -- テーブルが存在するか確認
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'trainees'
  ) THEN
    -- 社宅・管理関連情報のカラムを追加
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
    
    -- 事業所・指導員関連情報のカラムを追加
    ALTER TABLE trainees
    ADD COLUMN IF NOT EXISTS workplace_manager_name TEXT,
    ADD COLUMN IF NOT EXISTS workplace_name TEXT,
    ADD COLUMN IF NOT EXISTS area_manager TEXT,
    ADD COLUMN IF NOT EXISTS technical_instructor TEXT,
    ADD COLUMN IF NOT EXISTS life_instructor TEXT;
    
    RAISE NOTICE 'カラムの追加が完了しました';
  ELSE
    RAISE EXCEPTION 'traineesテーブルが存在しません。先にテーブルを作成してください。';
  END IF;
END $$;

-- 4. 追加されたカラムの確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainees' 
AND table_schema = 'public'
AND column_name IN (
  'supervising_organization',
  'monthly_rent',
  'management_company',
  'electric_provider',
  'gas_provider',
  'water_provider',
  'move_in_date',
  'batch_period',
  'residence_address',
  'residence_card_number',
  'date_of_birth',
  'workplace_manager_name',
  'workplace_name',
  'area_manager',
  'technical_instructor',
  'life_instructor'
)
ORDER BY column_name;

