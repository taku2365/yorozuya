# 統合スケジュール管理ツール 実装計画

## Phase 1: データモデル統合（1週間）

### 1.1 統一タスクモデルの実装
```typescript
// lib/types/unified-task.ts
export interface UnifiedTask {
  // 基本属性
  id: string;
  type: 'todo' | 'wbs' | 'kanban' | 'gantt';
  title: string;
  description?: string;
  
  // 進捗管理
  progress: number; // 0-100
  completed: boolean;
  completedAt?: Date;
  
  // 階層構造
  parentId?: string;
  children?: string[];
  position: number;
  hierarchyNumber?: string;
  
  // スケジュール
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  
  // 担当者
  assigneeId?: string;
  reviewerId?: string;
  
  // 共通拡張
  priority?: 'high' | 'medium' | 'low';
  labels?: string[];
  category?: string;
  icon?: string;
  color?: string;
  
  // 工数
  estimatedHours?: number;
  actualHours?: number;
  workDays?: number;
  
  // 関連
  dependencies?: string[];
  relatedTasks?: {
    todoId?: string;
    wbsTaskId?: string;
    kanbanCardId?: string;
    ganttTaskId?: string;
  };
  
  // メタデータ
  metadata?: Record<string, any>;
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 データベーススキーマの作成
- 新しい`unified_tasks`テーブルの作成
- インデックスの最適化
- 外部キー制約の設定

### 1.3 リポジトリ層の実装
```typescript
// lib/repositories/unified-task-repository.ts
export class UnifiedTaskRepository {
  async create(task: Partial<UnifiedTask>): Promise<UnifiedTask>
  async update(id: string, task: Partial<UnifiedTask>): Promise<UnifiedTask>
  async delete(id: string): Promise<void>
  async findById(id: string): Promise<UnifiedTask | null>
  async findByType(type: UnifiedTask['type']): Promise<UnifiedTask[]>
  async findChildren(parentId: string): Promise<UnifiedTask[]>
  async search(query: string): Promise<UnifiedTask[]>
}
```

### 1.4 マイグレーション
- 既存データの統合テーブルへの移行
- データ整合性の確保
- ロールバック機能の実装

## Phase 2: 統合UI基盤（1週間）

### 2.1 レイアウトコンポーネント
```typescript
// components/layout/integrated-layout.tsx
export function IntegratedLayout({ children }: { children: React.ReactNode }) {
  // 統合ナビゲーション
  // サイドバー
  // メインコンテンツエリア
}
```

### 2.2 ビュー切り替え機能
```typescript
// components/navigation/view-switcher.tsx
export function ViewSwitcher() {
  // Todo | WBS | カンバン | ガント の切り替え
  // URLルーティングとの連携
}
```

### 2.3 共通フィルタコンポーネント
```typescript
// components/common/task-filter.tsx
export function TaskFilter() {
  // ステータス、優先度、担当者、期限でのフィルタリング
  // 全ビュー共通で使用
}
```

### 2.4 統合検索機能
```typescript
// components/common/global-search.tsx
export function GlobalSearch() {
  // 全タスクタイプを横断検索
  // リアルタイム検索結果表示
}
```

## Phase 3: ビュー間連携（2週間）

### 3.1 Zustand統合ストア
```typescript
// stores/unified-task-store.ts
interface UnifiedTaskStore {
  tasks: UnifiedTask[];
  filters: TaskFilters;
  viewMode: 'todo' | 'wbs' | 'kanban' | 'gantt';
  
  // Actions
  createTask: (task: Partial<UnifiedTask>) => Promise<void>;
  updateTask: (id: string, task: Partial<UnifiedTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // View-specific actions
  moveToKanbanLane: (taskId: string, laneId: string) => Promise<void>;
  updateWBSHierarchy: (taskId: string, parentId: string) => Promise<void>;
  updateGanttSchedule: (taskId: string, dates: { start: Date; end: Date }) => Promise<void>;
}
```

### 3.2 各ビューのアダプター
```typescript
// adapters/todo-adapter.ts
export function todoAdapter(tasks: UnifiedTask[]): Todo[] {
  return tasks
    .filter(task => task.type === 'todo' || task.dueDate)
    .map(taskToTodo);
}

// 同様にWBS、カンバン、ガント用のアダプターも作成
```

### 3.3 ドラッグ&ドロップ連携
```typescript
// hooks/use-cross-view-dnd.ts
export function useCrossViewDnD() {
  // ビュー間でのタスク移動
  // タイプ変換と属性マッピング
}
```

### 3.4 リアルタイム同期
- 楽観的更新の実装
- 競合解決メカニズム
- エラーハンドリング

## Phase 4: 高度な機能（1週間）

### 4.1 一括操作
```typescript
// components/common/bulk-actions.tsx
export function BulkActions() {
  // 複数タスクの選択
  // 一括ステータス変更
  // 一括削除/アーカイブ
}
```

### 4.2 レポート機能
```typescript
// components/reports/project-dashboard.tsx
export function ProjectDashboard() {
  // 進捗サマリー
  // リソース使用状況
  // 期限アラート
  // バーンダウンチャート
}
```

### 4.3 インポート/エクスポート
```typescript
// utils/import-export.ts
export async function exportTasks(format: 'json' | 'csv' | 'excel'): Promise<Blob>
export async function importTasks(file: File): Promise<UnifiedTask[]>
```

### 4.4 通知システム
- 期限通知
- ステータス変更通知
- メンション通知

## Phase 5: テストとデプロイ（1週間）

### 5.1 単体テスト
- 統合モデルのテスト
- 各アダプターのテスト
- ストアのテスト

### 5.2 統合テスト
- ビュー間連携のテスト
- データ同期のテスト
- パフォーマンステスト

### 5.3 E2Eテスト
- ユーザーシナリオベースのテスト
- クロスブラウザテスト

### 5.4 移行とデプロイ
- 段階的な移行計画
- バックアップとロールバック
- ユーザーガイドの作成

## 技術スタック

### フロントエンド
- Next.js 15 (App Router)
- TypeScript
- Zustand (状態管理)
- React DnD Kit (ドラッグ&ドロップ)
- Tailwind CSS
- shadcn/ui

### バックエンド
- SQLite WASM (オフライン対応)
- tRPC (型安全なAPI)

### テスト
- Vitest (単体テスト)
- Testing Library (統合テスト)
- Playwright (E2Eテスト)

## リスクと対策

### 1. データ移行の複雑性
- **リスク**: 既存データの不整合
- **対策**: 段階的移行、検証スクリプト、ロールバック機能

### 2. パフォーマンス
- **リスク**: 大量タスクでの性能低下
- **対策**: 仮想スクロール、遅延読み込み、インデックス最適化

### 3. ユーザー体験の変化
- **リスク**: 既存ユーザーの混乱
- **対策**: 移行ガイド、チュートリアル、段階的な機能公開

## マイルストーン

1. **Week 1**: データモデル統合完了
2. **Week 2**: 統合UI基盤完了
3. **Week 3-4**: ビュー間連携完了
4. **Week 5**: 高度な機能完了
5. **Week 6**: テストとデプロイ完了

## 成功指標

- 全データの統合成功率: 100%
- ページロード時間: < 2秒
- ユーザー満足度: 90%以上
- バグ発生率: < 1%
- 単体テストカバレッジ: > 80%