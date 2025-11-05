import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

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

    // Excelデータの準備
    const excelData = (trainees || []).map(trainee => ({
      '実習生ID': trainee.trainee_id,
      '姓': trainee.last_name,
      '名': trainee.first_name,
      '姓（カナ）': trainee.last_name_kana || '',
      '名（カナ）': trainee.first_name_kana || '',
      '国籍': trainee.nationality,
      'パスポート番号': trainee.passport_number,
      'ビザ種類': trainee.visa_type,
      'ビザ有効期限': trainee.visa_expiry_date || '',
      '入国日': trainee.entry_date || '',
      '出国予定日': trainee.departure_date || '',
      '部署': trainee.department,
      '役職': trainee.position || '',
      '電話番号': trainee.phone_number || '',
      'メールアドレス': trainee.email || '',
      '住所': trainee.address || '',
      '社宅住所': (trainee as any).residence_address || '',
      '緊急連絡先': trainee.emergency_contact || '',
      '緊急連絡先電話': trainee.emergency_phone || '',
      '監理団体': (trainee as any).supervising_organization || '',
      '家賃': (trainee as any).monthly_rent || '',
      '管理会社': (trainee as any).management_company || '',
      '入寮日': (trainee as any).move_in_date || '',
      '期': (trainee as any).batch_period || '',
      '登録日': new Date(trainee.created_at).toLocaleDateString('ja-JP'),
      '更新日': new Date(trainee.updated_at).toLocaleDateString('ja-JP'),
    }))

    // Excelワークブックを作成
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // 列幅の調整
    const colWidths = [
      { wch: 12 }, // 実習生ID
      { wch: 10 }, // 姓
      { wch: 10 }, // 名
      { wch: 12 }, // 姓（カナ）
      { wch: 12 }, // 名（カナ）
      { wch: 10 }, // 国籍
      { wch: 15 }, // パスポート番号
      { wch: 12 }, // ビザ種類
      { wch: 12 }, // ビザ有効期限
      { wch: 12 }, // 入国日
      { wch: 12 }, // 出国予定日
      { wch: 15 }, // 部署
      { wch: 10 }, // 役職
      { wch: 15 }, // 電話番号
      { wch: 20 }, // メールアドレス
      { wch: 30 }, // 住所
      { wch: 30 }, // 社宅住所
      { wch: 15 }, // 緊急連絡先
      { wch: 15 }, // 緊急連絡先電話
      { wch: 15 }, // 監理団体
      { wch: 10 }, // 家賃
      { wch: 15 }, // 管理会社
      { wch: 12 }, // 入寮日
      { wch: 10 }, // 期
      { wch: 12 }, // 登録日
      { wch: 12 }, // 更新日
    ]
    ws['!cols'] = colWidths

    // ワークシートをワークブックに追加
    XLSX.utils.book_append_sheet(wb, ws, '実習生一覧')

    // Excelファイルを生成
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const fileName = `trainees_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

