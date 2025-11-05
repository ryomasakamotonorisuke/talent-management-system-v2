import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

/**
 * REQ-007: 在留期限通知（1ヶ月前）
 * REQ-008: 在留期限通知（8ヶ月前）
 * 
 * このAPIエンドポイントは、Vercel Cron JobsまたはSupabase Edge Functionsから
 * 定期実行されることを想定しています。
 */
export async function GET(request: Request) {
  try {
    // 認証チェック（APIキーまたは環境変数で保護）
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createSupabaseServerClient()
    const admin = createSupabaseAdmin()

    // 今日の日付
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1ヶ月後の日付（30日後）
    const oneMonthLater = new Date(today)
    oneMonthLater.setDate(today.getDate() + 30)

    // 8ヶ月後の日付（240日後）
    const eightMonthsLater = new Date(today)
    eightMonthsLater.setDate(today.getDate() + 240)

    // 在留期限が1ヶ月以内の実習生を取得
    const { data: trainees1Month, error: error1Month } = await supabase
      .from('trainees')
      .select('*')
      .eq('is_active', true)
      .gte('visa_expiry_date', today.toISOString().split('T')[0])
      .lte('visa_expiry_date', oneMonthLater.toISOString().split('T')[0])

    if (error1Month) {
      console.error('Error fetching trainees for 1 month expiry:', error1Month)
    }

    // 在留期限が8ヶ月以内の実習生を取得（1ヶ月後から8ヶ月後まで）
    const { data: trainees8Months, error: error8Months } = await supabase
      .from('trainees')
      .select('*')
      .eq('is_active', true)
      .gte('visa_expiry_date', oneMonthLater.toISOString().split('T')[0])
      .lte('visa_expiry_date', eightMonthsLater.toISOString().split('T')[0])

    if (error8Months) {
      console.error('Error fetching trainees for 8 months expiry:', error8Months)
    }

    // 通知対象ユーザーを取得（HR、ADMIN、DEPARTMENT）
    const { data: targetUsers, error: usersError } = await admin
      .from('user_organizations')
      .select('user_id, role')
      .in('role', ['HR', 'ADMIN', 'DEPARTMENT'])

    if (usersError) {
      console.error('Error fetching target users:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const userIds = Array.from(new Set(targetUsers?.map(u => u.user_id) || []))

    // 1ヶ月前通知の作成
    const notifications1Month: Array<{
      user_id: string
      type: string
      title: string
      message: string
      priority: string
      is_read: boolean
    }> = []

    if (trainees1Month && trainees1Month.length > 0) {
      for (const trainee of trainees1Month) {
        for (const userId of userIds) {
          // 既に通知済みかチェック（重複防止）
          // 注意: notificationsテーブルにrelated_idカラムがあることを前提
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'VISA_EXPIRY_1MONTH')
            .like('message', `%${trainee.trainee_id}%`)
            .maybeSingle()

          if (!existing) {
            notifications1Month.push({
              user_id: userId,
              type: 'VISA_EXPIRY_1MONTH',
              title: '在留期限が1ヶ月以内です',
              message: `${trainee.last_name} ${trainee.first_name}（${trainee.trainee_id}）の在留期限が${new Date(trainee.visa_expiry_date).toLocaleDateString('ja-JP')}に迫っています。`,
              priority: 'HIGH',
              is_read: false,
            })
          }
        }
      }
    }

    // 8ヶ月前通知の作成
    const notifications8Months: Array<{
      user_id: string
      type: string
      title: string
      message: string
      priority: string
      is_read: boolean
    }> = []

    if (trainees8Months && trainees8Months.length > 0) {
      for (const trainee of trainees8Months) {
        for (const userId of userIds) {
          // 既に通知済みかチェック（重複防止）
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'VISA_EXPIRY_8MONTHS')
            .like('message', `%${trainee.trainee_id}%`)
            .maybeSingle()

          if (!existing) {
            notifications8Months.push({
              user_id: userId,
              type: 'VISA_EXPIRY_8MONTHS',
              title: '在留期限が8ヶ月前（初級試験対象者）',
              message: `${trainee.last_name} ${trainee.first_name}（${trainee.trainee_id}）の在留期限が${new Date(trainee.visa_expiry_date).toLocaleDateString('ja-JP')}です。初級試験の対象者です。`,
              priority: 'MEDIUM',
              is_read: false,
            })
          }
        }
      }
    }

    // 通知を一括挿入
    const allNotifications = [...notifications1Month, ...notifications8Months]

    if (allNotifications.length > 0) {
      const { error: insertError } = await admin
        .from('notifications')
        .insert(allNotifications)

      if (insertError) {
        console.error('Error inserting notifications:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      notificationsCreated: allNotifications.length,
      oneMonthNotifications: notifications1Month.length,
      eightMonthsNotifications: notifications8Months.length,
      trainees1Month: trainees1Month?.length || 0,
      trainees8Months: trainees8Months?.length || 0,
    })
  } catch (error: any) {
    console.error('Error in check-visa-expiry:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

