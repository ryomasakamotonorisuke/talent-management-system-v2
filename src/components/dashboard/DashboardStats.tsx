import { Trainee, Certificate } from '@/types'
import Card from '@/components/ui/Card'

interface DashboardStatsProps {
  trainees?: Trainee[] | null
  certificates?: Certificate[] | null
}

export default function DashboardStats({ trainees = [], certificates = [] }: DashboardStatsProps) {
  const safeTrainees = trainees || []
  const safeCertificates = certificates || []

  // 実習生数
  const totalTrainees = safeTrainees.length
  const activeTrainees = safeTrainees.filter(t => t.is_active).length

  // 国籍別集計
  const nationalityCount: Record<string, number> = {}
  safeTrainees.forEach(t => {
    nationalityCount[t.nationality] = (nationalityCount[t.nationality] || 0) + 1
  })
  const nationalityData = Object.entries(nationalityCount)
    .map(([name, count]) => ({ name, count, percentage: totalTrainees > 0 ? (count / totalTrainees) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)

  // 部署別集計
  const departmentCount: Record<string, number> = {}
  safeTrainees.forEach(t => {
    departmentCount[t.department] = (departmentCount[t.department] || 0) + 1
  })
  const departmentData = Object.entries(departmentCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // 資格期限が近いものを集計（30日以内）
  const today = new Date()
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(today.getDate() + 30)
  
  const expiringCertificates = safeCertificates.filter((cert): boolean => {
    if (!cert?.expiry_date) return false
    const expiryDate = new Date(cert.expiry_date)
    return expiryDate >= today && expiryDate <= thirtyDaysLater
  })

  const expiredCertificates = safeCertificates.filter((cert): boolean => {
    if (!cert?.expiry_date) return false
    return new Date(cert.expiry_date) < today
  })

  // グラデーション色
  const gradientColors = [
    'from-primary-500 to-primary-600',
    'from-accent-500 to-accent-600',
    'from-yellow-500 to-orange-500',
    'from-purple-500 to-pink-500',
  ]

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card glow className="p-6 border-l-4 border-primary-500 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">実習生総数</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">{totalTrainees}</p>
              <p className="text-xs text-primary-500 mt-1">アクティブ: {activeTrainees}名</p>
            </div>
            <div className="bg-primary-100 rounded-full p-4 animate-float">
              <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card glow className="p-6 border-l-4 border-red-500 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">期限切れ資格</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">{expiredCertificates.length}</p>
              <p className="text-xs text-red-600 mt-1 font-medium">要更新</p>
            </div>
            <div className="bg-red-100 rounded-full p-4 animate-float" style={{ animationDelay: '0.2s' }}>
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card glow className="p-6 border-l-4 border-orange-500 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">期限間近資格</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">{expiringCertificates.length}</p>
              <p className="text-xs text-orange-600 mt-1 font-medium">30日以内</p>
            </div>
            <div className="bg-orange-100 rounded-full p-4 animate-float" style={{ animationDelay: '0.4s' }}>
              <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card glow className="p-6 border-l-4 border-green-500 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">有効資格</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">{safeCertificates.length - expiredCertificates.length - expiringCertificates.length}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">正常</p>
            </div>
            <div className="bg-green-100 rounded-full p-4 animate-float" style={{ animationDelay: '0.6s' }}>
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 国籍別分布 */}
        <Card glow className="p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-lg font-semibold text-primary-900 mb-6">国籍別分布</h3>
          <div className="space-y-5">
            {nationalityData.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${gradientColors[index % gradientColors.length]}`}></div>
                    <span className="text-sm font-medium text-primary-900">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-primary-900">{item.count}</span>
                    <span className="text-sm text-primary-500">名</span>
                    <span className="text-xs text-primary-400">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-primary-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradientColors[index % gradientColors.length]} transition-all duration-1000`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {nationalityData.length === 0 && (
              <p className="text-center text-primary-500 py-8">データがありません</p>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-primary-200">
            <div className="flex items-center justify-center space-x-2">
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text">{totalTrainees}</p>
                <p className="text-xs text-primary-500">総実習生数</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 部署別人数表 */}
        <Card glow className="p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-lg font-semibold text-primary-900 mb-6">部署別人数</h3>
          <div className="space-y-3">
            {departmentData.map((dept, index) => (
              <div 
                key={dept.name} 
                className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradientColors[index % gradientColors.length]}`}></div>
                  <span className="font-medium text-primary-900">{dept.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold gradient-text">{dept.count}</span>
                  <span className="text-sm text-primary-500">名</span>
                </div>
              </div>
            ))}
            {departmentData.length === 0 && (
              <p className="text-center text-primary-500 py-8">データがありません</p>
            )}
          </div>
        </Card>
      </div>

      {/* 資格期限アラート */}
      {(expiredCertificates.length > 0 || expiringCertificates.length > 0) && (
        <Card glow className="p-6 border-l-4 border-red-500 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            資格更新アラート
          </h3>
          <div className="space-y-2">
            {expiredCertificates.slice(0, 5).map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                <div>
                  <p className="font-medium text-red-900">{cert.name}</p>
                  <p className="text-sm text-red-700">期限切れ: {cert.expiry_date && new Date(cert.expiry_date).toLocaleDateString('ja-JP')}</p>
                </div>
                <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full font-medium">期限切れ</span>
              </div>
            ))}
            {expiringCertificates.slice(0, 5).map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg animate-fade-in">
                <div>
                  <p className="font-medium text-orange-900">{cert.name}</p>
                  <p className="text-sm text-orange-700">期限: {cert.expiry_date && new Date(cert.expiry_date).toLocaleDateString('ja-JP')}</p>
                </div>
                <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">期限間近</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
