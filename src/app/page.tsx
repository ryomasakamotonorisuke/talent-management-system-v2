import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary-50 via-white to-primary-50 particle-bg">
      <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in-up">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl shadow-2xl mb-6 animate-float">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold gradient-text animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            海外技能実習生
            <br />
            タレントマネジメントシステム
          </h1>
          <p className="text-xl text-primary-600 mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            実習生の情報、資格、スキルを一元管理
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link
            href="/login"
            className="px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-medium text-lg"
          >
            ログイン
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-primary-200 shadow-md">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-primary-900 mb-2">実習生管理</h3>
            <p className="text-sm text-primary-600">実習生情報の一括管理</p>
          </div>
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-primary-200 shadow-md">
            <div className="text-3xl mb-3">📜</div>
            <h3 className="font-semibold text-primary-900 mb-2">資格管理</h3>
            <p className="text-sm text-primary-600">証明書・資格の一元管理</p>
          </div>
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-primary-200 shadow-md">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="font-semibold text-primary-900 mb-2">スキル評価</h3>
            <p className="text-sm text-primary-600">スキル・進捗の可視化</p>
          </div>
        </div>

        <p className="text-sm text-primary-500 mt-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          システムにアクセスするにはログインしてください
        </p>
      </div>
    </main>
  )
}
