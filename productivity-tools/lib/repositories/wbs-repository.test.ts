import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WBSRepository } from "./wbs-repository";
import type { WBSTask } from "../db/types";

// Mock the database
vi.mock("../db/database");

describe("WBSRepository", () => {
  let repository: WBSRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
    };
    repository = new WBSRepository(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new WBS task", async () => {
      const newTask = {
        title: "Parent Task",
        estimated_hours: 8,
        assignee: "John Doe",
      };

      mockDb.execute.mockResolvedValueOnce([]);

      const result = await repository.create(newTask);

      expect(result).toMatchObject({
        id: expect.any(String),
        title: newTask.title,
        parent_id: undefined,
        position: 0,
        estimated_hours: newTask.estimated_hours,
        assignee: newTask.assignee,
        progress: 0,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO wbs_tasks"),
        expect.arrayContaining([
          expect.any(String), // id
          newTask.title,
          null, // parent_id
          0, // position
          newTask.estimated_hours,
        ])
      );
    });

    it("should create a child task with parent_id", async () => {
      const newTask = {
        title: "Child Task",
        parent_id: "parent-123",
        position: 2,
      };

      mockDb.execute.mockResolvedValueOnce([]);

      const result = await repository.create(newTask);

      expect(result).toMatchObject({
        parent_id: "parent-123",
        position: 2,
      });
    });
  });

  describe("findAll", () => {
    it("should return all root tasks with children", async () => {
      const mockTasks = [
        {
          id: "1",
          title: "Root Task 1",
          parent_id: null,
          position: 0,
          progress: 0,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "2",
          title: "Child Task 1.1",
          parent_id: "1",
          position: 0,
          progress: 50,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks);

      const result = await repository.findAll();

      expect(result).toHaveLength(1); // Only root task
      expect(result[0].id).toBe("1");
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].id).toBe("2");
    });

    it("should build nested hierarchy correctly", async () => {
      const mockTasks = [
        { id: "1", title: "Root", parent_id: null, position: 0, progress: 0 },
        { id: "2", title: "Child 1", parent_id: "1", position: 0, progress: 0 },
        { id: "3", title: "Child 2", parent_id: "1", position: 1, progress: 0 },
        { id: "4", title: "Grandchild 1.1", parent_id: "2", position: 0, progress: 0 },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children![0].children).toHaveLength(1);
      expect(result[0].children![0].children![0].id).toBe("4");
    });
  });

  describe("findById", () => {
    it("should return a task with its children", async () => {
      const mockTasks = [
        { id: "1", title: "Parent", parent_id: null, position: 0, progress: 0 },
        { id: "2", title: "Child", parent_id: "1", position: 0, progress: 0 },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks);

      const result = await repository.findById("1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("1");
      expect(result!.children).toHaveLength(1);
    });

    it("should return null if task not found", async () => {
      mockDb.execute.mockResolvedValueOnce([]);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a task", async () => {
      const updateData = {
        title: "Updated Task",
        progress: 75,
        actual_hours: 6,
      };

      mockDb.execute.mockResolvedValueOnce([]);
      mockDb.execute.mockResolvedValueOnce([{ id: "1", ...updateData }]);

      const result = await repository.update("1", updateData);

      expect(result).toMatchObject({
        id: "1",
        title: updateData.title,
        progress: updateData.progress,
        actual_hours: updateData.actual_hours,
      });
    });
  });

  describe("updateProgress", () => {
    it("should calculate and update parent progress based on children", async () => {
      const mockTasks = [
        { id: "1", title: "Parent", parent_id: null, progress: 0 },
        { id: "2", title: "Child 1", parent_id: "1", progress: 100 },
        { id: "3", title: "Child 2", parent_id: "1", progress: 50 },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks);
      mockDb.execute.mockResolvedValueOnce([]);

      await repository.updateProgress("1");

      // Should update parent progress to average of children (75)
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE wbs_tasks SET progress = ?"),
        [75, expect.any(String), "1"]
      );
    });
  });

  describe("move", () => {
    it("should move a task to a new parent", async () => {
      mockDb.execute.mockResolvedValueOnce([]);
      mockDb.execute.mockResolvedValueOnce([{ id: "1" }]);

      await repository.move("1", "new-parent", 3);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE wbs_tasks SET parent_id = ?, position = ?"),
        ["new-parent", 3, expect.any(String), "1"]
      );
    });

    it("should move a task to root level", async () => {
      mockDb.execute.mockResolvedValueOnce([]);
      mockDb.execute.mockResolvedValueOnce([{ id: "1" }]);

      await repository.move("1", null, 0);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE wbs_tasks SET parent_id = ?, position = ?"),
        [null, 0, expect.any(String), "1"]
      );
    });
  });

  describe("delete", () => {
    it("should delete a task and its children", async () => {
      const mockTasks = [
        { id: "1", parent_id: null },
        { id: "2", parent_id: "1" },
        { id: "3", parent_id: "2" },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks);
      mockDb.execute.mockResolvedValueOnce([]);

      await repository.delete("1");

      // Should delete all tasks in the hierarchy
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM wbs_tasks WHERE id IN"),
        [["1", "2", "3"]]
      );
    });
  });

  describe("getDescendants", () => {
    it("should return all descendants of a task", async () => {
      const mockTasks = [
        { id: "1", parent_id: null },
        { id: "2", parent_id: "1" },
        { id: "3", parent_id: "1" },
        { id: "4", parent_id: "2" },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks);

      const result = await repository.getDescendants("1");

      expect(result).toHaveLength(3); // 2, 3, 4
      expect(result.map(t => t.id)).toContain("2");
      expect(result.map(t => t.id)).toContain("3");
      expect(result.map(t => t.id)).toContain("4");
    });
  });

  describe("getTotalEstimatedHours", () => {
    it("should calculate total estimated hours including descendants", async () => {
      const mockTasks = [
        { id: "1", estimated_hours: 8, parent_id: null },
        { id: "2", parent_id: "1", estimated_hours: 4 },
        { id: "3", parent_id: "1", estimated_hours: 2 },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks); // For getTotalEstimatedHours
      mockDb.execute.mockResolvedValueOnce(mockTasks); // For getDescendants

      const result = await repository.getTotalEstimatedHours("1");

      expect(result).toBe(14); // 8 + 4 + 2
    });
  });
});