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
    // 追加項目
    workplace_manager_name: '',
    workplace_name: '',
    area_manager: '',
    technical_instructor: '',
    life_instructor: '',
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // 現在のユーザー情報を取得
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        // ユーザーのロールとtrainee_idを取得
        const { data: currentUser } = await supabase
          .from('users')
          .select('role, trainee_id')
          .eq('id', session.user.id)
          .single()

        // 実習生ユーザーの場合、自分の実習生データのみ編集可能
        if (currentUser?.role === 'TRAINEE' && currentUser?.trainee_id !== traineeId) {
          setError('この実習生データを編集する権限がありません。')
          return
        }
        // 明示的にカラムを指定して取得（スキーマキャッシュの問題を回避）
        const { data, error } = await supabase
          .from('trainees')
          .select(`
            id,
            organization_id,
            trainee_id,
            first_name,
            last_name,
            first_name_kana,
            last_name_kana,
            nationality,
            passport_number,
            visa_type,
            visa_expiry_date,
            entry_date,
            departure_date,
            department,
            position,
            photo,
            phone_number,
            email,
            address,
            emergency_contact,
            emergency_phone,
            supervising_organization,
            monthly_rent,
            management_company,
            electric_provider,
            gas_provider,
            water_provider,
            move_in_date,
            batch_period,
            residence_address,
            residence_card_number,
            date_of_birth,
            workplace_manager_name,
            workplace_name,
            area_manager,
            technical_instructor,
            life_instructor,
            is_active,
            created_at,
            updated_at
          `)
          .eq('id', traineeId)
          .single()
        if (error) {
          console.error('データ取得エラー:', error)
          throw error
        }
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
            // 追加項目
            workplace_manager_name: data.workplace_manager_name || '',
            workplace_name: data.workplace_name || '',
            area_manager: data.area_manager || '',
            technical_instructor: data.technical_instructor || '',
            life_instructor: data.life_instructor || '',
          })
          if (data.photo) {
            const { data: photoData } = supabase.storage
              .from('trainee-media')
              .getPublicUrl(data.photo)
            setPhotoPreview(photoData?.publicUrl || null)
          }
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '読み込みに失敗しました'
        setError(errorMessage)
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
      // 数値フィールドの変換と、空文字列をnullに変換
      const updateData: any = {
        trainee_id: formData.trainee_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        first_name_kana: formData.first_name_kana || null,
        last_name_kana: formData.last_name_kana || null,
        nationality: formData.nationality,
        passport_number: formData.passport_number,
        visa_type: formData.visa_type,
        visa_expiry_date: formData.visa_expiry_date,
        entry_date: formData.entry_date,
        department: formData.department,
        position: formData.position || null,
        phone_number: formData.phone_number || null,
        email: formData.email || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        // 社宅・管理関連情報（空文字列の場合はnullに変換）
        supervising_organization: formData.supervising_organization || null,
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
        management_company: formData.management_company || null,
        electric_provider: formData.electric_provider || null,
        gas_provider: formData.gas_provider || null,
        water_provider: formData.water_provider || null,
        move_in_date: formData.move_in_date || null,
        batch_period: formData.batch_period || null,
        residence_address: formData.residence_address || null,
        residence_card_number: formData.residence_card_number || null,
        date_of_birth: formData.date_of_birth || null,
        // 事業所・指導員関連情報
        workplace_manager_name: formData.workplace_manager_name || null,
        workplace_name: formData.workplace_name || null,
        area_manager: formData.area_manager || null,
        technical_instructor: formData.technical_instructor || null,
        life_instructor: formData.life_instructor || null,
      }
      const { error: updateError } = await supabase
        .from('trainees')
        .update(updateData)
        .eq('id', traineeId)
      if (updateError) {
        // スキーマエラーの場合は、より詳細なエラーメッセージを表示
        if (updateError.message?.includes('batch_period') || updateError.message?.includes('column')) {
          console.error('スキーマエラー:', updateError.message)
          console.error('データベースにカラムが存在しない可能性があります。')
          console.error('docs/fix-batch-period-column.sql を実行してください。')
          throw new Error(`データベースエラー: ${updateError.message}\n\n解決方法: Supabaseダッシュボードで docs/fix-batch-period-column.sql を実行してください。`)
        }
        throw updateError
      }

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
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新に失敗しました'
      setError(errorMessage)
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

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
            {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              </div>
            )}

            {loading ? (
            <div className="bg-white shadow-lg rounded-xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報セクション */}
              <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h2 className="text-xl font-bold text-white">基本情報</h2>
                  </div>
                </div>
                <div className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">実習生ID</label>
                    <input
                      type="text"
                      name="trainee_id"
                      value={formData.trainee_id}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">名</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓（カナ）</label>
                      <input
                        type="text"
                        name="last_name_kana"
                        value={formData.last_name_kana}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">名（カナ）</label>
                      <input
                        type="text"
                        name="first_name_kana"
                        value={formData.first_name_kana}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">国籍</label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">パスポート番号</label>
                    <input
                      type="text"
                      name="passport_number"
                      value={formData.passport_number}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ビザ種類</label>
                    <input
                      type="text"
                      name="visa_type"
                      value={formData.visa_type}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ビザ有効期限</label>
                    <input
                      type="date"
                      name="visa_expiry_date"
                      value={formData.visa_expiry_date}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">入国日</label>
                    <input
                      type="date"
                      name="entry_date"
                      value={formData.entry_date}
                      onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">写真</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        setPhotoFile(f)
                        if (f) setPhotoPreview(URL.createObjectURL(f))
                      }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                        </div>
                    {photoPreview && (
                          <div className="flex-shrink-0">
                            <img src={photoPreview} alt="プレビュー" className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 連絡先情報セクション */}
              <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <h2 className="text-xl font-bold text-white">連絡先情報</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">緊急連絡先（氏名）</label>
                      <input
                        type="text"
                        name="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">緊急連絡先（電話番号）</label>
                      <input
                        type="tel"
                        name="emergency_phone"
                        value={formData.emergency_phone}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                  </div>
                </div>

              {/* 社宅・管理関連情報セクション */}
              <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <h2 className="text-xl font-bold text-white">社宅・管理関連情報</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">管理団体</label>
                      <input
                        type="text"
                        name="supervising_organization"
                        value={formData.supervising_organization}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">家賃（円）</label>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={formData.monthly_rent}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">管理会社</label>
                      <input
                        type="text"
                        name="management_company"
                        value={formData.management_company}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">入寮日（入社日）</label>
                      <input
                        type="date"
                        name="move_in_date"
                        value={formData.move_in_date}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">在留カード番号</label>
                      <input
                        type="text"
                        name="residence_card_number"
                        value={formData.residence_card_number}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">社宅住所</label>
                      <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        name="residence_address"
                        value={formData.residence_address}
                        onChange={handleChange}
                          className="flex-1 border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                        {formData.residence_address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.residence_address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1 whitespace-nowrap shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <span>地図</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電気契約先</label>
                      <input
                        type="text"
                        name="electric_provider"
                        value={formData.electric_provider}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ガス契約先</label>
                      <input
                        type="text"
                        name="gas_provider"
                        value={formData.gas_provider}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">水道契約先</label>
                      <input
                        type="text"
                        name="water_provider"
                        value={formData.water_provider}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">期</label>
                      <input
                        type="text"
                        name="batch_period"
                        value={formData.batch_period}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 事業所・指導員関連情報セクション */}
              <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-xl font-bold text-white">事業所・指導員関連情報</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">事業所責任者名</label>
                      <input
                        type="text"
                        name="workplace_manager_name"
                        value={formData.workplace_manager_name}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">勤務事業所</label>
                      <input
                        type="text"
                        name="workplace_name"
                        value={formData.workplace_name}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">担当エリアマネージャー</label>
                      <input
                        type="text"
                        name="area_manager"
                        value={formData.area_manager}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">技能実習指導員</label>
                      <input
                        type="text"
                        name="technical_instructor"
                        value={formData.technical_instructor}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">生活指導員</label>
                      <input
                        type="text"
                        name="life_instructor"
                        value={formData.life_instructor}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    </div>
                  </div>
                </div>

              {/* 送信ボタン */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Link
                    href={`/dashboard/trainees/${traineeId}`}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    キャンセル
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>更新中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>更新する</span>
                    </>
                  )}
                  </button>
                </div>
              </form>
            )}
        </div>
      </main>
    </div>
  )
}
