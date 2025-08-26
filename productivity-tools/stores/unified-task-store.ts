import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UnifiedTaskRepository } from '@/lib/repositories/unified-task-repository';
import type { UnifiedTask } from '@/lib/types/unified-task';

interface TaskFilter {
  status?: string[];
  priority?: string[];
  assigneeIds?: string[];
  tags?: string[];
  projectIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface UnifiedTaskStore {
  // State
  tasks: UnifiedTask[];
  filter: TaskFilter;
  isLoading: boolean;
  error: string | null;
  repository: UnifiedTaskRepository;

  // Actions
  setTasks: (tasks: UnifiedTask[]) => void;
  setFilter: (filter: TaskFilter) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Task operations
  fetchTasks: () => Promise<void>;
  fetchTasksByView: (view: string) => Promise<void>;
  searchTasks: (query: string) => Promise<void>;
  createTask: (data: Partial<UnifiedTask>) => Promise<void>;
  updateTask: (id: string, data: Partial<UnifiedTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // View operations
  addTaskToView: (taskId: string, view: string) => Promise<void>;
  removeTaskFromView: (taskId: string, view: string) => Promise<void>;
  
  // Filter operations
  getFilteredTasks: () => UnifiedTask[];
  
  // Utility
  reset: () => void;
}

export const useUnifiedTaskStore = create<UnifiedTaskStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      filter: {},
      isLoading: false,
      error: null,
      repository: new UnifiedTaskRepository(),

      // Actions
      setTasks: (tasks) => set({ tasks }),
      setFilter: (filter) => set({ filter }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Fetch all tasks
      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await get().repository.findAll();
          set({ tasks, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'タスクの取得に失敗しました';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Fetch tasks by view
      fetchTasksByView: async (view: string) => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await get().repository.findByView(view);
          set({ tasks, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'タスクの取得に失敗しました';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Search tasks
      searchTasks: async (query: string) => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await get().repository.search(query);
          set({ tasks, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'タスクの検索に失敗しました';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Create task with optimistic update
      createTask: async (data: Partial<UnifiedTask>) => {
        const tempId = `temp-${Date.now()}`;
        const tempTask: UnifiedTask = {
          id: tempId,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          views: data.views || [],
          metadata: data.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };

        // Optimistic update
        set((state) => ({ tasks: [...state.tasks, tempTask] }));

        try {
          const newTask = await get().repository.create(data);
          // Replace temp task with real task
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === tempId ? newTask : t)),
          }));
        } catch (error) {
          // Rollback on error
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== tempId),
            error: error instanceof Error ? error.message : '作成エラー',
          }));
          throw error;
        }
      },

      // Update task
      updateTask: async (id: string, data: Partial<UnifiedTask>) => {
        const originalTask = get().tasks.find((t) => t.id === id);
        if (!originalTask) return;

        // Optimistic update
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date() } : t
          ),
        }));

        try {
          const updatedTask = await get().repository.update(id, data);
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
          }));
        } catch (error) {
          // Rollback on error
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? originalTask : t)),
            error: error instanceof Error ? error.message : '更新エラー',
          }));
          throw error;
        }
      },

      // Delete task
      deleteTask: async (id: string) => {
        const originalTasks = get().tasks;
        
        // Optimistic update
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));

        try {
          await get().repository.delete(id);
        } catch (error) {
          // Rollback on error
          set({
            tasks: originalTasks,
            error: error instanceof Error ? error.message : '削除エラー',
          });
          throw error;
        }
      },

      // Add task to view
      addTaskToView: async (taskId: string, view: string) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task || task.views.includes(view)) return;

        await get().updateTask(taskId, {
          views: [...task.views, view],
        });
      },

      // Remove task from view
      removeTaskFromView: async (taskId: string, view: string) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task || !task.views.includes(view)) return;

        await get().updateTask(taskId, {
          views: task.views.filter((v) => v !== view),
        });
      },

      // Get filtered tasks
      getFilteredTasks: () => {
        const { tasks, filter } = get();
        
        return tasks.filter((task) => {
          // Status filter
          if (filter.status?.length && !filter.status.includes(task.status)) {
            return false;
          }

          // Priority filter
          if (filter.priority?.length && task.priority && !filter.priority.includes(task.priority)) {
            return false;
          }

          // Assignee filter
          if (filter.assigneeIds?.length && (!task.assigneeId || !filter.assigneeIds.includes(task.assigneeId))) {
            return false;
          }

          // Tags filter
          if (filter.tags?.length && (!task.tags || !task.tags.some(tag => filter.tags!.includes(tag)))) {
            return false;
          }

          // Project filter
          if (filter.projectIds?.length && (!task.projectId || !filter.projectIds.includes(task.projectId))) {
            return false;
          }

          // Date range filter
          if (filter.dateRange) {
            const taskDate = task.dueDate || task.endDate;
            if (!taskDate) return false;
            
            const date = new Date(taskDate);
            if (date < filter.dateRange.start || date > filter.dateRange.end) {
              return false;
            }
          }

          return true;
        });
      },

      // Reset store
      reset: () => {
        set({
          tasks: [],
          filter: {},
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'unified-task-store',
    }
  )
);