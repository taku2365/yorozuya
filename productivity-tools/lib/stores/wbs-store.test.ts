import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useWBSStore } from "./wbs-store";
import type { WBSTask } from "../db/types";

// Mock the database singleton
vi.mock("../db/singleton", () => ({
  getDatabase: vi.fn(),
}));

// Mock the WBSRepository
const mockState = {
  reset: () => {
    mockState.createdTasks = [];
    mockState.deletedIds = [];
  },
  createdTasks: [] as WBSTask[],
  deletedIds: [] as string[],
};

vi.mock("../repositories/wbs-repository", () => {
  const mockTasks: WBSTask[] = [
    {
      id: "1",
      title: "Parent Task",
      description: "Parent task description",
      parent_id: null,
      position: 0,
      estimated_hours: 10,
      actual_hours: 5,
      progress: 50,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      children: [
        {
          id: "1-1",
          title: "Child Task 1",
          description: "Child task 1 description",
          parent_id: "1",
          position: 0,
          estimated_hours: 4,
          actual_hours: 2,
          progress: 50,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          children: [],
        },
        {
          id: "1-2",
          title: "Child Task 2",
          parent_id: "1",
          position: 1,
          estimated_hours: 6,
          actual_hours: 3,
          progress: 50,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          children: [],
        },
      ],
    },
    {
      id: "2",
      title: "Another Root Task",
      parent_id: null,
      position: 1,
      estimated_hours: 8,
      actual_hours: 4,
      progress: 50,
      created_at: "2024-01-02",
      updated_at: "2024-01-02",
      children: [],
    },
  ];

  return {
    WBSRepository: vi.fn().mockImplementation(() => ({
      findAll: vi.fn().mockImplementation(() => {
        // Return mock tasks plus created tasks, minus deleted tasks
        const allTasks = [...mockTasks, ...mockState.createdTasks].filter(
          t => !mockState.deletedIds.includes(t.id)
        );
        return Promise.resolve(allTasks);
      }),
      create: vi.fn().mockImplementation((data) => {
        const newTask = {
          id: "new-id",
          ...data,
          position: data.position ?? 0,
          estimated_hours: data.estimated_hours ?? 0,
          actual_hours: data.actual_hours ?? 0,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [],
        };
        mockState.createdTasks.push(newTask);
        return Promise.resolve(newTask);
      }),
      update: vi.fn().mockImplementation((id, data) => {
        const task = mockTasks.find((t) => t.id === id) || 
                     mockTasks[0].children?.find((t) => t.id === id);
        return Promise.resolve(
          task ? { ...task, ...data, updated_at: new Date().toISOString() } : null
        );
      }),
      delete: vi.fn().mockImplementation((id) => {
        mockState.deletedIds.push(id);
        return Promise.resolve(undefined);
      }),
      move: vi.fn().mockResolvedValue(undefined),
      updateProgress: vi.fn().mockResolvedValue(undefined),
      getDescendants: vi.fn().mockImplementation((taskId) => {
        if (taskId === "1") {
          return Promise.resolve([
            mockTasks[0].children![0],
            mockTasks[0].children![1],
          ]);
        }
        return Promise.resolve([]);
      }),
      getTotalEstimatedHours: vi.fn().mockImplementation((taskId) => {
        if (taskId === "1") {
          return Promise.resolve(10); // Parent + children
        }
        return Promise.resolve(0);
      }),
    })),
  };
});

