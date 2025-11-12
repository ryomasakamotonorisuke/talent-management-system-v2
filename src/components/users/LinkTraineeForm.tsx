'use client'

import { useState, useEffect } from 'react'
import { Trainee } from '@/types'

interface LinkTraineeFormProps {
  userId: string
  currentTraineeId: string | null
  onSuccess: () => void
}

export default function LinkTraineeForm({ userId, currentTraineeId, onSuccess }: LinkTraineeFormProps) {
  const [trainees, setTrainees] = useState<Trainee[]>([])
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>(currentTraineeId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        const res = await fetch('/api/trainees')
        if (res.ok) {
          const data = await res.json()
          setTrainees(data.trainees || [])
        }
      } catch (e) {
        console.error('Failed to fetch trainees:', e)
      }
    }
    fetchTrainees()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/users/${userId}/link-trainee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainee_id: selectedTraineeId || null }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || '紐付けに失敗しました')
      }

      onSuccess()
    } catch (e: any) {
      console.error('Link trainee error:', e)
      setError(e.message || '紐付け中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      <div>
        <select
          value={selectedTraineeId}
          onChange={(e) => setSelectedTraineeId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">紐付けなし</option>
          {trainees.map((t) => (
            <option key={t.id} value={t.id}>
              {t.trainee_id} - {t.last_name} {t.first_name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : '紐付けを保存'}
      </button>
    </form>
  )
}

