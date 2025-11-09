'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function NewSkillPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!name.trim()) throw new Error('スキル名を入力してください')
      if (!category.trim()) throw new Error('カテゴリを入力してください')

      const { error: insertError } = await supabase.from('skill_masters').insert({
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || null,
        is_active: true,
      })

      if (insertError) throw insertError

      router.push('/dashboard/skills')
      router.refresh()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'スキルの登録に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-3xl font-bold gradient-text mt-2">スキルマスターの新規登録</h1>
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
                placeholder="例: 日本語会話、溶接技術、機械操作"
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
                placeholder="例: 言語、技術、安全、コミュニケーション"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                カテゴリでグループ化されます（例: 言語、技術、安全など）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明（任意）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="スキルの詳細説明を入力してください"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? '登録中...' : '登録'}
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

