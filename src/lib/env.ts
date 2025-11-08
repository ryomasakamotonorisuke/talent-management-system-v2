/**
 * 環境変数の検証と取得を行うユーティリティ
 */

/**
 * 必須の環境変数を取得し、存在しない場合はエラーを投げる
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please check your .env.local file.`
    )
  }
  return value
}

/**
 * Supabase関連の環境変数を取得
 */
export function getSupabaseEnv() {
  return {
    url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

