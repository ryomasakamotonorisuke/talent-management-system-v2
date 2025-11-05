import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ロールチェック（ユーザーがADMINであること）
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!me || me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, name, role, department, organization_id } = body

  if (!email || !password || !role || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // 環境変数の確認
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ 
        error: 'サーバー設定エラー: SUPABASE_SERVICE_ROLE_KEYが設定されていません。環境変数を確認してください。' 
      }, { status: 500 })
    }

    // 既存ユーザーのチェック（メールアドレスで）
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: `このメールアドレス（${email}）は既に登録されています。別のメールアドレスを使用してください。` 
      }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    
    // Authユーザー作成（メール確認済みで作成）
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    
    if (createError) {
      console.error('Auth user creation error:', createError)
      // 既に存在するユーザーの場合
      if (createError.message?.includes('already registered') || 
          createError.message?.includes('already exists') ||
          createError.message?.includes('User already registered')) {
        // Authには存在するが、usersテーブルには存在しない場合
        // メールアドレスからAuthユーザーを取得して、usersテーブルに追加を試みる
        try {
          const { data: authUsers } = await admin.auth.admin.listUsers()
          const existingAuthUser = authUsers.users.find(u => u.email === email)
          
          if (existingAuthUser) {
            // 既存のAuthユーザーを使用してusersテーブルに追加
            const userId = existingAuthUser.id
            
            // usersテーブルに既に存在するか再チェック
            const { data: checkUser } = await supabase
              .from('users')
              .select('id')
              .eq('id', userId)
              .single()
            
            if (checkUser) {
              return NextResponse.json({ 
                error: 'このユーザーは既にシステムに登録されています。' 
              }, { status: 400 })
            }

            // usersテーブルに追加
            const { error: insertUserError } = await supabase.from('users').insert({
              id: userId,
              email,
              name: name || email,
              role,
              department: department || null,
              is_active: true,
            })
            
            if (insertUserError) {
              if (insertUserError.code === '23505') {
                return NextResponse.json({ 
                  error: 'このユーザーは既に存在します。' 
                }, { status: 400 })
              }
              throw insertUserError
            }

            // 所属組織を紐付け
            const { error: linkError } = await supabase.from('user_organizations').insert({
              user_id: userId,
              organization_id,
              role,
            })
            
            if (linkError) {
              console.error('User organizations insert error:', linkError)
              return NextResponse.json({ 
                error: `ユーザーは作成されましたが、組織との紐付けに失敗しました: ${linkError.message}` 
              }, { status: 500 })
            }

            return NextResponse.json({ ok: true, user_id: userId, message: '既存のAuthユーザーを使用してユーザーを作成しました。' })
          }
        } catch (syncError: any) {
          console.error('Error syncing existing auth user:', syncError)
        }
        
        return NextResponse.json({ 
          error: 'このメールアドレスは既にAuthに登録されています。' 
        }, { status: 400 })
      }
      throw createError
    }
    
    const userId = created.user?.id
    if (!userId) {
      throw new Error('ユーザーIDの取得に失敗しました')
    }

    // usersテーブルに既に存在するか再チェック（念のため）
    const { data: checkExisting } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkExisting) {
      // Authユーザーは作成されたが、usersテーブルに既に存在する場合
      // Authユーザーを削除
      try {
        await admin.auth.admin.deleteUser(userId)
      } catch (deleteError) {
        console.error('Failed to delete auth user:', deleteError)
      }
      return NextResponse.json({ 
        error: 'このユーザーは既に存在します。' 
      }, { status: 400 })
    }

    // usersテーブルに反映
    const { error: insertUserError } = await supabase.from('users').insert({
      id: userId,
      email,
      name: name || email,
      role,
      department: department || null,
      is_active: true,
    })
    
    if (insertUserError) {
      console.error('Users table insert error:', insertUserError)
      // Authユーザーは作成されたが、usersテーブルへの挿入に失敗した場合
      // Authユーザーを削除してクリーンアップ
      try {
        await admin.auth.admin.deleteUser(userId)
      } catch (deleteError) {
        console.error('Failed to delete auth user after insert error:', deleteError)
      }
      
      if (insertUserError.code === '23505') {
        return NextResponse.json({ 
          error: 'このユーザーは既に存在します。別のメールアドレスを使用してください。' 
        }, { status: 400 })
      }
      throw insertUserError
    }

    // 所属組織を紐付け
    const { error: linkError } = await supabase.from('user_organizations').insert({
      user_id: userId,
      organization_id,
      role,
    })
    
    if (linkError) {
      console.error('User organizations insert error:', linkError)
      // ユーザーは作成されたが、組織との紐付けに失敗した場合
      // これは警告レベルなので、エラーを返さずに続行することも可能
      // ただし、ここではエラーとして返す
      return NextResponse.json({ 
        error: `ユーザーは作成されましたが、組織との紐付けに失敗しました: ${linkError.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ ok: true, user_id: userId })
  } catch (e: any) {
    console.error('User creation error:', e)
    return NextResponse.json({ 
      error: e.message || 'ユーザー作成に失敗しました。詳細はサーバーログを確認してください。' 
    }, { status: 500 })
  }
}


