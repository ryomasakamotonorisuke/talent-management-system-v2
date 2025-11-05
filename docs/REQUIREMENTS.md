# 要件定義書

## プロジェクト概要
海外技能実習生タレントマネジメントシステムの機能拡張要件定義書

**作成日**: 2024年
**対象システム**: 海外技能実習生タレントマネジメントシステム v2.0

---

## 1. 権限管理の拡張

### 要件ID: REQ-001
### 要件名: 人事部・経理部の閲覧権限付与

#### 概要
人事部および経理部のユーザーも実習生データを閲覧できるようにする。

#### 詳細要件
1. **新規ロールの追加**
   - `HR` (人事部): 実習生データの閲覧・一部編集権限
   - `ACCOUNTING` (経理部): 実習生データの閲覧権限（財務関連データの編集可）

2. **権限設定**
   - 人事部（HR）: 
     - 実習生情報の閲覧・編集可能
     - 在留カード情報の閲覧・編集可能
     - 入社書類データの閲覧・編集可能
     - 証明書・書類の閲覧可能
   - 経理部（ACCOUNTING）:
     - 実習生基本情報の閲覧可能
     - 社宅関連情報（家賃、管理会社、ライフライン）の閲覧・編集可能
     - 財務関連データの編集可能
     - 証明書・書類の閲覧可能

3. **既存ロールとの関係**
   - `ADMIN`: 全権限保持（変更なし）
   - `DEPARTMENT`: 現状維持（現場担当者の権限）
   - `TRAINEE`: 現状維持（本人の閲覧のみ）

#### 技術要件
- `src/types/index.ts`の`UserRole`enumに`HR`と`ACCOUNTING`を追加
- `database-setup.md`のRLSポリシーに新ロール対応を追加
- ミドルウェア・各ページコンポーネントで権限チェックを実装

#### データベース変更
- `user_organizations`テーブルの`role`チェック制約を更新
- RLSポリシーの追加・更新

---

## 2. 検索機能の実装

### 要件ID: REQ-002
### 要件名: 多条件検索機能

#### 概要
実習生を管理番号（G〇〇）、事業所、名前で検索できる機能を実装する。

#### 詳細要件
1. **検索項目**
   - 管理番号（trainee_id）: 完全一致・部分一致の両方に対応
   - 事業所（departmentまたはorganization）: ドロップダウン選択
   - 名前（first_name, last_name）: 部分一致検索
   - 複合検索: 上記項目のAND検索

2. **UI要件**
   - 実習生一覧ページに検索フォームを配置
   - リアルタイム検索（オプション）または検索ボタンによる検索
   - 検索結果件数の表示
   - 検索条件のクリア機能

3. **検索対象テーブル**
   - `trainees`テーブルの以下のカラム:
     - `trainee_id` (管理番号)
     - `department` (事業所)
     - `first_name` (名前)
     - `last_name` (名前)
     - `organization_id` (組織)

#### 技術要件
- 検索APIエンドポイントの作成（`/api/trainees/search`）
- Supabaseのフルテキスト検索またはLIKE検索の実装
- クライアント側検索コンポーネントの実装（既存の`TraineeSearch.tsx`を拡張）

---

## 3. 在留カードOCR機能

### 要件ID: REQ-003
### 要件名: 在留カード画像からの情報自動抽出

#### 概要
在留カードの写真データをアップロードすると、記載情報を自動的に読み取ってデータベースに保存する。

#### 詳細要件
1. **抽出項目**
   - 在留カード番号（Residence Card Number）
   - 名前（Name）
   - 国籍（Nationality）
   - 生年月日（Date of Birth）
   - 社宅住所（Residence Address）
   - 入国日（Date of Entry）
   - 在留期限（Period of Stay / Expiry Date）

2. **処理フロー**
   1. ユーザーが在留カード画像をアップロード
   2. 画像をSupabase Storageに一時保存
   3. OCR API（例: Google Cloud Vision API、AWS Textract、Tesseract.js等）に画像を送信
   4. OCR結果から必要な情報を抽出・パース
   5. 抽出データを確認画面で表示（ユーザーが編集可能）
   6. ユーザー承認後、`trainees`テーブルに保存

3. **データマッピング**
   - 在留カード番号 → `trainees.residence_card_number` (新規カラム)
   - 名前 → `trainees.first_name`, `trainees.last_name`
   - 国籍 → `trainees.nationality`
   - 生年月日 → `trainees.date_of_birth` (新規カラム)
   - 社宅住所 → `trainees.residence_address` (新規カラム)
   - 入国日 → `trainees.entry_date`
   - 在留期限 → `trainees.visa_expiry_date`

