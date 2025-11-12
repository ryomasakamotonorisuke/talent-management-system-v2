import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Trainee, TraineeWithResidence, EnrichedEvaluation, Certificate, SkillMaster, User } from '@/types'
import DeleteTraineeButton from '@/components/trainees/DeleteTraineeButton'
import Link from 'next/link'
import CertificatePreview from '@/components/certificates/CertificatePreview'

// 値のフォーマット関数
const formatValue = (value: any, type: 'text' | 'date' | 'number' | 'currency' = 'text'): string => {
  if (value === null || value === undefined || value === '') {
    return '未登録'
  }
  
  switch (type) {
    case 'date':
      try {
        return new Date(value).toLocaleDateString('ja-JP')
      } catch {
        return '未登録'
      }
    case 'number':
      return String(value)
    case 'currency':
      return `${Number(value).toLocaleString()}円`
    default:
      return String(value)
  }
}

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

  // 明示的にカラムを指定して取得（スキーマキャッシュの問題を回避）
  const { data: trainee, error } = await supabase
    .from('trainees')
    .select(`
      id,
      organization_id,
      trainee_id,
      first_name,
      last_name,
      first_name_kana,
      last_name_kana,
      nationality,
      passport_number,
      visa_type,
      visa_expiry_date,
      entry_date,
      departure_date,
      department,
      position,
      photo,
      phone_number,
      email,
      address,
      emergency_contact,
      emergency_phone,
      supervising_organization,
      monthly_rent,
      management_company,
      electric_provider,
      gas_provider,
      water_provider,
      move_in_date,
      batch_period,
      residence_address,
      residence_card_number,
      date_of_birth,
      workplace_manager_name,
      workplace_name,
      area_manager,
      technical_instructor,
      life_instructor,
      is_active,
      created_at,
      updated_at
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error) {
    // スキーマエラーの場合は、より詳細なエラーメッセージを表示
    if (error.message?.includes('batch_period') || error.message?.includes('column')) {
      console.error('スキーマエラー:', error.message)
      console.error('データベースにカラムが存在しない可能性があります。docs/fix-batch-period-column.sql を実行してください。')
    }
    notFound()
  }

  if (!trainee) {
    notFound()
  }

  // 現在のユーザー情報を取得（実習生ユーザーの場合、自分の実習生データを編集できるようにする）
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, trainee_id')
    .eq('id', session.user.id)
    .single()

  // 実習生ユーザーが自分の実習生データを編集できるかチェック
  const canEdit = currentUser?.role === 'ADMIN' || 
                  (currentUser?.role === 'TRAINEE' && currentUser?.trainee_id === resolvedParams.id)

  // 顔写真の公開URL
  let photoUrl: string | null = null
  if (trainee?.photo) {
    const { data } = supabase.storage
      .from('trainee-media')
      .getPublicUrl(trainee.photo)
    photoUrl = data?.publicUrl || null
  }

  // Google Maps用のURL生成
  const getGoogleMapsUrl = (address: string) => {
    if (!address || address === '未登録') return null
    const encodedAddress = encodeURIComponent(address)
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  }

  const traineeWithResidence = trainee as TraineeWithResidence
  const extendedTrainee = trainee as Trainee & {
    workplace_manager_name?: string
    workplace_name?: string
    area_manager?: string
    technical_instructor?: string
    life_instructor?: string
  }

  // この実習生に紐づく証明書を取得
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('trainee_id', resolvedParams.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const safeCertificates: Certificate[] = certificates || []

  // この実習生に紐づくスキル評価を取得
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*')
    .eq('trainee_id', resolvedParams.id)
    .order('updated_at', { ascending: false })

  const safeEvaluations = evaluations || []

  // 評価データを拡張（スキル情報と評価者情報を取得）
  const enrichedEvaluations: EnrichedEvaluation[] = await Promise.all(
    safeEvaluations.map(async (e) => {
      // スキル情報を取得
      const { data: skill } = await supabase
        .from('skill_masters')
        .select('id, name, category')
        .eq('id', e.skill_id)
        .single()

      // 評価者情報を取得
      const { data: evaluator } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', e.evaluator_id)
        .single()

      return {
        ...e,
        skill: (skill as SkillMaster | null) || null,
        evaluator: (evaluator as User | null) || null,
      }
    })
  )

  // 情報表示用のヘルパー関数
  const InfoRow = ({ label, value, type = 'text' as 'text' | 'date' | 'number' | 'currency', mapsUrl = null as string | null }: {
    label: string
    value: any
    type?: 'text' | 'date' | 'number' | 'currency'
    mapsUrl?: string | null
  }) => {
    const formattedValue = formatValue(value, type)
    const isEmpty = formattedValue === '未登録'
    const hasMap = mapsUrl && !isEmpty

    return (
      <div className={`px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 transition-colors ${
        isEmpty ? 'bg-gray-50 opacity-75' : 'bg-white'
      }`}>
        <dt className="text-sm font-medium text-gray-700 flex items-center">
          {label}
          {isEmpty && (
            <span className="ml-2 text-xs text-gray-400 font-normal">(未登録)</span>
          )}
        </dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center justify-between">
          <span className={isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}>
            {formattedValue}
          </span>
          {hasMap && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>地図</span>
            </a>
          )}
        </dd>
      </div>
    )
  }

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
          {canEdit && (
            <div className="flex items-center space-x-3">
              <Button href={`/dashboard/trainees/${resolvedParams.id}/edit`} variant="primary">
                編集
              </Button>
              {currentUser?.role === 'ADMIN' && (
                <DeleteTraineeButton traineeId={resolvedParams.id} traineeName={`${trainee.last_name} ${trainee.first_name}`} />
              )}
            </div>
          )}
        </div>

        {/* プロフィールカード */}
        <Card glow className="p-6">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0 animate-scale-in">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="顔写真" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-primary-200 shadow-lg" 
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                  {trainee.last_name?.[0] || '？'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-primary-900">
                {trainee.last_name} {trainee.first_name}
              </h2>
              <p className="text-primary-600 mt-2 text-lg">実習生ID: {trainee.trainee_id} ・ 部署: {trainee.department}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-700 shadow-sm">
                  {trainee.nationality}
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-accent-100 text-accent-700 shadow-sm">
                  ビザ: {trainee.visa_type}
                </span>
                {trainee.position && (
                  <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700 shadow-sm">
                    {trainee.position}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 基本情報カード */}
        <Card className="overflow-hidden shadow-lg">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-bold text-white">基本情報</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            <InfoRow label="実習生ID" value={trainee.trainee_id} />
            <InfoRow label="姓" value={trainee.last_name} />
            <InfoRow label="名" value={trainee.first_name} />
            <InfoRow label="姓（カナ）" value={trainee.last_name_kana} />
            <InfoRow label="名（カナ）" value={trainee.first_name_kana} />
            <InfoRow label="国籍" value={trainee.nationality} />
            <InfoRow label="部署" value={trainee.department} />
            <InfoRow label="役職" value={trainee.position} />
            <InfoRow label="パスポート番号" value={trainee.passport_number} />
            <InfoRow label="ビザ種類" value={trainee.visa_type} />
            <InfoRow label="ビザ有効期限" value={trainee.visa_expiry_date} type="date" />
            <InfoRow label="入国日" value={trainee.entry_date} type="date" />
            <InfoRow label="退去日" value={trainee.departure_date} type="date" />
          </div>
        </Card>

        {/* 連絡先情報カード */}
        <Card className="overflow-hidden shadow-lg">
          <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-green-700 border-b border-green-800">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="text-lg font-bold text-white">連絡先情報</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            <InfoRow label="電話番号" value={trainee.phone_number} />
            <InfoRow label="メールアドレス" value={trainee.email} />
            <InfoRow label="住所" value={trainee.address} mapsUrl={getGoogleMapsUrl(trainee.address || '')} />
            <InfoRow label="緊急連絡先（氏名）" value={trainee.emergency_contact} />
            <InfoRow label="緊急連絡先（電話番号）" value={trainee.emergency_phone} />
          </div>
        </Card>

        {/* 社宅・管理関連情報カード */}
        <Card className="overflow-hidden shadow-lg">
          <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h3 className="text-lg font-bold text-white">社宅・管理関連情報</h3>
            </div>
          </div>
          
          {/* 社宅情報セクション */}
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">社宅情報</h4>
            </div>
            <InfoRow label="社宅住所" value={traineeWithResidence.residence_address} mapsUrl={getGoogleMapsUrl(traineeWithResidence.residence_address || '')} />
            <InfoRow label="入寮日（入社日）" value={traineeWithResidence.move_in_date} type="date" />
            <InfoRow label="家賃（円）" value={traineeWithResidence.monthly_rent} type="currency" />
            <InfoRow label="管理会社" value={traineeWithResidence.management_company} />
          </div>

          {/* ライフライン契約情報セクション */}
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">ライフライン契約情報</h4>
            </div>
            <InfoRow label="電気契約先" value={traineeWithResidence.electric_provider} />
            <InfoRow label="ガス契約先" value={traineeWithResidence.gas_provider} />
            <InfoRow label="水道契約先" value={traineeWithResidence.water_provider} />
          </div>

          {/* 管理・その他情報セクション */}
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">管理・その他情報</h4>
            </div>
            <InfoRow label="管理団体" value={traineeWithResidence.supervising_organization} />
            <InfoRow label="期" value={traineeWithResidence.batch_period} />
            <InfoRow label="在留カード番号" value={traineeWithResidence.residence_card_number} />
            <InfoRow label="生年月日" value={traineeWithResidence.date_of_birth} type="date" />
          </div>
        </Card>

        {/* 事業所・指導員関連情報カード */}
        <Card className="overflow-hidden shadow-lg">
          <div className="px-6 py-5 bg-gradient-to-r from-orange-600 to-orange-700 border-b border-orange-800">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-bold text-white">事業所・指導員関連情報</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            <InfoRow label="事業所責任者名" value={extendedTrainee.workplace_manager_name} />
            <InfoRow label="勤務事業所" value={extendedTrainee.workplace_name} />
            <InfoRow label="担当エリアマネージャー" value={extendedTrainee.area_manager} />
            <InfoRow label="技能実習指導員" value={extendedTrainee.technical_instructor} />
            <InfoRow label="生活指導員" value={extendedTrainee.life_instructor} />
          </div>
        </Card>

        {/* 証明書セクション */}
        <Card className="overflow-hidden shadow-lg">
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 border-b border-indigo-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-bold text-white">証明書</h3>
            </div>
            <Link
              href="/dashboard/certificates"
              className="text-sm text-white hover:text-indigo-100 font-medium flex items-center space-x-1 transition-colors"
            >
              <span>すべて見る</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="p-6">
            {safeCertificates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">証明書が登録されていません</p>
                <Link
                  href="/dashboard/certificates/upload"
                  className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  証明書をアップロード →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {safeCertificates.slice(0, 5).map((cert) => (
                  <div
                    key={cert.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          {cert.issuing_body && (
                            <div>
                              <span className="text-gray-500">発行元: </span>
                              <span>{cert.issuing_body}</span>
                            </div>
                          )}
                          {cert.issue_date && (
                            <div>
                              <span className="text-gray-500">発行日: </span>
                              <span>{new Date(cert.issue_date).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                          {cert.expiry_date && (
                            <div>
                              <span className="text-gray-500">有効期限: </span>
                              <span className={new Date(cert.expiry_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                                {new Date(cert.expiry_date).toLocaleDateString('ja-JP')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <CertificatePreview certificate={cert} />
                      </div>
                    </div>
                  </div>
                ))}
                {safeCertificates.length > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/dashboard/certificates"
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    >
                      すべての証明書を見る ({safeCertificates.length}件) →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* スキル評価セクション */}
        <Card className="overflow-hidden shadow-lg">
          <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-teal-700 border-b border-teal-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-bold text-white">スキル評価</h3>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/evaluations/new?traineeId=${resolvedParams.id}`}
                className="px-3 py-1.5 text-sm text-white bg-teal-800 hover:bg-teal-900 rounded-lg font-medium flex items-center space-x-1 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>評価を追加</span>
              </Link>
              <Link
                href="/dashboard/evaluations"
                className="text-sm text-white hover:text-teal-100 font-medium flex items-center space-x-1 transition-colors"
              >
                <span>すべて見る</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="p-6">
            {enrichedEvaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-sm">スキル評価が登録されていません</p>
                <Link
                  href="/dashboard/evaluations/new"
                  className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  評価を追加 →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrichedEvaluations.slice(0, 5).map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {evaluation.skill?.name || 'スキル情報なし'}
                          </h4>
                          {evaluation.skill?.category && (
                            <span className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {evaluation.skill.category}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                          <div>
                            <span className="text-gray-500">評価レベル: </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <span
                                    key={level}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                      level <= evaluation.level
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-400'
                                    }`}
                                  >
                                    {level}
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{evaluation.level}/5</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">評価期間: </span>
                            <span>{evaluation.period}</span>
                          </div>
                          {evaluation.evaluator && (
                            <div>
                              <span className="text-gray-500">評価者: </span>
                              <span>{evaluation.evaluator.name}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">評価日: </span>
                            <span>{new Date(evaluation.evaluation_date || evaluation.updated_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                        </div>
                        {evaluation.comment && (
                          <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {evaluation.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {enrichedEvaluations.length > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/dashboard/evaluations"
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    >
                      すべての評価を見る ({enrichedEvaluations.length}件) →
                    </Link>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href={`/dashboard/evaluations/new?traineeId=${resolvedParams.id}`}
                    className="w-full px-4 py-2 text-sm text-primary-600 hover:text-primary-800 font-medium border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    <span>評価を追加</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
