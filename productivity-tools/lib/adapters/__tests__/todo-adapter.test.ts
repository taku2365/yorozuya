import { describe, it, expect } from 'vitest';
import { TodoAdapter } from '../todo-adapter';
import type { Todo } from '@/lib/types';
import type { UnifiedTask } from '@/lib/types/unified-task';

describe('TodoAdapter', () => {
  const adapter = new TodoAdapter();

  describe('toUnifiedTask', () => {
    it('TodoをUnifiedTaskに変換できる', () => {
      const todo: Todo = {
        id: 'todo-1',
        title: 'テストタスク',
        description: '説明文',
        completed: false,
        priority: 'high',
        dueDate: '2024-12-31',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(todo);

      expect(unifiedTask).toEqual({
        id: expect.stringMatching(/^unified-/),
        title: 'テストタスク',
        description: '説明文',
        status: 'todo',
        priority: 'high',
        views: ['todo'],
        metadata: {
          todo: {
            originalId: 'todo-1',
            completed: false,
          },
        },
        dueDate: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('完了済みTodoを正しくマッピングする', () => {
      const todo: Todo = {
        id: 'todo-2',
        title: '完了タスク',
        completed: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(todo);

      expect(unifiedTask.status).toBe('done');
      expect(unifiedTask.metadata.todo?.completed).toBe(true);
    });

    it('優先度なしのTodoをデフォルト値で変換する', () => {
      const todo: Todo = {
        id: 'todo-3',
        title: '優先度なし',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(todo);

      expect(unifiedTask.priority).toBe('medium');
    });
  });

  describe('fromUnifiedTask', () => {
    it('UnifiedTaskをTodoに変換できる', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'テストタスク',
        description: '説明文',
        status: 'todo',
        priority: 'high',
        views: ['todo', 'wbs'],
        metadata: {
          todo: {
            originalId: 'todo-1',
            completed: false,
          },
        },
        dueDate: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const todo = adapter.fromUnifiedTask(unifiedTask);

      expect(todo).toEqual({
        id: 'todo-1',
        title: 'テストタスク',
        description: '説明文',
        completed: false,
        priority: 'high',
        dueDate: '2024-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('ステータスに基づいて完了状態を設定する', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-2',
        title: '完了タスク',
        status: 'done',
        views: ['todo'],
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const todo = adapter.fromUnifiedTask(unifiedTask);

      expect(todo.completed).toBe(true);
    });

    it('新規作成時はIDを生成する', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-3',
        title: '新規タスク',
        status: 'todo',
        views: ['todo'],
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const todo = adapter.fromUnifiedTask(unifiedTask);

      expect(todo.id).toMatch(/^todo-/);
    });
  });

  describe('canConvert', () => {
    it('todo viewを含むタスクは変換可能', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'テスト',
        status: 'todo',
        views: ['todo', 'wbs'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(adapter.canConvert(unifiedTask)).toBe(true);
    });

    it('todo viewを含まないタスクは変換不可', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-2',
        title: 'テスト',
        status: 'todo',
        views: ['wbs', 'gantt'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(adapter.canConvert(unifiedTask)).toBe(false);
    });
  });

  describe('createMetadata', () => {
    it('Todoのメタデータを作成できる', () => {
      const todo: Todo = {
        id: 'todo-1',
        title: 'テスト',
        completed: true,
        priority: 'low',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const metadata = adapter.createMetadata(todo);

      expect(metadata).toEqual({
        todo: {
          originalId: 'todo-1',
          completed: true,
        },
      });
    });
  });

  describe('validateTodo', () => {
    it('有効なTodoは検証を通過する', () => {
      const todo: Todo = {
        id: 'todo-1',
        title: 'テスト',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateTodo(todo)).not.toThrow();
    });

    it('タイトルが空のTodoはエラーになる', () => {
      const todo: Todo = {
        id: 'todo-1',
        title: '',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateTodo(todo)).toThrow('タイトルは必須です');
    });
  });
});