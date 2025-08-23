import { Database } from "@/lib/db/database";
import { getDatabase } from "@/lib/db/singleton";
import { v4 as uuidv4 } from "uuid";
import type { GanttTask, CreateGanttTaskDto, UpdateGanttTaskDto } from "@/lib/types/gantt";

export class GanttTaskRepository {
  constructor(private db: Database) {}

  async create(data: CreateGanttTaskDto): Promise<GanttTask> {
    const id = uuidv4();
    const now = new Date();

    await this.db.execute(
      `INSERT INTO gantt_tasks (id, title, start_date, end_date, progress, wbs_task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.startDate.toISOString(),
        data.endDate.toISOString(),
        data.progress || 0,
        data.wbsTaskId || null,
        now.toISOString(),
        now.toISOString(),
      ]
    );

    return {
      id,
      title: data.title,
      icon: data.icon,
      color: data.color,
      category: data.category,
      startDate: data.startDate,
      endDate: data.endDate,
      progress: data.progress || 0,
      dependencies: [],
      isCriticalPath: false,
      parentId: data.parentId,
      assignee: data.assignee,
      groupId: data.groupId,
      wbsTaskId: data.wbsTaskId,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: UpdateGanttTaskDto): Promise<GanttTask> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title);
    }

    if (data.startDate !== undefined) {
      fields.push("start_date = ?");
      params.push(data.startDate.toISOString());
    }

    if (data.endDate !== undefined) {
      fields.push("end_date = ?");
      params.push(data.endDate.toISOString());
    }

    if (data.progress !== undefined) {
      fields.push("progress = ?");
      params.push(data.progress);
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await this.db.execute(
      `UPDATE gantt_tasks SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    const task = await this.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute("DELETE FROM gantt_tasks WHERE id = ?", [id]);
  }

  async findAll(): Promise<GanttTask[]> {
    const rows = await this.db.execute<any>(
      "SELECT * FROM gantt_tasks ORDER BY start_date ASC"
    );
    return rows.map(row => this.mapRowToTask(row));
  }

  async findById(id: string): Promise<GanttTask | null> {
    const [row] = await this.db.execute<any>(
      "SELECT * FROM gantt_tasks WHERE id = ?",
      [id]
    );
    return row ? this.mapRowToTask(row) : null;
  }

  async findByWbsTaskId(wbsTaskId: string): Promise<GanttTask | null> {
    const [row] = await this.db.execute<any>(
      "SELECT * FROM gantt_tasks WHERE wbs_task_id = ?",
      [wbsTaskId]
    );
    return row ? this.mapRowToTask(row) : null;
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.db.execute(
      "UPDATE gantt_tasks SET progress = ?, updated_at = ? WHERE id = ?",
      [progress, new Date().toISOString(), id]
    );
  }

  private mapRowToTask(row: any): GanttTask {
    return {
      id: row.id,
      title: row.title,
      icon: row.icon,
      color: row.color,
      category: row.category,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      progress: row.progress || 0,
      dependencies: [],
      isCriticalPath: false,
      parentId: row.parent_id,
      assignee: row.assignee,
      assigneeIcon: row.assignee_icon,
      groupId: row.group_id,
      wbsTaskId: row.wbs_task_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// シングルトンインスタンス
let repository: GanttTaskRepository | null = null;

export const ganttTaskRepository = {
  async create(data: CreateGanttTaskDto): Promise<GanttTask> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttTaskRepository(db);
    }
    return repository.create(data);
  },

  async update(id: string, data: UpdateGanttTaskDto): Promise<GanttTask> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttTaskRepository(db);
    }
    return repository.update(id, data);
  },

  async delete(id: string): Promise<void> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttTaskRepository(db);
    }
    return repository.delete(id);
  },

  async findAll(): Promise<GanttTask[]> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttTaskRepository(db);
    }
    return repository.findAll();
  },

  async findById(id: string): Promise<GanttTask | null> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttTaskRepository(db);
    }
    return repository.findById(id);
  },

  async findByWbsTaskId(wbsTaskId: string): Promise<GanttTask | null> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttTaskRepository(db);
    }
    return repository.findByWbsTaskId(wbsTaskId);
  },

  async updateProgress(id: string, progress: number): Promise<void> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttTaskRepository(db);
    }
    return repository.updateProgress(id, progress);
  },
};