4. **エラーハンドリング**
   - OCR読み取り失敗時のエラーメッセージ表示
   - 手動入力フォールバック機能
   - 読み取り精度が低い場合の警告表示

#### 技術要件
- OCRサービスの選定・統合（推奨: Google Cloud Vision API）
- 画像アップロードAPIエンドポイント（`/api/trainees/upload-residence-card`）
- OCR処理用のサーバーサイドAPI（`/api/ocr/residence-card`）
- データ確認・編集UIの実装

#### データベース変更
- `trainees`テーブルに以下カラムを追加:
  - `residence_card_number` TEXT
  - `date_of_birth` DATE
  - `residence_address` TEXT

#### 外部サービス依存
- OCR API（Google Cloud Vision API、AWS Textract、Azure Computer Vision等）

---

## 4. SmartHR連携機能

### 要件ID: REQ-004
### 要件名: SmartHR入社書類データの自動取り込み

#### 概要
SmartHRで本人が入力するメールアドレスなどの入社書類データを自動的に取得・保存する。

#### 詳細要件
1. **連携データ項目**
   - メールアドレス
   - 電話番号
   - 緊急連絡先情報
   - その他SmartHRに入力された実習生情報

2. **連携方式**
   - **方式A: SmartHR API連携**（推奨）
     - SmartHR API経由でデータを取得
     - 定期的な同期処理（バッチ処理）
     - リアルタイム同期（Webhook利用）
   - **方式B: CSV/Excelファイルインポート**
     - 人事部がSmartHRからエクスポートしたファイルをアップロード
     - ファイル形式のパース・バリデーション
     - データマッピング・インポート処理

3. **データマッピング**
   - SmartHRのデータ項目 → システム内のテーブル・カラムへのマッピング定義
   - 既存データとのマッチング（メールアドレス、名前等で照合）

4. **同期処理**
   - 初回同期: 全データの一括インポート
   - 定期同期: 差分データのみ更新
   - 更新履歴の記録

5. **エラーハンドリング**
   - データ不整合時のエラー表示
   - マッピングできないデータの警告
   - 重複データの検出・処理

#### 技術要件
- SmartHR API連携（APIキー・認証設定）
- バッチ処理用のAPIエンドポイント（`/api/smarthr/sync`）
- CSV/Excelパーサーの実装（xlsx等のライブラリ利用）
- データインポートUIの実装（既存の`/dashboard/trainees/import`を拡張）

#### データベース変更
- `trainee_smarthr_sync`テーブル（新規）: 同期履歴管理
  - `trainee_id` UUID
  - `synced_at` TIMESTAMP
  - `sync_status` TEXT
  - `raw_data` JSONB（元データ保存用）

#### 外部サービス依存
- SmartHR API（連携方式Aの場合）

---

## 5. 手動入力項目の追加

### 要件ID: REQ-005
### 要件名: 社宅・管理関連情報の手動入力機能

#### 概要
監理団体、家賃、管理会社、ライフライン契約先、入寮日（入社日）、期の情報を手動で入力・編集できる機能を実装する。

#### 詳細要件
1. **入力項目**
   - 監理団体（Supervising Organization）
   - 家賃（Monthly Rent）
   - 管理会社（Management Company）
   - ライフライン契約先（Utility Providers）
     - 電気: 契約会社名
     - ガス: 契約会社名
     - 水道: 契約会社名
   - 入寮日（Move-in Date / Entry Date）
   - 期（Period / Batch Number）

2. **入力画面**
   - 実習生詳細ページまたは専用タブに追加
   - フォーム形式で入力
   - バリデーション（必須項目チェック等）

3. **権限設定**
   - 人事部（HR）: 編集可能
   - 経理部（ACCOUNTING）: 家賃・管理会社・ライフライン関連のみ編集可能
   - 管理者（ADMIN）: 全項目編集可能

#### 技術要件
- 実習生編集ページ（`/dashboard/trainees/[id]/edit`）に項目を追加
- データベーススキーマの拡張

#### データベース変更
- `trainees`テーブルに以下カラムを追加:
  - `supervising_organization` TEXT（監理団体）
  - `monthly_rent` DECIMAL(10,2)（家賃）
  - `management_company` TEXT（管理会社）
  - `electric_provider` TEXT（電気契約先）
  - `gas_provider` TEXT（ガス契約先）
  - `water_provider` TEXT（水道契約先）
  - `move_in_date` DATE（入寮日）
  - `batch_period` TEXT（期）

または、別テーブル`trainee_residence_info`として分離することも検討。

