# Productivity Tools Suite プロジェクト概要

## プロジェクトの目的
非プログラマー向けの生産性ツール集（ToDo、WBS、カンバン、ガントチャート）を提供するWebアプリケーション。

## 技術スタック
- **Frontend**: Next.js 14 (App Router), React 19, TypeScript 5
- **UI**: Tailwind CSS, Shadcn/ui, Radix UI
- **State Management**: Zustand
- **Database**: SQLite WASM (ブラウザ内で動作)
- **Data Fetching**: TanStack React Query
- **DnD**: React DnD Kit
- **Testing**: Vitest, Testing Library
- **Date handling**: date-fns
- **Icons**: Lucide React

## プロジェクト構造
```
productivity-tools/
├── app/              # Next.js App Router
├── components/       # UIコンポーネント
│   ├── layout/      # レイアウト関連
│   ├── ui/          # Shadcn/ui基本コンポーネント
│   ├── todo/        # ToDo機能
│   └── wbs/         # WBS機能
├── lib/             # ビジネスロジック
│   ├── db/          # SQLiteデータベース層
│   ├── repositories/ # データアクセス層
│   └── stores/      # Zustand状態管理
└── test/            # テスト設定

## アーキテクチャパターン
- Repositoryパターンでデータアクセスを抽象化
- Zustandストアで状態管理
- React Queryでデータフェッチとキャッシュ管理
```