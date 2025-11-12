import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CertificatePreview from '@/components/certificates/CertificatePreview'
import { Certificate } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CertificatesPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 証明書と実習生情報を結合して取得
  const { data: certificates, error } = await supabase
    .from('certificates')
    .select(`
      *,
      trainees:trainee_id (
        id,
        trainee_id,
        first_name,
        last_name,
        department
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const safeCertificates: (Certificate & {
    trainees?: {
      id: string
      trainee_id: string
      first_name: string
      last_name: string
      department: string
    } | null
  })[] = certificates || []

  const today = new Date()
  const soon = new Date()
  soon.setDate(today.getDate() + 30)

  const expired = safeCertificates.filter((c) => c.expiry_date && new Date(c.expiry_date) < today)
  const expiring = safeCertificates.filter((c) => {
    if (!c.expiry_date) return false
    const d = new Date(c.expiry_date)
    return d >= today && d <= soon
  })

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">資格管理</h1>
            <p className="text-primary-600 mt-2">証明書・資格の一覧・管理</p>
          </div>
          <Button
            href="/dashboard/certificates/upload"
            variant="primary"
            size="sm"
          >
            証明書アップロード
          </Button>
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-700 font-medium">データの取得に失敗しました</p>
            <p className="text-sm text-red-600 mt-1">{error.message}</p>
          </Card>
        )}

        {/* 期限アラート */}
        {!error && (expired.length > 0 || expiring.length > 0) && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">期限アラート</h2>
            <div className="space-y-2">
              {expired.map((c) => {
                const trainee = c.trainees
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    <div>
                      <p className="font-medium text-red-900">
                        {trainee ? (
                          <Link 
                            href={`/dashboard/trainees/${trainee.id}`}
                            className="hover:text-red-700 hover:underline"
                          >
                            {trainee.last_name} {trainee.first_name} - {c.name}
                          </Link>
                        ) : (
                          c.name
                        )}
                      </p>
                      <p className="text-sm text-red-700">
                        期限切れ: {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('ja-JP') : '未設定'}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">期限切れ</span>
                  </div>
                )
              })}
              {expiring.map((c) => {
                const trainee = c.trainees
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                    <div>
                      <p className="font-medium text-orange-900">
                        {trainee ? (
                          <Link 
                            href={`/dashboard/trainees/${trainee.id}`}
                            className="hover:text-orange-700 hover:underline"
                          >
                            {trainee.last_name} {trainee.first_name} - {c.name}
                          </Link>
                        ) : (
                          c.name
                        )}
                      </p>
                      <p className="text-sm text-orange-700">
                        期限: {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('ja-JP') : '未設定'}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">期限間近</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* 証明書一覧 */}
        {!error && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">実習生</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">資格名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発行元</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発行日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有効期限</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {safeCertificates.map((c) => {
                    const trainee = c.trainees
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {trainee ? (
                            <Link 
                              href={`/dashboard/trainees/${trainee.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              {trainee.last_name} {trainee.first_name}
                              <span className="block text-xs text-gray-500">ID: {trainee.trainee_id} / {trainee.department}</span>
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">実習生情報なし</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.issuing_body || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.issue_date ? new Date(c.issue_date).toLocaleDateString('ja-JP') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('ja-JP') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <CertificatePreview certificate={c} />
                        </td>
                      </tr>
                    )
                  })}
                  {safeCertificates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-900">証明書がありません</p>
                          <p className="text-xs text-gray-500 mt-1">証明書をアップロードしてください</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}


