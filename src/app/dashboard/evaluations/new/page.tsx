'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createSupabaseClient } from '@/lib/supabase/client'

function NewEvaluationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()

  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [trainees, setTrainees] = useState<Array<{ id: string; trainee_id: string; first_name: string; last_name: string }>>([])
  const [skills, setSkills] = useState<Array<{ id: string; name: string; category: string }>>([])
  const [traineeId, setTraineeId] = useState('')
  const [skillId, setSkillId] = useState('')
  const [level, setLevel] = useState<number>(1)
  const [period, setPeriod] = useState('')
  const [comment, setComment] = useState('')
  const [evaluationDate, setEvaluationDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }

      // 実習生一覧を取得
      const { data: traineesData } = await supabase
        .from('trainees')
        .select('id, trainee_id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name')
      setTrainees(traineesData || [])

      // スキルマスター一覧を取得
      const { data: skillsData } = await supabase
        .from('skill_masters')
        .select('id, name, category')
        .eq('is_active', true)
        .order('category, name')
      setSkills(skillsData || [])

      // 評価日を今日に設定
      setEvaluationDate(new Date().toISOString().split('T')[0])

      // URLパラメータから実習生IDを取得して設定
      const traineeIdParam = searchParams.get('traineeId')
      if (traineeIdParam) {
        setTraineeId(traineeIdParam)
      }
    }
    fetchData()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!traineeId) throw new Error('実習生を選択してください')
      if (!skillId) throw new Error('スキルを選択してください')
      if (!period) throw new Error('評価期間を入力してください')
      if (level < 1 || level > 5) throw new Error('評価レベルは1〜5の範囲で入力してください')

      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログイン情報が取得できませんでした')

      // usersテーブルに現在のユーザーが存在するか確認
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!userRecord) {
        throw new Error('ユーザー情報がusersテーブルに登録されていません。管理者に連絡してください。')
      }

      const { error: insertError, data: insertedData } = await supabase.from('evaluations').insert({
        trainee_id: traineeId,
        evaluator_id: user.id,
        skill_id: skillId,
        level,
        period,
        comment: comment || null,
        evaluation_date: evaluationDate || new Date().toISOString().split('T')[0],
      }).select()

      if (insertError) {
        // より詳細なエラーメッセージを表示
        console.error('評価登録エラー:', insertError)
        if (insertError.message?.includes('violates row-level security')) {
          throw new Error('評価の登録権限がありません。RLSポリシーを確認してください。')
        }
        if (insertError.message?.includes('foreign key')) {
          throw new Error('実習生、スキル、またはユーザー情報が見つかりません。')
        }
        if (insertError.message?.includes('unique constraint')) {
          throw new Error('同じ実習生・スキル・期間・評価者の組み合わせで既に評価が登録されています。')
        }
        throw new Error(`評価の登録に失敗しました: ${insertError.message}`)
      }

      router.push('/dashboard/evaluations')
      router.refresh()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '評価の登録に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userEmail={userEmail}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <Button href="/dashboard/evaluations" variant="ghost" size="sm">
              ← スキル評価に戻る
            </Button>
            <h1 className="text-4xl font-bold gradient-text mt-2">スキル評価の追加</h1>
            <p className="text-primary-600 mt-2">実習生のスキル評価を登録します</p>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-700 font-medium">{error}</p>
          </Card>
        )}

        {/* フォーム */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対象実習生 <span className="text-red-500">*</span>
              </label>
              <select
                value={traineeId}
                onChange={(e) => setTraineeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              >
                <option value="">選択してください</option>
                {trainees.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.last_name} {t.first_name} (ID: {t.trainee_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  スキル <span className="text-red-500">*</span>
                </label>
                {skills.length === 0 && (
                  <Button
                    href="/dashboard/skills/new"
                    variant="ghost"
                    size="sm"
                  >
                    スキルを登録 →
                  </Button>
                )}
              </div>
              {skills.length === 0 ? (
                <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">スキルマスターが登録されていません</p>
                    <Button
                      href="/dashboard/skills/new"
                      variant="primary"
                      size="sm"
                    >
                      スキルマスターを登録する
                    </Button>
                  </div>
                </Card>
              ) : (
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                >
                  <option value="">選択してください</option>
                  {skills.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">評価レベル (1〜5) <span className="text-red-500">*</span></label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        level === l
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">レベル {level}/5</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                評価期間 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="例: 2024年4月〜6月"
                required
              />
              <p className="mt-1 text-xs text-gray-500">例: 2024年4月〜6月、2024年度第1四半期 など</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                評価日 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">コメント（任意）</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="評価に関するコメントを入力してください"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                isLoading={loading}
              >
                {loading ? '登録中...' : '評価を登録'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={loading}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <NewEvaluationForm />
    </Suspense>
  )
}

