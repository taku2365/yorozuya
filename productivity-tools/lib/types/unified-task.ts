export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ViewType = 'todo' | 'wbs' | 'kanban' | 'gantt';

export interface UnifiedTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  tags?: string[];
  views: ViewType[];
  metadata: Record<string, any>;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  startDate?: Date;
  endDate?: Date;
  
  // Hierarchy
  parentId?: string;
  order?: number;
}