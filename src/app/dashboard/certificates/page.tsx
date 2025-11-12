import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CertificatePreview from '@/components/certificates/CertificatePreview'
import { Certificate } from '@/types'

export default async function CertificatesPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>ダッシュボード</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">資格管理</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard/certificates/upload" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow">
                証明書アップロード
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error ? (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md">{error.message}</div>
        ) : (
          <div className="space-y-8">
            {(expired.length > 0 || expiring.length > 0) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">期限アラート</h2>
                <div className="space-y-2">
                  {expired.map((c) => {
                    const trainee = c.trainees
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium text-red-900">
                            {trainee ? `${trainee.last_name} ${trainee.first_name} - ${c.name}` : c.name}
                          </p>
                          <p className="text-sm text-red-700">
                            期限切れ: {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('ja-JP') : '未設定'}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">期限切れ</span>
                      </div>
                    )
                  })}
                  {expiring.map((c) => {
                    const trainee = c.trainees
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div>
                          <p className="font-medium text-orange-900">
                            {trainee ? `${trainee.last_name} ${trainee.first_name} - ${c.name}` : c.name}
                          </p>
                          <p className="text-sm text-orange-700">
                            期限: {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('ja-JP') : '未設定'}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">期限間近</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">実習生</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">資格名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発行元</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発行日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有効期限</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {safeCertificates.map((c) => {
                    const trainee = c.trainees
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {trainee ? (
                            <Link 
                              href={`/dashboard/trainees/${trainee.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">証明書がありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


