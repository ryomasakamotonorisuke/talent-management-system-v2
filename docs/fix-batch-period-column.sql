-- batch_periodカラムとその他の不足しているカラムを追加するSQL
-- このSQLは安全に実行できます（IF NOT EXISTSを使用）

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

-- 確認: 追加されたカラムを確認
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

