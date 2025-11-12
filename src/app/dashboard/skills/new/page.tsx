import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewSkillPage from './page-client'

export const dynamic = 'force-dynamic'

export default async function NewSkillPageWrapper() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // ロールチェック（ADMINのみアクセス可能）
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <NewSkillPage userEmail={session.user.email} />
}

