-- batch_periodカラムを強制的に追加するSQL
-- このSQLは、カラムが存在しない場合のみ追加します

-- 1. 現在のカラム一覧を確認
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'trainees' 
AND table_schema = 'public'
ORDER BY column_name;

-- 2. batch_periodカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  -- カラムが存在しない場合のみ追加
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trainees'
    AND column_name = 'batch_period'
  ) THEN
    ALTER TABLE trainees ADD COLUMN batch_period TEXT;
    RAISE NOTICE 'batch_periodカラムを追加しました';
  ELSE
    RAISE NOTICE 'batch_periodカラムは既に存在します';
  END IF;
END $$;

-- 3. その他の不足しているカラムも追加
ALTER TABLE trainees
ADD COLUMN IF NOT EXISTS supervising_organization TEXT,
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS management_company TEXT,
ADD COLUMN IF NOT EXISTS electric_provider TEXT,
ADD COLUMN IF NOT EXISTS gas_provider TEXT,
ADD COLUMN IF NOT EXISTS water_provider TEXT,
ADD COLUMN IF NOT EXISTS move_in_date DATE,
ADD COLUMN IF NOT EXISTS residence_address TEXT,
ADD COLUMN IF NOT EXISTS residence_card_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS workplace_manager_name TEXT,
ADD COLUMN IF NOT EXISTS workplace_name TEXT,
ADD COLUMN IF NOT EXISTS area_manager TEXT,
ADD COLUMN IF NOT EXISTS technical_instructor TEXT,
ADD COLUMN IF NOT EXISTS life_instructor TEXT;

-- 4. 追加されたカラムを確認
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'trainees' 
AND table_schema = 'public'
AND column_name IN (
  'batch_period',
  'supervising_organization',
  'monthly_rent',
  'management_company',
  'electric_provider',
  'gas_provider',
  'water_provider',
  'move_in_date',
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

-- 5. テーブル構造の全体確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

