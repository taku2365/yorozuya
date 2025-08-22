import { v4 as uuidv4 } from "uuid";
import type { Database } from "../db/database";
import type { Todo } from "../db/types";

export interface CreateTodoDto {
  title: string;
  description?: string;
  due_date?: string;
  priority?: "high" | "medium" | "low";
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: "high" | "medium" | "low";
  completed?: boolean;
  completed_at?: string;
}

export interface TodoFilter {
  completed?: boolean;
  priority?: "high" | "medium" | "low";
  overdue?: boolean;
}

export class TodoRepository {
  constructor(private db: Database) {}

  async create(data: CreateTodoDto): Promise<Todo> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const todo: Todo = {
      id,
      title: data.title,
      description: data.description,
      due_date: data.due_date,
      priority: data.priority,
      completed: false,
      completed_at: undefined,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO todos (id, title, description, due_date, priority, completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        todo.id,
        todo.title,
        todo.description || null,
        todo.due_date || null,
        todo.priority || null,
        0,
        todo.created_at,
        todo.updated_at,
      ]
    );

    return todo;
  }

  async findAll(filter?: TodoFilter): Promise<Todo[]> {
    let sql = "SELECT * FROM todos";
    const params: any[] = [];
    const conditions: string[] = [];

    if (filter?.completed !== undefined) {
      conditions.push("completed = ?");
      params.push(filter.completed ? 1 : 0);
    }

    if (filter?.priority) {
      conditions.push("priority = ?");
      params.push(filter.priority);
    }

    if (filter?.overdue) {
      conditions.push("due_date < datetime('now') AND completed = 0");
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY created_at DESC";

    const rows = await this.db.execute(sql, params);
    return rows.map(this.mapRowToTodo);
  }

  async findById(id: string): Promise<Todo | null> {
    const rows = await this.db.execute(
      "SELECT * FROM todos WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToTodo(rows[0]);
  }

  async update(id: string, data: UpdateTodoDto): Promise<Todo | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title);
    }

    if (data.description !== undefined) {
      fields.push("description = ?");
      params.push(data.description);
    }

    if (data.due_date !== undefined) {
      fields.push("due_date = ?");
      params.push(data.due_date);
    }

    if (data.priority !== undefined) {
      fields.push("priority = ?");
      params.push(data.priority);
    }

    if (data.completed !== undefined) {
      fields.push("completed = ?");
      params.push(data.completed ? 1 : 0);
      
      if (data.completed) {
        fields.push("completed_at = ?");
        params.push(new Date().toISOString());
      } else {
        fields.push("completed_at = NULL");
      }
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    const sql = `UPDATE todos SET ${fields.join(", ")} WHERE id = ?`;
    await this.db.execute(sql, params);

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute("DELETE FROM todos WHERE id = ?", [id]);
  }

  async findOverdue(): Promise<Todo[]> {
    const now = new Date().toISOString();
    const rows = await this.db.execute(
      "SELECT * FROM todos WHERE due_date < ? AND completed = ? ORDER BY due_date ASC",
      [now, 0]
    );

    return rows.map(this.mapRowToTodo);
  }

  async search(keyword: string): Promise<Todo[]> {
    const searchPattern = `%${keyword}%`;
    const rows = await this.db.execute(
      "SELECT * FROM todos WHERE (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC",
      [searchPattern, searchPattern]
    );

    return rows.map(this.mapRowToTodo);
  }

  private mapRowToTodo(row: any): Todo {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      due_date: row.due_date || undefined,
      priority: row.priority || undefined,
      completed: Boolean(row.completed),
      completed_at: row.completed_at || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}