'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Organization } from '@/types'
import Button from '@/components/ui/Button'

interface OrganizationsListProps {
  initialOrganizations: Organization[]
}

export default function OrganizationsList({ initialOrganizations }: OrganizationsListProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`組織「${name}」を削除してもよろしいですか？\n\n注意: この組織に紐づく実習生やユーザーも影響を受けます。`)) {
      return
    }

    setLoading(id)
    setError(null)

    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || '組織の削除に失敗しました')
      }

      // リストから削除
      setOrganizations(orgs => orgs.filter(org => org.id !== id))
      router.refresh()
    } catch (e: any) {
      console.error('Organization delete error:', e)
      setError(e.message || '組織の削除中にエラーが発生しました')
    } finally {
      setLoading(null)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(id)
    setError(null)

    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || '組織の更新に失敗しました')
      }

      // リストを更新
      setOrganizations(orgs =>
        orgs.map(org =>
          org.id === id ? { ...org, is_active: !currentStatus } : org
        )
      )
      router.refresh()
    } catch (e: any) {
      console.error('Organization update error:', e)
      setError(e.message || '組織の更新中にエラーが発生しました')
    } finally {
      setLoading(null)
    }
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">組織が登録されていません</p>
        <Button
          href="/dashboard/admin/organizations/new"
          variant="primary"
          size="sm"
        >
          最初の組織を作成
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">エラーが発生しました</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                組織名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                コード
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {organizations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{org.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{org.code || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      org.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {org.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(org.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    href={`/dashboard/admin/organizations/${org.id}/edit`}
                    variant="ghost"
                    size="sm"
                  >
                    編集
                  </Button>
                  <button
                    onClick={() => handleToggleActive(org.id, org.is_active)}
                    disabled={loading === org.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    {loading === org.id ? '処理中...' : org.is_active ? '無効化' : '有効化'}
                  </button>
                  <button
                    onClick={() => handleDelete(org.id, org.name)}
                    disabled={loading === org.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {loading === org.id ? '削除中...' : '削除'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

