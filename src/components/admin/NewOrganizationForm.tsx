'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewOrganizationForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!name.trim()) {
        throw new Error('組織名は必須です')
      }

      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim() || null }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('ログインが必要です。再度ログインしてください。')
        } else if (res.status === 403) {
          throw new Error('管理者権限が必要です。管理者ユーザーでログインしてください。')
        } else if (res.status === 400) {
          throw new Error(json.error || '入力内容に誤りがあります。')
        } else {
          throw new Error(json.error || `組織の作成に失敗しました (${res.status})`)
        }
      }

      alert('組織を作成しました')
      router.push('/dashboard/admin')
      router.refresh()
    } catch (e: any) {
      console.error('Organization creation error:', e)
      setError(e.message || '組織作成中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">エラーが発生しました</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            組織名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="例: 株式会社サンプル"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            組織コード（任意）
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: SAMPLE"
          />
          <p className="text-xs text-gray-500 mt-1">組織を識別するためのコード（英数字推奨）</p>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium disabled:opacity-50"
          >
            {loading ? '作成中...' : '組織を作成'}
          </button>
        </div>
      </form>
    </>
  )
}

