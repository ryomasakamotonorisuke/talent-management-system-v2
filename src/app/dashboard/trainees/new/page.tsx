'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function NewTraineePage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // 画面では非表示、送信時に付与
    // organization_id: ''
    trainee_id: '',
    first_name: '',
    last_name: '',
    first_name_kana: '',
    last_name_kana: '',
    nationality: '',
    passport_number: '',
    visa_type: '',
    visa_expiry_date: '',
    entry_date: '',
    department: '',
    position: '',
    phone_number: '',
    email: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
  })

  // 組織機能は無効化（登録に組織は不要）

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 必須バリデーション
      const requiredFields = [
        ['trainee_id', '実習生ID'],
        ['first_name', '名'],
        ['last_name', '姓'],
        ['nationality', '国籍'],
        ['passport_number', 'パスポート番号'],
        ['visa_type', 'ビザ種類'],
        ['visa_expiry_date', 'ビザ有効期限'],
        ['entry_date', '入国日'],
        ['department', '部署'],
      ] as const
      for (const [key, label] of requiredFields) {
        // @ts-ignore
        if (!formData[key] || String(formData[key]).trim() === '') {
          throw new Error(`${label}は必須です`)
        }
      }

      // 既存チェック（trainee_idの重複防止）
      const { data: existsCheck } = await supabase
        .from('trainees')
        .select('id')
        .eq('trainee_id', formData.trainee_id)
        .maybeSingle()

      if (existsCheck?.id) {
        throw new Error('この実習生IDは既に登録されています')
      }

      const { error: insertError, data: inserted } = await supabase
        .from('trainees')
        .insert([formData])
        .select('id')
        .single()

      if (insertError) throw insertError

      const traineeId = inserted?.id

      // 写真アップロード
      if (photoFile && traineeId) {
        const ext = photoFile.name.split('.').pop()
        const path = `trainees/${formData.trainee_id}/photo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('trainee-media')
          .upload(path, photoFile, { upsert: true })
        if (uploadError) throw uploadError
        await supabase.from('trainees').update({ photo: path }).eq('id', traineeId)
      }

      router.push('/dashboard/trainees')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/trainees" className="text-blue-600 hover:text-blue-800">
                ← 実習生一覧
              </Link>
              <h1 className="text-xl font-semibold">実習生新規登録</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    実習生ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="trainee_id"
                    required
                    value={formData.trainee_id}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    部署 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    姓 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    国籍 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    required
                    value={formData.nationality}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パスポート番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="passport_number"
                    required
                    value={formData.passport_number}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ビザ種類 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="visa_type"
                    required
                    value={formData.visa_type}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ビザ有効期限 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="visa_expiry_date"
                    required
                    value={formData.visa_expiry_date}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    入国日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="entry_date"
                    required
                    value={formData.entry_date}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">写真（任意）</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      setPhotoFile(f)
                      if (f) {
                        const url = URL.createObjectURL(f)
                        setPhotoPreview(url)
                      } else {
                        setPhotoPreview(null)
                      }
                    }}
                    className="mt-1 block w-full"
                  />
                  {photoPreview && (
                    <div className="mt-3">
                      <img src={photoPreview} alt="プレビュー" className="h-32 w-32 object-cover rounded-md border" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard/trainees"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '登録中...' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}



