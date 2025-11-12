import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import UserList from '@/components/users/UserList'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
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

  // ユーザー一覧を取得（trainee_idを含む）
  const { data: users = [], error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">ユーザー管理</h1>
            <p className="text-primary-600 mt-2">システムユーザーの一覧・作成・管理</p>
          </div>
          <Button
            href="/dashboard/users/new"
            variant="primary"
            size="sm"
          >
            新規ユーザー作成
          </Button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
            データの取得に失敗しました: {error.message}
          </div>
        )}

        {/* ユーザーリスト */}
        {!error && (
          <UserList initialUsers={users || []} />
        )}
      </div>
    </DashboardLayout>
  )
}





