// ガントチャートのタスクアイコンタイプ
export type GanttTaskIcon = 'folder' | 'document' | 'person' | 'task';

// ガントチャートのタスクカラー
export type GanttTaskColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray';

// ガントチャートビューモード
export type GanttViewMode = 'day' | 'week' | 'month' | 'quarter';

// ガントチャートのタスクエンティティ
export interface GanttTask {
  id: string;
  title: string;
  icon?: GanttTaskIcon;
  color?: GanttTaskColor;
  category?: string;
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  dependencies: string[]; // 依存するタスクのID配列
  isCriticalPath: boolean;
  parentId?: string;
  children?: string[];
  assignee?: string;
  assigneeIcon?: string;
  groupId?: string;
  wbsTaskId?: string; // WBSタスクとのリンク
  createdAt: Date;
  updatedAt: Date;
}

// ガントチャートの依存関係
export interface GanttDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

// ガントチャートのグループ
export interface GanttGroup {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

// ガントチャートのメンバー
export interface GanttMember {
  id: string;
  name: string;
  email?: string;
  icon?: string;
}

// ガントチャートタスクの作成用DTO
export interface CreateGanttTaskDto {
  title: string;
  icon?: GanttTaskIcon;
  color?: GanttTaskColor;
  category?: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  parentId?: string;
  assignee?: string;
  groupId?: string;
  wbsTaskId?: string;
}

// ガントチャートタスクの更新用DTO
export interface UpdateGanttTaskDto {
  title?: string;
  icon?: GanttTaskIcon;
  color?: GanttTaskColor;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  parentId?: string;
  assignee?: string;
  groupId?: string;
}

// ガントチャートのフィルター条件
export interface GanttFilter {
  assignee?: string;
  groupId?: string;
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}