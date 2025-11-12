'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl border border-gray-300 shadow-md p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ エラーが発生しました</h1>
        <p className="text-gray-700 mb-4">
          {error.message || '予期しないエラーが発生しました。'}
        </p>
        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-600 mb-2">エラー詳細（開発環境のみ）</summary>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold shadow-md"
          >
            再試行
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

