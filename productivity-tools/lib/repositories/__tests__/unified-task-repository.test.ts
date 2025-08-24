import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedTaskRepository } from '../unified-task-repository';
import { Database } from '../../db/database';
import { 
  UnifiedTask, 
  TaskStatus, 
  TaskPriority, 
  ViewType,
  UnifiedTaskFilter,
  UnifiedTaskSort,
  BulkTaskOperation
} from '../../types/unified';

// モックデータベース
const createMockDb = () => {
  const data = {
    unified_tasks: [] as any[],
    task_tags: [] as any[],
    task_labels: [] as any[],
    task_history: [] as any[],
    task_mappings: [] as any[]
  };

  return {
    execute: vi.fn(async (query: string, params?: any[]) => {
      // INSERT処理
      if (query.includes('INSERT INTO unified_tasks')) {
        const task = {
          id: params![0],
          title: params![1],
          description: params![2],
          status: params![3],
          priority: params![4],
          progress: params![5],
          created_at: params![6],
          updated_at: params![7],
          start_date: params![8],
          end_date: params![9],
          due_date: params![10],
          assignee_id: params![11],
          assignee_name: params![12],
          reviewer_id: params![13],
          reviewer_name: params![14],
          parent_id: params![15],
          task_order: params![16],
          hierarchy_level: params![17],
          source_type: params![18],
          source_id: params![19],
          metadata: params![20]
        };
        data.unified_tasks.push(task);
        return [];
      }

      // SELECT処理
      if (query.includes('SELECT * FROM unified_tasks WHERE id = ?')) {
        return data.unified_tasks.filter(t => t.id === params![0]);
      }

      if (query.includes('SELECT * FROM unified_tasks WHERE source_type = ? AND source_id = ?')) {
        return data.unified_tasks.filter(t => 
          t.source_type === params![0] && t.source_id === params![1]
        );
      }

      if (query.includes('SELECT * FROM unified_tasks WHERE 1=1')) {
        // フィルタ処理のシミュレーション
        let results = [...data.unified_tasks];
        
        // ステータスフィルタ
        if (query.includes('AND status IN')) {
          const statusStart = params!.findIndex(p => ['not_started', 'in_progress', 'completed'].includes(p));
          if (statusStart >= 0) {
            const statuses = params!.slice(statusStart).filter(p => 
              ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'].includes(p)
            );
            results = results.filter(t => statuses.includes(t.status));
          }
        }

        // 優先度フィルタ
        if (query.includes('AND priority IN')) {
          const priorityStart = params!.findIndex(p => ['low', 'medium', 'high', 'urgent'].includes(p));
          if (priorityStart >= 0) {
            const priorities = params!.slice(priorityStart).filter(p => 
              ['low', 'medium', 'high', 'urgent'].includes(p)
            );
            results = results.filter(t => priorities.includes(t.priority));
          }
        }

        // ソート
        if (query.includes('ORDER BY')) {
          if (query.includes('task_order ASC')) {
            results.sort((a, b) => a.task_order - b.task_order);
          }
        }

        return results;
      }

      // UPDATE処理
      if (query.includes('UPDATE unified_tasks SET')) {
        const id = params![params!.length - 1];
        const taskIndex = data.unified_tasks.findIndex(t => t.id === id);
        if (taskIndex >= 0) {
          data.unified_tasks[taskIndex] = {
            ...data.unified_tasks[taskIndex],
            title: params![0],
            description: params![1],
            status: params![2],
            priority: params![3],
            progress: params![4],
            updated_at: params![5]
          };
        }
        return [];
      }

      // DELETE処理
      if (query.includes('DELETE FROM unified_tasks WHERE id = ?')) {
        data.unified_tasks = data.unified_tasks.filter(t => t.id !== params![0]);
        return [];
      }

      // タグ処理
      if (query.includes('INSERT OR IGNORE INTO task_tags')) {
        data.task_tags.push({
          id: params![0],
          task_id: params![1],
          tag: params![2]
        });
        return [];
      }

      if (query.includes('SELECT tag FROM task_tags WHERE task_id = ?')) {
        return data.task_tags.filter(t => t.task_id === params![0]);
      }

      // ラベル処理
      if (query.includes('SELECT label_id, label_name, label_color FROM task_labels WHERE task_id = ?')) {
        return data.task_labels.filter(l => l.task_id === params![0]);
      }

      // マッピング処理
      if (query.includes('INSERT OR REPLACE INTO task_mappings')) {
        const existing = data.task_mappings.findIndex(m => m.unified_id === params![0]);
        const mapping = {
          unified_id: params![0],
          todo_id: params![1],
          wbs_id: params![2],
          kanban_card_id: params![3],
          gantt_task_id: params![4]
        };
        
        if (existing >= 0) {
          data.task_mappings[existing] = mapping;
        } else {
          data.task_mappings.push(mapping);
        }
        return [];
      }

      if (query.includes('SELECT * FROM task_mappings WHERE unified_id = ?')) {
        return data.task_mappings.filter(m => m.unified_id === params![0]);
      }

      // 履歴処理
      if (query.includes('INSERT INTO task_history')) {
        data.task_history.push({
          id: params![0],
          task_id: params![1],
          timestamp: params![2],
          user_id: params![3],
          user_name: params![4],
          action: params![5],
          changes: params![6]
        });
        return [];
      }

      return [];
    })
  } as unknown as Database;
};

