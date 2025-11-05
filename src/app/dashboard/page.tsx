import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardStats from '@/components/dashboard/DashboardStats'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Trainee, Certificate } from '@/types'

export default async function DashboardPage() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      redirect('/login')
    }

    const userDisplayName = session.user.email

    // 実習生データを取得
    const { data: trainees = [], error: traineesError } = await supabase
      .from('trainees')
      .select('*')
      .order('created_at', { ascending: false })

    // 資格証明書データを取得
    const { data: certificates = [], error: certificatesError } = await supabase
      .from('certificates')
      .select('*')
      .eq('is_active', true)

    // エラーログ出力
    if (traineesError) {
      console.error('Trainees fetch error:', traineesError)
    }
    if (certificatesError) {
      console.error('Certificates fetch error:', certificatesError)
    }

    return (
      <DashboardLayout userEmail={userDisplayName || undefined}>
        <div className="space-y-8 animate-fade-in">
          {/* ページヘッダー */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">ダッシュボード</h1>
            <p className="text-primary-600">システム全体の統計とアラートを確認できます</p>
          </div>

          {/* エラー表示 */}
          {(traineesError || certificatesError) && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 px-4 py-3 rounded-lg">
              <p className="font-medium">データ取得時にエラーが発生しました</p>
              {traineesError && <p className="text-sm mt-1">実習生データ: {traineesError.message}</p>}
              {certificatesError && <p className="text-sm mt-1">証明書データ: {certificatesError.message}</p>}
            </div>
          )}

          {/* 統計コンポーネント */}
          <DashboardStats 
            trainees={(trainees || []) as Trainee[]} 
            certificates={(certificates || []) as Certificate[]} 
          />

          {/* クイックアクセス */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary-900">クイックアクセス</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card hover glow className="p-6 group">
                <Button
                  href="/dashboard/trainees"
                  variant="ghost"
                  className="w-full justify-start h-auto p-0"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="bg-primary-100 rounded-xl p-4 group-hover:bg-primary-200 transition-colors duration-300">
                      <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-600 transition-colors">
                        実習生管理
                      </h3>
                      <p className="text-sm text-primary-500 mt-1">実習生一覧・登録・編集</p>
                    </div>
                  </div>
                </Button>
              </Card>

              <Card hover glow className="p-6 group">
                <Button
                  href="/dashboard/certificates"
                  variant="ghost"
                  className="w-full justify-start h-auto p-0"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="bg-accent-100 rounded-xl p-4 group-hover:bg-accent-200 transition-colors duration-300">
                      <svg className="w-8 h-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary-900 group-hover:text-accent-600 transition-colors">
                        資格管理
                      </h3>
                      <p className="text-sm text-primary-500 mt-1">証明書・資格の管理</p>
                    </div>
                  </div>
                </Button>
              </Card>

              <Card hover glow className="p-6 group">
                <Button
                  href="/dashboard/evaluations"
                  variant="ghost"
                  className="w-full justify-start h-auto p-0"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="bg-purple-100 rounded-xl p-4 group-hover:bg-purple-200 transition-colors duration-300">
                      <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary-900 group-hover:text-purple-600 transition-colors">
                        スキル評価
                      </h3>
                      <p className="text-sm text-primary-500 mt-1">スキル評価・進捗管理</p>
                    </div>
                  </div>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  } catch (error: any) {
    console.error('Dashboard page error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-primary-600 mb-4">{error?.message || '不明なエラー'}</p>
          <a href="/login" className="text-primary-600 hover:text-primary-800 underline">
            ログインページに戻る
          </a>
        </div>
      </div>
    )
  }
}
