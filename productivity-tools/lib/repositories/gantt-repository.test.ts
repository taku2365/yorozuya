import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GanttRepository } from "./gantt-repository";
import type { GanttTask, GanttDependency } from "../db/types";

// Mock the database
vi.mock("../db/database");

describe("GanttRepository", () => {
  let repository: GanttRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
    };
    repository = new GanttRepository(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Task operations", () => {
    describe("createTask", () => {
      it("should create a new gantt task", async () => {
        const newTask = {
          title: "Design Phase",
          start_date: "2024-01-01",
          end_date: "2024-01-15",
          progress: 0,
          wbs_task_id: "wbs-123",
        };

        mockDb.execute.mockResolvedValueOnce([]);

        const result = await repository.createTask(newTask);

        expect(result).toMatchObject({
          id: expect.any(String),
          title: newTask.title,
          start_date: newTask.start_date,
          end_date: newTask.end_date,
          progress: newTask.progress,
          wbs_task_id: newTask.wbs_task_id,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        });

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO gantt_tasks"),
          expect.arrayContaining([
            expect.any(String), // id
            newTask.title,
            newTask.start_date,
            newTask.end_date,
            newTask.progress,
            newTask.wbs_task_id,
          ])
        );
      });

      it("should validate that end date is after start date", async () => {
        const invalidTask = {
          title: "Invalid Task",
          start_date: "2024-01-15",
          end_date: "2024-01-01", // Before start date
        };

        await expect(repository.createTask(invalidTask)).rejects.toThrow("End date must be after start date");
      });
    });

    describe("findAll", () => {
      it("should return all tasks ordered by start date", async () => {
        const mockTasks = [
          {
            id: "1",
            title: "Task 1",
            start_date: "2024-01-01",
            end_date: "2024-01-10",
            progress: 50,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
          {
            id: "2",
            title: "Task 2",
            start_date: "2024-01-05",
            end_date: "2024-01-15",
            progress: 0,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        ];

        mockDb.execute.mockResolvedValueOnce(mockTasks);

        const result = await repository.findAll();

        expect(result).toEqual(mockTasks);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("SELECT * FROM gantt_tasks ORDER BY start_date"),
          []
        );
      });
    });

    describe("findById", () => {
      it("should return a task by id", async () => {
        const mockTask = {
          id: "1",
          title: "Task 1",
          start_date: "2024-01-01",
          end_date: "2024-01-10",
          progress: 50,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        };

        mockDb.execute.mockResolvedValueOnce([mockTask]);

        const result = await repository.findById("1");

        expect(result).toEqual(mockTask);
      });

      it("should return null if task not found", async () => {
        mockDb.execute.mockResolvedValueOnce([]);

        const result = await repository.findById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("updateTask", () => {
      it("should update a task", async () => {
        const updateData = {
          title: "Updated Task",
          end_date: "2024-01-20",
          progress: 75,
        };

        mockDb.execute.mockResolvedValueOnce([]);
        mockDb.execute.mockResolvedValueOnce([{ id: "1", ...updateData }]);

        const result = await repository.updateTask("1", updateData);

        expect(result).toMatchObject({
          id: "1",
          title: updateData.title,
          end_date: updateData.end_date,
          progress: updateData.progress,
        });
      });

      it("should validate date range when updating", async () => {
        const updateData = {
          start_date: "2024-01-20",
          end_date: "2024-01-10", // Before start date
        };

        await expect(repository.updateTask("1", updateData)).rejects.toThrow("End date must be after start date");
      });
    });

    describe("deleteTask", () => {
      it("should delete a task and its dependencies", async () => {
        mockDb.execute.mockResolvedValueOnce([]); // Delete dependencies where task is predecessor
        mockDb.execute.mockResolvedValueOnce([]); // Delete dependencies where task is successor
        mockDb.execute.mockResolvedValueOnce([]); // Delete task

        await repository.deleteTask("1");

        expect(mockDb.execute).toHaveBeenCalledTimes(3);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM gantt_dependencies WHERE predecessor_id = ?"),
          ["1"]
        );
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM gantt_dependencies WHERE successor_id = ?"),
          ["1"]
        );
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM gantt_tasks WHERE id = ?"),
          ["1"]
        );
      });
    });

    describe("adjustDates", () => {
      it("should adjust task dates and cascade to dependent tasks", async () => {
        // Mock the task being adjusted
        mockDb.execute.mockResolvedValueOnce([
          {
            id: "1",
            title: "Task 1",
            start_date: "2024-01-01",
            end_date: "2024-01-10",
          },
        ]);

        // Mock dependencies
        mockDb.execute.mockResolvedValueOnce([
          {
            id: "dep-1",
            predecessor_id: "1",
            successor_id: "2",
            type: "finish-to-start",
          },
        ]);

        // Mock successor task
        mockDb.execute.mockResolvedValueOnce([
          {
            id: "2",
            title: "Task 2",
            start_date: "2024-01-11",
            end_date: "2024-01-20",
          },
        ]);

        // Mock updates
        mockDb.execute.mockResolvedValueOnce([]); // Update task 1
        mockDb.execute.mockResolvedValueOnce([]); // Update task 2

        await repository.adjustDates("1", "2024-01-05", "2024-01-15");

        // Should update both the original task and dependent task
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE gantt_tasks SET start_date = ?, end_date = ?"),
          ["2024-01-05", "2024-01-15", expect.any(String), "1"]
        );
      });
    });
  });

  describe("Dependency operations", () => {
    describe("createDependency", () => {
      it("should create a dependency between tasks", async () => {
        const newDependency = {
          predecessor_id: "1",
          successor_id: "2",
          type: "finish-to-start" as const,
        };

        // Mock tasks exist
        mockDb.execute.mockResolvedValueOnce([{ id: "1" }]);
        mockDb.execute.mockResolvedValueOnce([{ id: "2" }]);
        
        // Mock no circular dependency
        mockDb.execute.mockResolvedValueOnce([]);
        
        // Mock insert
        mockDb.execute.mockResolvedValueOnce([]);

        const result = await repository.createDependency(newDependency);

        expect(result).toMatchObject({
          id: expect.any(String),
          predecessor_id: newDependency.predecessor_id,
          successor_id: newDependency.successor_id,
          type: newDependency.type,
          created_at: expect.any(String),
        });
      });

      it("should prevent circular dependencies", async () => {
        const newDependency = {
          predecessor_id: "2",
          successor_id: "1",
        };

        // Mock tasks exist
        mockDb.execute.mockResolvedValueOnce([{ id: "2" }]);
        mockDb.execute.mockResolvedValueOnce([{ id: "1" }]);
        
        // Mock existing dependency in opposite direction
        mockDb.execute.mockResolvedValueOnce([
          { predecessor_id: "1", successor_id: "2" }
        ]);

        await expect(repository.createDependency(newDependency)).rejects.toThrow("Circular dependency detected");
      });

      it("should validate that both tasks exist", async () => {
        const newDependency = {
          predecessor_id: "1",
          successor_id: "non-existent",
        };

        // Mock first task exists
        mockDb.execute.mockResolvedValueOnce([{ id: "1" }]);
        
        // Mock second task doesn't exist
        mockDb.execute.mockResolvedValueOnce([]);

        await expect(repository.createDependency(newDependency)).rejects.toThrow("Task not found");
      });
    });

    describe("findDependenciesByTask", () => {
      it("should return all dependencies for a task", async () => {
        const mockDependencies = [
          {
            id: "dep-1",
            predecessor_id: "1",
            successor_id: "2",
            type: "finish-to-start",
            created_at: "2024-01-01",
          },
          {
            id: "dep-2",
            predecessor_id: "3",
            successor_id: "1",
            type: "start-to-start",
            created_at: "2024-01-01",
          },
        ];

        mockDb.execute.mockResolvedValueOnce(mockDependencies);

        const result = await repository.findDependenciesByTask("1");

        expect(result).toEqual(mockDependencies);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("WHERE predecessor_id = ? OR successor_id = ?"),
          ["1", "1"]
        );
      });
    });

    describe("deleteDependency", () => {
      it("should delete a dependency", async () => {
        mockDb.execute.mockResolvedValueOnce([]);

        await repository.deleteDependency("dep-1");

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM gantt_dependencies WHERE id = ?"),
          ["dep-1"]
        );
      });
    });
  });

  describe("Critical path operations", () => {
    describe("calculateCriticalPath", () => {
      it("should calculate the critical path", async () => {
        const mockTasks = [
          {
            id: "1",
            title: "Task 1",
            start_date: "2024-01-01",
            end_date: "2024-01-05",
            progress: 0,
          },
          {
            id: "2",
            title: "Task 2",
            start_date: "2024-01-06",
            end_date: "2024-01-10",
            progress: 0,
          },
          {
            id: "3",
            title: "Task 3",
            start_date: "2024-01-06",
            end_date: "2024-01-08",
            progress: 0,
          },
        ];

        const mockDependencies = [
          {
            id: "dep-1",
            predecessor_id: "1",
            successor_id: "2",
            type: "finish-to-start",
          },
          {
            id: "dep-2",
            predecessor_id: "1",
            successor_id: "3",
            type: "finish-to-start",
          },
        ];

        mockDb.execute.mockResolvedValueOnce(mockTasks);
        mockDb.execute.mockResolvedValueOnce(mockDependencies);

        const criticalPath = await repository.calculateCriticalPath();

        expect(criticalPath).toContain("1");
        expect(criticalPath).toContain("2");
        expect(criticalPath).not.toContain("3"); // Task 3 is shorter
      });
    });
  });

  describe("getChartData", () => {
    it("should return complete chart data", async () => {
      const mockTasks = [
        { id: "1", title: "Task 1", start_date: "2024-01-01", end_date: "2024-01-10" },
      ];
      
      const mockDependencies = [
        { id: "dep-1", predecessor_id: "1", successor_id: "2" },
      ];

      mockDb.execute.mockResolvedValueOnce(mockTasks);
      mockDb.execute.mockResolvedValueOnce(mockDependencies);

      const result = await repository.getChartData();

      expect(result).toEqual({
        tasks: mockTasks,
        dependencies: mockDependencies,
      });
    });
  });
});