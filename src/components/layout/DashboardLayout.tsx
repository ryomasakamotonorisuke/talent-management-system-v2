'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  userEmail?: string
}

export default function DashboardLayout({ children, userEmail }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: '📊' },
    { name: '実習生管理', href: '/dashboard/trainees', icon: '👥' },
    { name: '資格管理', href: '/dashboard/certificates', icon: '📜' },
    { name: 'スキル評価', href: '/dashboard/evaluations', icon: '📈' },
    { name: '通知', href: '/notifications', icon: '🔔' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* モバイル用サイドバーオーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-primary-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ロゴ */}
          <div className="p-6 border-b border-primary-200">
            <h1 className="text-xl font-bold gradient-text">
              タレント管理システム
            </h1>
            <p className="text-xs text-primary-500 mt-1">
              海外技能実習生
            </p>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-primary-700 hover:bg-primary-50 hover:text-primary-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* ユーザー情報 */}
          <div className="p-4 border-t border-primary-200">
            <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                {userEmail?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 truncate">
                  {userEmail || 'ユーザー'}
                </p>
                <p className="text-xs text-primary-500">ログイン中</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="lg:pl-64">
        {/* トップバー */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-primary-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-primary-700 hover:bg-primary-50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="p-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

