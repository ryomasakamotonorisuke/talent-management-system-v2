# デプロイチェックリスト

## ✅ コミット・プッシュ完了

以下の変更がGitHubにプッシュされました：
- ✅ 実習生削除機能の追加
- ✅ ユーザー管理機能の追加（一覧・削除）
- ✅ 重複ユーザーエラー処理の改善
- ✅ エラーハンドリングの改善

## 🚀 Vercelデプロイ手順

### ステップ1: Vercelダッシュボードを開く

1. [https://vercel.com](https://vercel.com) にアクセス
2. プロジェクトを選択

### ステップ2: 環境変数の確認（重要）

**必須環境変数が設定されているか確認：**

| 変数名 | 説明 | 確認方法 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Settings → Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Settings → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | **重要**: ユーザー作成に必要 | Settings → Environment Variables |

**特に `SUPABASE_SERVICE_ROLE_KEY` が設定されていない場合：**
1. Supabaseダッシュボード → Settings → API
2. 「service_role」キーをコピー
3. Vercel → Settings → Environment Variables
4. `SUPABASE_SERVICE_ROLE_KEY` を追加
5. 値にコピーしたキーを貼り付け
6. 「Save」をクリック

### ステップ3: デプロイ実行

#### オプションA: 自動デプロイ（推奨）

GitHubにプッシュしたので、Vercelが自動的にデプロイを開始している可能性があります。

1. Vercelダッシュボードの「Deployments」タブを確認
2. 新しいデプロイメントが進行中か確認
3. 完了を待つ（2-3分）

#### オプションB: 手動デプロイ

自動デプロイが開始されていない場合：

1. 「Deployments」タブを開く
2. 最新のコミット（`7036e7a`）を選択
3. 「Redeploy」をクリック

### ステップ4: ビルドログの確認

デプロイ中に以下を確認：

1. 「Deployments」タブでデプロイメントを開く
2. 「Build Logs」を確認
3. エラーがないか確認

**よくあるエラー：**
- `SUPABASE_SERVICE_ROLE_KEY is not set` → 環境変数を設定
- `Module not found` → ファイルパスの確認
- `Build failed` → ビルドログを確認

### ステップ5: デプロイ後の動作確認

デプロイが完了したら、以下を確認：

1. **ログイン**
   - デプロイされたURLにアクセス
   - `/login` でログイン

2. **ダッシュボード**
   - ダッシュボードが表示されるか確認
   - 「ユーザー管理」カードが表示されるか確認（管理者のみ）

3. **実習生削除機能**
   - 実習生詳細ページを開く
   - 「削除」ボタンが表示されるか確認（管理者のみ）

4. **ユーザー管理機能**
   - `/dashboard/users` にアクセス
   - ユーザー一覧が表示されるか確認
   - 「新規ユーザー作成」が動作するか確認
   - ユーザー削除が動作するか確認

5. **ユーザー作成**
   - 管理者でログイン
   - ユーザー管理 → 新規ユーザー作成
   - 新しいユーザーを作成
   - エラーが発生しないか確認

## 🔍 トラブルシューティング

### エラー: "SUPABASE_SERVICE_ROLE_KEY is not set"

**原因:** 環境変数が設定されていません

**対処法:**
1. Vercelダッシュボード → Settings → Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` を追加
3. 値を設定して保存
4. 再デプロイ

### エラー: "Build failed"

**原因:** ビルドエラーが発生しています

**対処法:**
1. ビルドログを確認
2. エラーメッセージを確認
3. ローカルで `npm run build` を実行して確認
4. エラーを修正して再度コミット・プッシュ

### エラー: "ユーザー作成に失敗しました"

**原因:** 環境変数が正しく設定されていない、またはSupabaseの設定に問題がある

**対処法:**
1. Vercelの環境変数を確認
2. Supabaseダッシュボードでプロジェクトが有効か確認
3. サーバーログを確認（Vercel → Deployments → Functions → Logs）

## 📝 確認事項

デプロイ前に以下を確認：

- [ ] GitHubに最新の変更がプッシュされている
- [ ] Vercelの環境変数がすべて設定されている
- [ ] `SUPABASE_SERVICE_ROLE_KEY` が設定されている
- [ ] ローカルで `npm run build` が成功する

デプロイ後に以下を確認：

- [ ] デプロイが成功している
- [ ] ログインができる
- [ ] ダッシュボードが表示される
- [ ] ユーザー管理機能が動作する
- [ ] 実習生削除機能が動作する
- [ ] ユーザー作成が動作する

## 🎉 完了

すべての確認が完了したら、デプロイは成功です！





