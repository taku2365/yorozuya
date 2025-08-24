import { v4 as uuidv4 } from "uuid";
import type { Database } from "../db/database";
import type { 
  GanttTask, 
  CreateGanttTaskDto, 
  UpdateGanttTaskDto,
  GanttFilter,
  GanttTaskIcon,
  GanttTaskColor
} from "../types/gantt";

export class GanttRepository {
  constructor(private db: Database) {}

  async create(data: CreateGanttTaskDto): Promise<GanttTask> {
    const id = uuidv4();
    const now = new Date();
    
    const task: GanttTask = {
      id,
      title: data.title,
      icon: data.icon,
      color: data.color,
      category: data.category,
      startDate: data.startDate,
      endDate: data.endDate,
      progress: data.progress ?? 0,
      dependencies: [],
      isCriticalPath: false,
      parentId: data.parentId,
      children: [],
      assignee: data.assignee,
      groupId: data.groupId,
      wbsTaskId: data.wbsTaskId,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.execute(
      `INSERT INTO gantt_tasks (
        id, title, icon, color, category, start_date, end_date, 
        progress, is_critical_path, parent_id, assignee, group_id, 
        wbs_task_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.icon || null,
        task.color || null,
        task.category || null,
        task.startDate.getTime(),
        task.endDate.getTime(),
        task.progress,
        task.isCriticalPath ? 1 : 0,
        task.parentId || null,
        task.assignee || null,
        task.groupId || null,
        task.wbsTaskId || null,
        task.createdAt.getTime(),
        task.updatedAt.getTime(),
      ]
    );

    return task;
  }

  async update(id: string, data: UpdateGanttTaskDto): Promise<GanttTask> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title);
    }

    if (data.icon !== undefined) {
      fields.push("icon = ?");
      params.push(data.icon);
    }

    if (data.color !== undefined) {
      fields.push("color = ?");
      params.push(data.color);
    }

    if (data.category !== undefined) {
      fields.push("category = ?");
      params.push(data.category);
    }

    if (data.startDate !== undefined) {
      fields.push("start_date = ?");
      params.push(data.startDate.getTime());
    }

    if (data.endDate !== undefined) {
      fields.push("end_date = ?");
      params.push(data.endDate.getTime());
    }

    if (data.progress !== undefined) {
      fields.push("progress = ?");
      params.push(data.progress);
    }

    if (data.parentId !== undefined) {
      fields.push("parent_id = ?");
      params.push(data.parentId);
    }

    if (data.assignee !== undefined) {
      fields.push("assignee = ?");
      params.push(data.assignee);
    }

    if (data.groupId !== undefined) {
      fields.push("group_id = ?");
      params.push(data.groupId);
    }

    fields.push("updated_at = ?");
    params.push(new Date().getTime());

    params.push(id);

    await this.db.execute(
      `UPDATE gantt_tasks SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    // モックデータを返す（テスト環境用）
    const rows = await this.db.execute(
      "SELECT * FROM gantt_tasks WHERE id = ?",
      [id]
    );
    
    if (!rows || rows.length === 0) {
      throw new Error("Task not found");
    }

    return this.mapRowToTask(rows[0]);
  }

  async updateSchedule(taskId: string, startDate: Date, endDate: Date): Promise<void> {
    await this.db.execute(
      "UPDATE gantt_tasks SET start_date = ?, end_date = ?, updated_at = ? WHERE id = ?",
      [startDate.getTime(), endDate.getTime(), new Date().getTime(), taskId]
    );

    // 依存タスクの自動調整
    const dependencies = await this.db.execute(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ?",
      [taskId]
    ) || [];

    for (const dep of dependencies) {
      const successorTask = await this.findById(dep.successorId);
      if (successorTask) {
        const duration = successorTask.endDate.getTime() - successorTask.startDate.getTime();
        const newStartDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // 1日後
        const newEndDate = new Date(newStartDate.getTime() + duration);
        
        await this.updateSchedule(successorTask.id, newStartDate, newEndDate);
      }
    }
  }

  async createDependency(fromId: string, toId: string): Promise<void> {
    // 循環依存チェック
    const existingDeps = await this.db.execute(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ? AND successor_id = ?",
      [toId, fromId]
    ) || [];

    if (existingDeps.length > 0) {
      throw new Error("循環依存が検出されました");
    }

    const id = uuidv4();
    await this.db.execute(
      "INSERT INTO gantt_dependencies (id, predecessor_id, successor_id) VALUES (?, ?, ?)",
      [id, fromId, toId]
    );
  }

  async calculateCriticalPath(projectId: string): Promise<string[]> {
    const tasks = await this.findAll();
    const dependencies = await this.db.execute(
      "SELECT * FROM gantt_dependencies",
      []
    ) || [];

    // タスクマップの作成
    const taskMap = new Map<string, GanttTask>();
    const successors = new Map<string, string[]>();
    
    tasks.forEach(task => {
      taskMap.set(task.id, task);
      successors.set(task.id, []);
    });

    // 依存関係の構築
    dependencies.forEach((dep: any) => {
      const current = successors.get(dep.predecessorId) || [];
      current.push(dep.successorId);
      successors.set(dep.predecessorId, current);
    });

    // 最長パスの計算
    let longestPath: string[] = [];
    let longestDuration = 0;

    const calculatePath = (taskId: string, path: string[], duration: number): void => {
      path.push(taskId);
      const task = taskMap.get(taskId);
      if (!task) return;

      const taskDuration = task.endDate.getTime() - task.startDate.getTime();
      duration += taskDuration;

      const taskSuccessors = successors.get(taskId) || [];
      if (taskSuccessors.length === 0) {
        if (duration > longestDuration) {
          longestDuration = duration;
          longestPath = [...path];
        }
      } else {
        taskSuccessors.forEach(successorId => {
          calculatePath(successorId, [...path], duration);
        });
      }
    };

    // 開始タスクから計算開始
    const startTasks = tasks.filter(task => {
      return !dependencies.some((dep: any) => dep.successorId === task.id);
    });

    startTasks.forEach(task => {
      calculatePath(task.id, [], 0);
    });

    return longestPath;
  }

  async setTaskIcon(taskId: string, icon: GanttTaskIcon): Promise<void> {
    await this.db.execute(
      "UPDATE gantt_tasks SET icon = ?, updated_at = ? WHERE id = ?",
      [icon, new Date().getTime(), taskId]
    );
  }

  async setTaskColor(taskId: string, color: GanttTaskColor): Promise<void> {
    await this.db.execute(
      "UPDATE gantt_tasks SET color = ?, updated_at = ? WHERE id = ?",
      [color, new Date().getTime(), taskId]
    );
  }

  async assignMember(taskId: string, memberId: string): Promise<void> {
    await this.db.execute(
      "UPDATE gantt_tasks SET assignee = ?, updated_at = ? WHERE id = ?",
      [memberId, new Date().getTime(), taskId]
    );
  }

  async createTaskGroup(name: string, color: string): Promise<string> {
    const id = uuidv4();
    await this.db.execute(
      "INSERT INTO gantt_groups (id, name, color, created_at) VALUES (?, ?, ?, ?)",
      [id, name, color, new Date().getTime()]
    );
    return id;
  }

  async moveTaskToGroup(taskId: string, groupId: string): Promise<void> {
    await this.db.execute(
      "UPDATE gantt_tasks SET group_id = ?, updated_at = ? WHERE id = ?",
      [groupId, new Date().getTime(), taskId]
    );
  }

  async updateHierarchy(taskId: string, parentId: string | null): Promise<void> {
    await this.db.execute(
      "UPDATE gantt_tasks SET parent_id = ?, updated_at = ? WHERE id = ?",
      [parentId, new Date().getTime(), taskId]
    );
  }

  async findAll(filter?: GanttFilter): Promise<GanttTask[]> {
    let sql = "SELECT * FROM gantt_tasks";
    const params: any[] = [];
    const conditions: string[] = [];

    if (filter) {
      if (filter.assignee) {
        conditions.push("assignee = ?");
        params.push(filter.assignee);
      }

      if (filter.groupId) {
        conditions.push("group_id = ?");
        params.push(filter.groupId);
      }

      if (filter.category) {
        conditions.push("category = ?");
        params.push(filter.category);
      }

      if (filter.dateRange) {
        conditions.push("start_date >= ? AND end_date <= ?");
        params.push(filter.dateRange.start.getTime(), filter.dateRange.end.getTime());
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
    }

    sql += " ORDER BY start_date";

    const rows = await this.db.execute(sql, params) || [];
    return rows.map(row => this.mapRowToTask(row));
  }

  async findById(id: string): Promise<GanttTask | null> {
    const rows = await this.db.execute(
      "SELECT * FROM gantt_tasks WHERE id = ?",
      [id]
    ) || [];

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToTask(rows[0]);
  }

  async delete(id: string): Promise<void> {
    // 子タスクを取得
    const children = await this.db.execute(
      "SELECT id FROM gantt_tasks WHERE parent_id = ?",
      [id]
    ) || [];

    // 子タスクを再帰的に削除
    for (const child of children) {
      await this.delete(child.id);
    }

    // 依存関係を削除
    await this.db.execute("DELETE FROM gantt_dependencies WHERE predecessor_id = ? OR successor_id = ?", [id, id]);

    // タスク本体を削除
    await this.db.execute("DELETE FROM gantt_tasks WHERE id = ?", [id]);
  }

  private mapRowToTask(row: any): GanttTask {
    return {
      id: row.id,
      title: row.title,
      icon: row.icon as GanttTaskIcon | undefined,
      color: row.color as GanttTaskColor | undefined,
      category: row.category,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      progress: row.progress,
      dependencies: [], // 別途取得が必要
      isCriticalPath: row.is_critical_path === 1,
      parentId: row.parent_id,
      children: [], // 別途取得が必要
      assignee: row.assignee,
      assigneeIcon: row.assignee_icon,
      groupId: row.group_id,
      wbsTaskId: row.wbs_task_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}