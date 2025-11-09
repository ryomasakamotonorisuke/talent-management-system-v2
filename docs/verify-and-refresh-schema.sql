-- 1. batch_periodカラムが存在するか確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainees' 
AND table_schema = 'public'
AND column_name = 'batch_period';

-- 2. もしカラムが存在しない場合は、再度追加
ALTER TABLE trainees
ADD COLUMN IF NOT EXISTS batch_period TEXT;

-- 3. すべての新しいカラムが存在するか確認
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

-- 4. スキーマキャッシュをリフレッシュするために、簡単なクエリを実行
SELECT COUNT(*) FROM trainees;

