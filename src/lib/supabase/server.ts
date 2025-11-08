import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/env'

/**
 * サーバー側で使用するSupabaseクライアント（認証済みユーザー用）
 * Next.js App RouterのサーバーコンポーネントやRoute Handlersで使用
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv()

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value)
          } catch {
            // サーバーコンポーネントではsetは無視される場合がある
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // サーバーコンポーネントではremoveは無視される場合がある
          }
        },
      },
    }
  )
}

