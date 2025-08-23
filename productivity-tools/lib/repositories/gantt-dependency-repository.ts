import { Database } from "@/lib/db/database";
import { getDatabase } from "@/lib/db/singleton";
import { v4 as uuidv4 } from "uuid";
import type { GanttDependency } from "@/lib/types/gantt";

interface CreateGanttDependencyDto {
  predecessorId: string;
  successorId: string;
  type?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

export class GanttDependencyRepository {
  constructor(private db: Database) {}

  async create(data: CreateGanttDependencyDto): Promise<GanttDependency> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // 循環依存チェック
    const existing = await this.db.execute<any>(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ? AND successor_id = ?",
      [data.successorId, data.predecessorId]
    );

    if (existing.length > 0) {
      throw new Error("循環依存が検出されました");
    }

    await this.db.execute(
      `INSERT INTO gantt_dependencies (id, predecessor_id, successor_id, type, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        data.predecessorId,
        data.successorId,
        data.type || "finish-to-start",
        now,
      ]
    );

    return {
      id,
      predecessorId: data.predecessorId,
      successorId: data.successorId,
      type: data.type || "finish-to-start",
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.execute("DELETE FROM gantt_dependencies WHERE id = ?", [id]);
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.db.execute(
      "DELETE FROM gantt_dependencies WHERE predecessor_id = ? OR successor_id = ?",
      [taskId, taskId]
    );
  }

  async findAll(): Promise<GanttDependency[]> {
    const rows = await this.db.execute<any>(
      "SELECT * FROM gantt_dependencies"
    );
    return rows.map(row => this.mapRowToDependency(row));
  }

  async findByTaskId(taskId: string): Promise<GanttDependency[]> {
    const rows = await this.db.execute<any>(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ? OR successor_id = ?",
      [taskId, taskId]
    );
    return rows.map(row => this.mapRowToDependency(row));
  }

  async findPredecessors(taskId: string): Promise<GanttDependency[]> {
    const rows = await this.db.execute<any>(
      "SELECT * FROM gantt_dependencies WHERE successor_id = ?",
      [taskId]
    );
    return rows.map(row => this.mapRowToDependency(row));
  }

  async findSuccessors(taskId: string): Promise<GanttDependency[]> {
    const rows = await this.db.execute<any>(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ?",
      [taskId]
    );
    return rows.map(row => this.mapRowToDependency(row));
  }

  async hasCyclicDependency(
    predecessorId: string,
    successorId: string
  ): Promise<boolean> {
    // 直接的な循環依存チェック
    const direct = await this.db.execute<any>(
      "SELECT * FROM gantt_dependencies WHERE predecessor_id = ? AND successor_id = ?",
      [successorId, predecessorId]
    );

    if (direct.length > 0) {
      return true;
    }

    // 間接的な循環依存チェック（深さ優先探索）
    const visited = new Set<string>();
    const checkCycle = async (currentId: string): Promise<boolean> => {
      if (currentId === predecessorId) {
        return true;
      }

      if (visited.has(currentId)) {
        return false;
      }

      visited.add(currentId);

      const successors = await this.findSuccessors(currentId);
      for (const dep of successors) {
        if (await checkCycle(dep.successor_id)) {
          return true;
        }
      }

      return false;
    };

    return await checkCycle(successorId);
  }

  private mapRowToDependency(row: any): GanttDependency {
    return {
      id: row.id,
      predecessorId: row.predecessor_id,
      successorId: row.successor_id,
      type: row.type || 'finish-to-start',
    };
  }
}

// シングルトンインスタンス
let repository: GanttDependencyRepository | null = null;

export const ganttDependencyRepository = {
  async create(data: CreateGanttDependencyDto): Promise<GanttDependency> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.create(data);
  },

  async delete(id: string): Promise<void> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.delete(id);
  },

  async deleteByTaskId(taskId: string): Promise<void> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.deleteByTaskId(taskId);
  },

  async findAll(): Promise<GanttDependency[]> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.findAll();
  },

  async findByTaskId(taskId: string): Promise<GanttDependency[]> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.findByTaskId(taskId);
  },

  async findPredecessors(taskId: string): Promise<GanttDependency[]> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.findPredecessors(taskId);
  },

  async findSuccessors(taskId: string): Promise<GanttDependency[]> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.findSuccessors(taskId);
  },

  async hasCyclicDependency(
    predecessorId: string,
    successorId: string
  ): Promise<boolean> {
    if (!repository) {
      const db = await getDatabase();
      repository = new GanttDependencyRepository(db);
    }
    return repository.hasCyclicDependency(predecessorId, successorId);
  },
};