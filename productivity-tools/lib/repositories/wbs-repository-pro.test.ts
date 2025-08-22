import { describe, it, expect, beforeEach, vi } from "vitest";
import { WBSRepository } from "./wbs-repository";
import type { Database } from "../db/database";
import type { WBSTask } from "../db/types";

describe("WBSRepository Professional Features", () => {
  let mockDb: Partial<Database>;
  let repository: WBSRepository;
  let mockTasks: any[];

  beforeEach(() => {
    mockTasks = [];
    mockDb = {
      execute: vi.fn(async (sql: string, params: any[]) => {
        if (sql.includes("INSERT")) {
          const task = {
            id: params[0],
            title: params[1],
            parent_id: params[2],
            position: params[3],
            hierarchy_number: params[4],
            estimated_hours: params[5],
            actual_hours: params[6],
            progress: params[7],
            assignee: params[8],
            reviewer: params[9],
            start_date: params[10],
            end_date: params[11],
            due_date: params[12],
            work_days: params[13],
            remarks: params[14],
            created_at: params[15],
            updated_at: params[16],
          };
          mockTasks.push(task);
          return [];
        }
        if (sql.includes("SELECT")) {
          return mockTasks;
        }
        if (sql.includes("UPDATE")) {
          // Handle updates
          return [];
        }
        return [];
      }),
    };
    repository = new WBSRepository(mockDb as Database);
  });

  describe("createWithHierarchyNumber", () => {
    it("should create task with hierarchy number", async () => {
      const result = await repository.createWithHierarchyNumber({
        title: "プロジェクト全体",
        hierarchy_number: "1",
      });

      expect(result.hierarchy_number).toBe("1");
      expect(mockDb.execute).toHaveBeenCalled();
    });

    it("should create sub-task with hierarchy number", async () => {
      const result = await repository.createWithHierarchyNumber({
        title: "企画立案",
        parent_id: "parent-id",
        hierarchy_number: "1.1",
      });

      expect(result.hierarchy_number).toBe("1.1");
    });
  });

  describe("createWithDateRange", () => {
    it("should create task with start and end dates", async () => {
      const result = await repository.createWithDateRange({
        title: "開発フェーズ",
        start_date: "2024-01-01",
        end_date: "2024-01-05",
      });

      expect(result.start_date).toBe("2024-01-01");
      expect(result.end_date).toBe("2024-01-05");
      expect(result.work_days).toBe(5);
    });

    it("should calculate work days automatically", async () => {
      const result = await repository.createWithDateRange({
        title: "テストフェーズ",
        start_date: "2024-01-01", // Monday
        end_date: "2024-01-08", // Next Monday
      });

      expect(result.work_days).toBe(6); // Mon-Fri + Mon
    });
  });

  describe("updateWithRecalculation", () => {
    it("should update dates and recalculate work days", async () => {
      const taskId = "test-id";
      const result = await repository.updateWithRecalculation(taskId, {
        start_date: "2024-01-01",
        end_date: "2024-01-10",
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        expect.arrayContaining([8]) // 8 work days
      );
    });
  });

  describe("insertTaskAfter", () => {
    it("should insert task and recalculate hierarchy numbers", async () => {
      mockTasks = [
        {
          id: "1",
          title: "Task 1",
          hierarchy_number: "1",
          position: 0,
          progress: 0,
        },
        {
          id: "2",
          title: "Task 2",
          hierarchy_number: "2",
          position: 1,
          progress: 0,
        },
      ];

      // Mock findAll to return hierarchical structure
      const originalExecute = mockDb.execute;
      mockDb.execute = vi.fn(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT") && sql.includes("ORDER BY")) {
          return mockTasks;
        }
        return originalExecute!(sql, params);
      });

      const result = await repository.insertTaskAfter("1", {
        title: "New Task",
      });

      // The test expects the repository to handle hierarchy number assignment
      // Check that position update was called
      expect(mockDb.execute).toHaveBeenCalledWith(
        "UPDATE wbs_tasks SET position = position + 1 WHERE id = ?",
        ["2"]
      );
      
      // Check that hierarchy number updates were called
      expect(mockDb.execute).toHaveBeenCalledWith(
        "UPDATE wbs_tasks SET hierarchy_number = ? WHERE id = ?",
        expect.arrayContaining(["3"]) // New task gets hierarchy number 3
      );
    });
  });

  describe("recalculateAllHierarchyNumbers", () => {
    it("should recalculate all hierarchy numbers", async () => {
      mockTasks = [
        {
          id: "1",
          title: "Task 1",
          parent_id: null,
          position: 0,
          progress: 0,
        },
        {
          id: "2",
          title: "Task 1.1",
          parent_id: "1",
          position: 0,
          progress: 0,
        },
        {
          id: "3",
          title: "Task 2",
          parent_id: null,
          position: 1,
          progress: 0,
        },
      ];

      await repository.recalculateAllHierarchyNumbers();

      // Should update each task with correct hierarchy number
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        expect.arrayContaining(["1", "1"])
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        expect.arrayContaining(["1.1", "2"])
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        expect.arrayContaining(["2", "3"])
      );
    });
  });
});