/**
 * ユーザーロール定義
 */
export enum UserRole {
  ADMIN = 'ADMIN',           // 管理部署（人事・総務）
  DEPARTMENT = 'DEPARTMENT', // 勤務部署（現場）
  TRAINEE = 'TRAINEE',       // 実習生本人
  HR = 'HR',                 // 人事部
  ACCOUNTING = 'ACCOUNTING', // 経理部
}

export interface Organization {
  id: string
  name: string
  code?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  organization_id: string
  name: string
  code?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserOrganization {
  id: string
  user_id: string
  organization_id: string
  role: UserRole
  created_at: string
}

/**
 * 実習生データ型
 */
export interface Trainee {
  id: string
  organization_id: string
  trainee_id: string
  first_name: string
  last_name: string
  first_name_kana?: string
  last_name_kana?: string
  nationality: string
  passport_number: string
  visa_type: string
  visa_expiry_date: string
  entry_date: string
  departure_date?: string
  department: string
  position?: string
  photo?: string
  phone_number?: string
  email?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  // 社宅・管理関連情報（REQ-005）
  supervising_organization?: string // 監理団体
  monthly_rent?: number // 家賃
  management_company?: string // 管理会社
  electric_provider?: string // 電気契約先
  gas_provider?: string // ガス契約先
  water_provider?: string // 水道契約先
  move_in_date?: string // 入寮日
  batch_period?: string // 期
  residence_address?: string // 社宅住所（REQ-006用）
  residence_card_number?: string // 在留カード番号
  date_of_birth?: string // 生年月日
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * ユーザーデータ型
 */
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 資格・証明書データ型
 */
export interface Certificate {
  id: string
  trainee_id: string
  name: string
  issuing_body?: string
  issue_date?: string
  expiry_date?: string
  file_path: string
  document_type?: 'CERTIFICATE' | 'EMPLOYMENT_CONDITIONS' | 'MINOR_CHANGE' | 'TRAINING_PLAN_CERT' // REQ-009
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 評価データ型
 */
export interface Evaluation {
  id: string
  trainee_id: string
  evaluator_id: string
  skill_id: string
  level: number
  comment?: string
  evaluation_date: string
  period: string
  created_at: string
  updated_at: string
}

/**
 * 育成計画データ型
 */
export interface DevelopmentPlan {
  id: string
  trainee_id: string
  creator_id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  goals: string[]
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  created_at: string
  updated_at: string
}

/**
 * 面談記録データ型
 */
export interface Interview {
  id: string
  trainee_id: string
  interviewer_id: string
  interview_date: string
  type: 'REGULAR' | 'PROGRESS' | 'CONCERN' | 'HEALTH' | 'EXIT'
  content: string
  concerns?: string
  health_status?: string
  progress?: string
  next_steps?: string
  created_at: string
  updated_at: string
}



