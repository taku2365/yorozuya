export interface TaskLink {
  id: string;
  unifiedId: string;  // 統一タスクID (例: todo:123, wbs:456)
  viewType: 'todo' | 'wbs' | 'kanban' | 'gantt';
  originalId: string; // 各ビューでのオリジナルID
  syncEnabled: boolean;
  createdAt: string;
  lastSyncedAt: string;
}

export type CreateTaskLinkDto = Omit<TaskLink, 'id' | 'createdAt' | 'lastSyncedAt'>;
export type UpdateTaskLinkDto = Partial<Omit<TaskLink, 'id' | 'createdAt'>>;

export interface TaskLinkGroup {
  unifiedId: string;
  links: TaskLink[];
  syncEnabled: boolean;
}