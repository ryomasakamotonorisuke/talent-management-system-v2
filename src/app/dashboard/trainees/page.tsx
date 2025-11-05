import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TraineeList from '@/components/trainees/TraineeList'
import Button from '@/components/ui/Button'
import { Trainee } from '@/types'

export default async function TraineesPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 実習生一覧を取得
  const { data: trainees = [], error } = await supabase
    .from('trainees')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">実習生管理</h1>
            <p className="text-primary-600 mt-2">実習生情報の一覧・検索・管理</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              href="/dashboard/trainees/import"
              variant="secondary"
              size="sm"
            >
              CSVインポート
            </Button>
            <Button
              href="/dashboard/trainees/new"
              variant="primary"
              size="sm"
            >
              新規登録
            </Button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
            データの取得に失敗しました: {error.message}
          </div>
        )}

        {/* 実習生リスト */}
        {!error && (
          <TraineeList initialTrainees={trainees as Trainee[]} />
        )}
      </div>
    </DashboardLayout>
  )
}
