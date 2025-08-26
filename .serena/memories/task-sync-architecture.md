# タスク同期アーキテクチャ設計

## 概要
ビュー間でタスクを同期し、進捗や状態の更新を反映するシステム

## 主要コンポーネント

### 1. 統一タスクID (Unified Task ID)
- 形式: `{view}:{original_id}`
- 例: `todo:todo123`, `wbs:wbs456`
- タスクの起源を識別可能

### 2. タスクリンクテーブル
```typescript
interface TaskLink {
  id: string;
  unifiedId: string;  // 統一タスクID
  viewType: 'todo' | 'wbs' | 'kanban' | 'gantt';
  originalId: string; // 各ビューでのID
  syncEnabled: boolean;
  lastSyncedAt: Date;
}
```

### 3. 同期マッピング
```typescript
interface SyncMapping {
  // ToDoの完了状態 → 他ビューの状態
  todoCompleted: {
    wbs: { progress: 100, status: 'completed' },
    kanban: { laneId: 'done' },
    gantt: { progress: 100 }
  },
  
  // WBSの進捗 → 他ビューの状態
  wbsProgress: {
    0: { todo: { completed: false }, kanban: { laneId: 'todo' } },
    100: { todo: { completed: true }, kanban: { laneId: 'done' } },
    // 1-99は in-progress
  }
}
```

### 4. タスク転送ダイアログ
- タスク複数選択
- 転送先ビュー選択（複数可）
- 同期ON/OFF切り替え
- 転送実行

### 5. 同期サービス
- リアルタイム同期（変更検知）
- バッチ同期（手動実行）
- 競合解決（最新の変更を優先）