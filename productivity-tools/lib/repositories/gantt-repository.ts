import { v4 as uuidv4 } from "uuid";
import type { Database } from "../db/database";
import type { GanttTask, GanttDependency } from "../db/types";
import type { SqlValue } from "@sqlite.org/sqlite-wasm";

export interface CreateGanttTaskDto {
  title: string;
  start_date: string;
  end_date: string;
  progress?: number;
  wbs_task_id?: string;
}

export interface UpdateGanttTaskDto {
  title?: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  wbs_task_id?: string;
}

export interface CreateDependencyDto {
  predecessor_id: string;
  successor_id: string;
  type?: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish";
}

export class GanttRepository {
  constructor(private db: Database) {}

  // Task operations
  async createTask(data: CreateGanttTaskDto): Promise<GanttTask> {
    // Validate dates
    if (new Date(data.end_date) <= new Date(data.start_date)) {
      throw new Error("End date must be after start date");
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    
    const task: GanttTask = {
      id,
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      progress: data.progress ?? 0,
      wbs_task_id: data.wbs_task_id,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO gantt_tasks (id, title, start_date, end_date, progress, wbs_task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.start_date,
        task.end_date,
        task.progress,
        task.wbs_task_id || null,
        task.created_at,
        task.updated_at,
      ]
    );

    return task;
  }

  async findAll(): Promise<GanttTask[]> {
    const rows = await this.db.execute(
      "SELECT * FROM gantt_tasks ORDER BY start_date",
      []
    );

    return rows.map(row => this.mapRowToTask(row));
  }

  async findAllTasks(): Promise<GanttTask[]> {
    // Alias for findAll() for consistency with test expectations
    return this.findAll();
  }

  async findById(id: string): Promise<GanttTask | null> {
    const rows = await this.db.execute(
      "SELECT * FROM gantt_tasks WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToTask(rows[0]);
  }

  async updateTask(id: string, data: UpdateGanttTaskDto): Promise<GanttTask | null> {
    // If both dates are provided, validate them
    if (data.start_date && data.end_date) {
      if (new Date(data.end_date) <= new Date(data.start_date)) {
        throw new Error("End date must be after start date");
      }
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title);
    }

    if (data.start_date !== undefined) {
      fields.push("start_date = ?");
      params.push(data.start_date);
    }

    if (data.end_date !== undefined) {
      fields.push("end_date = ?");
      params.push(data.end_date);
    }

    if (data.progress !== undefined) {
      fields.push("progress = ?");
      params.push(data.progress);
    }

    if (data.wbs_task_id !== undefined) {
      fields.push("wbs_task_id = ?");
      params.push(data.wbs_task_id);
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    const sql = `UPDATE gantt_tasks SET ${fields.join(", ")} WHERE id = ?`;
    await this.db.execute(sql, params);

    return this.findById(id);
  }

  async deleteTask(id: string): Promise<void> {
    // Delete dependencies first
    await this.db.execute("DELETE FROM gantt_dependencies WHERE predecessor_id = ?", [id]);
    await this.db.execute("DELETE FROM gantt_dependencies WHERE successor_id = ?", [id]);
    
    // Then delete the task
    await this.db.execute("DELETE FROM gantt_tasks WHERE id = ?", [id]);
  }

  async updateProgress(taskId: string, progress: number): Promise<void> {
    // Validate progress is between 0 and 100
    if (progress < 0 || progress > 100) {
      throw new Error("Progress must be between 0 and 100");
    }

    await this.db.execute(
      "UPDATE gantt_tasks SET progress = ?, updated_at = ? WHERE id = ?",
      [progress, new Date().toISOString(), taskId]
    );
  }

  async adjustDates(taskId: string, newStartDate: string, newEndDate: string): Promise<void> {
    // Get the task
    const task = await this.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Update the task dates
    await this.db.execute(
      "UPDATE gantt_tasks SET start_date = ?, end_date = ?, updated_at = ? WHERE id = ?",
      [newStartDate, newEndDate, new Date().toISOString(), taskId]
    );

    // Find all dependencies where this task is a predecessor
    const dependencies = await this.db.execute(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ?",
      [taskId]
    );

    // Adjust successor tasks based on dependency type
    for (const row of dependencies) {
      const dep = this.mapRowToDependency(row);
      if (dep.type === "finish-to-start") {
        // Get successor task
        const successor = await this.findById(dep.successor_id);
        if (successor) {
          const duration = new Date(successor.end_date).getTime() - new Date(successor.start_date).getTime();
          const newSuccessorStart = new Date(newEndDate);
          newSuccessorStart.setDate(newSuccessorStart.getDate() + 1); // Start day after predecessor ends
          
          const newSuccessorEnd = new Date(newSuccessorStart.getTime() + duration);
          
          // Recursively adjust the successor's dates
          await this.adjustDates(
            successor.id,
            newSuccessorStart.toISOString().split('T')[0],
            newSuccessorEnd.toISOString().split('T')[0]
          );
        }
      }
    }
  }

  // Dependency operations
  async createDependency(data: CreateDependencyDto): Promise<GanttDependency> {
    // Validate both tasks exist
    const predecessorExists = await this.findById(data.predecessor_id);
    if (!predecessorExists) {
      throw new Error("Task not found");
    }

    const successorExists = await this.findById(data.successor_id);
    if (!successorExists) {
      throw new Error("Task not found");
    }

    // Check for circular dependencies
    await this.checkCircularDependency(data.predecessor_id, data.successor_id);

    const id = uuidv4();
    const now = new Date().toISOString();
    
    const dependency: GanttDependency = {
      id,
      predecessor_id: data.predecessor_id,
      successor_id: data.successor_id,
      type: data.type || "finish-to-start",
      created_at: now,
    };

    await this.db.execute(
      `INSERT INTO gantt_dependencies (id, predecessor_id, successor_id, type, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        dependency.id,
        dependency.predecessor_id,
        dependency.successor_id,
        dependency.type,
        dependency.created_at,
      ]
    );

    return dependency;
  }

  async findAllDependencies(): Promise<GanttDependency[]> {
    const rows = await this.db.execute(
      "SELECT * FROM gantt_dependencies",
      []
    );

    return rows.map(row => this.mapRowToDependency(row));
  }

  async findDependenciesByTask(taskId: string): Promise<GanttDependency[]> {
    const rows = await this.db.execute(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ? OR successor_id = ?",
      [taskId, taskId]
    );

    return rows.map(row => this.mapRowToDependency(row));
  }

  async deleteDependency(id: string): Promise<void> {
    await this.db.execute("DELETE FROM gantt_dependencies WHERE id = ?", [id]);
  }

  // Critical path operations
  async calculateCriticalPath(): Promise<string[]> {
    const tasks = await this.findAll();
    const dependencies = await this.db.execute(
      "SELECT * FROM gantt_dependencies",
      []
    );

    // Build task map and dependency graph
    const taskMap = new Map<string, GanttTask>();
    const successors = new Map<string, string[]>();
    const predecessors = new Map<string, string[]>();

    for (const task of tasks) {
      taskMap.set(task.id, task);
      successors.set(task.id, []);
      predecessors.set(task.id, []);
    }

    for (const row of dependencies) {
      const dep = this.mapRowToDependency(row);
      if (dep.type === "finish-to-start") {
        successors.get(dep.predecessor_id)?.push(dep.successor_id);
        predecessors.get(dep.successor_id)?.push(dep.predecessor_id);
      }
    }

    // Find tasks with no predecessors (start nodes)
    const startTasks = tasks.filter(task => predecessors.get(task.id)?.length === 0);

    // Calculate longest path from each start task
    let longestPath: string[] = [];
    let longestDuration = 0;

    for (const startTask of startTasks) {
      const path = this.findLongestPath(startTask.id, taskMap, successors);
      const duration = this.calculatePathDuration(path, taskMap);
      
      if (duration > longestDuration) {
        longestDuration = duration;
        longestPath = path;
      }
    }

    return longestPath;
  }

  // Chart data operations
  async getChartData(): Promise<{ tasks: GanttTask[]; dependencies: GanttDependency[] }> {
    const tasks = await this.findAll();
    const dependencies = await this.db.execute(
      "SELECT * FROM gantt_dependencies",
      []
    );

    return {
      tasks,
      dependencies: dependencies.map(row => this.mapRowToDependency(row)),
    };
  }

  // Helper methods
  private async checkCircularDependency(predecessorId: string, successorId: string): Promise<void> {
    // Simple check: if there's already a path from successor to predecessor, it would create a cycle
    const dependencies = await this.db.execute(
      "SELECT * FROM gantt_dependencies",
      []
    );

    const visited = new Set<string>();
    const queue = [successorId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === predecessorId) {
        throw new Error("Circular dependency detected");
      }

      if (!visited.has(current)) {
        visited.add(current);
        const nextDeps = dependencies.filter((d: any) => d.predecessor_id === current);
        queue.push(...nextDeps.map((d: any) => d.successor_id));
      }
    }
  }

  private findLongestPath(
    taskId: string,
    taskMap: Map<string, GanttTask>,
    successors: Map<string, string[]>
  ): string[] {
    const task = taskMap.get(taskId);
    if (!task) return [];

    const taskSuccessors = successors.get(taskId) || [];
    if (taskSuccessors.length === 0) {
      return [taskId];
    }

    let longestSubPath: string[] = [];
    for (const successorId of taskSuccessors) {
      const subPath = this.findLongestPath(successorId, taskMap, successors);
      if (subPath.length > longestSubPath.length) {
        longestSubPath = subPath;
      }
    }

    return [taskId, ...longestSubPath];
  }

  private calculatePathDuration(path: string[], taskMap: Map<string, GanttTask>): number {
    let duration = 0;
    for (const taskId of path) {
      const task = taskMap.get(taskId);
      if (task) {
        const taskDuration = new Date(task.end_date).getTime() - new Date(task.start_date).getTime();
        duration += taskDuration;
      }
    }
    return duration;
  }

  private mapRowToTask(row: Record<string, SqlValue>): GanttTask {
    return {
      id: row.id as string,
      title: row.title as string,
      start_date: row.start_date as string,
      end_date: row.end_date as string,
      progress: row.progress as number,
      wbs_task_id: row.wbs_task_id as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  private mapRowToDependency(row: Record<string, SqlValue>): GanttDependency {
    return {
      id: row.id as string,
      predecessor_id: row.predecessor_id as string,
      successor_id: row.successor_id as string,
      type: row.type as GanttDependency['type'],
      created_at: row.created_at as string,
    };
  }
}