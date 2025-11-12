import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { EnrichedEvaluation, Evaluation, Trainee, User, SkillMaster } from '@/types'

export const dynamic = 'force-dynamic'

export default async function EvaluationsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 現在のユーザーのロールを取得
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const isAdmin = currentUser?.role === 'ADMIN'

  // 評価データを取得
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select('*')
    .order('updated_at', { ascending: false })
  
  const safeEvaluations: Evaluation[] = evaluations || []

  // 関連データを取得して結合
  const enrichedEvaluations: EnrichedEvaluation[] = await Promise.all(
    safeEvaluations.map(async (e): Promise<EnrichedEvaluation> => {
      // 実習生情報を取得
      const { data: trainee } = await supabase
        .from('trainees')
        .select('id, trainee_id, first_name, last_name, first_name_kana, last_name_kana, department')
        .eq('id', e.trainee_id)
        .single()

      // 評価者情報を取得
      const { data: evaluator } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', e.evaluator_id)
        .single()

      // スキル情報を取得
      const { data: skill } = await supabase
        .from('skill_masters')
        .select('id, name, category')
        .eq('id', e.skill_id)
        .single()

      return {
        ...e,
        trainee: (trainee as Trainee | null) || null,
        evaluator: (evaluator as User | null) || null,
        skill: (skill as SkillMaster | null) || null,
      }
    })
  )

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">スキル評価</h1>
            <p className="text-primary-600 mt-2">スキル評価・進捗管理</p>
          </div>
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Button
                href="/dashboard/skills"
                variant="secondary"
                size="sm"
              >
                スキルマスター管理
              </Button>
            )}
            <Button
              href="/dashboard/evaluations/new"
              variant="primary"
              size="sm"
            >
              新規評価を追加
            </Button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-700 font-medium">データの取得に失敗しました</p>
            <p className="text-sm text-red-600 mt-1">{error.message}</p>
          </Card>
        )}

        {/* 評価一覧 */}
        {!error && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">評価一覧</h2>
            {enrichedEvaluations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">評価がまだありません</p>
                <p className="text-xs text-gray-500 mt-1">新規評価を追加してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrichedEvaluations.map((e) => {
                  const trainee = e.trainee
                  const evaluator = e.evaluator
                  const skill = e.skill
                  
                  return (
                    <div key={e.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {trainee ? (
                              <Link
                                href={`/dashboard/trainees/${trainee.id}`}
                                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {trainee.last_name} {trainee.first_name}
                              </Link>
                            ) : (
                              <h3 className="text-lg font-semibold text-gray-900">実習生情報なし</h3>
                            )}
                            {trainee?.trainee_id && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                ID: {trainee.trainee_id}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">スキル</p>
                              <p className="text-sm font-medium text-gray-900">
                                {skill?.name || 'スキル情報なし'}
                                {skill?.category && (
                                  <span className="ml-2 text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    {skill.category}
                                  </span>
                                )}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">評価レベル</p>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <span
                                      key={level}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                        level <= e.level
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-200 text-gray-400'
                                      }`}
                                    >
                                      {level}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-900">レベル {e.level}/5</span>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">評価期間</p>
                              <p className="text-sm text-gray-900">{e.period}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">評価者</p>
                              <p className="text-sm text-gray-900">
                                {evaluator?.name || '評価者情報なし'}
                              </p>
                            </div>
                            
                            {e.comment && (
                              <div className="md:col-span-2">
                                <p className="text-xs text-gray-500 mb-1">コメント</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{e.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-400">
                            {new Date(e.evaluation_date || e.updated_at).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            更新: {new Date(e.updated_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}


