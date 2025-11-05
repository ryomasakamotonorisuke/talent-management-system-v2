'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface CertificatePreviewProps {
  certificate: {
    id: string
    name: string
    file_path: string
  }
}

export default function CertificatePreview({ certificate }: CertificatePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseClient()

  const handleOpen = async () => {
    setIsOpen(true)
    setLoading(true)
    
    try {
      // ファイルの公開URLを取得
      const { data } = supabase.storage
        .from('pdf-media')
        .getPublicUrl(certificate.file_path)
      
      setFileUrl(data.publicUrl)
    } catch (error) {
      console.error('ファイルURLの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFileUrl(null)
  }

  // ファイル拡張子からファイルタイプを判定
  const getFileType = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    if (['pdf'].includes(ext || '')) return 'pdf'
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return 'video'
    return 'unknown'
  }

  const fileType = getFileType(certificate.file_path)

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        プレビュー
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={handleClose}>
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{certificate.name}</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">読み込み中...</span>
                </div>
              ) : fileUrl ? (
                <div className="flex items-center justify-center">
                  {fileType === 'image' ? (
                    <img
                      src={fileUrl}
                      alt={certificate.name}
                      className="max-w-full max-h-[calc(90vh-120px)] object-contain rounded"
                    />
                  ) : fileType === 'pdf' ? (
                    <iframe
                      src={fileUrl}
                      className="w-full h-[calc(90vh-120px)] border border-gray-200 rounded"
                      title={certificate.name}
                    />
                  ) : fileType === 'video' ? (
                    <video
                      src={fileUrl}
                      controls
                      className="max-w-full max-h-[calc(90vh-120px)] rounded"
                    >
                      お使いのブラウザは動画タグをサポートしていません。
                    </video>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">このファイルタイプはプレビューできません</p>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        ダウンロード
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  ファイルを読み込めませんでした
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50">
              <a
                href={fileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={(e) => !fileUrl && e.preventDefault()}
              >
                別ウィンドウで開く
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