---

## 6. Google Maps連携

### 要件ID: REQ-006
### 要件名: 社宅住所のGoogle Maps表示機能

#### 概要
社宅住所の横に「地図」ボタンを配置し、クリックするとGoogle Mapsで該当地址を表示する。

#### 詳細要件
1. **UI要件**
   - 実習生詳細ページの社宅住所表示部分に「地図」ボタンを追加
   - ボタンクリックで新しいタブでGoogle Mapsを開く
   - Google Maps URL: `https://www.google.com/maps/search/?api=1&query={住所}`

2. **住所データ**
   - `trainees.residence_address`カラムの値を利用
   - URLエンコーディング処理

3. **エラーハンドリング**
   - 住所が未入力の場合、ボタンを非表示または無効化

#### 技術要件
- クライアントサイドでのリンク生成（外部API不要）
- 住所のURLエンコーディング処理

---

## 7. 在留期限通知機能（1ヶ月前）

### 要件ID: REQ-007
### 要件名: 在留期限1ヶ月前の通知

#### 概要
在留期限が1ヶ月以内の実習生に対して通知を送信する。

#### 詳細要件
1. **通知タイミング**
   - 在留期限の30日前（1ヶ月前）
   - 定期実行（毎日または毎週）で対象者をチェック

2. **通知内容**
   - 対象実習生の情報（名前、在留期限日）
   - 通知タイプ: `VISA_EXPIRY_1MONTH`
   - 優先度: `HIGH`

3. **通知先**
   - 人事部（HR）ユーザー
   - 管理者（ADMIN）ユーザー
   - 該当実習生の担当部署（DEPARTMENT）ユーザー

4. **通知方法**
   - システム内通知（`notifications`テーブル）
   - メール通知（オプション）

5. **重複防止**
   - 既に通知済みの場合は再通知しない
   - 通知済みフラグの管理

#### 技術要件
- バッチ処理用のAPIエンドポイント（`/api/notifications/check-visa-expiry`）
- Vercel Cron JobsまたはSupabase Edge Functionsで定期実行
- 通知作成処理

#### データベース変更
- `notifications`テーブルの`type`カラムに`VISA_EXPIRY_1MONTH`を追加
- 通知済み管理用のテーブルまたはフラグ（オプション）

---

## 8. 在留期限通知機能（8ヶ月前）

### 要件ID: REQ-008
### 要件名: 在留期限8ヶ月前の通知（初級試験対象者）

#### 概要
在留期限が8ヶ月前の実習生に対して、初級試験対象者である旨の通知を送信する。

#### 詳細要件
1. **通知タイミング**
   - 在留期限の240日前（8ヶ月前）
   - 定期実行（毎日または毎週）で対象者をチェック

2. **通知内容**
   - 対象実習生の情報（名前、在留期限日）
   - 通知タイプ: `VISA_EXPIRY_8MONTHS`（初級試験対象者）
   - 優先度: `MEDIUM`

3. **通知先**
   - 人事部（HR）ユーザー
   - 管理者（ADMIN）ユーザー
   - 該当実習生の担当部署（DEPARTMENT）ユーザー

4. **通知方法**
   - システム内通知（`notifications`テーブル）
   - メール通知（オプション）

5. **重複防止**
   - 既に通知済みの場合は再通知しない

#### 技術要件
- REQ-007と同様のバッチ処理を拡張
- 通知タイプ: `VISA_EXPIRY_8MONTHS`を追加

---

## 9. PDF書類管理機能

### 要件ID: REQ-009
### 要件名: PDF書類と人事データの紐づけ

#### 概要
雇用条件書、軽微変更届出書、技能実習計画認定通知書をPDFとして保存し、実習生データと紐づける。

#### 詳細要件
1. **管理対象書類**
   - 雇用条件書（Employment Conditions）
   - 軽微変更届出書（Minor Change Notification）
   - 技能実習計画認定通知書（Training Plan Certification Notice）

2. **機能要件**
   - PDFファイルのアップロード（実習生ごと）
   - 書類タイプの選択
   - 実習生データとの紐づけ（`trainee_id`）
   - 書類一覧の表示
   - 書類のダウンロード機能

3. **データ構造**
   - 既存の`certificates`テーブルを拡張するか、新規テーブル`trainee_documents`を作成
   - 書類タイプ（`document_type`）を定義

4. **権限設定**
   - 人事部（HR）: アップロード・編集・削除可能
   - 経理部（ACCOUNTING）: 閲覧可能
   - 管理者（ADMIN）: 全権限
   - その他: 閲覧のみ

