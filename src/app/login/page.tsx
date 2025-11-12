'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error('Login error details:', {
          message: authError.message,
          status: authError.status,
          email: email,
          error: authError
        })
        let errorMessage = 'ログインに失敗しました'
        
        if (authError.message?.includes('Invalid login credentials')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません。\n\n以下の点をご確認ください:\n1. Supabaseダッシュボードでユーザーが作成されているか\n2. 「Auto Confirm User」がONになっているか\n3. メールアドレスとパスワードが正確に入力されているか'
        } else if (authError.message?.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスが確認されていません。Supabaseダッシュボードで「Auto Confirm User」をONにしてください'
        } else if (authError.message?.includes('User not found')) {
          errorMessage = 'ユーザーが見つかりません。Supabaseダッシュボードでユーザーを作成してください'
        } else {
          errorMessage = authError.message || 'ログインに失敗しました'
        }
        
        setError(errorMessage)
        return
      }

      if (data.user) {
        // usersテーブルにユーザーが存在するか確認し、存在しない場合は作成
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingUser) {
          // デフォルト組織を取得
          const { data: defaultOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('code', 'DEFAULT')
            .single()

          let defaultOrgId: string | null = null
          if (defaultOrg?.id) {
            defaultOrgId = defaultOrg.id
          } else {
            // デフォルト組織が存在しない場合は作成
            const { data: newOrg } = await supabase
              .from('organizations')
              .insert([{
                name: 'デフォルト組織',
                code: 'DEFAULT',
                is_active: true
              }])
              .select('id')
              .single()
            defaultOrgId = newOrg?.id || null
          }

          // usersテーブルにユーザーを追加
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: data.user.email || email,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'ユーザー',
              role: 'ADMIN', // デフォルトでADMINロールを設定
              is_active: true,
            }])

          if (insertError && !insertError.message?.includes('duplicate key')) {
            console.error('Failed to create user record:', insertError)
            // エラーをログに記録するが、ログインは続行
          } else if (defaultOrgId) {
            // user_organizationsテーブルに紐付け（エラーは無視）
            await supabase
              .from('user_organizations')
              .insert([{
                user_id: data.user.id,
                organization_id: defaultOrgId,
                role: 'ADMIN',
              }])
          }
        }

        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err.message || 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 particle-bg py-12 px-4">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        {/* ロゴ・タイトルエリア */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-xl mb-6 animate-float">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold gradient-text">
            海外技能実習生管理システム
          </h2>
          <p className="mt-3 text-sm text-primary-600">
            アカウントにログインしてください
          </p>
        </div>

        {/* ログインフォーム */}
        <Card glow className="p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm whitespace-pre-line">{error}</div>
                </div>
              </div>
            )}
            
            <Input
              label="メールアドレス"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Input
              label="パスワード"
              type="password"
              autoComplete="current-password"
              required
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
            >
              ログイン
            </Button>
          </form>
        </Card>

        {/* フッター */}
        <p className="text-center text-xs text-primary-500">
          © 2024 海外技能実習生管理システム. All rights reserved.
        </p>
      </div>
    </div>
  )
}
