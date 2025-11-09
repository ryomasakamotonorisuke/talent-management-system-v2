-- 実習生テーブルに追加項目を追加するマイグレーション
-- 実行前にバックアップを取得してください
-- 
-- ⚠️ 重要: traineesテーブルが存在しない場合は、先に docs/create-trainees-table-complete.sql を実行してください

-- 1. テーブルの存在確認
-- 以下のクエリでテーブルが存在するか確認してください：
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'trainees';

-- もしテーブルが存在しない場合は、先に docs/create-trainees-table-complete.sql を実行してテーブルを作成してください

-- 2. 既存のカラム確認（オプション）
-- 以下のクエリで既存のカラムを確認できます：
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trainees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 事業所・指導員関連情報のカラムを追加
-- テーブルが存在する場合のみ実行してください
DO $$
BEGIN
  -- テーブルが存在するか確認
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'trainees'
  ) THEN
    -- カラムを追加
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

-- 4. 既存のカラムが存在しない場合のみ追加（既に存在する場合はスキップされます）
-- 以下のカラムは既に存在する可能性がありますが、念のため確認してください：
-- - supervising_organization (管理団体)
-- - monthly_rent (家賃)
-- - electric_provider, gas_provider, water_provider (ライフライン契約先)
-- - move_in_date (入寮日)
-- - residence_card_number (在留カード番号)
-- - residence_address (社宅住所)

-- これらのカラムが存在しない場合は、docs/database-migration-req001-req005.sql を実行してください

