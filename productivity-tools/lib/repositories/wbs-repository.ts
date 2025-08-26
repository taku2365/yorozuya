import { v4 as uuidv4 } from "uuid";
import type { Database } from "../db/database";
import type { WBSTask } from "../db/types";
import { calculateWorkDays } from "../utils/work-days";
import { generateHierarchyNumber, recalculateHierarchyNumbers } from "../utils/wbs-hierarchy";
import { determineInsertionHierarchy, getTasksToRenumber } from "../utils/wbs-insert-logic";

export interface CreateWBSTaskDto {
  name?: string; // タスク転送サービス用に追加
  title?: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  parent_id?: string;
  parentId?: string | null; // タスク転送サービス用
  position?: number;
  order?: number; // タスク転送サービス用
  hierarchy_number?: string;
  hierarchyNumber?: string; // タスク転送サービス用
  estimated_hours?: number;
  progress?: number;
  assignee?: string | null;
  reviewer?: string;
  start_date?: string;
  startDate?: string; // タスク転送サービス用
  end_date?: string;
  endDate?: string; // タスク転送サービス用
  due_date?: string;
  work_days?: number;
  remarks?: string;
}

export interface UpdateWBSTaskDto {
  name?: string;
  title?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  hierarchy_number?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress?: number;
  assignee?: string;
  reviewer?: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  work_days?: number;
  remarks?: string;
}

export class WBSRepository {
  constructor(private db: Database) {}

  async create(data: CreateWBSTaskDto): Promise<WBSTask> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // 互換性のためのマッピング
    const title = data.name || data.title || '';
    const parent_id = data.parentId !== undefined ? data.parentId : data.parent_id;
    const position = data.order !== undefined ? data.order : (data.position ?? 0);
    const hierarchy_number = data.hierarchyNumber || data.hierarchy_number;
    const start_date = data.startDate || data.start_date;
    const end_date = data.endDate || data.end_date;
    
    const task: WBSTask = {
      id,
      title,
      parent_id,
      position,
      estimated_hours: data.estimated_hours,
      actual_hours: undefined,
      progress: data.progress ?? 0,
      assignee: data.assignee,
      reviewer: data.reviewer,
      due_date: data.due_date,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO wbs_tasks (id, title, parent_id, position, estimated_hours, actual_hours, progress, assignee, reviewer, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.parent_id || null,
        task.position,
        task.estimated_hours || null,
        task.actual_hours || null,
        task.progress,
        task.assignee || null,
        task.reviewer || null,
        task.due_date || null,
        task.created_at,
        task.updated_at,
      ]
    );

