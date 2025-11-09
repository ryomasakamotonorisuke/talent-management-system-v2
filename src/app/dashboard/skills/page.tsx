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

  // スキルマスター一覧を取得
  const { data: skills, error } = await supabase
    .from('skill_masters')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const safeSkills: SkillMaster[] = skills || []

  // カテゴリ別にグループ化
  const skillsByCategory = safeSkills.reduce((acc, skill) => {
    const category = skill.category || 'その他'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(skill)
    return acc
  }, {} as Record<string, SkillMaster[]>)

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
                      className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
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

