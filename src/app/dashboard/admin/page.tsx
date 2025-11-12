import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import OrganizationsList from '@/components/admin/OrganizationsList'
import UsersManagementLink from '@/components/admin/UsersManagementLink'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
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

  // 組織一覧を取得
  const { data: organizations = [], error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-8 animate-fade-in">
        {/* ページヘッダー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text">管理画面</h1>
              <p className="text-primary-600 mt-2">組織編制・ユーザー編制</p>
            </div>
            <Button
              href="/dashboard"
              variant="secondary"
              size="sm"
            >
              ← ダッシュボードに戻る
            </Button>
          </div>
        </div>

        {/* エラー表示 */}
        {orgsError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">組織データの取得に失敗しました</p>
            <p className="text-sm mt-1">{orgsError.message}</p>
          </div>
        )}

        {/* 組織編制セクション */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-primary-900">組織編制</h2>
            <Button
              href="/dashboard/admin/organizations/new"
              variant="primary"
              size="sm"
            >
              + 新規組織作成
            </Button>
          </div>
          <Card className="p-6">
            <OrganizationsList initialOrganizations={organizations || []} />
          </Card>
        </div>

        {/* ユーザー編制セクション */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary-900">ユーザー編制</h2>
          <Card className="p-6">
            <UsersManagementLink />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