describe("WBSStore", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store before each test
    const { result } = renderHook(() => useWBSStore());
    act(() => {
      result.current.reset();
    });
    // Reset mock state
    mockState.reset();
    vi.clearAllMocks();
  });

  describe("State Management", () => {
    it("should initialize with empty tasks", () => {
      const { result } = renderHook(() => useWBSStore());
      
      expect(result.current.tasks).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should set loading state", () => {
      const { result } = renderHook(() => useWBSStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it("should set error state", () => {
      const { result } = renderHook(() => useWBSStore());
      const error = "Test error";
      
      act(() => {
        result.current.setError(error);
      });
      
      expect(result.current.error).toBe(error);
    });

    it("should set expanded state for tasks", () => {
      const { result } = renderHook(() => useWBSStore());
      
      act(() => {
        result.current.setExpanded("1", true);
      });
      
      expect(result.current.expandedTasks).toContain("1");
      
      act(() => {
        result.current.setExpanded("1", false);
      });
      
      expect(result.current.expandedTasks).not.toContain("1");
    });
  });

  describe("CRUD Operations", () => {
    it("should fetch all tasks with hierarchy", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      expect(result.current.tasks).toHaveLength(2);
      expect(result.current.tasks[0].title).toBe("Parent Task");
      expect(result.current.tasks[0].children).toHaveLength(2);
      expect(result.current.tasks[0].children![0].title).toBe("Child Task 1");
    });

    it("should create a new root task", async () => {
      const { result } = renderHook(() => useWBSStore());
      const newTask = {
        title: "New Task",
        description: "New Description",
        estimated_hours: 5,
      };
      
      await act(async () => {
        await result.current.createTask(newTask);
      });
      
      await waitFor(() => {
        expect(result.current.tasks).toContainEqual(
          expect.objectContaining({
            title: "New Task",
            description: "New Description",
            estimated_hours: 5,
          })
        );
      });
    });

    it("should create a child task", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      // First fetch tasks
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      const newChild = {
        title: "New Child Task",
        parent_id: "1",
        estimated_hours: 3,
      };
      
      await act(async () => {
        await result.current.createTask(newChild);
      });
      
      // Should refetch to get updated hierarchy
      expect(result.current.tasks[0].children).toBeDefined();
    });

    it("should update a task", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      // First fetch tasks
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      // Then update one
      await act(async () => {
        await result.current.updateTask("1", { 
          title: "Updated Parent Task",
          progress: 75 
        });
      });
      
      const updatedTask = result.current.tasks.find(t => t.id === "1");
      expect(updatedTask?.title).toBe("Updated Parent Task");
      expect(updatedTask?.progress).toBe(75);
    });

    it("should delete a task", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      // First fetch tasks
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      expect(result.current.tasks).toHaveLength(2);
      
      // Then delete one
      await act(async () => {
        await result.current.deleteTask("2");
      });
      
      // Should refetch after delete
      await waitFor(() => {
        expect(result.current.tasks.find(t => t.id === "2")).toBeUndefined();
      });
    });
  });

  describe("Task Movement", () => {
    it("should move a task to a new parent", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      await act(async () => {
        await result.current.moveTask("1-1", "2", 0);
      });
      
      // Should trigger refetch
      expect(result.current.isLoading).toBe(false);
    });

    it("should reorder tasks within the same parent", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      await act(async () => {
        await result.current.moveTask("1-1", "1", 1);
      });
      
      // Should trigger refetch
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Progress Management", () => {
    it("should update task progress", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      await act(async () => {
        await result.current.updateTaskProgress("1-1", 80);
      });
      
      // Should trigger updateProgress and refetch
      expect(result.current.isLoading).toBe(false);
    });

    it("should calculate total estimated hours", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      const totalHours = await result.current.getTotalEstimatedHours("1");
      expect(totalHours).toBe(10);
    });
  });

  describe("Utility Functions", () => {
    it("should get flattened task list", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      const flattened = result.current.getFlattenedTasks();
      expect(flattened).toHaveLength(4); // 2 root + 2 children
      expect(flattened.map(t => t.id)).toEqual(["1", "1-1", "1-2", "2"]);
    });

    it("should find task by id", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      const task = result.current.findTaskById("1-1");
      expect(task?.title).toBe("Child Task 1");
    });

    it("should get task ancestors", async () => {
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      const ancestors = result.current.getTaskAncestors("1-1");
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].id).toBe("1");
    });
  });

  describe("Local Storage Sync", () => {
    it("should save tasks to localStorage on update", async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      const { result } = renderHook(() => useWBSStore());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      expect(setItemSpy).toHaveBeenCalledWith(
        "wbs-cache",
        expect.any(String)
      );
    });
  });
});