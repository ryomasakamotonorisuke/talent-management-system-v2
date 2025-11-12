import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NewOrganizationForm from '@/components/admin/NewOrganizationForm'

export const dynamic = 'force-dynamic'

export default async function NewOrganizationPage() {
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

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <a
              href="/dashboard/admin"
              className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
            >
              ← 管理画面に戻る
            </a>
            <h1 className="text-2xl font-bold text-gray-900">新規組織作成</h1>
            <p className="text-sm text-gray-600 mt-2">新しい組織をシステムに追加します</p>
          </div>
          <NewOrganizationForm />
        </div>
      </div>
    </DashboardLayout>
  )
}

