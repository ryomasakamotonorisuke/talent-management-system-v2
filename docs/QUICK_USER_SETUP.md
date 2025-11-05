# ユーザー作成クイックガイド

## 🚨 今すぐ実行する手順

### ステップ1: Supabaseでユーザーを作成

1. **Supabaseダッシュボード**にアクセス
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **「Authentication」→「Users」**をクリック

3. **「Add user」ボタン**をクリック

4. 以下の情報を**正確に**入力：
   ```
   Email: admin@admin.com
   Password: Admin123456（8文字以上、必ずメモ！）
   Auto Confirm User: ✅ ON（絶対にチェック！）
   ```

5. **「Create user」**をクリック

6. 作成されたユーザーの**UUID**をコピー（ユーザーをクリックすると表示されます）
   - 例: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### ステップ2: usersテーブルに追加

1. **「SQL Editor」**を開く

2. 以下を実行（**UUIDを貼り付け**）：

```sql
INSERT INTO users (id, email, name, role, department)
VALUES (
  'ここにコピーしたUUIDを貼り付け',
  'admin@admin.com',
  '管理者',
  'ADMIN',
  '管理部'
);
```

3. **「Run」**ボタンをクリック

4. エラーが出ないことを確認

### ステップ3: ログイン

1. アプリケーションのログインページに戻る
2. 以下を入力：
   - **メールアドレス**: `admin@admin.com`
   - **パスワード**: `Admin123456`（ステップ1で設定したもの）
3. **「ログイン」**をクリック

## ✅ 確認ポイント

- ✅ Supabase Authにユーザーが作成されている
- ✅ 「Confirmed At」に日付が設定されている（Auto ConfirmがONの証拠）
- ✅ usersテーブルにレコードが追加されている
- ✅ UUIDが完全一致している
- ✅ メールアドレスが完全一致している

## ⚠️ まだエラーが出る場合

1. パスワードを確認（大文字小文字、数字を含む）
2. メールアドレスにスペースがないか確認
3. ブラウザのコンソール（F12）でエラーを確認
4. Supabaseダッシュボードの「Logs」→「Auth Logs」を確認


