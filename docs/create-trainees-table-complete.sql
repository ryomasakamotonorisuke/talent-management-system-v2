-- traineesテーブルの完全なセットアップSQL
-- このSQLは、traineesテーブルとその関連テーブルを新規作成する場合に使用します
-- 実行前にバックアップを取得してください

-- ============================================
-- 1. 前提となるテーブルの作成（存在しない場合）
-- ============================================

-- 組織テーブル（存在しない場合のみ作成）
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー情報テーブル（存在しない場合のみ作成）
-- 注意: Supabase Authのusersテーブルとは別のテーブルです
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DEPARTMENT', 'TRAINEE', 'HR', 'ACCOUNTING')),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. traineesテーブルの作成（すべてのカラムを含む）
-- ============================================

CREATE TABLE IF NOT EXISTS trainees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trainee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name_kana TEXT,
  last_name_kana TEXT,
  nationality TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  visa_type TEXT NOT NULL,
  visa_expiry_date DATE NOT NULL,
  entry_date DATE NOT NULL,
  departure_date DATE,
  department TEXT NOT NULL,
  position TEXT,
  photo TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  -- 社宅・管理関連情報（REQ-005）
  supervising_organization TEXT, -- 管理団体
  monthly_rent DECIMAL(10,2), -- 家賃
  management_company TEXT, -- 管理会社
  electric_provider TEXT, -- 電気契約先
  gas_provider TEXT, -- ガス契約先
  water_provider TEXT, -- 水道契約先
  move_in_date DATE, -- 入寮日（入社日）
  batch_period TEXT, -- 期
  residence_address TEXT, -- 社宅住所
  residence_card_number TEXT, -- 在留カード番号
  date_of_birth DATE, -- 生年月日
  -- 事業所・指導員関連情報（新規追加）
  workplace_manager_name TEXT, -- 事業所責任者名
  workplace_name TEXT, -- 勤務事業所
  area_manager TEXT, -- 担当エリアマネージャー
  technical_instructor TEXT, -- 技能実習指導員
  life_instructor TEXT, -- 生活指導員
  -- システム管理用
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. インデックスの作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_trainees_org_id ON trainees(organization_id);
CREATE INDEX IF NOT EXISTS idx_trainees_department ON trainees(department);
CREATE INDEX IF NOT EXISTS idx_trainees_is_active ON trainees(is_active);
CREATE INDEX IF NOT EXISTS idx_trainees_trainee_id ON trainees(trainee_id);

-- ============================================
-- 4. 既存のtraineesテーブルにカラムを追加する場合
-- （テーブルが既に存在する場合のみ実行）
-- ============================================

-- 以下のSQLは、既存のtraineesテーブルに新しいカラムを追加する場合に使用します
-- テーブルが既に存在する場合は、このセクションを実行してください

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
    
    RAISE NOTICE '既存のtraineesテーブルにカラムを追加しました';
  ELSE
    RAISE NOTICE 'traineesテーブルは新規作成されました';
  END IF;
END $$;

-- ============================================
-- 5. 確認クエリ
-- ============================================

-- テーブルの存在確認
SELECT 
  'traineesテーブル' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'trainees'
    ) THEN '存在します'
    ELSE '存在しません'
  END as status;

-- カラムの確認
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'trainees'
ORDER BY ordinal_position;

