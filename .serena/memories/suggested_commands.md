# 開発用コマンド一覧

## 基本コマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションサーバー起動
npm start

# リント実行
npm run lint

# テスト実行
npm test

# UIモードでテスト実行
npm run test:ui

# ウォッチモードでテスト実行
npm run test:watch
```

## Git操作
```bash
# ステータス確認
git status

# 差分確認
git diff

# コミット履歴確認
git log --oneline -10
```

## プロジェクトナビゲーション
```bash
# プロジェクトルートへ移動
cd productivity-tools

# 主要ディレクトリ
cd lib/db           # データベース層
cd lib/repositories # リポジトリ層
cd lib/stores      # 状態管理層
cd components      # UIコンポーネント
cd app            # Next.jsページ
```