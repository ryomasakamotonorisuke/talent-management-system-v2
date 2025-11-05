import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return NextResponse.json({ orgs: [] }, { status: 200 })

  // 1) ユーザーの所属org IDを取得
  const { data: uo, error: uoError } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', session.user.id)

  if (uoError) return NextResponse.json({ orgs: [], error: uoError.message }, { status: 500 })

  const orgIds = (uo || []).map((r: any) => r.organization_id)
  if (orgIds.length === 0) return NextResponse.json({ orgs: [] }, { status: 200 })

  // 2) organizationsからIDリストで取得
  const { data: orgsData, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds)

  if (orgsError) return NextResponse.json({ orgs: [], error: orgsError.message }, { status: 500 })

  return NextResponse.json({ orgs: orgsData || [] })
}


