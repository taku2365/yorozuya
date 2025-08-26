import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedTaskStore } from '../unified-task-store';
import type { UnifiedTask } from '@/lib/types/unified-task';

// モックリポジトリ
vi.mock('@/lib/repositories/unified-task-repository', () => ({
  UnifiedTaskRepository: vi.fn().mockImplementation(() => ({
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByView: vi.fn(),
    search: vi.fn(),
  })),
}));

describe('UnifiedTaskStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useUnifiedTaskStore.getState().reset();
    vi.clearAllMocks();
  });

  const mockTask: UnifiedTask = {
    id: 'task-1',
    title: 'テストタスク',
    description: 'テストの説明',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    views: ['todo', 'wbs'],
    metadata: {},
  };

  describe('タスクの取得', () => {
    it('すべてのタスクを取得できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      const mockTasks = [mockTask, { ...mockTask, id: 'task-2' }];
      
      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.findAll).mockResolvedValue(mockTasks);

      await act(async () => {
        await result.current.fetchTasks();
      });

      expect(result.current.tasks).toHaveLength(2);
      expect(result.current.tasks[0].id).toBe('task-1');
    });

    it('特定のビューのタスクを取得できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      const todoTasks = [{ ...mockTask, views: ['todo'] }];
      
      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.findByView).mockResolvedValue(todoTasks);

      await act(async () => {
        await result.current.fetchTasksByView('todo');
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].views).toContain('todo');
    });

    it('タスクを検索できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      const searchResults = [mockTask];
      
      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.search).mockResolvedValue(searchResults);

      await act(async () => {
        await result.current.searchTasks('テスト');
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].title).toContain('テスト');
    });
  });

  describe('タスクの作成', () => {
    it('新しいタスクを作成できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      const newTask = { ...mockTask, id: 'new-task' };
      
      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.create).mockResolvedValue(newTask);

      await act(async () => {
        await result.current.createTask({
          title: 'テストタスク',
          description: 'テストの説明',
          views: ['todo', 'wbs'],
        });
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe('new-task');
    });

    it('楽観的更新を行う', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.create).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockTask), 100))
      );

      let promise: Promise<void>;
      act(() => {
        promise = result.current.createTask({
          title: 'テストタスク',
          views: ['todo'],
        });
      });

      // 楽観的更新の確認
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toMatch(/^temp-/);

      await act(async () => {
        await promise!;
      });

      // 実際のデータで更新される
      expect(result.current.tasks[0].id).toBe('task-1');
    });
  });

  describe('タスクの更新', () => {
    it('タスクを更新できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      const updatedTask = { ...mockTask, title: '更新されたタスク' };
      
      // 初期状態
      act(() => {
        result.current.setTasks([mockTask]);
      });

      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.update).mockResolvedValue(updatedTask);

      await act(async () => {
        await result.current.updateTask('task-1', { title: '更新されたタスク' });
      });

      expect(result.current.tasks[0].title).toBe('更新されたタスク');
    });

    it('部分更新を行える', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([mockTask]);
      });

      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.update).mockResolvedValue({
        ...mockTask,
        status: 'in_progress',
      });

      await act(async () => {
        await result.current.updateTask('task-1', { status: 'in_progress' });
      });

      expect(result.current.tasks[0].status).toBe('in_progress');
      expect(result.current.tasks[0].title).toBe('テストタスク'); // 変更されない
    });
  });

  describe('タスクの削除', () => {
    it('タスクを削除できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([mockTask, { ...mockTask, id: 'task-2' }]);
      });

      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.delete).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.deleteTask('task-1');
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe('task-2');
    });
  });

  describe('フィルタリング', () => {
    it('ステータスでフィルタリングできる', () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([
          mockTask,
          { ...mockTask, id: 'task-2', status: 'in_progress' },
          { ...mockTask, id: 'task-3', status: 'done' },
        ]);
        result.current.setFilter({ status: ['todo', 'in_progress'] });
      });

      const filtered = result.current.getFilteredTasks();
      expect(filtered).toHaveLength(2);
      expect(filtered.find(t => t.status === 'done')).toBeUndefined();
    });

    it('優先度でフィルタリングできる', () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([
          mockTask,
          { ...mockTask, id: 'task-2', priority: 'high' },
          { ...mockTask, id: 'task-3', priority: 'low' },
        ]);
        result.current.setFilter({ priority: ['high'] });
      });

      const filtered = result.current.getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe('high');
    });

    it('担当者でフィルタリングできる', () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([
          { ...mockTask, assigneeId: 'user-1' },
          { ...mockTask, id: 'task-2', assigneeId: 'user-2' },
          { ...mockTask, id: 'task-3' },
        ]);
        result.current.setFilter({ assigneeIds: ['user-1'] });
      });

      const filtered = result.current.getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].assigneeId).toBe('user-1');
    });

    it('複数条件でフィルタリングできる', () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([
          { ...mockTask, status: 'todo', priority: 'high' },
          { ...mockTask, id: 'task-2', status: 'todo', priority: 'low' },
          { ...mockTask, id: 'task-3', status: 'done', priority: 'high' },
        ]);
        result.current.setFilter({ 
          status: ['todo'],
          priority: ['high'],
        });
      });

      const filtered = result.current.getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('todo');
      expect(filtered[0].priority).toBe('high');
    });
  });

  describe('ビュー間の同期', () => {
    it('タスクにビューを追加できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([mockTask]);
      });

      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.update).mockResolvedValue({
        ...mockTask,
        views: ['todo', 'wbs', 'kanban'],
      });

      await act(async () => {
        await result.current.addTaskToView('task-1', 'kanban');
      });

      expect(result.current.tasks[0].views).toContain('kanban');
    });

    it('タスクからビューを削除できる', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      act(() => {
        result.current.setTasks([mockTask]);
      });

      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.update).mockResolvedValue({
        ...mockTask,
        views: ['todo'],
      });

      await act(async () => {
        await result.current.removeTaskFromView('task-1', 'wbs');
      });

      expect(result.current.tasks[0].views).not.toContain('wbs');
    });
  });

  describe('エラーハンドリング', () => {
    it('作成エラーをハンドリングする', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      const error = new Error('作成エラー');
      
      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.create).mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.createTask({ title: 'エラータスク', views: ['todo'] });
        } catch (e) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe('作成エラー');
    });

    it('更新エラーをハンドリングする', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      const error = new Error('更新エラー');
      
      act(() => {
        result.current.setTasks([mockTask]);
      });

      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.update).mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.updateTask('task-1', { title: '更新' });
        } catch (e) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe('更新エラー');
    });
  });

  describe('読み込み状態', () => {
    it('読み込み中の状態を管理する', async () => {
      const { result } = renderHook(() => useUnifiedTaskStore());
      
      const repository = useUnifiedTaskStore.getState().repository;
      vi.mocked(repository.findAll).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      // 非同期処理を開始
      let fetchPromise: Promise<void>;
      act(() => {
        fetchPromise = result.current.fetchTasks();
      });

      // 読み込み中の確認
      expect(result.current.isLoading).toBe(true);

      // 非同期処理の完了を待つ
      await act(async () => {
        await fetchPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});