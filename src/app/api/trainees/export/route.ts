import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // 実習生データを取得
    const { data: trainees, error } = await supabase
      .from('trainees')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // CSVヘッダー
    const headers = [
      '実習生ID',
      '姓',
      '名',
      '姓（カナ）',
      '名（カナ）',
      '国籍',
      'パスポート番号',
      'ビザ種類',
      'ビザ有効期限',
      '入国日',
      '出国予定日',
      '部署',
      '役職',
      '電話番号',
      'メールアドレス',
      '住所',
      '緊急連絡先',
      '緊急連絡先電話',
      '登録日',
      '更新日',
    ]

    // CSVデータ行を作成
    const csvRows = [
      headers.join(','),
      ...(trainees || []).map(trainee => [
        trainee.trainee_id,
        `"${trainee.last_name}"`,
        `"${trainee.first_name}"`,
        trainee.last_name_kana || '',
        trainee.first_name_kana || '',
        `"${trainee.nationality}"`,
        trainee.passport_number,
        `"${trainee.visa_type}"`,
        trainee.visa_expiry_date || '',
        trainee.entry_date || '',
        trainee.departure_date || '',
        `"${trainee.department}"`,
        trainee.position || '',
        trainee.phone_number || '',
        trainee.email || '',
        trainee.address ? `"${trainee.address}"` : '',
        trainee.emergency_contact || '',
        trainee.emergency_phone || '',
        new Date(trainee.created_at).toLocaleDateString('ja-JP'),
        new Date(trainee.updated_at).toLocaleDateString('ja-JP'),
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="trainees_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


