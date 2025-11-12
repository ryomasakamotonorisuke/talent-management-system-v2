import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(
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
  const { trainee_id } = body

  try {
    // trainee_idが指定されている場合、その実習生が存在するか確認
    if (trainee_id) {
      const { data: trainee, error: traineeError } = await supabase
        .from('trainees')
        .select('id')
        .eq('id', trainee_id)
        .single()

      if (traineeError || !trainee) {
        return NextResponse.json({ error: '指定された実習生が見つかりません' }, { status: 400 })
      }
    }

    // usersテーブルのtrainee_idを更新
    const { error: updateError } = await supabase
      .from('users')
      .update({ trainee_id: trainee_id || null })
      .eq('id', resolvedParams.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to link trainee' }, { status: 500 })
  }
}

