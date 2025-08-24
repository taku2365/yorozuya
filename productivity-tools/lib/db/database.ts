import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import type { Sqlite3Static, Database as SQLiteDatabase, SqlValue } from "@sqlite.org/sqlite-wasm";
import { runMigrations } from "./migrations";

export class Database {
  private sqlite3: Sqlite3Static | null = null;
  private db: SQLiteDatabase | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize SQLite WASM
    const sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    });
    this.sqlite3 = sqlite3;

    // Create database in memory for now
    // TODO: Implement OPFS persistence later
    this.db = new sqlite3.oo1.DB(":memory:", "c");

    // Create tables - no need to check initialized here since we're in the process of initializing
    await this.createTables();
    
    // Run migrations
    await runMigrations(this);
    
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.sqlite3 = null;
      this.initialized = false;
    }
  }

  async getTables(): Promise<string[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    const result = this.db.exec({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      returnValue: "resultRows",
      rowMode: "array"
    }) as string[][];
    return result.map((row) => row[0]);
  }

  async execute<T = Record<string, SqlValue>>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    
    // For DDL statements (CREATE, ALTER, DROP), use exec without expecting results
    if (sql.trim().toUpperCase().match(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)/)) {
      this.db.exec({
        sql,
        bind: params,
      });
      return [];
    }
    
    // For SELECT statements, return results
    const result = this.db.exec({
      sql,
      bind: params,
      returnValue: "resultRows",
      rowMode: "object",
    }) as { [columnName: string]: SqlValue }[];
    
    // Cast to T[] - the user is responsible for ensuring type safety
    return result as unknown as T[];
  }

  private async createTables(): Promise<void> {
    // Remove the check for initialized since we're calling this during initialization
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    
    // Create todos table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        priority TEXT CHECK(priority IN ('high', 'medium', 'low')),
        completed BOOLEAN DEFAULT 0,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create WBS tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wbs_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        parent_id TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        estimated_hours REAL,
        actual_hours REAL,
        progress INTEGER DEFAULT 0,
        assignee TEXT,
        reviewer TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE
      )
    `);

    // Create kanban lanes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kanban_lanes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        wip_limit INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create kanban cards table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kanban_cards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        lane_id TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        labels TEXT,
        todo_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lane_id) REFERENCES kanban_lanes(id) ON DELETE CASCADE,
        FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE SET NULL
      )
    `);

    // Create gantt tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gantt_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        wbs_task_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wbs_task_id) REFERENCES wbs_tasks(id) ON DELETE SET NULL
      )
    `);

    // Create gantt dependencies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gantt_dependencies (
        id TEXT PRIMARY KEY,
        predecessor_id TEXT NOT NULL,
        successor_id TEXT NOT NULL,
        type TEXT DEFAULT 'finish-to-start',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (predecessor_id) REFERENCES gantt_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (successor_id) REFERENCES gantt_tasks(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_wbs_tasks_parent ON wbs_tasks(parent_id)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_kanban_cards_lane ON kanban_cards(lane_id)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_gantt_deps_pred ON gantt_dependencies(predecessor_id)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_gantt_deps_succ ON gantt_dependencies(successor_id)");
  }
}