#### 技術要件
- 既存の`/dashboard/certificates/upload`を拡張
- Supabase StorageへのPDF保存
- 書類タイプの管理（enumまたはマスターテーブル）

#### データベース変更
- `certificates`テーブルに`document_type`カラムを追加
  または
- `trainee_documents`テーブル（新規）を作成:
  - `id` UUID PRIMARY KEY
  - `trainee_id` UUID REFERENCES trainees(id)
  - `document_type` TEXT（EMPLOYMENT_CONDITIONS, MINOR_CHANGE, TRAINING_PLAN_CERT）
  - `file_path` TEXT
  - `uploaded_by` UUID REFERENCES users(id)
  - `uploaded_at` TIMESTAMP
  - `created_at` TIMESTAMP
  - `updated_at` TIMESTAMP

---

## 10. 事業所責任者一覧の取り込み

### 要件ID: REQ-010
### 要件名: 人事部作成の事業所責任者一覧のインポート

#### 概要
人事部が作成する事業所責任者一覧を取り込んで、事業所に責任者を反映する。

#### 詳細要件
1. **データ項目**
   - 事業所名（または事業所コード）
   - 責任者名
   - 責任者の連絡先（メールアドレス、電話番号等）

2. **インポート方式**
   - Excel/CSVファイルのアップロード
   - ファイル形式のパース
   - データマッピング・バリデーション
   - 一括インポート処理

3. **データ反映**
   - `departments`テーブルまたは新規テーブル`department_managers`に保存
   - 既存データとの更新処理（事業所コードでマッチング）

4. **UI要件**
   - インポート用ページ（`/dashboard/departments/import-managers`）
   - インポート結果の表示（成功・失敗件数）
   - エラーログの表示

#### 技術要件
- Excel/CSVパーサーの実装
- インポートAPIエンドポイント（`/api/departments/import-managers`）
- インポートUIの実装

#### データベース変更
- `department_managers`テーブル（新規）を作成:
  - `id` UUID PRIMARY KEY
  - `department_id` UUID REFERENCES departments(id)
  - `manager_name` TEXT
  - `manager_email` TEXT
  - `manager_phone` TEXT
  - `created_at` TIMESTAMP
  - `updated_at` TIMESTAMP

---

## 11. 事業所住所一覧の取り込み

### 要件ID: REQ-011
### 要件名: 経営企画部作成の事業所住所一覧のインポート

#### 概要
経営企画部が作成する事業所住所一覧を取り込んで、AMと事業所番号を一覧に反映する。

#### 詳細要件
1. **データ項目**
   - 事業所番号
   - 事業所名
   - 事業所住所
   - AM（Account Manager / アカウントマネージャー）名

2. **インポート方式**
   - Excel/CSVファイルのアップロード
   - ファイル形式のパース
   - データマッピング・バリデーション
   - 一括インポート処理

3. **データ反映**
   - `departments`テーブルまたは`organizations`テーブルに反映
   - 既存データとの更新処理（事業所番号でマッチング）

4. **UI要件**
   - インポート用ページ（`/dashboard/departments/import-addresses`）
   - インポート結果の表示
   - エラーログの表示

#### 技術要件
- Excel/CSVパーサーの実装
- インポートAPIエンドポイント（`/api/departments/import-addresses`）
- インポートUIの実装

#### データベース変更
- `departments`テーブルに以下カラムを追加:
  - `office_number` TEXT（事業所番号）
  - `address` TEXT（事業所住所）
  - `account_manager` TEXT（AM名）

---

## 12. 指導員登録機能

### 要件ID: REQ-012
### 要件名: 技能実習指導員と生活指導員の登録

#### 概要
技能実習指導員と生活指導員の名前を登録し、一覧に反映する。

#### 詳細要件
1. **登録項目**
   - 指導員名
   - 指導員タイプ（技能実習指導員 / 生活指導員）
   - 所属事業所
   - 連絡先（メールアドレス、電話番号等）

2. **機能要件**
   - 指導員の新規登録
   - 指導員情報の編集
   - 指導員一覧の表示
   - 事業所別フィルタリング

3. **UI要件**
   - 指導員登録ページ（`/dashboard/instructors/new`）
   - 指導員一覧ページ（`/dashboard/instructors`）
   - 指導員編集ページ（`/dashboard/instructors/[id]/edit`）

#### 技術要件
- 指導員管理用のCRUD機能
- 指導員一覧表示コンポーネント

