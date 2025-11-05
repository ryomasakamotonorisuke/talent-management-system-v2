'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function EditTraineePage() {
  const params = useParams<{ id: string }>()
  const traineeId = params?.id
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
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
    // 社宅・管理関連情報（REQ-005）
    supervising_organization: '',
    monthly_rent: '',
    management_company: '',
    electric_provider: '',
    gas_provider: '',
    water_provider: '',
    move_in_date: '',
    batch_period: '',
    residence_address: '',
    residence_card_number: '',
    date_of_birth: '',
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('trainees')
          .select('*')
          .eq('id', traineeId)
          .single()
        if (error) throw error
        if (data) {
          setFormData({
            trainee_id: data.trainee_id || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            first_name_kana: data.first_name_kana || '',
            last_name_kana: data.last_name_kana || '',
            nationality: data.nationality || '',
            passport_number: data.passport_number || '',
            visa_type: data.visa_type || '',
            visa_expiry_date: data.visa_expiry_date || '',
            entry_date: data.entry_date || '',
            department: data.department || '',
            position: data.position || '',
            phone_number: data.phone_number || '',
            email: data.email || '',
            address: data.address || '',
            emergency_contact: data.emergency_contact || '',
            emergency_phone: data.emergency_phone || '',
            // 社宅・管理関連情報（REQ-005）
            supervising_organization: data.supervising_organization || '',
            monthly_rent: data.monthly_rent?.toString() || '',
            management_company: data.management_company || '',
            electric_provider: data.electric_provider || '',
            gas_provider: data.gas_provider || '',
            water_provider: data.water_provider || '',
            move_in_date: data.move_in_date || '',
            batch_period: data.batch_period || '',
            residence_address: data.residence_address || '',
            residence_card_number: data.residence_card_number || '',
            date_of_birth: data.date_of_birth || '',
          })
          if (data.photo) setPhotoPreview(data.photo)
        }
      } catch (e: any) {
        setError(e.message || '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    if (traineeId) load()
  }, [supabase, traineeId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // 数値フィールドの変換
      const updateData = {
        ...formData,
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
      }
      const { error: updateError } = await supabase
        .from('trainees')
        .update(updateData)
        .eq('id', traineeId)
      if (updateError) throw updateError

      // 写真更新
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `trainees/${formData.trainee_id}/photo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('trainee-media')
          .upload(path, photoFile, { upsert: true })
        if (uploadError) throw uploadError
        await supabase.from('trainees').update({ photo: path }).eq('id', traineeId)
      }

      router.push(`/dashboard/trainees/${traineeId}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message || '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/dashboard/trainees/${traineeId}`} className="text-blue-600 hover:text-blue-800">
                ← 実習生詳細
              </Link>
              <h1 className="text-xl font-semibold">実習生編集</h1>
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

            {loading ? (
              <p className="text-gray-600">読み込み中...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">実習生ID</label>
                    <input
                      type="text"
                      name="trainee_id"
                      value={formData.trainee_id}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">部署</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">姓</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">名</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">国籍</label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">パスポート番号</label>
                    <input
                      type="text"
                      name="passport_number"
                      value={formData.passport_number}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ビザ種類</label>
                    <input
                      type="text"
                      name="visa_type"
                      value={formData.visa_type}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ビザ有効期限</label>
                    <input
                      type="date"
                      name="visa_expiry_date"
                      value={formData.visa_expiry_date}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">入国日</label>
                    <input
                      type="date"
                      name="entry_date"
                      value={formData.entry_date}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">写真</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        setPhotoFile(f)
                        if (f) setPhotoPreview(URL.createObjectURL(f))
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

                {/* 社宅・管理関連情報セクション（REQ-005） */}
                <div className="border-t pt-6 mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">社宅・管理関連情報</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">監理団体</label>
                      <input
                        type="text"
                        name="supervising_organization"
                        value={formData.supervising_organization}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">家賃（円）</label>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={formData.monthly_rent}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">管理会社</label>
                      <input
                        type="text"
                        name="management_company"
                        value={formData.management_company}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">入寮日</label>
                      <input
                        type="date"
                        name="move_in_date"
                        value={formData.move_in_date}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">期</label>
                      <input
                        type="text"
                        name="batch_period"
                        value={formData.batch_period}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">社宅住所</label>
                      <input
                        type="text"
                        name="residence_address"
                        value={formData.residence_address}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">電気契約先</label>
                      <input
                        type="text"
                        name="electric_provider"
                        value={formData.electric_provider}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ガス契約先</label>
                      <input
                        type="text"
                        name="gas_provider"
                        value={formData.gas_provider}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">水道契約先</label>
                      <input
                        type="text"
                        name="water_provider"
                        value={formData.water_provider}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">在留カード番号</label>
                      <input
                        type="text"
                        name="residence_card_number"
                        value={formData.residence_card_number}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">生年月日</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Link
                    href={`/dashboard/trainees/${traineeId}`}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    キャンセル
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? '更新中...' : '更新する'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


