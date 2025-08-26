import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskTransferService } from '../task-transfer-service';
import { TaskLinkRepository } from '@/lib/repositories/task-link-repository';
import { TodoRepository } from '@/lib/repositories/todo-repository';
import { WBSRepository } from '@/lib/repositories/wbs-repository';
import { KanbanRepository } from '@/lib/repositories/kanban-repository';
import { TodoAdapter } from '@/lib/adapters/todo-adapter';
import { WBSAdapter } from '@/lib/adapters/wbs-adapter';
import { KanbanAdapter } from '@/lib/adapters/kanban-adapter';

vi.mock('@/lib/repositories/task-link-repository');
vi.mock('@/lib/repositories/todo-repository');
vi.mock('@/lib/repositories/wbs-repository');
vi.mock('@/lib/repositories/kanban-repository');
vi.mock('@/lib/db/singleton', () => ({
  getDatabase: vi.fn().mockResolvedValue({}),
}));

describe('TaskTransferService', () => {
  let service: TaskTransferService;
  let mockLinkRepo: any;
  let mockTodoRepo: any;
  let mockWBSRepo: any;
  let mockKanbanRepo: any;

  const mockTodo = {
    id: 'todo-123',
    title: 'テストタスク',
    description: 'テスト説明',
    completed: false,
    priority: 'medium',
    dueDate: null,
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockLinkRepo = {
      findByViewAndOriginalId: vi.fn(),
      createLinkGroup: vi.fn(),
      findByUnifiedId: vi.fn(),
      updateSyncStatus: vi.fn(),
      update: vi.fn(),
    };
    mockTodoRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    mockWBSRepo = {
      create: vi.fn(),
      update: vi.fn(),
    };
    mockKanbanRepo = {
      create: vi.fn(),
      createCard: vi.fn(),
      update: vi.fn(),
      findDefaultLane: vi.fn(),
    };

    TaskLinkRepository.mockImplementation(() => mockLinkRepo);
    TodoRepository.mockImplementation(() => mockTodoRepo);
    WBSRepository.mockImplementation(() => mockWBSRepo);
    KanbanRepository.mockImplementation(() => mockKanbanRepo);

    service = new TaskTransferService();
  });

  describe('transferTasks', () => {
    it('ToDoからWBSへタスクを転送できる', async () => {
      mockTodoRepo.findById.mockResolvedValue(mockTodo);
      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue(null);
      mockWBSRepo.create.mockResolvedValue({ id: 'wbs-new-123', ...mockTodo });
      mockLinkRepo.createLinkGroup.mockResolvedValue({
        unifiedId: 'todo:todo-123',
        links: [
          { id: '1', viewType: 'todo', originalId: 'todo-123' },
          { id: '2', viewType: 'wbs', originalId: 'wbs-456' },
        ],
        syncEnabled: true,
      });

      mockWBSRepo.create.mockResolvedValue({
        id: 'wbs-456',
        name: 'テストタスク',
        description: 'テスト説明',
        status: 'not_started',
        progress: 0,
      });

      const result = await service.transferTasks({
        sourceView: 'todo',
        taskIds: ['todo-123'],
        targetViews: ['wbs'],
        syncEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.transferred).toHaveLength(1);
      expect(mockWBSRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'テストタスク',
          description: 'テスト説明',
        })
      );
    });

    it('既にリンクが存在する場合はエラーを返す', async () => {
      mockTodoRepo.findById.mockResolvedValue(mockTodo);
      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue({
        id: 'existing-link',
        unifiedId: 'todo:todo-123',
        viewType: 'todo',
        originalId: 'todo-123',
      });

      const result = await service.transferTasks({
        sourceView: 'todo',
        taskIds: ['todo-123'],
        targetViews: ['wbs'],
        syncEnabled: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('タスク「テストタスク」は既に他のビューにリンクされています');
    });

    it('複数のビューに同時に転送できる', async () => {
      mockTodoRepo.findById.mockResolvedValue(mockTodo);
      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue(null);
      mockKanbanRepo.findDefaultLane.mockResolvedValue({ id: 'lane-todo', title: 'ToDo' });
      mockWBSRepo.create.mockResolvedValue({ id: 'wbs-new-123', ...mockTodo });
      mockKanbanRepo.createCard.mockResolvedValue({ id: 'kanban-new-123', ...mockTodo });

      const result = await service.transferTasks({
        sourceView: 'todo',
        taskIds: ['todo-123'],
        targetViews: ['wbs', 'kanban'],
        syncEnabled: true,
      });

      expect(mockWBSRepo.create).toHaveBeenCalled();
      expect(mockKanbanRepo.create).toHaveBeenCalled();
    });

    it('同期無効の場合はリンクのみ作成', async () => {
      mockTodoRepo.findById.mockResolvedValue(mockTodo);
      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue(null);

      await service.transferTasks({
        sourceView: 'todo',
        taskIds: ['todo-123'],
        targetViews: ['wbs'],
        syncEnabled: false,
      });

      expect(mockLinkRepo.createLinkGroup).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        false // syncEnabled = false
      );
    });
  });

  describe('syncTask', () => {
    it('ToDoの完了状態をWBSに同期できる', async () => {
      const completedTodo = { ...mockTodo, completed: true };
      const mockLinks = [
        { viewType: 'todo', originalId: 'todo-123', syncEnabled: true },
        { viewType: 'wbs', originalId: 'wbs-456', syncEnabled: true },
      ];

      mockTodoRepo.findById.mockResolvedValue(completedTodo);
      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue({
        unifiedId: 'todo:todo-123',
      });
      mockLinkRepo.findByUnifiedId.mockResolvedValue(mockLinks);

      await service.syncTask('todo', 'todo-123');

      expect(mockWBSRepo.update).toHaveBeenCalledWith('wbs-456', {
        progress: 100,
        status: 'completed',
      });
    });

    it('WBSの進捗をToDoに同期できる', async () => {
      const mockWBSTask = {
        id: 'wbs-456',
        name: 'タスク',
        progress: 50,
        status: 'in_progress',
      };
      const mockLinks = [
        { viewType: 'wbs', originalId: 'wbs-456', syncEnabled: true },
        { viewType: 'todo', originalId: 'todo-123', syncEnabled: true },
      ];

      mockWBSRepo.findById = vi.fn().mockResolvedValue(mockWBSTask);
      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue({
        unifiedId: 'wbs:wbs-456',
      });
      mockLinkRepo.findByUnifiedId.mockResolvedValue(mockLinks);

      await service.syncTask('wbs', 'wbs-456');

      expect(mockTodoRepo.update).toHaveBeenCalledWith('todo-123', {
        completed: false, // 50%なので未完了
      });
    });

    it('同期が無効の場合は同期しない', async () => {
      const mockLinks = [
        { viewType: 'todo', originalId: 'todo-123', syncEnabled: false },
        { viewType: 'wbs', originalId: 'wbs-456', syncEnabled: false },
      ];

      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue({
        unifiedId: 'todo:todo-123',
      });
      mockLinkRepo.findByUnifiedId.mockResolvedValue(mockLinks);

      await service.syncTask('todo', 'todo-123');

      expect(mockWBSRepo.update).not.toHaveBeenCalled();
      expect(mockTodoRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('toggleSync', () => {
    it('同期の有効/無効を切り替えられる', async () => {
      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue({
        unifiedId: 'todo:todo-123',
      });

      await service.toggleSync('todo', 'todo-123', false);

      expect(mockLinkRepo.updateSyncStatus).toHaveBeenCalledWith(
        'todo:todo-123',
        false
      );
    });
  });

  describe('getLinkedTasks', () => {
    it('リンクされたタスクの情報を取得できる', async () => {
      const mockLinks = [
        { viewType: 'todo', originalId: 'todo-123', syncEnabled: true },
        { viewType: 'wbs', originalId: 'wbs-456', syncEnabled: true },
      ];

      mockLinkRepo.findByViewAndOriginalId.mockResolvedValue({
        unifiedId: 'todo:todo-123',
      });
      mockLinkRepo.findByUnifiedId.mockResolvedValue(mockLinks);
      mockTodoRepo.findById.mockResolvedValue(mockTodo);
      mockWBSRepo.findById = vi.fn().mockResolvedValue({
        id: 'wbs-456',
        name: 'テストタスク',
        progress: 0,
      });

      const result = await service.getLinkedTasks('todo', 'todo-123');

      expect(result).toHaveLength(2);
      expect(result[0].viewType).toBe('todo');
      expect(result[1].viewType).toBe('wbs');
    });
  });
});