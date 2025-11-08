import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

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
    // 環境変数の確認（createSupabaseAdmin内で検証されるが、念のため）

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
      logger.error('Auth user creation error', createError)
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
        } catch (syncError) {
          logger.error('Error syncing existing auth user', syncError)
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
        logger.error('Failed to delete auth user', deleteError)
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
      logger.error('Users table insert error', insertUserError)
      // Authユーザーは作成されたが、usersテーブルへの挿入に失敗した場合
      // Authユーザーを削除してクリーンアップ
      try {
        await admin.auth.admin.deleteUser(userId)
      } catch (deleteError) {
        logger.error('Failed to delete auth user after insert error', deleteError)
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
      logger.error('User organizations insert error', linkError)
      // ユーザーは作成されたが、組織との紐付けに失敗した場合
      // これは警告レベルなので、エラーを返さずに続行することも可能
      // ただし、ここではエラーとして返す
      return NextResponse.json({ 
        error: `ユーザーは作成されましたが、組織との紐付けに失敗しました: ${linkError.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ ok: true, user_id: userId })
  } catch (error) {
    logger.error('User creation error', error)
    const errorMessage = error instanceof Error ? error.message : 'ユーザー作成に失敗しました。詳細はサーバーログを確認してください。'
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
}


