import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Trainee, TraineeWithResidence, EnrichedEvaluation, Certificate, SkillMaster, User } from '@/types'
import DeleteTraineeButton from '@/components/trainees/DeleteTraineeButton'
import Link from 'next/link'
import CertificatePreview from '@/components/certificates/CertificatePreview'

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
  const traineeWithResidence = trainee as TraineeWithResidence
  const address = traineeWithResidence.residence_address || trainee.address || null
  const mapsUrl = address ? getGoogleMapsUrl(address) : null

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

        {/* 証明書セクション */}
        <Card className="overflow-hidden">
          <div className="px-6 py-5 bg-primary-50 border-b border-primary-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary-900">証明書</h3>
            <Link
              href="/dashboard/certificates"
              className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center space-x-1"
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
        <Card className="overflow-hidden">
          <div className="px-6 py-5 bg-primary-50 border-b border-primary-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary-900">スキル評価</h3>
            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/evaluations/new?traineeId=${resolvedParams.id}`}
                className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-medium flex items-center space-x-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>評価を追加</span>
              </Link>
              <Link
                href="/dashboard/evaluations"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center space-x-1"
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
