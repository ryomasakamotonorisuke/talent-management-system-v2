import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * サーバー側で使用するSupabaseクライアント（認証済みユーザー用）
 * Next.js App RouterのサーバーコンポーネントやRoute Handlersで使用
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

