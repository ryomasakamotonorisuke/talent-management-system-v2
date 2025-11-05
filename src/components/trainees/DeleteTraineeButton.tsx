'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface DeleteTraineeButtonProps {
  traineeId: string
  traineeName: string
}

export default function DeleteTraineeButton({ traineeId, traineeName }: DeleteTraineeButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`本当に「${traineeName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/trainees/${traineeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      // 削除成功後、実習生一覧にリダイレクト
      router.push('/dashboard/trainees')
      router.refresh()
    } catch (error: any) {
      alert(error.message || '削除に失敗しました')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? '削除中...' : '削除'}
    </button>
  )
}

