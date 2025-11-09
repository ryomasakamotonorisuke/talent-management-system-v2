'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'

interface UserListProps {
  initialUsers: User[]
}

export default function UserList({ initialUsers }: UserListProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`本当に「${userName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return
    }

    setDeletingId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      // 削除成功後、リストから削除
      setUsers(users.filter(u => u.id !== userId))
      router.refresh()
    } catch (error: any) {
      alert(error.message || '削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'ADMIN': '管理者',
      'DEPARTMENT': '部署担当者',
      'TRAINEE': '実習生',
      'HR': '人事部',
      'ACCOUNTING': '経理部',
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'ADMIN': 'bg-red-100 text-red-700',
      'DEPARTMENT': 'bg-blue-100 text-blue-700',
      'TRAINEE': 'bg-gray-100 text-gray-700',
      'HR': 'bg-purple-100 text-purple-700',
      'ACCOUNTING': 'bg-green-100 text-green-700',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メールアドレス</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ロール</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部署</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {user.department || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.is_active ? (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    有効
                  </span>
                ) : (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    無効
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  onClick={() => handleDelete(user.id, user.name)}
                  disabled={deletingId === user.id}
                  className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === user.id ? '削除中...' : '削除'}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                ユーザーがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}





