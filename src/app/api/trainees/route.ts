import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: trainees, error } = await supabase
      .from('trainees')
      .select('id, trainee_id, first_name, last_name, email, is_active')
      .eq('is_active', true)
      .order('trainee_id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ trainees: trainees || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch trainees' }, { status: 500 })
  }
}

