import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { GanttProvider, useGantt } from '../gantt-context';
import type { GanttTask, GanttDependency } from '@/lib/types/gantt';

// モックリポジトリ
const mockTaskRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  reorder: vi.fn(),
  updateProgress: vi.fn(),
};

const mockDependencyRepository = {
  findAll: vi.fn(),
  findByTaskId: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  validateDependency: vi.fn(),
};

vi.mock('@/lib/repositories/gantt-task-repository', () => ({
  ganttTaskRepository: mockTaskRepository,
}));

vi.mock('@/lib/repositories/gantt-dependency-repository', () => ({
  ganttDependencyRepository: mockDependencyRepository,
}));

describe('GanttContext', () => {
  const mockTasks: GanttTask[] = [
    {
      id: 'task1',
      title: 'タスク1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05'),
      progress: 50,
      dependencies: [],
      isCriticalPath: false,
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task2',
      title: 'タスク2',
      startDate: new Date('2024-01-06'),
      endDate: new Date('2024-01-10'),
      progress: 30,
      dependencies: ['task1'],
      isCriticalPath: false,
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockDependencies: GanttDependency[] = [
    {
      id: 'dep1',
      fromTaskId: 'task1',
      toTaskId: 'task2',
      type: 'finish-to-start',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockTaskRepository.findAll.mockResolvedValue(mockTasks);
    mockDependencyRepository.findAll.mockResolvedValue(mockDependencies);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GanttProvider>{children}</GanttProvider>
  );

  describe('初期化', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useGantt(), { wrapper });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.dependencies).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.viewMode).toBe('month');
      expect(result.current.selectedTaskId).toBeNull();
    });

    it('データが自動的に読み込まれる', async () => {
      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.dependencies).toEqual(mockDependencies);
      expect(mockTaskRepository.findAll).toHaveBeenCalled();
      expect(mockDependencyRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('タスク操作', () => {
    it('新しいタスクを作成できる', async () => {
      const newTask: Partial<GanttTask> = {
        title: '新規タスク',
        startDate: new Date('2024-01-11'),
        endDate: new Date('2024-01-15'),
      };

      const createdTask = { ...newTask, id: 'task3' } as GanttTask;
      mockTaskRepository.create.mockResolvedValue(createdTask);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTask(newTask);
      });

      expect(mockTaskRepository.create).toHaveBeenCalledWith(newTask);
      expect(result.current.tasks).toContainEqual(createdTask);
    });

    it('タスクを更新できる', async () => {
      const updatedTask = { ...mockTasks[0], title: '更新されたタスク' };
      mockTaskRepository.update.mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTask(updatedTask);
      });

      expect(mockTaskRepository.update).toHaveBeenCalledWith(updatedTask.id, updatedTask);
      expect(result.current.tasks[0].title).toBe('更新されたタスク');
    });

    it('タスクを削除できる', async () => {
      mockTaskRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteTask('task1');
      });

      expect(mockTaskRepository.delete).toHaveBeenCalledWith('task1');
      expect(result.current.tasks).not.toContainEqual(
        expect.objectContaining({ id: 'task1' })
      );
    });

    it('タスクの進捗を更新できる', async () => {
      const updatedTask = { ...mockTasks[0], progress: 80 };
      mockTaskRepository.updateProgress.mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTaskProgress('task1', 80);
      });

      expect(mockTaskRepository.updateProgress).toHaveBeenCalledWith('task1', 80);
      expect(result.current.tasks[0].progress).toBe(80);
    });
  });

  describe('依存関係操作', () => {
    it('依存関係を作成できる', async () => {
      const newDependency: Partial<GanttDependency> = {
        fromTaskId: 'task2',
        toTaskId: 'task1',
        type: 'finish-to-start',
      };

      const createdDependency = { ...newDependency, id: 'dep2' } as GanttDependency;
      mockDependencyRepository.validateDependency.mockResolvedValue(true);
      mockDependencyRepository.create.mockResolvedValue(createdDependency);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createDependency('task2', 'task1');
      });

      expect(mockDependencyRepository.validateDependency).toHaveBeenCalledWith('task2', 'task1');
      expect(mockDependencyRepository.create).toHaveBeenCalledWith(newDependency);
      expect(result.current.dependencies).toContainEqual(createdDependency);
    });

    it('循環依存を検出してエラーを返す', async () => {
      mockDependencyRepository.validateDependency.mockResolvedValue(false);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const error = await result.current.createDependency('task1', 'task2');
        expect(error).toBe('循環依存が発生します');
      });

      expect(mockDependencyRepository.create).not.toHaveBeenCalled();
    });

    it('依存関係を削除できる', async () => {
      mockDependencyRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteDependency('dep1');
      });

      expect(mockDependencyRepository.delete).toHaveBeenCalledWith('dep1');
      expect(result.current.dependencies).not.toContainEqual(
        expect.objectContaining({ id: 'dep1' })
      );
    });
  });

  describe('ビュー管理', () => {
    it('ビューモードを変更できる', () => {
      const { result } = renderHook(() => useGantt(), { wrapper });

      act(() => {
        result.current.setViewMode('week');
      });

      expect(result.current.viewMode).toBe('week');
    });

    it('日付範囲を変更できる', () => {
      const { result } = renderHook(() => useGantt(), { wrapper });

      const newStartDate = new Date('2024-01-01');
      const newEndDate = new Date('2024-12-31');

      act(() => {
        result.current.setDateRange(newStartDate, newEndDate);
      });

      expect(result.current.startDate).toEqual(newStartDate);
      expect(result.current.endDate).toEqual(newEndDate);
    });

    it('タスクを選択できる', () => {
      const { result } = renderHook(() => useGantt(), { wrapper });

      act(() => {
        result.current.selectTask('task1');
      });

      expect(result.current.selectedTaskId).toBe('task1');
    });

    it('ズームイン・ズームアウトができる', () => {
      const { result } = renderHook(() => useGantt(), { wrapper });

      // ズームイン (month -> week)
      act(() => {
        result.current.zoomIn();
      });
      expect(result.current.viewMode).toBe('week');

      // さらにズームイン (week -> day)
      act(() => {
        result.current.zoomIn();
      });
      expect(result.current.viewMode).toBe('day');

      // ズームアウト (day -> week)
      act(() => {
        result.current.zoomOut();
      });
      expect(result.current.viewMode).toBe('week');
    });
  });

  describe('クリティカルパス計算', () => {
    it('クリティカルパスを計算できる', async () => {
      const criticalPathTaskIds = ['task1', 'task2'];
      
      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const pathIds = await result.current.calculateCriticalPath();
        expect(pathIds).toBeDefined();
      });

      // クリティカルパスの計算ロジックに応じて、該当タスクのisCriticalPathがtrueになる
      // ここではモックの実装に依存
    });
  });

  describe('フィルタリング', () => {
    it('担当者でフィルタリングできる', async () => {
      const tasksWithAssignee = [
        { ...mockTasks[0], assigneeId: 'user1' },
        { ...mockTasks[1], assigneeId: 'user2' },
      ];
      mockTaskRepository.findAll.mockResolvedValue(tasksWithAssignee);

      const { result, rerender } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFilter({ assigneeId: 'user1' });
      });

      const filteredTasks = result.current.getFilteredTasks();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].assigneeId).toBe('user1');
    });

    it('ステータスでフィルタリングできる', async () => {
      const tasksWithStatus = [
        { ...mockTasks[0], status: 'in-progress' },
        { ...mockTasks[1], status: 'completed' },
      ];
      mockTaskRepository.findAll.mockResolvedValue(tasksWithStatus);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFilter({ status: 'completed' });
      });

      const filteredTasks = result.current.getFilteredTasks();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].status).toBe('completed');
    });
  });

  describe('エラーハンドリング', () => {
    it('データ読み込みエラーをハンドリングする', async () => {
      const error = new Error('Failed to load tasks');
      mockTaskRepository.findAll.mockRejectedValue(error);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load tasks');
      expect(result.current.tasks).toEqual([]);
    });

    it('タスク作成エラーをハンドリングする', async () => {
      const error = new Error('Failed to create task');
      mockTaskRepository.create.mockRejectedValue(error);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const errorMessage = await result.current.createTask({
          title: 'エラータスク',
          startDate: new Date(),
          endDate: new Date(),
        });
        expect(errorMessage).toBe('Failed to create task');
      });
    });
  });

  describe('楽観的更新', () => {
    it('タスク更新が楽観的に反映される', async () => {
      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedTask = { ...mockTasks[0], title: '楽観的更新' };
      
      // 更新を開始（まだResolveしていない）
      let updatePromise: Promise<void>;
      act(() => {
        updatePromise = result.current.updateTask(updatedTask);
      });

      // UIには即座に反映される
      expect(result.current.tasks[0].title).toBe('楽観的更新');

      // サーバー更新を待つ
      await act(async () => {
        await updatePromise;
      });

      expect(mockTaskRepository.update).toHaveBeenCalled();
    });

    it('楽観的更新が失敗した場合はロールバックされる', async () => {
      const error = new Error('Update failed');
      mockTaskRepository.update.mockRejectedValue(error);

      const { result } = renderHook(() => useGantt(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalTitle = result.current.tasks[0].title;
      const updatedTask = { ...mockTasks[0], title: '失敗する更新' };

      await act(async () => {
        const errorMessage = await result.current.updateTask(updatedTask);
        expect(errorMessage).toBe('Update failed');
      });

      // ロールバックされて元のタイトルに戻る
      expect(result.current.tasks[0].title).toBe(originalTitle);
    });
  });
});