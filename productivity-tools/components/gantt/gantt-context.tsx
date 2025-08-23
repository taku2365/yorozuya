"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ganttTaskRepository } from '@/lib/repositories/gantt-task-repository';
import { ganttDependencyRepository } from '@/lib/repositories/gantt-dependency-repository';
import type { GanttTask, GanttDependency, GanttViewMode } from '@/lib/types/gantt';

interface GanttFilter {
  assigneeId?: string;
  status?: string;
  priority?: string;
  tag?: string;
}

interface GanttContextValue {
  // State
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  loading: boolean;
  error: string | null;
  viewMode: GanttViewMode;
  startDate: Date;
  endDate: Date;
  selectedTaskId: string | null;
  filter: GanttFilter;

  // Task operations
  createTask: (task: Partial<GanttTask>) => Promise<string | void>;
  updateTask: (task: GanttTask) => Promise<string | void>;
  deleteTask: (taskId: string) => Promise<string | void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<string | void>;

  // Dependency operations
  createDependency: (fromTaskId: string, toTaskId: string) => Promise<string | void>;
  deleteDependency: (dependencyId: string) => Promise<string | void>;

  // View operations
  setViewMode: (mode: GanttViewMode) => void;
  setDateRange: (start: Date, end: Date) => void;
  selectTask: (taskId: string | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Filtering
  setFilter: (filter: GanttFilter) => void;
  getFilteredTasks: () => GanttTask[];

  // Critical path
  calculateCriticalPath: () => Promise<string[]>;
}

const GanttContext = createContext<GanttContextValue | undefined>(undefined);

export function useGantt() {
  const context = useContext(GanttContext);
  if (!context) {
    throw new Error('useGantt must be used within a GanttProvider');
  }
  return context;
}

interface GanttProviderProps {
  children: React.ReactNode;
}

const viewModeOrder: GanttViewMode[] = ['day', 'week', 'month', 'quarter', 'year'];

export function GanttProvider({ children }: GanttProviderProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<GanttViewMode>('month');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<GanttFilter>({});

  // Date range based on tasks
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [loadedTasks, loadedDependencies] = await Promise.all([
        ganttTaskRepository.findAll(),
        ganttDependencyRepository.findAll(),
      ]);
      setTasks(loadedTasks);
      setDependencies(loadedDependencies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Task operations with optimistic updates
  const createTask = useCallback(async (taskData: Partial<GanttTask>): Promise<string | void> => {
    try {
      const createdTask = await ganttTaskRepository.create(taskData);
      setTasks(prev => [...prev, createdTask]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      setError(message);
      return message;
    }
  }, []);

  const updateTask = useCallback(async (task: GanttTask): Promise<string | void> => {
    // Optimistic update
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));

    try {
      const updatedTask = await ganttTaskRepository.update(task.id, task);
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (err) {
      // Rollback on error
      setTasks(originalTasks);
      const message = err instanceof Error ? err.message : 'Failed to update task';
      setError(message);
      return message;
    }
  }, [tasks]);

  const deleteTask = useCallback(async (taskId: string): Promise<string | void> => {
    try {
      await ganttTaskRepository.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      // Also remove dependencies
      setDependencies(prev => prev.filter(d => 
        d.fromTaskId !== taskId && d.toTaskId !== taskId
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      return message;
    }
  }, []);

  const updateTaskProgress = useCallback(async (taskId: string, progress: number): Promise<string | void> => {
    try {
      const updatedTask = await ganttTaskRepository.updateProgress(taskId, progress);
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update progress';
      setError(message);
      return message;
    }
  }, []);

  // Dependency operations
  const createDependency = useCallback(async (fromTaskId: string, toTaskId: string): Promise<string | void> => {
    try {
      // Validate first
      const isValid = await ganttDependencyRepository.validateDependency(fromTaskId, toTaskId);
      if (!isValid) {
        const message = '循環依存が発生します';
        setError(message);
        return message;
      }

      const dependency = await ganttDependencyRepository.create({
        fromTaskId,
        toTaskId,
        type: 'finish-to-start',
      });
      setDependencies(prev => [...prev, dependency]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create dependency';
      setError(message);
      return message;
    }
  }, []);

  const deleteDependency = useCallback(async (dependencyId: string): Promise<string | void> => {
    try {
      await ganttDependencyRepository.delete(dependencyId);
      setDependencies(prev => prev.filter(d => d.id !== dependencyId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete dependency';
      setError(message);
      return message;
    }
  }, []);

  // View operations
  const zoomIn = useCallback(() => {
    const currentIndex = viewModeOrder.indexOf(viewMode);
    if (currentIndex > 0) {
      setViewMode(viewModeOrder[currentIndex - 1]);
    }
  }, [viewMode]);

  const zoomOut = useCallback(() => {
    const currentIndex = viewModeOrder.indexOf(viewMode);
    if (currentIndex < viewModeOrder.length - 1) {
      setViewMode(viewModeOrder[currentIndex + 1]);
    }
  }, [viewMode]);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Filtering
  const getFilteredTasks = useCallback(() => {
    return tasks.filter(task => {
      if (filter.assigneeId && task.assigneeId !== filter.assigneeId) return false;
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.tag && !task.tags?.includes(filter.tag)) return false;
      return true;
    });
  }, [tasks, filter]);

  // Critical path calculation
  const calculateCriticalPath = useCallback(async (): Promise<string[]> => {
    // Simple critical path algorithm
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const criticalPath: string[] = [];

    // Find tasks with no dependencies (start tasks)
    const startTasks = tasks.filter(task => 
      !task.dependencies || task.dependencies.length === 0
    );

    // Calculate longest path from each start task
    const calculatePath = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (!task) return 0;

      const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Find dependent tasks
      const dependentTasks = tasks.filter(t => t.dependencies?.includes(taskId));
      if (dependentTasks.length === 0) return duration;

      const maxChildPath = Math.max(...dependentTasks.map(t => calculatePath(t.id, new Set(visited))));
      return duration + maxChildPath;
    };

    // Find the longest path
    let maxPath = 0;
    let criticalStartTask: string | null = null;

    startTasks.forEach(task => {
      const pathLength = calculatePath(task.id);
      if (pathLength > maxPath) {
        maxPath = pathLength;
        criticalStartTask = task.id;
      }
    });

    // Build critical path
    if (criticalStartTask) {
      const buildPath = (taskId: string) => {
        criticalPath.push(taskId);
        const task = taskMap.get(taskId);
        if (task) {
          task.isCriticalPath = true;
        }

        const dependentTasks = tasks.filter(t => t.dependencies?.includes(taskId));
        if (dependentTasks.length > 0) {
          // Choose the dependent task with the longest path
          const nextTask = dependentTasks.reduce((longest, current) => {
            const currentPath = calculatePath(current.id);
            const longestPath = calculatePath(longest.id);
            return currentPath > longestPath ? current : longest;
          });
          buildPath(nextTask.id);
        }
      };

      buildPath(criticalStartTask);
    }

    // Update tasks with critical path flag
    setTasks(prev => prev.map(task => ({
      ...task,
      isCriticalPath: criticalPath.includes(task.id),
    })));

    return criticalPath;
  }, [tasks]);

  const value: GanttContextValue = {
    tasks,
    dependencies,
    loading,
    error,
    viewMode,
    startDate,
    endDate,
    selectedTaskId,
    filter,
    createTask,
    updateTask,
    deleteTask,
    updateTaskProgress,
    createDependency,
    deleteDependency,
    setViewMode,
    setDateRange,
    selectTask: setSelectedTaskId,
    zoomIn,
    zoomOut,
    setFilter,
    getFilteredTasks,
    calculateCriticalPath,
  };

  return (
    <GanttContext.Provider value={value}>
      {children}
    </GanttContext.Provider>
  );
}