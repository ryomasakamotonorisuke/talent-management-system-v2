/**
 * 環境変数の検証と取得を行うユーティリティ
 */

/**
 * 必須の環境変数を取得し、存在しない場合はエラーを投げる
 * クライアント側とサーバー側の両方で動作します
 */
export function getRequiredEnv(key: string): string {
  // クライアント側では、NEXT_PUBLIC_で始まる環境変数は自動的に公開される
  // サーバー側では、process.envから直接取得
  const value = typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.[key] || process.env[key]
    : process.env[key]
  
  if (!value) {
    // クライアント側でのエラーメッセージを改善
    const errorMessage = typeof window !== 'undefined'
      ? `Missing required environment variable: ${key}. Please check your Vercel environment variables.`
      : `Missing required environment variable: ${key}. Please check your .env.local file.`
    throw new Error(errorMessage)
  }
  return value
}

/**
 * Supabase関連の環境変数を取得
 * クライアント側とサーバー側の両方で動作します
 */
export function getSupabaseEnv() {
  // クライアント側では、NEXT_PUBLIC_で始まる環境変数はビルド時に埋め込まれる
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      typeof window !== 'undefined'
        ? 'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please check your Vercel environment variables.'
        : 'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.'
    )
  }

  if (!anonKey) {
    throw new Error(
      typeof window !== 'undefined'
        ? 'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your Vercel environment variables.'
        : 'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file.'
    )
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  }
}

