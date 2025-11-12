'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createSupabaseClient } from '@/lib/supabase/client'

function CertificateUploadForm() {
  const router = useRouter()
  const params = useSearchParams()
  const traineeIdParam = params.get('traineeId') || ''
  const supabase = createSupabaseClient()

  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [trainees, setTrainees] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])
  const [traineeId, setTraineeId] = useState<string>(traineeIdParam)
  const [name, setName] = useState('')
  const [issuingBody, setIssuingBody] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [documentType, setDocumentType] = useState<'CERTIFICATE' | 'EMPLOYMENT_CONDITIONS' | 'MINOR_CHANGE' | 'TRAINING_PLAN_CERT'>('CERTIFICATE')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }

      // 実習生一覧を取得
      const { data } = await supabase
        .from('trainees')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name')
      setTrainees(data || [])
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!traineeId) throw new Error('実習生を選択してください')
      if (!file) throw new Error('ファイルを選択してください')

      const ext = file.name.split('.').pop()
      const path = `certificates/${traineeId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('pdf-media')
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('certificates').insert({
        trainee_id: traineeId,
        name,
        issuing_body: issuingBody || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        file_path: path,
        document_type: documentType,
        is_active: true,
      })
      if (insertError) throw insertError

      router.push('/dashboard/certificates')
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'アップロードに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userEmail={userEmail}>
      <div className="space-y-6 animate-fade-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <Button href="/dashboard/certificates" variant="ghost" size="sm">
              ← 資格管理に戻る
            </Button>
            <h1 className="text-4xl font-bold gradient-text mt-2">証明書アップロード</h1>
            <p className="text-primary-600 mt-2">証明書・資格ファイルをアップロードします</p>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-700 font-medium">{error}</p>
          </Card>
        )}

        {/* フォーム */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対象実習生 <span className="text-red-500">*</span>
              </label>
              <select
                value={traineeId}
                onChange={(e) => setTraineeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              >
                <option value="">選択してください</option>
                {trainees.map(t => (
                  <option key={t.id} value={t.id}>{t.last_name} {t.first_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">書類タイプ（REQ-009）</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as typeof documentType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="CERTIFICATE">資格・証明書</option>
                <option value="EMPLOYMENT_CONDITIONS">雇用条件書</option>
                <option value="MINOR_CHANGE">軽微変更届出書</option>
                <option value="TRAINING_PLAN_CERT">技能実習計画認定通知書</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                資格名・書類名 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">発行元</label>
                <Input
                  type="text"
                  value={issuingBody}
                  onChange={(e) => setIssuingBody(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">発行日</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">有効期限</label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ファイル <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setFile(f)
                  setPreviewUrl(f ? URL.createObjectURL(f) : null)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
              {previewUrl && (
                <div className="mt-3">
                  {file?.type?.startsWith('image/') ? (
                    <img src={previewUrl} alt="プレビュー" className="h-32 w-32 object-cover rounded-md border" />
                  ) : file?.type?.startsWith('video/') ? (
                    <video src={previewUrl} className="h-40 rounded-md border" controls />
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>
                      <span className="text-sm">PDFを選択中</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                isLoading={loading}
              >
                {loading ? 'アップロード中...' : 'アップロード'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={loading}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function CertificateUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <CertificateUploadForm />
    </Suspense>
  )
}


