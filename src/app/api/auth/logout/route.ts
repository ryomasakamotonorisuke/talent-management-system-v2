import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  
  // リクエストのURLを使用してリダイレクト（環境に応じて自動的に適切なURLになる）
  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}