describe('UnifiedTaskRepository', () => {
  let db: Database;
  let repository: UnifiedTaskRepository;

  beforeEach(() => {
    db = createMockDb();
    repository = new UnifiedTaskRepository(db);
  });

  describe('create', () => {
    it('should create a new unified task', async () => {
      const taskData: Omit<UnifiedTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'not_started',
        priority: 'medium',
        progress: 0,
        assigneeId: 'user1',
        assigneeName: 'User One',
        parentId: undefined,
        order: 0,
        hierarchyLevel: 0,
        tags: ['tag1', 'tag2'],
        labels: [{ id: 'label1', name: 'Label 1', color: '#ff0000' }],
        sourceType: 'todo',
        sourceId: 'todo-123',
        metadata: { todo: {} }
      };

      const result = await repository.create(taskData);

      expect(result).toMatchObject({
        ...taskData,
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO unified_tasks'),
        expect.any(Array)
      );
    });
  });

  describe('update', () => {
    it('should update an existing task', async () => {
      // 先にタスクを作成
      const created = await repository.create({
        title: 'Original Title',
        status: 'not_started',
        priority: 'low',
        progress: 0,
        order: 0,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        sourceType: 'todo',
        sourceId: 'todo-123',
        metadata: {}
      });

      // 更新
      // Wait a bit to ensure updatedAt is different
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await repository.update(created.id, {
        title: 'Updated Title',
        status: 'in_progress',
        progress: 50
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('in_progress');
      expect(updated.progress).toBe(50);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should throw error if task not found', async () => {
      await expect(
        repository.update('non-existent', { title: 'New Title' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const created = await repository.create({
        title: 'Task to Delete',
        status: 'not_started',
        priority: 'medium',
        progress: 0,
        order: 0,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        sourceType: 'todo',
        sourceId: 'todo-123',
        metadata: {}
      });

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      // テストデータを作成
      await repository.create({
        title: 'High Priority Task',
        status: 'not_started',
        priority: 'high',
        progress: 0,
        order: 1,
        hierarchyLevel: 0,
        tags: ['urgent'],
        labels: [],
        sourceType: 'todo',
        sourceId: 'todo-1',
        metadata: {}
      });

      await repository.create({
        title: 'In Progress Task',
        status: 'in_progress',
        priority: 'medium',
        progress: 50,
        order: 2,
        hierarchyLevel: 0,
        tags: ['work'],
        labels: [],
        sourceType: 'wbs',
        sourceId: 'wbs-1',
        metadata: {}
      });

      await repository.create({
        title: 'Completed Task',
        status: 'completed',
        priority: 'low',
        progress: 100,
        order: 3,
        hierarchyLevel: 0,
        tags: ['done'],
        labels: [],
        sourceType: 'kanban',
        sourceId: 'kanban-1',
        metadata: {}
      });
    });

    it('should find all tasks without filter', async () => {
      const tasks = await repository.find();
      expect(tasks).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const filter: UnifiedTaskFilter = {
        status: ['not_started', 'in_progress']
      };
      const tasks = await repository.find(filter);
      expect(tasks).toHaveLength(2);
      expect(tasks.every(t => ['not_started', 'in_progress'].includes(t.status))).toBe(true);
    });

    it('should filter by priority', async () => {
      const filter: UnifiedTaskFilter = {
        priority: ['high']
      };
      const tasks = await repository.find(filter);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].priority).toBe('high');
    });

    it('should sort by order', async () => {
      const sort: UnifiedTaskSort = {
        field: 'customOrder',
        direction: 'asc'
      };
      const tasks = await repository.find(undefined, sort);
      expect(tasks[0].order).toBe(1);
      expect(tasks[1].order).toBe(2);
      expect(tasks[2].order).toBe(3);
    });
  });

  describe('findBySource', () => {
    it('should find task by source type and id', async () => {
      const created = await repository.create({
        title: 'Source Task',
        status: 'not_started',
        priority: 'medium',
        progress: 0,
        order: 0,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        sourceType: 'todo',
        sourceId: 'todo-unique-123',
        metadata: {}
      });

      const found = await repository.findBySource('todo', 'todo-unique-123');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });
  });

  describe('task mappings', () => {
    it('should create and retrieve task mappings', async () => {
      const task = await repository.create({
        title: 'Mapped Task',
        status: 'not_started',
        priority: 'medium',
        progress: 0,
        order: 0,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        sourceType: 'todo',
        sourceId: 'todo-123',
        metadata: {}
      });

      await repository.setMapping({
        unifiedId: task.id,
        todoId: 'todo-123',
        wbsId: 'wbs-456'
      });

      const mapping = await repository.getMapping(task.id);
      expect(mapping).not.toBeNull();
      expect(mapping!.todoId).toBe('todo-123');
      expect(mapping!.wbsId).toBe('wbs-456');
    });
  });

  describe('bulkOperation', () => {
    beforeEach(async () => {
      // テストデータを作成
      await repository.create({
        title: 'Task 1',
        status: 'not_started',
        priority: 'low',
        progress: 0,
        order: 1,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        sourceType: 'todo',
        sourceId: 'todo-1',
        metadata: {}
      });

      await repository.create({
        title: 'Task 2',
        status: 'not_started',
        priority: 'low',
        progress: 0,
        order: 2,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        sourceType: 'todo',
        sourceId: 'todo-2',
        metadata: {}
      });
    });

    it('should update status for multiple tasks', async () => {
      const tasks = await repository.find();
      const taskIds = tasks.map(t => t.id);

      const operation: BulkTaskOperation = {
        taskIds,
        operation: { type: 'updateStatus', status: 'in_progress' }
      };

      await repository.bulkOperation(operation);

      const updatedTasks = await repository.find();
      expect(updatedTasks.every(t => t.status === 'in_progress')).toBe(true);
    });

    it('should update priority for multiple tasks', async () => {
      const tasks = await repository.find();
      const taskIds = tasks.map(t => t.id);

      const operation: BulkTaskOperation = {
        taskIds,
        operation: { type: 'updatePriority', priority: 'high' }
      };

      await repository.bulkOperation(operation);

      const updatedTasks = await repository.find();
      expect(updatedTasks.every(t => t.priority === 'high')).toBe(true);
    });
  });
});