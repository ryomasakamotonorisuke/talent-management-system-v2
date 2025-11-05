import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ロールチェック（ユーザーがADMINであること）
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!me || me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, name, role, department, organization_id } = body

  if (!email || !password || !role || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const admin = createSupabaseAdmin()
    // Authユーザー作成（メール確認済みで作成）
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) throw createError
    const userId = created.user?.id
    if (!userId) throw new Error('Failed to create auth user')

    // usersテーブルに反映
    const { error: insertUserError } = await supabase.from('users').insert({
      id: userId,
      email,
      name: name || email,
      role,
      department: department || null,
      is_active: true,
    })
    if (insertUserError) throw insertUserError

    // 所属組織を紐付け
    const { error: linkError } = await supabase.from('user_organizations').insert({
      user_id: userId,
      organization_id,
      role,
    })
    if (linkError) throw linkError

    return NextResponse.json({ ok: true, user_id: userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 500 })
  }
}


