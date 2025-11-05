# Supabaseデータベースセットアップガイド

このドキュメントでは、Supabaseでデータベーススキーマを設定する手順を説明します。

## 前提条件

- Supabaseアカウント
- 新しいプロジェクトを作成済み

## セットアップ手順

### 1. Supabaseダッシュボードにアクセス

1. [Supabase](https://supabase.com) にログイン
2. プロジェクトを選択
3. 左サイドバーから「SQL Editor」を選択

### 2. データベーススキーマの作成

以下のSQLを実行して、必要なテーブルを作成します：

```sql
-- 組織テーブル
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 組織配下の部署テーブル（既存departmentを移行予定）
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザーと組織の関連（ロール付与）
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DEPARTMENT', 'TRAINEE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ユーザー情報テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DEPARTMENT', 'TRAINEE')),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 実習生テーブル
CREATE TABLE trainees (
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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 資格・証明書テーブル
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_body TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_path TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('CERTIFICATE', 'EMPLOYMENT_CONDITIONS', 'MINOR_CHANGE', 'TRAINING_PLAN_CERT') OR document_type IS NULL),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スキルマスター
CREATE TABLE skill_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  levels JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 評価テーブル
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES users(id),
  skill_id UUID NOT NULL REFERENCES skill_masters(id),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  comment TEXT,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  period TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainee_id, skill_id, period, evaluator_id)
);

-- 育成計画テーブル
CREATE TABLE development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goals JSONB,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 面談記録テーブル
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES users(id),
  interview_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('REGULAR', 'PROGRESS', 'CONCERN', 'HEALTH', 'EXIT')),
  content TEXT NOT NULL,
  concerns TEXT,
  health_status TEXT,
  progress TEXT,
  next_steps TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知テーブル
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id UUID REFERENCES users(id),
  trainee_id UUID REFERENCES trainees(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 健康診断履歴テーブル（任意機能）
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_trainees_org_id ON trainees(organization_id);
CREATE INDEX idx_trainees_department ON trainees(department);
CREATE INDEX idx_trainees_is_active ON trainees(is_active);
CREATE INDEX idx_evaluations_trainee_id ON evaluations(trainee_id);
CREATE INDEX idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX idx_interviews_trainee_id ON interviews(trainee_id);
CREATE INDEX idx_certificates_trainee_id ON certificates(trainee_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_health_checks_trainee_id ON health_checks(trainee_id);
```

### 3. Row Level Security (RLS) の設定

セキュリティポリシーを設定します：

```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- 管理者判定用のSECURITY DEFINER関数（usersを直接参照しない）
CREATE OR REPLACE FUNCTION is_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_organizations uo
    WHERE uo.user_id = p_uid
      AND uo.role = 'ADMIN'
  );
$$;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- usersテーブル: 自分のレコード参照可 + 管理者は全権限
DROP POLICY IF EXISTS "Admin full access" ON users;
CREATE POLICY "Users self select" ON users
  FOR SELECT USING (id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users self update" ON users
  FOR UPDATE USING (id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users admin insert" ON users
  FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users admin delete" ON users
  FOR DELETE USING (is_admin(auth.uid()));

-- 組織ベースのアクセス制御（例：trainees）
CREATE POLICY "Org scoped trainees" ON trainees
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = trainees.organization_id
    )
  );

-- trainees: 管理者は全権限
DROP POLICY IF EXISTS "Admin full access trainees" ON trainees;
CREATE POLICY "Trainees admin all" ON trainees
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 部署担当者は自部署の実習生を参照可（管理者は別途カバー）
CREATE POLICY "Trainees department select" ON trainees
  FOR SELECT USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'DEPARTMENT'
        AND u.department = trainees.department
    )
  );

-- certificatesテーブル: 管理者は全権限
DROP POLICY IF EXISTS "Certificates admin all" ON certificates;
CREATE POLICY "Certificates admin all" ON certificates
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- certificatesテーブル: 認証済みユーザーは証明書を追加できる
DROP POLICY IF EXISTS "Certificates authenticated insert" ON certificates;
CREATE POLICY "Certificates authenticated insert" ON certificates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM trainees WHERE id = certificates.trainee_id AND is_active = true
    )
  );

-- certificatesテーブル: 認証済みユーザーは証明書を参照できる
DROP POLICY IF EXISTS "Certificates authenticated select" ON certificates;
CREATE POLICY "Certificates authenticated select" ON certificates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- certificatesテーブル: 組織ベースのアクセス制御（オプション）
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

-- certificatesテーブル: 部署担当者は自部署の実習生の証明書を参照可能
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

-- evaluationsテーブル: 管理者は全権限
DROP POLICY IF EXISTS "Evaluations admin all" ON evaluations;
CREATE POLICY "Evaluations admin all" ON evaluations
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- evaluationsテーブル: 組織ベースのアクセス制御
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

-- evaluationsテーブル: 部署担当者は自部署の実習生の評価を参照可能
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

-- evaluationsテーブル: 評価者は自分の評価を追加・更新できる
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
```

### 4. 初期ユーザーの作成

管理画面からユーザーを作成するか、SQLで直接作成：

```sql
-- 注意: この方法ではパスワードが設定されていないため、
-- Supabase Authを使用してユーザーを作成することを推奨します
INSERT INTO users (email, name, role, department)
VALUES 
  ('admin@example.com', '管理者', 'ADMIN', '管理部'),
  ('dept@example.com', '部署担当者', 'DEPARTMENT', '製造部');
```

### 5. Supabase Authでのユーザー作成

Supabaseダッシュボードの「Authentication」タブから：
1. 「Users」を選択
2. 「Add user」をクリック
3. メールアドレスとパスワードを設定
4. 作成後、`users`テーブルに手動でレコードを追加

## 次のステップ

データベースのセットアップが完了したら、アプリケーションから接続をテストします。


