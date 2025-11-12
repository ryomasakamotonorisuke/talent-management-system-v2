'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function TraineeImportPage() {
  const supabase = createSupabaseClient()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const parseCsv = async (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean)
    const header = lines.shift()?.split(',')?.map(h => h.trim()) || []
    const rows = lines.map(line => {
      const cols = line.split(',')
      const obj: any = {}
      header.forEach((h, i) => {
        obj[h] = (cols[i] || '').replace(/^"|"$/g, '')
      })
      return obj
    })
    return rows
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setMessage(null)
    try {
      // デフォルト組織を取得（存在しない場合は作成）
      let defaultOrgId: string | null = null
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('code', 'DEFAULT')
        .single()

      if (defaultOrg?.id) {
        defaultOrgId = defaultOrg.id
      } else {
        // デフォルト組織が存在しない場合は作成
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert([{
            name: 'デフォルト組織',
            code: 'DEFAULT',
            is_active: true
          }])
          .select('id')
          .single()

        if (orgError || !newOrg?.id) {
          throw new Error('組織の作成に失敗しました。管理者に連絡してください。')
        }
        defaultOrgId = newOrg.id
      }

      const text = await file.text()
      const rows = await parseCsv(text)
      // 最低限の項目名想定: trainee_id,last_name,first_name,nationality,passport_number,visa_type,visa_expiry_date,entry_date,department
      const payload = rows.map((r: any) => ({
        organization_id: defaultOrgId,
        trainee_id: r.trainee_id,
        last_name: r.last_name,
        first_name: r.first_name,
        nationality: r.nationality,
        passport_number: r.passport_number,
        visa_type: r.visa_type,
        visa_expiry_date: r.visa_expiry_date,
        entry_date: r.entry_date,
        department: r.department,
        is_active: true,
      }))
      // まとめて挿入
      const { error } = await supabase.from('trainees').insert(payload)
      if (error) throw error
      setMessage(`インポートに成功しました（${payload.length}件）`)
    } catch (e: any) {
      setMessage(`インポート失敗: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">実習生CSVインポート</h1>
          <Link href="/dashboard/trainees" className="text-blue-600 hover:text-blue-800 text-sm">一覧へ戻る</Link>
        </div>
        {message && (
          <div className="mb-4 bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg">{message}</div>
        )}
        <div className="space-y-4">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={handleImport} disabled={loading || !file} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
            {loading ? 'インポート中...' : 'インポート'}
          </button>
          <div className="text-xs text-gray-500">
            期待するヘッダー: trainee_id,last_name,first_name,nationality,passport_number,visa_type,visa_expiry_date,entry_date,department
          </div>
        </div>
      </div>
    </div>
  )
}


