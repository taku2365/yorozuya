import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Database } from "./database";
import { v4 as uuidv4 } from "uuid";

// Mock UUID for predictable IDs in tests
vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid-123"),
}));

// Mock SQLite WASM
vi.mock("@sqlite.org/sqlite-wasm", () => ({
  default: async () => ({
    oo1: {
      DB: class MockDB {
        private data: any = {
          todos: [],
        };

        constructor() {}
        
        exec(options: any) {
          if (typeof options === "string") return;
          
          const sql = options.sql?.toLowerCase() || "";
          
          // Handle CREATE TABLE
          if (sql.includes("create table")) {
            return;
          }
          
          // Handle INSERT
          if (sql.includes("insert into todos")) {
            const todo = {
              id: options.bind[0],
              title: options.bind[1],
              description: options.bind[2],
              priority: options.bind[3],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              completed: false,
            };
            this.data.todos.push(todo);
            return [];
          }
          
          // Handle SELECT
          if (sql.includes("select * from todos")) {
            return this.data.todos;
          }
          
          if (sql.includes("sqlite_master")) {
            return [["todos"]];
          }
          
          return [];
        }
        
        close() {}
      },
    },
  }),
}));

describe("Database Operations", () => {
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

  it("should insert and retrieve a todo", async () => {
    // Insert a todo
    await db.execute(
      "INSERT INTO todos (id, title, description, priority) VALUES (?, ?, ?, ?)",
      ["test-uuid-123", "Test Todo", "Test Description", "high"]
    );

    // Retrieve todos
    const todos = await db.execute("SELECT * FROM todos");
    
    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({
      id: "test-uuid-123",
      title: "Test Todo",
      description: "Test Description",
      priority: "high",
      completed: false,
    });
  });
});