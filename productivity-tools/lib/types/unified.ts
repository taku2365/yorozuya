/**
 * Unified Task Model Types
 * 統合タスクモデルの型定義
 */

/**
 * タスクの基本ステータス
 */
export type TaskStatus = 
  | 'not_started'    // 未着手
  | 'in_progress'    // 進行中
  | 'completed'      // 完了
  | 'on_hold'        // 保留
  | 'cancelled';     // キャンセル

/**
 * タスクの優先度
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * ビューのタイプ
 */
export type ViewType = 'todo' | 'wbs' | 'kanban' | 'gantt';

/**
 * 統一タスクインターフェース
 * すべてのツールで共通する基本的なタスクデータ
 */
export interface UnifiedTask {
  // 基本情報
  id: string;
  title: string;
  description?: string;
  
  // ステータス管理
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0-100の進捗率
  
  // 日付管理
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  
  // 担当者
  assigneeId?: string;
  assigneeName?: string;
  reviewerId?: string;
  reviewerName?: string;
  
  // 階層構造
  parentId?: string;
  order: number; // 同一階層内での並び順
  hierarchyLevel: number; // 階層の深さ (0が最上位)
  
  // 関連付け
  tags: string[];
  labels: Label[];
  
  // 元のツール情報
  sourceType: ViewType;
  sourceId: string; // 元のテーブルでのID
  
  // ビュー固有の拡張データ
  metadata: TaskMetadata;
}

/**
 * ラベル情報
 */
export interface Label {
  id: string;
  name: string;
  color: string;
}

/**
 * タスクのメタデータ（ビュー固有の拡張情報）
 */
export interface TaskMetadata {
  // Todo固有
  todo?: {
    recurring?: boolean;
    recurringPattern?: string;
  };
  
  // WBS固有
  wbs?: {
    hierarchyNumber: string; // "1.2.3"形式
    estimatedHours?: number;
    actualHours?: number;
    workDays?: number;
    remarks?: string;
    isDeliverable?: boolean;
  };
  
  // Kanban固有
  kanban?: {
    laneId: string;
    laneName: string;
    position: number;
    blockedReason?: string;
    cardColor?: string;
  };
  
  // Gantt固有
  gantt?: {
    dependencies: GanttDependency[];
    icon?: string;
    color?: string;
    groupId?: string;
    groupName?: string;
    isMilestone?: boolean;
    criticalPath?: boolean;
  };
}

/**
 * ガント依存関係
 */
export interface GanttDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag: number; // 日数
}

/**
 * 統一タスクのフィルタ条件
 */
export interface UnifiedTaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeIds?: string[];
  tags?: string[];
  labelIds?: string[];
  viewTypes?: ViewType[];
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'dueDate';
    from?: Date;
    to?: Date;
  };
  searchText?: string;
  parentId?: string | null; // nullは最上位タスクのみ
}

/**
 * 統一タスクのソート条件
 */
export interface UnifiedTaskSort {
  field: keyof UnifiedTask | 'customOrder';
  direction: 'asc' | 'desc';
}

/**
 * ビュー間のタスクマッピング情報
 */
export interface TaskMapping {
  unifiedId: string;
  todoId?: string;
  wbsId?: string;
  kanbanCardId?: string;
  ganttTaskId?: string;
}

/**
 * タスクの一括操作
 */
export interface BulkTaskOperation {
  taskIds: string[];
  operation: 
    | { type: 'updateStatus'; status: TaskStatus }
    | { type: 'updatePriority'; priority: TaskPriority }
    | { type: 'updateAssignee'; assigneeId: string }
    | { type: 'addTags'; tags: string[] }
    | { type: 'removeTags'; tags: string[] }
    | { type: 'move'; parentId: string | null }
    | { type: 'delete' };
}

/**
 * タスクの変更履歴
 */
export interface TaskHistory {
  id: string;
  taskId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  changes: Record<string, { old: any; new: any }>;
}

/**
 * 統一タスクのイベント
 */
export interface UnifiedTaskEvent {
  type: 'created' | 'updated' | 'deleted' | 'moved' | 'statusChanged';
  taskId: string;
  task?: UnifiedTask;
  previousData?: Partial<UnifiedTask>;
  userId: string;
  timestamp: Date;
  source: ViewType;
}