export interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: "high" | "medium" | "low";
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WBSTask {
  id: string;
  title: string;
  parent_id?: string;
  position: number;
  hierarchy_number?: string; // 階層番号（例: "1.1.1"）
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  assignee?: string;
  reviewer?: string;
  start_date?: string; // 開始日
  end_date?: string; // 終了日
  due_date?: string;
  work_days?: number; // 工数（人日）
  remarks?: string; // 備考
  dependencies?: string[];
  created_at: string;
  updated_at: string;
  children?: WBSTask[];
}

export interface KanbanLane {
  id: string;
  title: string;
  position: number;
  wip_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  lane_id: string;
  position: number;
  labels?: string;
  todo_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GanttTask {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  progress: number;
  wbs_task_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GanttDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  type: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish";
  created_at: string;
}