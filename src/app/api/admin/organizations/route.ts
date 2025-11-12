import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ロールチェック（ADMINのみ）
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, code } = body

  if (!name) {
    return NextResponse.json({ error: '組織名は必須です' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name,
        code: code || null,
        is_active: true,
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'このコードは既に使用されています' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, organization: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create organization' }, { status: 500 })
  }
}

