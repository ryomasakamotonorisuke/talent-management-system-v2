import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/lib/env'

/**
 * クライアント側で使用するSupabaseクライアント
 * ブラウザでのみ実行されます
 */
export function createSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv()
  return createBrowserClient(url, anonKey)
}

/**
 * サーバー側で使用するSupabaseクライアント
 * サービスロールキーを使用（管理者権限）
 */
export function createSupabaseAdmin() {
  const { url, serviceRoleKey } = getSupabaseEnv()

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please check your .env.local file.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

