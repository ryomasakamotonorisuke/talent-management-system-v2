import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Trainee } from '@/types'
import DeleteTraineeButton from '@/components/trainees/DeleteTraineeButton'

export default async function TraineeDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = await Promise.resolve(params)
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: trainee, error } = await supabase
    .from('trainees')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !trainee) {
    notFound()
  }

  // 顔写真の公開URL
  let photoUrl: string | null = null
  if (trainee?.photo) {
    const { data } = supabase.storage
      .from('trainee-media')
      .getPublicUrl(trainee.photo)
    photoUrl = data?.publicUrl || null
  }

  // Google Maps用のURL生成（REQ-006）
  const getGoogleMapsUrl = (address: string) => {
    if (!address) return null
    const encodedAddress = encodeURIComponent(address)
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  }

  // 社宅住所を優先、なければ通常の住所を使用
  const address = (trainee as any).residence_address || trainee.address || null
  const mapsUrl = address ? getGoogleMapsUrl(address) : null

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <Button href="/dashboard/trainees" variant="ghost" size="sm">
              ← 実習生一覧
            </Button>
            <h1 className="text-3xl font-bold gradient-text mt-2">
              {trainee.last_name} {trainee.first_name} の詳細
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button href={`/dashboard/trainees/${resolvedParams.id}/edit`} variant="primary">
              編集
            </Button>
            <DeleteTraineeButton traineeId={resolvedParams.id} traineeName={`${trainee.last_name} ${trainee.first_name}`} />
          </div>
        </div>

        {/* プロフィールカード */}
        <Card glow className="p-6">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0 animate-scale-in">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="顔写真" 
                  className="h-28 w-28 rounded-full object-cover border-4 border-primary-200 shadow-lg" 
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {trainee.last_name?.[0] || '？'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-primary-900">
                {trainee.last_name} {trainee.first_name}
              </h2>
              <p className="text-primary-600 mt-2">実習生ID: {trainee.trainee_id} ・ 部署: {trainee.department}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                  {trainee.nationality}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-700">
                  ビザ: {trainee.visa_type}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 基本情報カード */}
        <Card className="overflow-hidden">
          <div className="px-6 py-5 bg-primary-50 border-b border-primary-200">
            <h3 className="text-lg font-semibold text-primary-900">基本情報</h3>
          </div>
          <div className="divide-y divide-primary-100">
            {[
              { label: '実習生ID', value: trainee.trainee_id },
              { 
                label: '氏名', 
                value: `${trainee.last_name} ${trainee.first_name}${trainee.last_name_kana && trainee.first_name_kana ? ` (${trainee.last_name_kana} ${trainee.first_name_kana})` : ''}` 
              },
              { label: '国籍', value: trainee.nationality },
              { label: '部署', value: trainee.department },
              { label: 'パスポート番号', value: trainee.passport_number },
              { label: 'ビザ種類', value: trainee.visa_type },
              { label: 'ビザ有効期限', value: new Date(trainee.visa_expiry_date).toLocaleDateString('ja-JP') },
              { label: '入国日', value: new Date(trainee.entry_date).toLocaleDateString('ja-JP') },
              trainee.email && { label: 'メールアドレス', value: trainee.email },
              address && { 
                label: '住所', 
                value: address,
                mapsUrl: mapsUrl
              },
            ].filter(Boolean).map((item, index) => (
              <div 
                key={index} 
                className={`px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-primary-50'
                }`}
              >
                <dt className="text-sm font-medium text-primary-600">{item.label}</dt>
                <dd className="mt-1 text-sm text-primary-900 sm:mt-0 sm:col-span-2 flex items-center justify-between">
                  <span>{item.value}</span>
                  {item.mapsUrl && (
                    <a
                      href={item.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-3 py-1.5 text-xs font-medium text-accent-700 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>地図</span>
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
