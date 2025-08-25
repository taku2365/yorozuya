import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { UnifiedTaskMigrator } from './migrate-to-unified';
import { Database } from '../db/database';
import { UnifiedTaskRepository } from '../repositories/unified-task-repository';

vi.mock('../db/database');
vi.mock('../repositories/unified-task-repository');

describe('UnifiedTaskMigrator', () => {
  let mockDb: jest.Mocked<Database>;
  let migrator: UnifiedTaskMigrator;
  let mockUnifiedRepo: jest.Mocked<UnifiedTaskRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Database
    mockDb = {
      execute: vi.fn(),
      initialize: vi.fn(),
    } as any;

    // Mock UnifiedTaskRepository
    mockUnifiedRepo = {
      findBySource: vi.fn(),
      create: vi.fn(),
      setMapping: vi.fn(),
      getMapping: vi.fn(),
    } as any;

    // Mock the constructor
    vi.mocked(UnifiedTaskRepository).mockImplementation(() => mockUnifiedRepo);

    migrator = new UnifiedTaskMigrator(mockDb);
  });

  describe('migrateAll', () => {
    it('should start transaction and commit on success', async () => {
      mockDb.execute.mockImplementation((query: string) => {
        if (query.includes('SELECT')) {
          return Promise.resolve([]);
        }
        return Promise.resolve();
      });

      await migrator.migrateAll();

      expect(mockDb.execute).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockDb.execute).toHaveBeenCalledWith('COMMIT');
    });

    it('should rollback on error', async () => {
      mockDb.execute.mockImplementation((query: string) => {
        if (query === 'SELECT * FROM todos ORDER BY created_at') {
          throw new Error('Database error');
        }
        return Promise.resolve();
      });

      await expect(migrator.migrateAll()).rejects.toThrow();
      expect(mockDb.execute).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('migrateTodos', () => {
    it('should migrate todos to unified tasks', async () => {
      const mockTodos = [
        {
          id: 'todo-1',
          title: 'Test Todo',
          description: 'Test description',
          completed: false,
          priority: 'high',
          due_date: '2024-01-10',
        },
      ];

      mockDb.execute.mockImplementation((query: string) => {
        if (query === 'SELECT * FROM todos ORDER BY created_at') {
          return Promise.resolve(mockTodos);
        }
        if (query.includes('SELECT')) {
          return Promise.resolve([]);
        }
        return Promise.resolve();
      });

      mockUnifiedRepo.findBySource.mockResolvedValue(null);
      mockUnifiedRepo.create.mockResolvedValue({
        id: 'unified-1',
        title: 'Test Todo',
        sourceType: 'todo',
        sourceId: 'todo-1',
      } as any);

      await migrator.migrateAll();

      expect(mockUnifiedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Todo',
          sourceType: 'todo',
          sourceId: 'todo-1',
          priority: 'high',
        })
      );

      expect(mockUnifiedRepo.setMapping).toHaveBeenCalledWith({
        unifiedId: 'unified-1',
        todoId: 'todo-1',
      });
    });

    it('should skip already migrated todos', async () => {
      const mockTodos = [
        {
          id: 'todo-1',
          title: 'Already Migrated',
          completed: false,
          priority: 'medium',
        },
      ];

      mockDb.execute.mockImplementation((query: string) => {
        if (query === 'SELECT * FROM todos ORDER BY created_at') {
          return Promise.resolve(mockTodos);
        }
        if (query.includes('SELECT')) {
          return Promise.resolve([]);
        }
        return Promise.resolve();
      });

      mockUnifiedRepo.findBySource.mockResolvedValue({
        id: 'existing-unified-1',
      } as any);

      await migrator.migrateAll();

      expect(mockUnifiedRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('migrateWbsTasks', () => {
    it('should migrate WBS tasks with hierarchy', async () => {
      const mockWbsTasks = [
        {
          id: 'wbs-parent',
          title: 'Parent Task',
          description: 'Parent description',
          progress: 50,
          parent_id: null,
          task_order: 0,
          hierarchy_number: '1',
          start_date: '2024-01-05',
          end_date: '2024-01-15',
          assignee: 'user-1',
        },
        {
          id: 'wbs-child',
          title: 'Child Task',
          description: 'Child description',
          progress: 25,
          parent_id: 'wbs-parent',
          task_order: 1,
          hierarchy_number: '1.1',
          start_date: '2024-01-06',
          end_date: '2024-01-10',
          assignee: 'user-2',
        },
      ];

      mockDb.execute.mockImplementation((query: string) => {
        if (query.includes('wbs_tasks')) {
          return Promise.resolve(mockWbsTasks);
        }
        if (query.includes('SELECT')) {
          return Promise.resolve([]);
        }
        return Promise.resolve();
      });

      mockUnifiedRepo.findBySource.mockResolvedValue(null);
      mockUnifiedRepo.create
        .mockResolvedValueOnce({ id: 'unified-parent' } as any)
        .mockResolvedValueOnce({ id: 'unified-child' } as any);

      await migrator.migrateAll();

      // Check parent task
      expect(mockUnifiedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Parent Task',
          sourceType: 'wbs',
          sourceId: 'wbs-parent',
          parentId: undefined,
          hierarchyLevel: 0,
        })
      );

      // Check child task
      expect(mockUnifiedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Child Task',
          sourceType: 'wbs',
          sourceId: 'wbs-child',
          parentId: 'unified-parent',
          hierarchyLevel: 1,
        })
      );
    });
  });

  describe('migrateKanbanCards', () => {
    it('should migrate kanban cards with lane information', async () => {
      const mockLanes = [
        { id: 'lane-1', title: 'ToDo' },
        { id: 'lane-2', title: '進行中' },
      ];

      const mockCards = [
        {
          id: 'card-1',
          title: 'Kanban Card',
          description: 'Card description',
          lane_id: 'lane-2',
          position: 0,
          priority: 'high',
          due_date: '2024-01-20',
          labels: 'bug,urgent',
          archived: 0,
        },
      ];

      mockDb.execute.mockImplementation((query: string) => {
        if (query === 'SELECT * FROM kanban_lanes') {
          return Promise.resolve(mockLanes);
        }
        if (query.includes('kanban_cards')) {
          return Promise.resolve(mockCards);
        }
        if (query.includes('SELECT')) {
          return Promise.resolve([]);
        }
        return Promise.resolve();
      });

      mockUnifiedRepo.findBySource.mockResolvedValue(null);
      mockUnifiedRepo.create.mockResolvedValue({ id: 'unified-card-1' } as any);
      mockUnifiedRepo.getMapping.mockResolvedValue(null);

      await migrator.migrateAll();

      expect(mockUnifiedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Kanban Card',
          sourceType: 'kanban',
          sourceId: 'card-1',
          status: 'in_progress',
          tags: ['bug', 'urgent'],
        })
      );
    });
  });

  describe('migrateGanttTasks', () => {
    it('should migrate gantt tasks with dependencies', async () => {
      const mockGroups = [{ id: 'group-1', name: 'Phase 1' }];
      
      const mockGanttTasks = [
        {
          id: 'gantt-1',
          title: 'Gantt Task',
          description: 'Gantt description',
          progress: 75,
          start_date: '2024-02-01',
          end_date: '2024-02-15',
          parent_id: null,
          group_id: 'group-1',
          assignee: 'user-3',
          icon: 'folder',
          color: 'blue',
        },
      ];

      const mockDependencies = [
        {
          id: 'dep-1',
          source_task_id: 'gantt-0',
          target_task_id: 'gantt-1',
          type: 'finish-to-start',
          lag: 0,
        },
      ];

      mockDb.execute.mockImplementation((query: string, params?: any[]) => {
        if (query === 'SELECT * FROM gantt_groups') {
          return Promise.resolve(mockGroups);
        }
        if (query.includes('gantt_tasks')) {
          return Promise.resolve(mockGanttTasks);
        }
        if (query.includes('gantt_dependencies')) {
          return Promise.resolve(mockDependencies);
        }
        if (query.includes('SELECT')) {
          return Promise.resolve([]);
        }
        return Promise.resolve();
      });

      mockUnifiedRepo.findBySource.mockResolvedValue(null);
      mockUnifiedRepo.create.mockResolvedValue({ id: 'unified-gantt-1' } as any);
      mockUnifiedRepo.getMapping.mockResolvedValue(null);

      await migrator.migrateAll();

      expect(mockUnifiedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Gantt Task',
          sourceType: 'gantt',
          sourceId: 'gantt-1',
          progress: 75,
          metadata: expect.objectContaining({
            gantt: expect.objectContaining({
              dependencies: expect.arrayContaining([
                expect.objectContaining({
                  sourceTaskId: 'gantt-0',
                  targetTaskId: 'gantt-1',
                }),
              ]),
              icon: 'folder',
              color: 'blue',
            }),
          }),
        })
      );
    });
  });
});