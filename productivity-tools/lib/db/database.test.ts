import { describe, it, expect, vi } from "vitest";
import { Database } from "./database";

// Mock the SQLite WASM module for testing
vi.mock("@sqlite.org/sqlite-wasm", () => ({
  default: async () => ({
    oo1: {
      DB: class MockDB {
        constructor() {}
        exec(options: any) {
          if (typeof options === "string") return;
          
          const sql = options.sql.toLowerCase();
          if (sql.includes("sqlite_master")) {
            return [
              ["todos"],
              ["wbs_tasks"],
              ["kanban_cards"],
              ["kanban_lanes"],
              ["gantt_tasks"],
              ["gantt_dependencies"],
            ];
          }
          if (sql === "select 1 as value") {
            return [{ value: 1 }];
          }
          return [];
        }
        close() {}
      },
    },
  }),
}));

describe("Database", () => {
  let db: Database;

  beforeEach(async () => {
    db = new Database();
    await db.initialize();
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
  });

  it("should initialize successfully", async () => {
    expect(db.isInitialized()).toBe(true);
  });

  it("should create required tables", async () => {
    const tables = await db.getTables();
    expect(tables).toContain("todos");
    expect(tables).toContain("wbs_tasks");
    expect(tables).toContain("kanban_cards");
    expect(tables).toContain("kanban_lanes");
    expect(tables).toContain("gantt_tasks");
    expect(tables).toContain("gantt_dependencies");
  });

  it("should execute queries successfully", async () => {
    const result = await db.execute("SELECT 1 as value");
    expect(result[0].value).toBe(1);
  });
});