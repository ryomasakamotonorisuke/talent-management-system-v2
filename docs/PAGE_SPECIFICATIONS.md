# ページ仕様書 - 各ページの動作と実装技術

このドキュメントでは、アプリケーション内の各ページに実装されている動作と、使用している技術・実装方法を詳細に記載します。

---

## 目次

1. [認証・ミドルウェア](#認証ミドルウェア)
2. [ルートページ](#ルートページ)
3. [ログインページ](#ログインページ)
4. [ダッシュボードページ](#ダッシュボードページ)
5. [実習生管理ページ](#実習生管理ページ)
6. [実習生詳細ページ](#実習生詳細ページ)
7. [実習生編集ページ](#実習生編集ページ)
8. [実習生新規登録ページ](#実習生新規登録ページ)
9. [実習生CSVインポートページ](#実習生csvインポートページ)
10. [資格管理ページ](#資格管理ページ)
11. [証明書アップロードページ](#証明書アップロードページ)
12. [スキル評価ページ](#スキル評価ページ)
13. [ユーザー登録ページ](#ユーザー登録ページ)
14. [通知ページ](#通知ページ)
15. [APIルート](#apiルート)
16. [共通コンポーネント](#共通コンポーネント)

---

## 認証・ミドルウェア

### `src/middleware.ts`

**動作:**
- 全ページへのアクセスをインターセプトして認証状態をチェック
- 未認証ユーザーはログインページにリダイレクト（`/login`と`/`を除く）
- ログイン済みユーザーが`/login`にアクセスした場合は`/dashboard`にリダイレクト

**使用技術:**
- **Next.js Middleware**: Next.js 14のEdge Runtimeで実行されるミドルウェア
- **Supabase SSR Client** (`@supabase/ssr`): サーバーサイドでのセッション管理
- **Cookie管理**: HTTPクッキーを通じた認証状態の保持
- **リダイレクト**: `NextResponse.redirect()`によるページ遷移制御

**実装詳細:**
```12:60:src/middleware.ts
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // ログインページ以外で認証が必要
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    if (req.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // ログイン済みユーザーがログインページにアクセス
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
```

---

## ルートページ

### `src/app/page.tsx`

**動作:**
- アプリケーションのエントリーポイント
- ログインボタンとシステム説明を表示
- スタイリッシュなランディングページとして機能

**使用技術:**
- **Server Component**: サーバーサイドでレンダリング
- **Next.js Link**: クライアントサイドナビゲーション
- **Tailwind CSS**: レスポンシブデザインとグラデーション

**実装詳細:**
```4:24:src/app/page.tsx
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          海外技能実習生タレントマネジメントシステム
        </h1>
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログイン
          </Link>
          <p className="text-gray-600 mt-4">
            システムにアクセスするにはログインしてください
          </p>
        </div>
      </div>
    </main>
  )
```

---

## ログインページ

### `src/app/login/page.tsx`

**動作:**
1. メールアドレスとパスワードを入力
2. Supabase Authによる認証処理
3. 成功時: ダッシュボードへリダイレクト
4. 失敗時: エラーメッセージを日本語で表示（詳細な原因も表示）

**使用技術:**
- **Client Component** (`'use client'`): インタラクティブなフォーム処理
- **React Hooks**:
  - `useState`: フォーム状態とローディング状態の管理
  - `useRouter`: ページ遷移制御
- **Supabase Auth**: `signInWithPassword()`による認証
- **エラーハンドリング**: 日本語化されたエラーメッセージ表示
- **Tailwind CSS**: モダンなUIデザイン（グラデーション、アイコン、アニメーション）

**実装詳細:**
```15:60:src/app/login/page.tsx
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
        // エラーメッセージを日本語化
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
```

**特徴:**
- フォーム送信時のローディング表示（スピナーアニメーション）
- エラーメッセージの詳細な日本語化
- アイコンを使用した視覚的なUI
- レスポンシブデザイン

---

## ダッシュボードページ

### `src/app/dashboard/page.tsx`

**動作:**
1. サーバーサイドで実習生データと証明書データを取得
2. 統計情報を計算・表示
3. クイックアクセスリンクを提供
4. ナビゲーションバーを表示

**使用技術:**
- **Server Component**: サーバーサイドでのデータフェッチ
- **Supabase Server Client**: サーバーサイドでのデータベースアクセス
- **認証チェック**: セッション確認とリダイレクト
- **DashboardStats Component**: 統計情報表示用の再利用可能コンポーネント

**実装詳細:**
```7:97:src/app/dashboard/page.tsx
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // NOTE: usersテーブル参照はRLS整備まで一時停止
  const userDisplayName = session.user.email
  const userRoleLabel = 'ログイン中'

  // 実習生データを取得
  const { data: trainees = [] } = await supabase
    .from('trainees')
    .select('*')
    .order('created_at', { ascending: false })

  // 資格証明書データを取得
  const { data: certificates = [] } = await supabase
    .from('certificates')
    .select('*')
    .eq('is_active', true)
```

**表示内容:**
- 実習生総数・アクティブ数
- 期限切れ資格数
- 期限間近資格数（30日以内）
- 有効資格数
- 国籍別分布グラフ
- 部署別人数表
- 資格更新アラート

---

## 実習生管理ページ

### `src/app/dashboard/trainees/page.tsx`

**動作:**
1. サーバーサイドで実習生一覧を取得（`is_active = true`のみ）
2. TraineeListコンポーネントにデータを渡して表示
3. CSVインポート・新規登録ボタンを表示

**使用技術:**
- **Server Component**: サーバーサイドでのデータフェッチ
- **TraineeList Component**: クライアントサイドのリスト表示コンポーネント
- **Supabase Query**: フィルタリングとソート

**実装詳細:**
```17:22:src/app/dashboard/trainees/page.tsx
  // 実習生一覧を取得
  const { data: trainees = [], error } = await supabase
    .from('trainees')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
```

**TraineeListコンポーネントの動作:**
- **検索・フィルタ機能**: TraineeSearchコンポーネントによる名前・ID・国籍・部署でのフィルタリング
- **CSV出力**: `/api/trainees/export`エンドポイントを呼び出してCSVダウンロード
- **クリック可能なリスト**: 各実習生をクリックで詳細ページへ遷移

**CSV出力処理:**
```15:35:src/components/TraineeList.tsx
  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/trainees/export')
      if (!response.ok) {
        throw new Error('CSV出力に失敗しました')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trainees_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('CSV出力中にエラーが発生しました')
      console.error(error)
    }
  }
```

---

## 実習生詳細ページ

### `src/app/dashboard/trainees/[id]/page.tsx`

**動作:**
1. URLパラメータから実習生IDを取得
2. サーバーサイドで該当実習生の詳細データを取得
3. プロフィール情報を詳細表示
4. 顔写真の公開URLを生成して表示（Supabase Storage）

**使用技術:**
- **Dynamic Route**: Next.jsの`[id]`による動的ルーティング
- **Server Component**: サーバーサイドでのデータ取得
- **Supabase Storage**: 画像ファイルの公開URL生成
- **notFound()**: データが見つからない場合の404ページ表示

**実装詳細:**
```6:37:src/app/dashboard/trainees/[id]/page.tsx
export default async function TraineeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: trainee, error } = await supabase
    .from('trainees')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !trainee) {
    notFound()
  }

  // 顔写真の公開URL（Publicバケット想定）
  let photoUrl: string | null = null
  if (trainee?.photo) {
    const { data } = supabase.storage
      .from('trainee-media')
      .getPublicUrl(trainee.photo)
    photoUrl = data?.publicUrl || null
  }
```

**表示内容:**
- プロフィールヘッダー（顔写真・名前・基本情報）
- 実習生ID、氏名、国籍、部署
- パスポート番号、ビザ種類・有効期限
- 入国日、メールアドレス
- 編集ボタン（編集ページへのリンク）

---

## 実習生編集ページ

### `src/app/dashboard/trainees/[id]/edit/page.tsx`

**動作:**
1. ページ読み込み時に既存の実習生データを取得
2. フォームにデータを反映
3. フォーム送信時にデータを更新
4. 写真ファイルを選択した場合、Supabase Storageにアップロード
5. 更新成功後、詳細ページにリダイレクト

**使用技術:**
- **Client Component**: インタラクティブなフォーム処理
- **React Hooks**:
  - `useState`: フォーム状態、ローディング状態、エラー状態の管理
  - `useEffect`: 初期データの読み込み
  - `useParams`: URLパラメータの取得
  - `useRouter`: ページ遷移制御
- **Supabase Client**: クライアントサイドでのデータ更新
- **Supabase Storage**: ファイルアップロード機能
- **File API**: 画像プレビュー表示（`URL.createObjectURL()`）

**実装詳細:**
```40:117:src/app/dashboard/trainees/[id]/edit/page.tsx
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('trainees')
          .select('*')
          .eq('id', traineeId)
          .single()
        if (error) throw error
        if (data) {
          setFormData({
            trainee_id: data.trainee_id || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            first_name_kana: data.first_name_kana || '',
            last_name_kana: data.last_name_kana || '',
            nationality: data.nationality || '',
            passport_number: data.passport_number || '',
            visa_type: data.visa_type || '',
            visa_expiry_date: data.visa_expiry_date || '',
            entry_date: data.entry_date || '',
            department: data.department || '',
            position: data.position || '',
            phone_number: data.phone_number || '',
            email: data.email || '',
            address: data.address || '',
            emergency_contact: data.emergency_contact || '',
            emergency_phone: data.emergency_phone || '',
          })
          if (data.photo) setPhotoPreview(data.photo)
        }
      } catch (e: any) {
        setError(e.message || '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    if (traineeId) load()
  }, [supabase, traineeId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('trainees')
        .update(formData)
        .eq('id', traineeId)
      if (updateError) throw updateError

      // 写真更新
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `trainees/${formData.trainee_id}/photo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('trainee-media')
          .upload(path, photoFile, { upsert: true })
        if (uploadError) throw uploadError
        await supabase.from('trainees').update({ photo: path }).eq('id', traineeId)
      }

      router.push(`/dashboard/trainees/${traineeId}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message || '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }
```

**特徴:**
- リアルタイムフォームバリデーション
- 画像プレビュー機能
- エラーハンドリング
- ローディング状態の表示

---

## 実習生新規登録ページ

### `src/app/dashboard/trainees/new/page.tsx`

**動作:**
1. 空のフォームを表示
2. 必須項目のバリデーション（実習生ID、名前、国籍、パスポート番号、ビザ種類、ビザ有効期限、入国日、部署）
3. 実習生IDの重複チェック
4. データをデータベースに挿入
5. 写真ファイルを選択した場合、Supabase Storageにアップロード
6. 登録成功後、実習生一覧ページにリダイレクト

**使用技術:**
- **Client Component**: フォーム処理
- **React Hooks**: `useState`, `useRouter`
- **Supabase Client**: データ挿入と重複チェック
- **File API**: 画像プレビュー

**実装詳細:**
```40:104:src/app/dashboard/trainees/new/page.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 必須バリデーション
      const requiredFields = [
        ['trainee_id', '実習生ID'],
        ['first_name', '名'],
        ['last_name', '姓'],
        ['nationality', '国籍'],
        ['passport_number', 'パスポート番号'],
        ['visa_type', 'ビザ種類'],
        ['visa_expiry_date', 'ビザ有効期限'],
        ['entry_date', '入国日'],
        ['department', '部署'],
      ] as const
      for (const [key, label] of requiredFields) {
        // @ts-ignore
        if (!formData[key] || String(formData[key]).trim() === '') {
          throw new Error(`${label}は必須です`)
        }
      }

      // 既存チェック（trainee_idの重複防止）
      const { data: existsCheck } = await supabase
        .from('trainees')
        .select('id')
        .eq('trainee_id', formData.trainee_id)
        .maybeSingle()

      if (existsCheck?.id) {
        throw new Error('この実習生IDは既に登録されています')
      }

      const { error: insertError, data: inserted } = await supabase
        .from('trainees')
        .insert([formData])
        .select('id')
        .single()

      if (insertError) throw insertError

      const traineeId = inserted?.id

      // 写真アップロード
      if (photoFile && traineeId) {
        const ext = photoFile.name.split('.').pop()
        const path = `trainees/${formData.trainee_id}/photo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('trainee-media')
          .upload(path, photoFile, { upsert: true })
        if (uploadError) throw uploadError
        await supabase.from('trainees').update({ photo: path }).eq('id', traineeId)
      }

      router.push('/dashboard/trainees')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }
```

**特徴:**
- 詳細なバリデーション（必須項目チェック、重複チェック）
- エラーメッセージの日本語表示
- 画像プレビュー機能

---

## 実習生CSVインポートページ

### `src/app/dashboard/trainees/import/page.tsx`

**動作:**
1. CSVファイルを選択
2. ファイル内容をパース（カンマ区切り、クォート処理）
3. データをバリデーション
4. 一括でデータベースに挿入
5. 結果メッセージを表示

**使用技術:**
- **Client Component**: ファイル処理
- **File API**: `File.text()`でCSV読み込み
- **文字列処理**: CSVパーシング（手動実装）
- **Supabase Client**: 一括挿入処理

**実装詳細:**
```13:56:src/app/dashboard/trainees/import/page.tsx
  const parseCsv = async (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean)
    const header = lines.shift()?.split(',')?.map(h => h.trim()) || []
    const rows = lines.map(line => {
      const cols = line.split(',')
      const obj: any = {}
      header.forEach((h, i) => {
        obj[h] = (cols[i] || '').replace(/^"|"$/g, '')
      })
      return obj
    })
    return rows
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setMessage(null)
    try {
      const text = await file.text()
      const rows = await parseCsv(text)
      // 最低限の項目名想定: trainee_id,last_name,first_name,nationality,passport_number,visa_type,visa_expiry_date,entry_date,department
      const payload = rows.map((r: any) => ({
        trainee_id: r.trainee_id,
        last_name: r.last_name,
        first_name: r.first_name,
        nationality: r.nationality,
        passport_number: r.passport_number,
        visa_type: r.visa_type,
        visa_expiry_date: r.visa_expiry_date,
        entry_date: r.entry_date,
        department: r.department,
        is_active: true,
      }))
      // まとめて挿入（organization_idはRLSの都合上、クライアントからは直接制御できない場合があるため、既定のトリガーor後続で更新が必要）
      const { error } = await supabase.from('trainees').insert(payload)
      if (error) throw error
      setMessage(`インポートに成功しました（${payload.length}件）`)
    } catch (e: any) {
      setMessage(`インポート失敗: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }
```

**特徴:**
- シンプルなCSVパーサー（本格的なライブラリなし）
- エラーハンドリング
- 成功/失敗メッセージの表示

---

## 資格管理ページ

### `src/app/dashboard/certificates/page.tsx`

**動作:**
1. サーバーサイドで証明書一覧を取得
2. 期限切れ・期限間近の証明書を計算
3. アラート表示
4. 証明書一覧をテーブル形式で表示

**使用技術:**
- **Server Component**: サーバーサイドでのデータ取得
- **日付計算**: JavaScriptの`Date`オブジェクトによる期限チェック
- **Supabase Query**: フィルタリングとソート

**実装詳細:**
```21:36:src/app/dashboard/certificates/page.tsx
  const { data: certificates = [], error } = await supabase
    .from('certificates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const today = new Date()
  const soon = new Date()
  soon.setDate(today.getDate() + 30)

  const expired = certificates.filter((c: any) => c.expiry_date && new Date(c.expiry_date) < today)
  const expiring = certificates.filter((c: any) => {
    if (!c.expiry_date) return false
    const d = new Date(c.expiry_date)
    return d >= today && d <= soon
  })
```

**表示内容:**
- 期限アラートセクション（期限切れ・期限間近）
- 証明書一覧テーブル（資格名、発行元、発行日、有効期限）
- アップロードボタン

---

## 証明書アップロードページ

### `src/app/dashboard/certificates/upload/page.tsx`

**動作:**
1. 実習生一覧を取得してドロップダウン表示
2. 証明書情報を入力（資格名、発行元、発行日、有効期限）
3. ファイルを選択（画像・動画・PDF対応）
4. ファイルプレビュー表示
5. Supabase Storageにアップロード
6. `certificates`テーブルにデータを保存
7. 成功後、資格管理ページにリダイレクト

**使用技術:**
- **Client Component**: インタラクティブなフォーム処理
- **React Hooks**: `useState`, `useEffect`, `useRouter`, `useSearchParams`
- **Supabase Client**: データ取得と挿入
- **Supabase Storage**: ファイルアップロード
- **File API**: ファイルプレビュー（`URL.createObjectURL()`）
- **ファイルタイプ判定**: MIMEタイプによる画像/動画/PDFの判別

**実装詳細:**
```25:66:src/app/dashboard/certificates/upload/page.tsx
  useEffect(() => {
    const fetchTrainees = async () => {
      const { data } = await supabase.from('trainees').select('id, first_name, last_name').order('last_name')
      setTrainees(data || [])
    }
    fetchTrainees()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!traineeId) throw new Error('実習生を選択してください')
      if (!file) throw new Error('ファイルを選択してください')

      const ext = file.name.split('.').pop()
      const path = `certificates/${traineeId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('pdf-media')
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('certificates').insert({
        trainee_id: traineeId,
        name,
        issuing_body: issuingBody || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        file_path: path,
        is_active: true,
      })
      if (insertError) throw insertError

      router.push('/dashboard/certificates')
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'アップロードに失敗しました')
    } finally {
      setLoading(false)
    }
  }
```

**特徴:**
- URLパラメータからの`traineeId`取得（`?traineeId=xxx`）
- 画像・動画・PDFのプレビュー表示
- ファイルタイプに応じた適切な表示（画像は`<img>`、動画は`<video>`、PDFはアイコン）

---

## スキル評価ページ

### `src/app/dashboard/evaluations/page.tsx`

**動作:**
1. サーバーサイドで評価データを取得
2. 評価一覧を時系列で表示

**使用技術:**
- **Server Component**: サーバーサイドでのデータ取得
- **Supabase Query**: ソート（更新日時降順）

**実装詳細:**
```21:24:src/app/dashboard/evaluations/page.tsx
  const { data: evaluations = [] } = await supabase
    .from('evaluations')
    .select('*')
    .order('updated_at', { ascending: false })
```

**表示内容:**
- スキル評価の一覧（スキルID、レベル、期間、評価日）
- データがない場合のメッセージ

---

## ユーザー登録ページ

### `src/app/dashboard/users/new/page.tsx`

**動作:**
1. 所属組織一覧を取得（`/api/me/orgs`）
2. フォームに入力（組織、氏名、メールアドレス、パスワード、ロール、部署）
3. `/api/admin/users`にPOSTリクエストを送信
4. ユーザー作成成功後、ダッシュボードにリダイレクト

**使用技術:**
- **Client Component**: フォーム処理
- **React Hooks**: `useState`, `useEffect`, `useRouter`
- **Fetch API**: REST API呼び出し
- **localStorage**: 選択した組織IDの保存

**実装詳細:**
```18:49:src/app/dashboard/users/new/page.tsx
  useEffect(() => {
    fetch('/api/me/orgs')
      .then((r) => r.json())
      .then((d) => {
        setOrgs(d.orgs || [])
        const current = localStorage.getItem('current_org_id')
        const fallback = d.orgs?.[0]?.id || ''
        setOrganizationId(current || fallback)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, department, organization_id: organizationId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '作成に失敗しました')
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
```

**特徴:**
- 組織選択機能
- ロール選択（ADMIN、DEPARTMENT、TRAINEE）
- エラーハンドリング

---

## 通知ページ

### `src/app/notifications/page.tsx`

**動作:**
1. サーバーサイドで通知一覧を取得
2. 通知を時系列で表示
3. 既読/未読の状態表示

**使用技術:**
- **Server Component**: サーバーサイドでのデータ取得
- **Supabase Query**: ソート（作成日時降順）

**実装詳細:**
```15:18:src/app/notifications/page.tsx
  const { data: notifications = [] } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
```

**表示内容:**
- 通知タイトル
- 通知メッセージ
- 作成日時
- 既読/未読バッジ

---

## APIルート

### `/api/auth/logout` (POST)

**動作:**
- Supabase Authからサインアウト
- ログインページにリダイレクト

**使用技術:**
- **Route Handler**: Next.jsのAPI Route
- **Supabase Server Client**: サーバーサイドでの認証処理
- **リダイレクト**: `NextResponse.redirect()`

**実装詳細:**
```4:9:src/app/api/auth/logout/route.ts
export async function POST() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}
```

---

### `/api/admin/users` (POST)

**動作:**
1. 認証チェック（セッション確認）
2. ロールチェック（ADMINのみ許可）
3. Supabase Admin APIでAuthユーザーを作成
4. `users`テーブルにデータを挿入
5. `user_organizations`テーブルに組織との関連を追加

**使用技術:**
- **Route Handler**: Next.jsのAPI Route
- **Supabase Admin Client**: 管理者権限でのユーザー作成
- **認証・認可チェック**: セッションとロールの検証

**実装詳細:**
```5:65:src/app/api/admin/users/route.ts
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
    const admin = createSupabaseAdmin()
    // Authユーザー作成（メール確認済みで作成）
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) throw createError
    const userId = created.user?.id
    if (!userId) throw new Error('Failed to create auth user')

    // usersテーブルに反映
    const { error: insertUserError } = await supabase.from('users').insert({
      id: userId,
      email,
      name: name || email,
      role,
      department: department || null,
      is_active: true,
    })
    if (insertUserError) throw insertUserError

    // 所属組織を紐付け
    const { error: linkError } = await supabase.from('user_organizations').insert({
      user_id: userId,
      organization_id,
      role,
    })
    if (linkError) throw linkError

    return NextResponse.json({ ok: true, user_id: userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 500 })
  }
}
```

---

### `/api/me/orgs` (GET)

**動作:**
1. 認証チェック
2. `user_organizations`テーブルからユーザーの所属組織IDを取得
3. `organizations`テーブルから組織情報を取得
4. JSON形式で返却

**使用技術:**
- **Route Handler**: Next.jsのAPI Route
- **Supabase Query**: JOIN的な処理（2回のクエリで実現）

**実装詳細:**
```4:32:src/app/api/me/orgs/route.ts
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return NextResponse.json({ orgs: [] }, { status: 200 })

  // 1) ユーザーの所属org IDを取得
  const { data: uo, error: uoError } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', session.user.id)

  if (uoError) return NextResponse.json({ orgs: [], error: uoError.message }, { status: 500 })

  const orgIds = (uo || []).map((r: any) => r.organization_id)
  if (orgIds.length === 0) return NextResponse.json({ orgs: [] }, { status: 200 })

  // 2) organizationsからIDリストで取得
  const { data: orgsData, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds)

  if (orgsError) return NextResponse.json({ orgs: [], error: orgsError.message }, { status: 500 })

  return NextResponse.json({ orgs: orgsData || [] })
}
```

---

### `/api/trainees/export` (GET)

**動作:**
1. サーバーサイドで実習生データを取得（`is_active = true`のみ）
2. CSV形式に変換（UTF-8 BOM付き）
3. ファイル名に日付を含めてダウンロード

**使用技術:**
- **Route Handler**: Next.jsのAPI Route
- **CSV生成**: 手動でCSV文字列を構築
- **Blob API**: バイナリデータの生成
- **Response Headers**: Content-Type、Content-Dispositionの設定

**実装詳細:**
```4:82:src/app/api/trainees/export/route.ts
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
```

**特徴:**
- UTF-8 BOM付きCSV（Excelでの日本語文字化け対策）
- 日本語ヘッダー
- 日付を含むファイル名

---

## 共通コンポーネント

### DashboardStats

**動作:**
- 実習生数・資格数の統計を計算
- 国籍別分布グラフを表示
- 部署別人数表を表示
- 資格期限アラートを表示

**使用技術:**
- **React Component**: 再利用可能なコンポーネント
- **Props**: データを受け取る
- **計算処理**: 集計・フィルタリング
- **Tailwind CSS**: グラフ表示とスタイリング

**実装詳細:**
```8:50:src/components/DashboardStats.tsx
export default function DashboardStats({ trainees = [], certificates = [] }: DashboardStatsProps) {
  // null/undefinedチェック
  const safeTrainees = trainees || []
  const safeCertificates = certificates || []

  // 実習生数
  const totalTrainees = safeTrainees.length
  const activeTrainees = safeTrainees.filter(t => t.is_active).length

  // 国籍別集計
  const nationalityCount: Record<string, number> = {}
  safeTrainees.forEach(t => {
    nationalityCount[t.nationality] = (nationalityCount[t.nationality] || 0) + 1
  })
  const nationalityData = Object.entries(nationalityCount)
    .map(([name, count]) => ({ name, count, percentage: totalTrainees > 0 ? (count / totalTrainees) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)

  // 部署別集計
  const departmentCount: Record<string, number> = {}
  safeTrainees.forEach(t => {
    departmentCount[t.department] = (departmentCount[t.department] || 0) + 1
  })
  const departmentData = Object.entries(departmentCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // 資格期限が近いものを集計（30日以内）
  const today = new Date()
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(today.getDate() + 30)
  
  const expiringCertificates = safeCertificates.filter(cert => {
    if (!cert.expiry_date) return false
    const expiryDate = new Date(cert.expiry_date)
    return expiryDate >= today && expiryDate <= thirtyDaysLater
  })

  const expiredCertificates = safeCertificates.filter(cert => {
    if (!cert.expiry_date) return false
    return new Date(cert.expiry_date) < today
  })
```

---

### TraineeList

**動作:**
- 実習生一覧を表示
- 検索・フィルタ機能を提供
- CSV出力ボタンを提供
- 各実習生をクリック可能なリンクとして表示

**使用技術:**
- **Client Component**: インタラクティブな機能
- **React Hooks**: `useState`, `useEffect`
- **TraineeSearch Component**: 検索機能の分離
- **Fetch API**: CSV出力API呼び出し
- **Blob API**: CSVファイルのダウンロード

**実装詳細:**
```12:43:src/components/TraineeList.tsx
export default function TraineeList({ initialTrainees }: TraineeListProps) {
  const [filteredTrainees, setFilteredTrainees] = useState<Trainee[]>(initialTrainees)

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/trainees/export')
      if (!response.ok) {
        throw new Error('CSV出力に失敗しました')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trainees_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('CSV出力中にエラーが発生しました')
      console.error(error)
    }
  }
```

---

### TraineeSearch

**動作:**
- 名前・実習生IDでの検索
- 国籍・部署でのフィルタリング
- リアルタイムフィルタリング（検索条件変更時に自動実行）
- リセット機能

**使用技術:**
- **Client Component**: インタラクティブな検索機能
- **React Hooks**: `useState`, `useEffect`
- **文字列操作**: 部分一致検索（`toLowerCase()`, `includes()`）
- **配列操作**: `filter()`, `Set()`による一意な値の抽出

**実装詳細:**
```11:56:src/components/TraineeSearch.tsx
export default function TraineeSearch({ trainees, onFilterChange }: TraineeSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNationality, setSelectedNationality] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // 国籍の一意なリスト
  const nationalities = Array.from(new Set(trainees.map(t => t.nationality))).sort()
  
  // 部署の一意なリスト
  const departments = Array.from(new Set(trainees.map(t => t.department))).sort()

  // 検索条件が変更されたときに自動フィルタリング
  useEffect(() => {
    let filtered = trainees

    // 名前検索
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.first_name.toLowerCase().includes(term) ||
        t.last_name.toLowerCase().includes(term) ||
        (t.first_name_kana && t.first_name_kana.toLowerCase().includes(term)) ||
        (t.last_name_kana && t.last_name_kana.toLowerCase().includes(term)) ||
        t.trainee_id.toLowerCase().includes(term)
      )
    }

    // 国籍フィルタ
    if (selectedNationality) {
      filtered = filtered.filter(t => t.nationality === selectedNationality)
    }

    // 部署フィルタ
    if (selectedDepartment) {
      filtered = filtered.filter(t => t.department === selectedDepartment)
    }

    onFilterChange(filtered)
  }, [searchTerm, selectedNationality, selectedDepartment, trainees, onFilterChange])
```

---

### OrgSwitcher

**動作:**
- 所属組織一覧を取得
- 組織を選択できるドロップダウンを表示
- 選択した組織IDを`localStorage`に保存
- 親コンポーネントに変更を通知（`onChange`コールバック）

**使用技術:**
- **Client Component**: インタラクティブな選択機能
- **React Hooks**: `useState`, `useEffect`
- **Fetch API**: 組織一覧API呼び出し
- **localStorage**: 選択状態の永続化

**実装詳細:**
```9:34:src/components/OrgSwitcher.tsx
export default function OrgSwitcher({ onChange }: OrgSwitcherProps) {
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([])
  const [current, setCurrent] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrgs = async () => {
      const res = await fetch('/api/me/orgs')
      if (res.ok) {
        const data = await res.json()
        setOrgs(data.orgs || [])
        const stored = localStorage.getItem('current_org_id')
        const first = stored || (data.orgs?.[0]?.id ?? null)
        setCurrent(first)
        if (onChange) onChange(first)
      }
    }
    fetchOrgs()
  }, [onChange])

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value || null
    setCurrent(val)
    if (val) localStorage.setItem('current_org_id', val)
    else localStorage.removeItem('current_org_id')
    if (onChange) onChange(val)
  }
```

---

## Supabaseクライアント

### Client (`src/lib/supabase/client.ts`)

**動作:**
- ブラウザ側で使用するSupabaseクライアントの生成
- 管理者権限用クライアントの生成（サービスロールキー使用）

**使用技術:**
- **@supabase/ssr**: ブラウザ用クライアント
- **@supabase/supabase-js**: 管理者権限用クライアント

**実装詳細:**
```8:35:src/lib/supabase/client.ts
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * サーバー側で使用するSupabaseクライアント
 * サービスロールキーを使用（管理者権限）
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
```

---

### Server (`src/lib/supabase/server.ts`)

**動作:**
- サーバーサイド（Server Component、Route Handler）で使用するSupabaseクライアントの生成
- Cookie経由でのセッション管理

**使用技術:**
- **@supabase/ssr**: サーバーサイド用クライアント
- **Next.js Cookies API**: Cookie操作

**実装詳細:**
```8:36:src/lib/supabase/server.ts
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value)
          } catch {
            // サーバーコンポーネントではsetは無視される場合がある
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // サーバーコンポーネントではremoveは無視される場合がある
          }
        },
      },
    }
  )
}
```

---

## まとめ

### 主要な技術スタック

1. **Next.js 14 App Router**: サーバーコンポーネント、Route Handlers、Middleware
2. **React**: Hooks（useState, useEffect, useRouter, useParams）
3. **Supabase**: 認証、データベース、ストレージ
4. **TypeScript**: 型安全性
5. **Tailwind CSS**: スタイリング
6. **File API**: ファイルアップロード・プレビュー
7. **Fetch API / Blob API**: ファイルダウンロード

### アーキテクチャパターン

1. **Server Components**: データフェッチはサーバーサイドで実行
2. **Client Components**: インタラクティブな機能はクライアントサイドで実行
3. **API Routes**: 複雑な処理や管理者権限が必要な処理はRoute Handlerで実行
4. **Middleware**: 認証チェックとリダイレクトを一元管理
5. **コンポーネント分離**: 再利用可能なコンポーネントへの分割

### データフロー

1. **認証フロー**: Middleware → Supabase Auth → Session管理
2. **データ取得**: Server Component → Supabase Server Client → Database
3. **データ更新**: Client Component → Supabase Client → Database / Storage
4. **ファイル処理**: Client Component → File API → Supabase Storage

---

以上が、各ページの動作と実装技術の詳細です。

