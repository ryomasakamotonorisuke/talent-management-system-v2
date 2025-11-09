import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EnrichedEvaluation, Evaluation, Trainee, User, SkillMaster } from '@/types'

export default async function EvaluationsPage() {
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

  // 評価データを取得
  const { data: evaluations } = await supabase
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
              <h1 className="text-xl font-bold text-gray-900">スキル評価</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">スキル評価一覧</h2>
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/skills"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>スキルマスター管理</span>
            </Link>
            <Link
              href="/dashboard/evaluations/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>新規評価を追加</span>
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近の評価</h2>
          {enrichedEvaluations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">評価がまだありません</p>
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
                          <h3 className="text-lg font-semibold text-gray-900">
                            {trainee ? `${trainee.last_name} ${trainee.first_name}` : '実習生情報なし'}
                          </h3>
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
        </div>
      </main>
    </div>
  )
}


