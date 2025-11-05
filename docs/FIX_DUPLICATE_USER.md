# 重複ユーザーエラーの対処方法

## エラー: `duplicate key value violates unique constraint "users_pkey"`

このエラーは、Supabase Authにユーザーが存在するが、`users`テーブルにも既に同じIDのユーザーが存在する場合に発生します。

## 対処方法

### 方法1: 既存ユーザーを確認・更新（推奨）

1. **Supabaseダッシュボード**でユーザーを確認
   - Authentication → Users
   - エラーメッセージに含まれるID（例: `c128b1fe-3c6a-4a01-93ff-ea005f84e0c5`）で検索

2. **usersテーブルを確認**
   - SQL Editorで以下を実行：
   ```sql
   SELECT id, email, name, role, is_active 
   FROM users 
   WHERE id = 'c128b1fe-3c6a-4a01-93ff-ea005f84e0c5';
   ```

3. **既に存在する場合**
   - そのユーザーを使用する
   - または、別のメールアドレスで新規作成

4. **存在しないがAuthには存在する場合**
   - 以下のSQLで`users`テーブルに追加：
   ```sql
   INSERT INTO users (id, email, name, role, department, is_active)
   VALUES (
     'c128b1fe-3c6a-4a01-93ff-ea005f84e0c5',
     '既存のメールアドレス',
     'ユーザー名',
     'ADMIN',
     '管理部',
     true
   );
   ```

### 方法2: 既存のAuthユーザーを削除

既存のユーザーが不要な場合：

1. **Supabaseダッシュボード** → Authentication → Users
2. 該当ユーザーを削除
3. 再度、システムからユーザーを作成

### 方法3: システムの改善機能を使用

システムは自動的に以下を試みます：

1. **メールアドレスで既存チェック**
   - 同じメールアドレスのユーザーが存在する場合、エラーを返します

2. **Authユーザーが既に存在する場合**
   - Authユーザーを取得して、`users`テーブルに追加を試みます
   - 既に`users`テーブルに存在する場合は、エラーを返します

3. **クリーンアップ**
   - Authユーザーは作成されたが、`users`テーブルへの挿入が失敗した場合
   - 自動的にAuthユーザーを削除してクリーンアップします

## 予防策

1. **ユーザー作成前に確認**
   - 同じメールアドレスのユーザーが存在しないか確認
   - システムが自動的にチェックします

2. **エラーメッセージを確認**
   - 詳細なエラーメッセージが表示されます
   - どの段階でエラーが発生したか確認

3. **ログの確認**
   - サーバーログ（開発サーバーのターミナル）を確認
   - エラーの詳細が記録されています

## 現在のエラー（ID: c128b1fe-3c6a-4a01-93ff-ea005f84e0c5）の場合

このユーザーIDが既に存在する場合：

### オプション1: 既存ユーザーを使用
- そのユーザーでログインできるか確認
- ログインできない場合、パスワードをリセット

### オプション2: 新規ユーザーを作成
- 別のメールアドレスを使用
- システムから再度作成

### オプション3: 既存ユーザーを削除して再作成
1. Supabaseダッシュボード → Authentication → Users
2. 該当ユーザーを削除
3. SQL Editorで以下を実行：
   ```sql
   DELETE FROM users WHERE id = 'c128b1fe-3c6a-4a01-93ff-ea005f84e0c5';
   DELETE FROM user_organizations WHERE user_id = 'c128b1fe-3c6a-4a01-93ff-ea005f84e0c5';
   ```
4. システムから再度ユーザーを作成

## 確認SQL

現在の状態を確認するには：

```sql
-- usersテーブルの該当ユーザーを確認
SELECT * FROM users WHERE id = 'c128b1fe-3c6a-4a01-93ff-ea005f84e0c5';

-- メールアドレスで確認
SELECT * FROM users WHERE email = 'your-email@example.com';

-- user_organizationsの確認
SELECT * FROM user_organizations WHERE user_id = 'c128b1fe-3c6a-4a01-93ff-ea005f84e0c5';
```

