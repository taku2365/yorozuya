# コーディング規約

## TypeScript
- strictモード有効
- 型定義は必須（any禁止）
- インターフェースとタイプエイリアスを適切に使い分け

## ファイル命名規則
- コンポーネント: PascalCase（例: TodoList.tsx）
- その他: kebab-case（例: todo-repository.ts）
- テスト: *.test.ts/tsx

## インポート順序
1. 外部ライブラリ
2. 内部モジュール（絶対パス）
3. 相対パス

## React/Next.js
- 関数コンポーネントのみ使用
- Hooksは「use」プレフィックス
- クライアントコンポーネントには'use client'ディレクティブ

## テスト
- describe/it構造でテストを整理
- AAA（Arrange-Act-Assert）パターン
- モックは最小限に

## コメント
- 基本的にコメントは不要（コードが自己文書化されるように）
- 複雑なビジネスロジックのみコメント追加

## Prettier/ESLint
- 設定ファイルに従って自動フォーマット
- コミット前にlintチェック必須