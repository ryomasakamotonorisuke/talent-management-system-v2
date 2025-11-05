# トラブルシューティングガイド

## ログインエラー「Invalid login credentials」の解決方法

### ステップ1: Supabase Authでのユーザー確認

1. Supabaseダッシュボードにアクセス
2. 「Authentication」→「Users」を選択
3. 現在のユーザーリストを確認

### ステップ2: ユーザーが存在する場合

既存のユーザーがある場合：
1. ユーザー行をクリックして詳細を開く
2. 以下の項目を確認：
   - **Email**: ログイン時に使用するメールアドレスと一致しているか
   - **Confirmed At**: 日付が設定されているか（Auto Confirmが必要）
3. **「Send magic link」**をクリックしてパスワードをリセットするか、新しいパスワードを設定

### ステップ3: 新しいユーザーを作成する場合

1. 「Authentication」→「Users」→「Add user」をクリック
2. 以下の情報を入力：
   - **Email**: 例 `admin@example.com`
   - **Password**: 強力なパスワードを設定（最低8文字）
   - **Auto Confirm User**: **必ずONにする**（開発環境では重要）
3. 「Create user」をクリック
4. 作成されたユーザーの**UUID**をコピーする（例：`550e8400-e29b-41d4-a716-446655440000`）

### ステップ4: usersテーブルにレコードを追加

作成したAuthユーザーのUUIDを使って、SQL Editorで以下を実行：

```sql
INSERT INTO users (id, email, name, role, department)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- 作成したユーザーのUUIDを貼り付け
  'admin@example.com',                      -- Authで設定したメールアドレス
  '管理者',
  'ADMIN',
  '管理部'
);
```

**重要**: UUIDは必ずSupabase Authで作成したユーザーのUUIDと一致させること！

### ステップ5: ログイン再試行

1. アプリケーションのログインページに戻る
2. 作成したメールアドレスとパスワードでログイン
3. 成功すればダッシュボードにリダイレクトされます

## よくある問題

### Q: 「User not found in users table」エラーが出る

A: `users`テーブルにレコードが追加されていません。ステップ4を実行してください。

### Q: パスワードを忘れた

A: Supabaseダッシュボードでユーザーを選択し、「Send magic link」をクリックするか、パスワードをリセットしてください。

### Q: Auto Confirmが設定できない

A: Supabaseのプロジェクト設定で確認が必要な場合があります。「Settings」→「Authentication」で確認してください。

