import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { GanttTask, GanttDependency } from "../db/types";
import type { 
  CreateGanttTaskDto, 
  UpdateGanttTaskDto, 
  CreateDependencyDto 
} from "../repositories/gantt-repository";
import { GanttRepository } from "../repositories/gantt-repository";
import { getDatabase } from "../db/singleton";

interface GanttState {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTasks: (tasks: GanttTask[]) => void;
  setDependencies: (dependencies: GanttDependency[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Task operations
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateGanttTaskDto) => Promise<void>;
  updateTask: (id: string, data: UpdateGanttTaskDto) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Task management
  adjustTaskDates: (taskId: string, newStartDate: string, newEndDate: string) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  
  // Dependency operations
  fetchDependencies: () => Promise<void>;
  createDependency: (data: CreateDependencyDto) => Promise<void>;
  deleteDependency: (id: string) => Promise<void>;
  
  // Analysis
  calculateCriticalPath: () => Promise<string[]>;
  
  // Utility functions
  getTaskDependencies: (taskId: string) => { 
    predecessors: GanttDependency[]; 
    successors: GanttDependency[]; 
  };
  canDeleteTask: (taskId: string) => boolean;
  getTasksInRange: (startDate: string, endDate: string) => GanttTask[];
  
  // Utility
  reset: () => void;
}

const initialState = {
  tasks: [],
  dependencies: [],
  isLoading: false,
  error: null,
};

export const useGanttStore = create<GanttState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setTasks: (tasks) => set({ tasks }),
        setDependencies: (dependencies) => set({ dependencies }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        
        // Fetch all tasks
        fetchTasks: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            const tasks = await repository.findAllTasks();
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
            const repository = new GanttRepository(db);
            const newTask = await repository.createTask(data);
            set((state) => ({ 
              tasks: [...state.tasks, newTask],
              isLoading: false 
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to create task", isLoading: false });
          }
        },
        
        // Update a task
        updateTask: async (id, data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            const updatedTask = await repository.updateTask(id, data);
            if (updatedTask) {
              set((state) => ({
                tasks: state.tasks.map(task => 
                  task.id === id ? updatedTask : task
                ),
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
            const repository = new GanttRepository(db);
            await repository.deleteTask(id);
            set((state) => ({
              tasks: state.tasks.filter(task => task.id !== id),
              dependencies: state.dependencies.filter(
                dep => dep.predecessor_id !== id && dep.successor_id !== id
              ),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to delete task", isLoading: false });
          }
        },
        
        // Adjust task dates
        adjustTaskDates: async (taskId, newStartDate, newEndDate) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            await repository.adjustDates(taskId, newStartDate, newEndDate);
            
            // Update local state
            set((state) => ({
              tasks: state.tasks.map(task => 
                task.id === taskId 
                  ? { ...task, start_date: newStartDate, end_date: newEndDate }
                  : task
              ),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to adjust dates", isLoading: false });
          }
        },
        
        // Update task progress
        updateTaskProgress: async (taskId, progress) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            await repository.updateProgress(taskId, progress);
            
            // Update local state
            set((state) => ({
              tasks: state.tasks.map(task => 
                task.id === taskId ? { ...task, progress } : task
              ),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to update progress", isLoading: false });
          }
        },
        
        // Fetch all dependencies
        fetchDependencies: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            const dependencies = await repository.findAllDependencies();
            set({ dependencies, isLoading: false });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to fetch dependencies", isLoading: false });
          }
        },
        
        // Create a new dependency
        createDependency: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            const newDependency = await repository.createDependency(data);
            set((state) => ({ 
              dependencies: [...state.dependencies, newDependency],
              isLoading: false 
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to create dependency", isLoading: false });
          }
        },
        
        // Delete a dependency
        deleteDependency: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            await repository.deleteDependency(id);
            set((state) => ({
              dependencies: state.dependencies.filter(dep => dep.id !== id),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to delete dependency", isLoading: false });
          }
        },
        
        // Calculate critical path
        calculateCriticalPath: async () => {
          try {
            const db = await getDatabase();
            const repository = new GanttRepository(db);
            return await repository.calculateCriticalPath();
          } catch (error) {
            console.error("Failed to calculate critical path:", error);
            return [];
          }
        },
        
        // Get task dependencies
        getTaskDependencies: (taskId) => {
          const { dependencies } = get();
          return {
            predecessors: dependencies.filter(dep => dep.successor_id === taskId),
            successors: dependencies.filter(dep => dep.predecessor_id === taskId),
          };
        },
        
        // Check if task can be deleted
        canDeleteTask: (taskId) => {
          const { dependencies } = get();
          const hasDependendencies = dependencies.some(
            dep => dep.predecessor_id === taskId || dep.successor_id === taskId
          );
          return !hasDependendencies;
        },
        
        // Get tasks in date range
        getTasksInRange: (startDate, endDate) => {
          const { tasks } = get();
          return tasks.filter(task => {
            // Task overlaps with the given range if:
            // 1. Task starts before range ends AND
            // 2. Task ends after range starts
            return task.start_date <= endDate && task.end_date >= startDate;
          });
        },
        
        // Reset store
        reset: () => set(initialState),
      }),
      {
        name: "gantt-cache",
        partialize: (state) => ({ tasks: state.tasks, dependencies: state.dependencies }),
      }
    )
  )
);