#### データベース変更
- `instructors`テーブル（新規）を作成:
  - `id` UUID PRIMARY KEY
  - `name` TEXT NOT NULL
  - `instructor_type` TEXT（SKILL_INSTRUCTOR / LIFE_INSTRUCTOR）
  - `department_id` UUID REFERENCES departments(id)
  - `email` TEXT
  - `phone` TEXT
  - `is_active` BOOLEAN DEFAULT true
  - `created_at` TIMESTAMP
  - `updated_at` TIMESTAMP

---

## 13. Excel出力機能

### 要件ID: REQ-013
### 要件名: 実習生データのExcel出力

#### 概要
実習生データをExcel形式で出力できる機能を実装する。

#### 詳細要件
1. **出力対象データ**
   - 実習生基本情報
   - 在留カード情報
   - 社宅情報
   - 入社書類情報
   - その他関連情報

2. **出力形式**
   - Excel形式（.xlsx）
   - シート構成のカスタマイズ可能（オプション）

3. **機能要件**
   - 全実習生データの一括出力
   - 検索条件に基づくフィルタリング出力
   - 出力項目の選択（カスタマイズ可能、オプション）

4. **UI要件**
   - 実習生一覧ページに「Excel出力」ボタンを配置
   - 出力完了後、ダウンロードリンクを表示

#### 技術要件
- Excel生成ライブラリの使用（例: `xlsx`、`exceljs`）
- 出力APIエンドポイント（`/api/trainees/export`）
- 既存の`/api/trainees/export/route.ts`を拡張

#### 依存ライブラリ
- `xlsx` または `exceljs`

---

## 14. 宛名ラベル作成機能

### 要件ID: REQ-014
### 要件名: 宛名ラベル作成用Excelファイルへの自動遷移

#### 概要
宛名ラベル作成用のExcelファイルに自動的にページが飛ぶ機能を実装する。

#### 詳細要件
1. **機能概要**
   - 実習生一覧または詳細ページから「宛名ラベル作成」ボタンを配置
   - ボタンクリックで宛名ラベル用Excelファイルを生成・ダウンロード
   - または、外部サービス（例: Excel Online）にデータを送信して開く

2. **出力データ形式**
   - 実習生の名前（日本語・英語）
   - 社宅住所
   - 郵便番号
   - その他宛名ラベルに必要な情報

3. **Excelファイル形式**
   - 宛名ラベル印刷に対応したレイアウト
   - 一般的な宛名ラベル形式（A4サイズ、ラベルシート形式等）

4. **UI要件**
   - 「宛名ラベル作成」ボタンの配置
   - 対象実習生の選択（複数選択可）
   - 出力処理中のローディング表示

#### 技術要件
- Excel生成ライブラリの使用
- 宛名ラベル用APIエンドポイント（`/api/trainees/export-labels`）
- 既存の出力機能を拡張

#### 依存ライブラリ
- `xlsx` または `exceljs`

---

## 実装優先度

### 高優先度
1. REQ-001: 権限管理の拡張（人事部・経理部）
2. REQ-002: 検索機能の実装
3. REQ-005: 手動入力項目の追加
4. REQ-007: 在留期限通知（1ヶ月前）

### 中優先度
5. REQ-006: Google Maps連携
6. REQ-008: 在留期限通知（8ヶ月前）
7. REQ-009: PDF書類管理
8. REQ-013: Excel出力機能

### 低優先度（外部連携・複雑な機能）
9. REQ-003: 在留カードOCR機能（外部API依存）
10. REQ-004: SmartHR連携（外部API依存）
11. REQ-010: 事業所責任者一覧取り込み
12. REQ-011: 事業所住所一覧取り込み
13. REQ-012: 指導員登録機能
14. REQ-014: 宛名ラベル作成機能

---

## 技術的検討事項

### 外部サービス統合
- **OCR機能**: Google Cloud Vision API、AWS Textract、Azure Computer Vision等の選定
- **SmartHR連携**: API仕様の確認、認証方式の決定
- **メール通知**: Supabase FunctionsまたはSendGrid等の利用検討

### パフォーマンス考慮
- 大量データの検索・出力時のパフォーマンス最適化
- インデックスの適切な設定
- ページネーションの実装

### セキュリティ考慮
- 個人情報の取り扱い（在留カード情報等）
- ファイルアップロード時のバリデーション
- 権限チェックの徹底

### データ整合性
- 外部データ取り込み時のバリデーション
- 重複データの検出・処理
- データ更新履歴の管理

---

## 次ステップ

1. 詳細設計書の作成
2. API仕様書の作成
3. データベーススキーマ設計の詳細化
4. UI/UXデザインの検討
5. 外部サービス選定・契約（OCR、SmartHR等）
6. 開発スプリント計画の策定