    return task;
  }

  async findAll(): Promise<WBSTask[]> {
    const rows = await this.db.execute(
      "SELECT * FROM wbs_tasks ORDER BY parent_id, position",
      []
    );

    const tasksMap = new Map<string, WBSTask>();
    const rootTasks: WBSTask[] = [];

    // First pass: create all tasks
    for (const row of rows) {
      const task = this.mapRowToTask(row);
      tasksMap.set(task.id, task);
    }

    // Second pass: build hierarchy
    for (const task of tasksMap.values()) {
      if (task.parent_id) {
        const parent = tasksMap.get(task.parent_id);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(task);
        }
      } else {
        rootTasks.push(task);
      }
    }

    return rootTasks;
  }

  async findById(id: string): Promise<WBSTask | null> {
    const allTasks = await this.db.execute(
      "SELECT * FROM wbs_tasks",
      []
    );

    const tasksMap = new Map<string, WBSTask>();
    let targetTask: WBSTask | null = null;

    // Build task map
    for (const row of allTasks) {
      const task = this.mapRowToTask(row);
      tasksMap.set(task.id, task);
      if (task.id === id) {
        targetTask = task;
      }
    }

    if (!targetTask) {
      return null;
    }

    // Build children for the target task
    for (const task of tasksMap.values()) {
      if (task.parent_id === id) {
        if (!targetTask.children) {
          targetTask.children = [];
        }
        targetTask.children.push(task);
      }
    }

    return targetTask;
  }

  async update(id: string, data: UpdateWBSTaskDto): Promise<WBSTask | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title);
    }

    if (data.estimated_hours !== undefined) {
      fields.push("estimated_hours = ?");
      params.push(data.estimated_hours);
    }

    if (data.actual_hours !== undefined) {
      fields.push("actual_hours = ?");
      params.push(data.actual_hours);
    }

    if (data.progress !== undefined) {
      fields.push("progress = ?");
      params.push(data.progress);
    }

    if (data.assignee !== undefined) {
      fields.push("assignee = ?");
      params.push(data.assignee);
    }

    if (data.reviewer !== undefined) {
      fields.push("reviewer = ?");
      params.push(data.reviewer);
    }

    if (data.due_date !== undefined) {
      fields.push("due_date = ?");
      params.push(data.due_date);
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    const sql = `UPDATE wbs_tasks SET ${fields.join(", ")} WHERE id = ?`;
    await this.db.execute(sql, params);

    return this.findById(id);
  }

  async updateProgress(taskId: string): Promise<void> {
    const allTasks = await this.db.execute(
      "SELECT * FROM wbs_tasks",
      []
    );

    const children = allTasks.filter((row: any) => row.parent_id === taskId);

    if (children.length > 0) {
      const totalProgress = children.reduce((sum: number, child: any) => sum + child.progress, 0);
      const averageProgress = Math.round(totalProgress / children.length);

      await this.db.execute(
        "UPDATE wbs_tasks SET progress = ?, updated_at = ? WHERE id = ?",
        [averageProgress, new Date().toISOString(), taskId]
      );

      // Recursively update parent
      const task = allTasks.find((row: any) => row.id === taskId);
      if (task && task.parent_id) {
        await this.updateProgress(task.parent_id);
      }
    }
  }

  async move(taskId: string, newParentId: string | null, newPosition: number): Promise<void> {
    await this.db.execute(
      "UPDATE wbs_tasks SET parent_id = ?, position = ?, updated_at = ? WHERE id = ?",
      [newParentId, newPosition, new Date().toISOString(), taskId]
    );
  }

  async delete(taskId: string): Promise<void> {
    // Get all tasks to find descendants
    const allTasks = await this.db.execute(
      "SELECT * FROM wbs_tasks",
      []
    );

    const toDelete = new Set<string>();
    
    const collectDescendants = (id: string) => {
      toDelete.add(id);
      const children = allTasks.filter((row: any) => row.parent_id === id);
      for (const child of children) {
        collectDescendants(child.id);
      }
    };

    collectDescendants(taskId);

    if (toDelete.size > 0) {
      const ids = Array.from(toDelete);
      const placeholders = ids.map(() => "?").join(", ");
      await this.db.execute(
        `DELETE FROM wbs_tasks WHERE id IN (${placeholders})`,
        [ids]
      );
    }
  }

  async getDescendants(taskId: string): Promise<WBSTask[]> {
    const allTasks = await this.db.execute(
      "SELECT * FROM wbs_tasks",
      []
    );

    const descendants: WBSTask[] = [];
    
    const collectDescendants = (id: string, tasks: any[]) => {
      const children = tasks.filter((row: any) => row.parent_id === id);
      for (const child of children) {
        descendants.push(this.mapRowToTask(child));
        collectDescendants(child.id, tasks);
      }
    };

    collectDescendants(taskId, allTasks);
    return descendants;
  }

  async getTotalEstimatedHours(taskId: string): Promise<number> {
    const allTasks = await this.db.execute(
      "SELECT * FROM wbs_tasks",
      []
    );

    let total = 0;
    
    const task = allTasks.find((row: any) => row.id === taskId);
    if (task && task.estimated_hours) {
      total += task.estimated_hours;
    }

    const descendants = await this.getDescendants(taskId);
    for (const descendant of descendants) {
      if (descendant.estimated_hours) {
        total += descendant.estimated_hours;
      }
    }

    return total;
  }

  private mapRowToTask(row: any): WBSTask {
    return {
      id: row.id,
      title: row.title,
      parent_id: row.parent_id || undefined,
      position: row.position,
      hierarchy_number: row.hierarchy_number || undefined,
      estimated_hours: row.estimated_hours || undefined,
      actual_hours: row.actual_hours || undefined,
      progress: row.progress,
      assignee: row.assignee || undefined,
      reviewer: row.reviewer || undefined,
      start_date: row.start_date || undefined,
      end_date: row.end_date || undefined,
      due_date: row.due_date || undefined,
      work_days: row.work_days || undefined,
      remarks: row.remarks || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * 階層番号から親の階層番号を取得する
   * @param hierarchyNumber - 階層番号（例: "1.2.3"）
   * @returns 親の階層番号（例: "1.2"）またはnull
   */
  private getParentHierarchyNumber(hierarchyNumber: string): string | null {
    const parts = hierarchyNumber.split('.');
    if (parts.length <= 1) {
      return null;
    }
    return parts.slice(0, -1).join('.');
  }

  // Professional features

  async createWithHierarchyNumber(data: CreateWBSTaskDto): Promise<WBSTask> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Calculate work days if dates are provided
    let workDays: number | undefined;
    if (data.start_date && data.end_date) {
      const calculated = calculateWorkDays(data.start_date, data.end_date);
      workDays = calculated !== null ? calculated : undefined;
    }
    
    // If hierarchy number is provided but parent_id is not, find parent by hierarchy number
    let parentId = data.parent_id;
    if (data.hierarchy_number && !parentId) {
      const parentHierarchyNumber = this.getParentHierarchyNumber(data.hierarchy_number);
      if (parentHierarchyNumber) {
        const allTasks = await this.findAll();
        const parentTask = allTasks.find(t => t.hierarchy_number === parentHierarchyNumber);
        if (parentTask) {
          parentId = parentTask.id;
        }
      }
    }
    
    const task: WBSTask = {
      id,
      title: data.title,
      parent_id: parentId,
      position: data.position ?? 0,
      hierarchy_number: data.hierarchy_number,
      estimated_hours: data.estimated_hours,
      actual_hours: undefined,
      progress: data.progress ?? 0,
      assignee: data.assignee,
      reviewer: data.reviewer,
      start_date: data.start_date,
      end_date: data.end_date,
      due_date: data.due_date,
      work_days: workDays || data.work_days,
      remarks: data.remarks,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO wbs_tasks (id, title, parent_id, position, hierarchy_number, estimated_hours, actual_hours, progress, assignee, reviewer, start_date, end_date, due_date, work_days, remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.parent_id || null,
        task.position,
        task.hierarchy_number || null,
        task.estimated_hours || null,
        task.actual_hours || null,
        task.progress,
        task.assignee || null,
        task.reviewer || null,
        task.start_date || null,
        task.end_date || null,
        task.due_date || null,
        task.work_days || null,
        task.remarks || null,
        task.created_at,
        task.updated_at,
      ]
    );

    return task;
  }

  async createWithDateRange(data: CreateWBSTaskDto): Promise<WBSTask> {
    // Calculate work days from date range
    if (data.start_date && data.end_date) {
      const workDays = calculateWorkDays(data.start_date, data.end_date);
      if (workDays !== null) {
        data.work_days = workDays;
      }
    }
    
    return this.createWithHierarchyNumber(data);
  }

  async updateWithRecalculation(id: string, data: UpdateWBSTaskDto): Promise<WBSTask | null> {
    // Recalculate work days if dates change
    if (data.start_date && data.end_date) {
      const workDays = calculateWorkDays(data.start_date, data.end_date);
      if (workDays !== null) {
        data.work_days = workDays;
      }
    }
    
    const fields: string[] = [];
    const params: any[] = [];

    // Add all possible fields
    const fieldMap: Record<string, any> = {
      title: data.title,
      hierarchy_number: data.hierarchy_number,
      estimated_hours: data.estimated_hours,
      actual_hours: data.actual_hours,
      progress: data.progress,
      assignee: data.assignee,
      reviewer: data.reviewer,
      start_date: data.start_date,
      end_date: data.end_date,
      due_date: data.due_date,
      work_days: data.work_days,
      remarks: data.remarks,
    };

    for (const [field, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());
    params.push(id);

    const sql = `UPDATE wbs_tasks SET ${fields.join(", ")} WHERE id = ?`;
    await this.db.execute(sql, params);

    return this.findById(id);
  }

  async insertTaskAfter(afterTaskId: string, data: CreateWBSTaskDto): Promise<WBSTask> {
    // Get all tasks to determine position and hierarchy
    const allTasks = await this.findAll();
    const flatTasks = this.flattenTasks(allTasks);
    
    // Find the task to insert after
    const afterTask = flatTasks.find(t => t.id === afterTaskId);
    if (!afterTask) {
      throw new Error(`Task ${afterTaskId} not found`);
    }
    
    // Determine the hierarchy and parent for the new task
    const { hierarchyNumber, parentId } = determineInsertionHierarchy(afterTask, flatTasks);
    
    // Set the hierarchy number and parent
    data.hierarchy_number = hierarchyNumber;
    data.parent_id = parentId;
    
    // Update hierarchy numbers for tasks that need to be shifted
    const tasksToRenumber = getTasksToRenumber(hierarchyNumber, flatTasks);
    for (const update of tasksToRenumber) {
      await this.db.execute(
        "UPDATE wbs_tasks SET hierarchy_number = ?, updated_at = ? WHERE id = ?",
        [update.newHierarchyNumber, new Date().toISOString(), update.id]
      );
    }
    
    // Set position based on parent
    const siblings = flatTasks.filter(t => t.parent_id === parentId);
    data.position = siblings.length;
    
    // Create the new task
    const newTask = await this.createWithHierarchyNumber(data);
    
    // Return the updated task
    return this.findById(newTask.id) || newTask;
  }

  async recalculateAllHierarchyNumbers(): Promise<void> {
    const allTasks = await this.findAll();
    const flatTasks = this.flattenTasks(allTasks);
    
    // Recalculate hierarchy numbers
    const updatedTasks = recalculateHierarchyNumbers(flatTasks);
    
    // Update each task's hierarchy number
    for (const task of updatedTasks) {
      await this.db.execute(
        "UPDATE wbs_tasks SET hierarchy_number = ? WHERE id = ?",
        [task.hierarchy_number, task.id]
      );
    }
  }

  async reorderTask(taskId: string, targetTaskId: string, position: "before" | "after"): Promise<void> {
    const allTasks = await this.findAll();
    const flatTasks = this.flattenTasks(allTasks);
    
    const task = flatTasks.find(t => t.id === taskId);
    const targetTask = flatTasks.find(t => t.id === targetTaskId);
    
    if (!task || !targetTask) {
      throw new Error("Task not found");
    }
    
    // Check if they have the same parent
    if (task.parent_id !== targetTask.parent_id) {
      throw new Error("Tasks must have the same parent to reorder");
    }
    
    // Get siblings sorted by position
    const siblings = flatTasks
      .filter(t => t.parent_id === task.parent_id)
      .sort((a, b) => a.position - b.position);
    
    // Remove the task from its current position
    const currentIndex = siblings.findIndex(t => t.id === taskId);
    siblings.splice(currentIndex, 1);
    
    // Find target index and insert
    const targetIndex = siblings.findIndex(t => t.id === targetTaskId);
    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    siblings.splice(insertIndex, 0, task);
    
    // Update positions for all siblings
    for (let i = 0; i < siblings.length; i++) {
      await this.db.execute(
        "UPDATE wbs_tasks SET position = ?, updated_at = ? WHERE id = ?",
        [i, new Date().toISOString(), siblings[i].id]
      );
    }
    
    // Recalculate hierarchy numbers
    await this.recalculateAllHierarchyNumbers();
  }

  private flattenTasks(tasks: WBSTask[]): WBSTask[] {
    const result: WBSTask[] = [];
    
    const flatten = (taskList: WBSTask[]) => {
      for (const task of taskList) {
        result.push(task);
        if (task.children) {
          flatten(task.children);
        }
      }
    };
    
    flatten(tasks);
    return result;
  }
}