import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { SkillMaster } from '@/types'

export default async function SkillsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // ロールチェック（ADMINのみアクセス可能）
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // スキルマスター一覧を取得
  const { data: skills, error } = await supabase
    .from('skill_masters')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const safeSkills: SkillMaster[] = skills || []

  // 各スキルに対する評価を取得（実習生情報を含む）
  const skillsWithEvaluations = await Promise.all(
    safeSkills.map(async (skill) => {
      const { data: evaluations } = await supabase
        .from('evaluations')
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
        .eq('skill_id', skill.id)
        .order('updated_at', { ascending: false })

      return {
        ...skill,
        evaluations: evaluations || [],
      }
    })
  )

  // カテゴリ別にグループ化
  const skillsByCategory = skillsWithEvaluations.reduce((acc, skill) => {
    const category = skill.category || 'その他'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(skill)
    return acc
  }, {} as Record<string, typeof skillsWithEvaluations[0][]>)

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <Button href="/dashboard" variant="ghost" size="sm">
              ← ダッシュボード
            </Button>
            <h1 className="text-3xl font-bold gradient-text mt-2">スキルマスター管理</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button href="/dashboard/skills/new" variant="primary">
              新規登録
            </Button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-700">エラー: {error.message}</p>
          </Card>
        )}

        {/* スキル一覧 */}
        {safeSkills.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">スキルマスターが登録されていません</p>
            <p className="text-sm text-gray-500 mb-4">スキル評価を行う前に、スキルマスターを登録してください</p>
            <Button href="/dashboard/skills/new" variant="primary">
              スキルマスターを登録
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <Card key={category} className="overflow-hidden">
                <div className="px-6 py-4 bg-primary-50 border-b border-primary-200">
                  <h2 className="text-lg font-semibold text-primary-900">{category}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-base font-medium text-gray-900">{skill.name}</h3>
                            {!skill.is_active && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                無効
                              </span>
                            )}
                          </div>
                          {skill.description && (
                            <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            href={`/dashboard/skills/${skill.id}/edit`}
                            variant="ghost"
                            size="sm"
                          >
                            編集
                          </Button>
                        </div>
                      </div>
                      
                      {/* 実習生ごとの評価一覧 */}
                      {skill.evaluations && skill.evaluations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-2">評価実績 ({skill.evaluations.length}件)</p>
                          <div className="space-y-2">
                            {skill.evaluations.slice(0, 5).map((evaluation: any) => {
                              const trainee = evaluation.trainees
                              return (
                                <div
                                  key={evaluation.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    {trainee ? (
                                      <Link
                                        href={`/dashboard/trainees/${trainee.id}`}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                      >
                                        {trainee.last_name} {trainee.first_name}
                                        <span className="ml-2 text-xs text-gray-500">
                                          (ID: {trainee.trainee_id} / {trainee.department})
                                        </span>
                                      </Link>
                                    ) : (
                                      <span className="text-sm text-gray-400">実習生情報なし</span>
                                    )}
                                    <div className="mt-1 flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">評価期間: {evaluation.period}</span>
                                      <span className="text-xs text-gray-400">|</span>
                                      <span className="text-xs text-gray-500">
                                        評価日: {new Date(evaluation.evaluation_date || evaluation.updated_at).toLocaleDateString('ja-JP')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
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
                                    <span className="text-sm font-medium text-gray-900 ml-2">
                                      {evaluation.level}/5
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                            {skill.evaluations.length > 5 && (
                              <Link
                                href={`/dashboard/evaluations?skillId=${skill.id}`}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium block text-center pt-2"
                              >
                                すべての評価を見る ({skill.evaluations.length}件) →
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {(!skill.evaluations || skill.evaluations.length === 0) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-400">評価実績がありません</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

