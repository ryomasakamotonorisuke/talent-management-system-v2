'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { SkillMaster } from '@/types'

export default function EditSkillPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createSupabaseClient()
  const skillId = params.id as string

  const [skill, setSkill] = useState<SkillMaster | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('skill_masters')
          .select('*')
          .eq('id', skillId)
          .single()

        if (fetchError) throw fetchError
        if (!data) throw new Error('スキルが見つかりません')

        setSkill(data as SkillMaster)
        setName(data.name)
        setCategory(data.category)
        setDescription(data.description || '')
        setIsActive(data.is_active)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'スキルの取得に失敗しました'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (skillId) {
      fetchSkill()
    }
  }, [skillId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!name.trim()) throw new Error('スキル名を入力してください')
      if (!category.trim()) throw new Error('カテゴリを入力してください')

      const { error: updateError } = await supabase
        .from('skill_masters')
        .update({
          name: name.trim(),
          category: category.trim(),
          description: description.trim() || null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', skillId)

      if (updateError) throw updateError

      router.push('/dashboard/skills')
      router.refresh()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'スキルの更新に失敗しました'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userEmail={undefined}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !skill) {
    return (
      <DashboardLayout userEmail={undefined}>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <Button href="/dashboard/skills" variant="ghost" size="sm">
              ← スキルマスター一覧
            </Button>
          </div>
          <Card className="p-6 bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userEmail={undefined}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <Button href="/dashboard/skills" variant="ghost" size="sm">
              ← スキルマスター一覧
            </Button>
            <h1 className="text-3xl font-bold gradient-text mt-2">スキルマスターの編集</h1>
          </div>
        </div>

        <Card className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                スキル名 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明（任意）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">有効</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                無効にすると、スキル評価の選択肢に表示されません
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? '更新中...' : '更新'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={saving}
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

