import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TodoRepository } from "./todo-repository";
import { Database } from "../db/database";
import type { Todo } from "../db/types";

// Mock the database
vi.mock("../db/database");

describe("TodoRepository", () => {
  let repository: TodoRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
    };
    repository = new TodoRepository(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new todo", async () => {
      const newTodo = {
        title: "Test Todo",
        description: "Test Description",
        due_date: "2024-12-31",
        priority: "high" as const,
      };

      mockDb.execute.mockResolvedValueOnce([]);

      const result = await repository.create(newTodo);

      expect(result).toMatchObject({
        id: expect.any(String),
        title: newTodo.title,
        description: newTodo.description,
        due_date: newTodo.due_date,
        priority: newTodo.priority,
        completed: false,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO todos"),
        expect.arrayContaining([
          expect.any(String), // id
          newTodo.title,
          newTodo.description,
          newTodo.due_date,
          newTodo.priority,
        ])
      );
    });

    it("should create a todo with minimal data", async () => {
      const newTodo = {
        title: "Minimal Todo",
      };

      mockDb.execute.mockResolvedValueOnce([]);

      const result = await repository.create(newTodo);

      expect(result).toMatchObject({
        id: expect.any(String),
        title: newTodo.title,
        completed: false,
      });
    });
  });

  describe("findAll", () => {
    it("should return all todos", async () => {
      const mockTodos = [
        {
          id: "1",
          title: "Todo 1",
          completed: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "2",
          title: "Todo 2",
          completed: true,
          created_at: "2024-01-02",
          updated_at: "2024-01-02",
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTodos);

      const result = await repository.findAll();

      expect(result).toEqual(mockTodos);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM todos"),
        []
      );
    });

    it("should filter todos by completion status", async () => {
      const mockTodos = [
        {
          id: "1",
          title: "Incomplete Todo",
          completed: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTodos);

      const result = await repository.findAll({ completed: false });

      expect(result).toEqual(mockTodos);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE completed = ?"),
        [0]
      );
    });

    it("should filter todos by priority", async () => {
      const mockTodos = [
        {
          id: "1",
          title: "High Priority Todo",
          priority: "high",
          completed: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTodos);

      const result = await repository.findAll({ priority: "high" });

      expect(result).toEqual(mockTodos);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE priority = ?"),
        ["high"]
      );
    });
  });

  describe("findById", () => {
    it("should return a todo by id", async () => {
      const mockTodo = {
        id: "1",
        title: "Test Todo",
        completed: false,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockDb.execute.mockResolvedValueOnce([mockTodo]);

      const result = await repository.findById("1");

      expect(result).toEqual(mockTodo);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM todos WHERE id = ?"),
        ["1"]
      );
    });

    it("should return null if todo not found", async () => {
      mockDb.execute.mockResolvedValueOnce([]);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a todo", async () => {
      const updateData = {
        title: "Updated Todo",
        completed: true,
      };

      mockDb.execute.mockResolvedValueOnce([]);
      mockDb.execute.mockResolvedValueOnce([{ ...updateData, id: "1" }]);

      const result = await repository.update("1", updateData);

      expect(result).toMatchObject({
        id: "1",
        title: updateData.title,
        completed: updateData.completed,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE todos SET"),
        expect.arrayContaining([updateData.title, 1, "1"])
      );
    });

    it("should return null if todo not found", async () => {
      mockDb.execute.mockResolvedValueOnce([]);
      mockDb.execute.mockResolvedValueOnce([]);

      const result = await repository.update("non-existent", { title: "Test" });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a todo", async () => {
      mockDb.execute.mockResolvedValueOnce([]);

      await repository.delete("1");

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM todos WHERE id = ?"),
        ["1"]
      );
    });
  });

  describe("findOverdue", () => {
    it("should return overdue todos", async () => {
      const mockTodos = [
        {
          id: "1",
          title: "Overdue Todo",
          due_date: "2023-01-01",
          completed: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTodos);

      const result = await repository.findOverdue();

      expect(result).toEqual(mockTodos);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE due_date < ? AND completed = ?"),
        [expect.any(String), 0]
      );
    });
  });

  describe("search", () => {
    it("should search todos by keyword", async () => {
      const mockTodos = [
        {
          id: "1",
          title: "Test Todo",
          description: "Contains keyword",
          completed: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTodos);

      const result = await repository.search("keyword");

      expect(result).toEqual(mockTodos);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE (title LIKE ? OR description LIKE ?)"),
        ["%keyword%", "%keyword%"]
      );
    });
  });
});