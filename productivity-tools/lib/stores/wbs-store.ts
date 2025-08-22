import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { WBSTask } from "../db/types";
import type { CreateWBSTaskDto, UpdateWBSTaskDto } from "../repositories/wbs-repository";
import { WBSRepository } from "../repositories/wbs-repository";
import { getDatabase } from "../db/singleton";

interface WBSState {
  tasks: WBSTask[];
  isLoading: boolean;
  error: string | null;
  expandedTasks: string[];
  
  // Actions
  setTasks: (tasks: WBSTask[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setExpanded: (taskId: string, expanded: boolean) => void;
  
  // CRUD operations
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateWBSTaskDto) => Promise<void>;
  updateTask: (id: string, data: UpdateWBSTaskDto) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Professional features
  insertTaskAfter: (afterTaskId: string, data: CreateWBSTaskDto) => Promise<void>;
  recalculateHierarchyNumbers: () => Promise<void>;
  reorderTask: (taskId: string, targetTaskId: string, position: "before" | "after") => Promise<void>;
  
  // Task management
  moveTask: (taskId: string, newParentId: string | null, newPosition: number) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  getTotalEstimatedHours: (taskId: string) => Promise<number>;
  
  // Utility functions
  getFlattenedTasks: () => WBSTask[];
  findTaskById: (id: string) => WBSTask | undefined;
  getTaskAncestors: (taskId: string) => WBSTask[];
  
  // Utility
  reset: () => void;
}

const initialState = {
  tasks: [],
  isLoading: false,
  error: null,
  expandedTasks: [],
};

export const useWBSStore = create<WBSState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setTasks: (tasks) => set({ tasks }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setExpanded: (taskId, expanded) => 
          set((state) => ({
            expandedTasks: expanded
              ? [...state.expandedTasks, taskId]
              : state.expandedTasks.filter(id => id !== taskId)
          })),
        
        // Fetch all tasks
        fetchTasks: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            const tasks = await repository.findAll();
            set({ tasks, isLoading: false });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to fetch tasks", isLoading: false });
          }
        },
        
        // Create a new task
        createTask: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            await repository.createWithHierarchyNumber(data);
            // Refetch to get updated hierarchy
            await get().fetchTasks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to create task", isLoading: false });
          }
        },
        
        // Insert task after another task
        insertTaskAfter: async (afterTaskId, data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            await repository.insertTaskAfter(afterTaskId, data);
            // Refetch to get updated hierarchy
            await get().fetchTasks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to insert task", isLoading: false });
          }
        },
        
        // Recalculate all hierarchy numbers
        recalculateHierarchyNumbers: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            await repository.recalculateAllHierarchyNumbers();
            // Refetch to get updated hierarchy numbers
            await get().fetchTasks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to recalculate hierarchy numbers", isLoading: false });
          }
        },
        
        // Update a task
        updateTask: async (id, data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            const updatedTask = await repository.updateWithRecalculation(id, data);
            if (updatedTask) {
              // Update task in state while preserving hierarchy
              const updateTaskInTree = (tasks: WBSTask[]): WBSTask[] => {
                return tasks.map(task => {
                  if (task.id === id) {
                    return { ...task, ...updatedTask };
                  }
                  if (task.children) {
                    return { ...task, children: updateTaskInTree(task.children) };
                  }
                  return task;
                });
              };
              
              set((state) => ({
                tasks: updateTaskInTree(state.tasks),
                isLoading: false
              }));
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to update task", isLoading: false });
          }
        },
        
        // Delete a task
        deleteTask: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            await repository.delete(id);
            // Refetch to get updated hierarchy
            await get().fetchTasks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to delete task", isLoading: false });
          }
        },
        
        // Move a task
        moveTask: async (taskId, newParentId, newPosition) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            await repository.move(taskId, newParentId, newPosition);
            // Refetch to get updated hierarchy
            await get().fetchTasks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to move task", isLoading: false });
          }
        },
        
        // Reorder task
        reorderTask: async (taskId, targetTaskId, position) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            await repository.reorderTask(taskId, targetTaskId, position);
            // Refetch to get updated hierarchy
            await get().fetchTasks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to reorder task", isLoading: false });
          }
        },
        
        // Update task progress
        updateTaskProgress: async (taskId, progress) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            await repository.update(taskId, { progress, actual_hours: 0 }); // Placeholder for actual_hours
            await repository.updateProgress(taskId);
            // Refetch to get updated progress for parent tasks
            await get().fetchTasks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to update progress", isLoading: false });
          }
        },
        
        // Get total estimated hours
        getTotalEstimatedHours: async (taskId) => {
          try {
            const db = await getDatabase();
            const repository = new WBSRepository(db);
            return await repository.getTotalEstimatedHours(taskId);
          } catch (error) {
            console.error("Failed to get total estimated hours:", error);
            return 0;
          }
        },
        
        // Get flattened task list
        getFlattenedTasks: () => {
          const { tasks } = get();
          const flattened: WBSTask[] = [];
          
          const flatten = (taskList: WBSTask[]) => {
            taskList.forEach(task => {
              flattened.push(task);
              if (task.children) {
                flatten(task.children);
              }
            });
          };
          
          flatten(tasks);
          return flattened;
        },
        
        // Find task by ID
        findTaskById: (id) => {
          const flattened = get().getFlattenedTasks();
          return flattened.find(task => task.id === id);
        },
        
        // Get task ancestors
        getTaskAncestors: (taskId) => {
          const ancestors: WBSTask[] = [];
          const { tasks } = get();
          
          const findAncestors = (id: string, taskList: WBSTask[]): boolean => {
            for (const task of taskList) {
              if (task.children?.some(child => child.id === id)) {
                ancestors.unshift(task);
                findAncestors(task.id, tasks);
                return true;
              }
              if (task.children && findAncestors(id, task.children)) {
                return true;
              }
            }
            return false;
          };
          
          findAncestors(taskId, tasks);
          return ancestors;
        },
        
        // Reset store
        reset: () => set(initialState),
      }),
      {
        name: "wbs-cache",
        partialize: (state) => ({ tasks: state.tasks, expandedTasks: state.expandedTasks }),
      }
    )
  )
);