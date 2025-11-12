'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewUserFormProps {
  initialOrgs: Array<{ id: string; name: string }>
}

export default function NewUserForm({ initialOrgs }: NewUserFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'DEPARTMENT' | 'TRAINEE'>('DEPARTMENT')
  const [department, setDepartment] = useState('')
  const [organizationId, setOrganizationId] = useState<string>(initialOrgs[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // バリデーション
      if (!email || !password || !role || !organizationId) {
        throw new Error('必須項目を入力してください')
      }
      if (password.length < 8) {
        throw new Error('パスワードは8文字以上にしてください')
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, department, organization_id: organizationId }),
      })
      const json = await res.json()
      
      if (!res.ok) {
        // エラーメッセージを詳細に表示
        if (res.status === 401) {
          throw new Error('ログインが必要です。再度ログインしてください。')
        } else if (res.status === 403) {
          throw new Error('管理者権限が必要です。管理者ユーザーでログインしてください。')
        } else if (res.status === 400) {
          throw new Error(json.error || '入力内容に誤りがあります。')
        } else {
          throw new Error(json.error || `ユーザー作成に失敗しました (${res.status})`)
        }
      }
      
      // 成功メッセージを表示してからリダイレクト
      alert('ユーザーを作成しました')
      router.push('/dashboard/users')
      router.refresh()
    } catch (e: any) {
      console.error('User creation error:', e)
      setError(e.message || 'ユーザー作成中にエラーが発生しました')
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
          <label className="block text-sm font-medium text-gray-700 mb-1">所属組織 <span className="text-red-500">*</span></label>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">選択してください</option>
            {initialOrgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="山田 太郎"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="8文字以上"
            minLength={8}
          />
          <p className="text-xs text-gray-500 mt-1">8文字以上のパスワードを設定してください</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ロール <span className="text-red-500">*</span></label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="ADMIN">管理部署（フルアクセス）</option>
            <option value="DEPARTMENT">勤務部署（閲覧＋評価）</option>
            <option value="TRAINEE">実習生（閲覧のみ）</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">部署（任意）</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="製造部 など"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium disabled:opacity-50"
          >
            {loading ? '作成中...' : 'ユーザーを作成'}
          </button>
        </div>
      </form>
    </>
  )
}





