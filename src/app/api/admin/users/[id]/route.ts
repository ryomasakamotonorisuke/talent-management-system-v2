import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params)
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ロールチェック（ADMINのみ許可）
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!me || me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 自分自身を削除できないようにする
  if (session.user.id === resolvedParams.id) {
    return NextResponse.json({ error: '自分自身を削除することはできません' }, { status: 400 })
  }

  try {
    const admin = createSupabaseAdmin()

    // usersテーブルから論理削除（is_activeをfalseに設定）
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', resolvedParams.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Supabase Authからもユーザーを削除（オプション：論理削除のみの場合）
    // 注意: 物理削除する場合は以下のコメントを外す
    // const { error: deleteAuthError } = await admin.auth.admin.deleteUser(resolvedParams.id)
    // if (deleteAuthError) {
    //   console.error('Auth user deletion error:', deleteAuthError)
    //   // 論理削除は成功しているので、エラーを無視するか、ログに記録
    // }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

