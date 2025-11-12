'use client'

import Button from '@/components/ui/Button'

export default function UsersManagementLink() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ユーザー管理</h3>
          <p className="text-sm text-gray-600 mt-1">
            システムユーザーの作成・編集・削除を行います
          </p>
        </div>
        <Button
          href="/dashboard/users"
          variant="primary"
          size="sm"
        >
          ユーザー管理画面へ
        </Button>
      </div>
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>ユーザー管理画面</strong>では、以下の操作が可能です：
        </p>
        <ul className="text-sm mt-2 list-disc list-inside space-y-1">
          <li>新規ユーザーの作成</li>
          <li>既存ユーザーの編集</li>
          <li>ユーザーの削除</li>
          <li>ユーザーと実習生データの紐付け（実習生ロールの場合）</li>
        </ul>
      </div>
    </div>
  )
}

