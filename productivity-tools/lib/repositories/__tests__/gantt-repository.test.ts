import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GanttRepository } from '../gantt-repository';
import { db } from '../../db';
import type { GanttTask, CreateGanttTaskDto, UpdateGanttTaskDto } from '../../types/gantt';

// モックデータベース
vi.mock('../../db', () => ({
  db: {
    execute: vi.fn(),
    transaction: vi.fn((fn) => fn()),
  },
}));

describe('GanttRepository', () => {
  let repository: GanttRepository;

  beforeEach(() => {
    repository = new GanttRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('新しいガントタスクを作成できる', async () => {
      const createDto: CreateGanttTaskDto = {
        title: 'テストタスク',
        icon: 'folder',
        color: 'blue',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        progress: 0,
      };

      const mockResult = {
        id: 'task1',
        ...createDto,
        dependencies: [],
        isCriticalPath: false,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.execute).mockResolvedValueOnce([mockResult]);

      const result = await repository.create(createDto);

      expect(result).toMatchObject({
        id: expect.any(String),
        title: 'テストタスク',
        icon: 'folder',
        color: 'blue',
        progress: 0,
      });
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gantt_tasks'),
        expect.any(Array)
      );
    });

    it('親タスクを指定してタスクを作成できる', async () => {
      const createDto: CreateGanttTaskDto = {
        title: '子タスク',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
        parentId: 'parent1',
      };

      vi.mocked(db.execute).mockResolvedValueOnce([{ id: 'task2', ...createDto }]);

      const result = await repository.create(createDto);

      expect(result.parentId).toBe('parent1');
    });
  });

  describe('update', () => {
    it('ガントタスクを更新できる', async () => {
      const updateDto: UpdateGanttTaskDto = {
        title: '更新されたタスク',
        progress: 50,
        color: 'green',
      };

      vi.mocked(db.execute)
        .mockResolvedValueOnce([]) // UPDATE文の結果（結果なし）
        .mockResolvedValueOnce([  // SELECT文の結果
          {
            id: 'task1',
            title: '更新されたタスク',
            progress: 50,
            color: 'green',
            start_date: new Date().getTime(),
            end_date: new Date().getTime(),
            created_at: new Date().getTime(),
            updated_at: new Date().getTime(),
          },
        ]);

      const result = await repository.update('task1', updateDto);

      expect(result).toMatchObject({
        title: '更新されたタスク',
        progress: 50,
        color: 'green',
      });
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.any(Array)
      );
    });
  });

  describe('updateSchedule', () => {
    it('タスクのスケジュールを更新できる', async () => {
      const newStart = new Date('2024-01-05');
      const newEnd = new Date('2024-01-10');

      await repository.updateSchedule('task1', newStart, newEnd);

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.arrayContaining([newStart.getTime(), newEnd.getTime(), 'task1'])
      );
    });

    it('依存タスクの日程も自動調整される', async () => {
      // 依存関係のあるタスクを取得
      vi.mocked(db.execute)
        .mockResolvedValueOnce([{ successorId: 'task2' }]) // 依存関係
        .mockResolvedValueOnce([
          {
            id: 'task2',
            startDate: new Date('2024-01-03').getTime(),
            endDate: new Date('2024-01-05').getTime(),
          },
        ]) // 依存タスク
        .mockResolvedValueOnce([]); // 更新

      const newStart = new Date('2024-01-10');
      const newEnd = new Date('2024-01-15');

      await repository.updateSchedule('task1', newStart, newEnd);

      expect(db.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('createDependency', () => {
    it('タスク間の依存関係を作成できる', async () => {
      await repository.createDependency('task1', 'task2');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gantt_dependencies'),
        expect.arrayContaining(['task1', 'task2'])
      );
    });

    it('循環依存を検出してエラーをスローする', async () => {
      // 既存の依存関係をモック
      vi.mocked(db.execute).mockResolvedValueOnce([
        { predecessorId: 'task2', successorId: 'task1' },
      ]);

      await expect(
        repository.createDependency('task1', 'task2')
      ).rejects.toThrow('循環依存');
    });
  });

  describe('calculateCriticalPath', () => {
    it('クリティカルパスを計算できる', async () => {
      // タスクデータ
      const tasks = [
        {
          id: 'task1',
          title: 'タスク1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          start_date: new Date('2024-01-01').getTime(),
          end_date: new Date('2024-01-05').getTime(),
          progress: 0,
          is_critical_path: 0,
          created_at: new Date().getTime(),
          updated_at: new Date().getTime(),
        },
        {
          id: 'task2',
          title: 'タスク2',
          startDate: new Date('2024-01-06'),
          endDate: new Date('2024-01-10'),
          start_date: new Date('2024-01-06').getTime(),
          end_date: new Date('2024-01-10').getTime(),
          progress: 0,
          is_critical_path: 0,
          created_at: new Date().getTime(),
          updated_at: new Date().getTime(),
        },
        {
          id: 'task3',
          title: 'タスク3',
          startDate: new Date('2024-01-06'),
          endDate: new Date('2024-01-08'),
          start_date: new Date('2024-01-06').getTime(),
          end_date: new Date('2024-01-08').getTime(),
          progress: 0,
          is_critical_path: 0,
          created_at: new Date().getTime(),
          updated_at: new Date().getTime(),
        },
      ];

      // findAllのモック
      vi.mocked(db.execute)
        .mockResolvedValueOnce(tasks) // findAllのSELECT
        .mockResolvedValueOnce([
          { predecessorId: 'task1', successorId: 'task2' },
          { predecessorId: 'task1', successorId: 'task3' },
        ]); // 依存関係のSELECT

      const criticalPath = await repository.calculateCriticalPath('project1');

      expect(criticalPath).toEqual(['task1', 'task2']);
    });
  });

  describe('setTaskIcon', () => {
    it('タスクのアイコンを設定できる', async () => {
      await repository.setTaskIcon('task1', 'document');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.arrayContaining(['document', 'task1'])
      );
    });
  });

  describe('setTaskColor', () => {
    it('タスクの色を設定できる', async () => {
      await repository.setTaskColor('task1', 'red');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.arrayContaining(['red', 'task1'])
      );
    });
  });

  describe('assignMember', () => {
    it('タスクにメンバーを割り当てられる', async () => {
      await repository.assignMember('task1', 'user1');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.arrayContaining(['user1', 'task1'])
      );
    });
  });

  describe('createTaskGroup', () => {
    it('タスクグループを作成できる', async () => {
      const groupId = await repository.createTaskGroup('開発フェーズ', '#ff0000');

      expect(groupId).toBeTruthy();
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gantt_groups'),
        expect.arrayContaining(['開発フェーズ', '#ff0000'])
      );
    });
  });

  describe('moveTaskToGroup', () => {
    it('タスクをグループに移動できる', async () => {
      await repository.moveTaskToGroup('task1', 'group1');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.arrayContaining(['group1', 'task1'])
      );
    });
  });

  describe('updateHierarchy', () => {
    it('タスクの階層構造を更新できる', async () => {
      await repository.updateHierarchy('task2', 'task1');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.arrayContaining(['task1', 'task2'])
      );
    });

    it('親タスクをnullに設定してルートレベルに移動できる', async () => {
      await repository.updateHierarchy('task2', null);

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gantt_tasks'),
        expect.arrayContaining([null, 'task2'])
      );
    });
  });

  describe('findAll', () => {
    it('すべてのガントタスクを取得できる', async () => {
      const mockTasks = [
        {
          id: 'task1',
          title: 'タスク1',
          startDate: new Date('2024-01-01').getTime(),
          endDate: new Date('2024-01-05').getTime(),
        },
        {
          id: 'task2',
          title: 'タスク2',
          startDate: new Date('2024-01-06').getTime(),
          endDate: new Date('2024-01-10').getTime(),
        },
      ];

      vi.mocked(db.execute).mockResolvedValueOnce(mockTasks);

      const tasks = await repository.findAll();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('タスク1');
    });

    it('フィルター条件でタスクを絞り込める', async () => {
      await repository.findAll({
        assignee: 'user1',
        groupId: 'group1',
      });

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.any(Array)
      );
    });
  });

  describe('findById', () => {
    it('IDでタスクを取得できる', async () => {
      const mockTask = {
        id: 'task1',
        title: 'テストタスク',
        dependencies: [],
      };

      vi.mocked(db.execute).mockResolvedValueOnce([mockTask]);

      const task = await repository.findById('task1');

      expect(task).toMatchObject({
        id: 'task1',
        title: 'テストタスク',
      });
    });

    it('存在しないIDの場合nullを返す', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([]);

      const task = await repository.findById('nonexistent');

      expect(task).toBeNull();
    });
  });

  describe('delete', () => {
    it('タスクを削除できる', async () => {
      await repository.delete('task1');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM gantt_tasks'),
        ['task1']
      );
    });

    it('子タスクも含めて削除される', async () => {
      // モックの設定
      vi.mocked(db.execute)
        .mockResolvedValueOnce([ // 親タスクの子タスク取得
          { id: 'task2', parentId: 'task1' },
          { id: 'task3', parentId: 'task1' },
        ])
        .mockResolvedValueOnce([]) // task2の子タスク取得（なし）
        .mockResolvedValueOnce([]) // task2の依存関係削除
        .mockResolvedValueOnce([]) // task2本体の削除
        .mockResolvedValueOnce([]) // task3の子タスク取得（なし）
        .mockResolvedValueOnce([]) // task3の依存関係削除
        .mockResolvedValueOnce([]) // task3本体の削除
        .mockResolvedValueOnce([]) // task1の依存関係削除
        .mockResolvedValueOnce([]); // task1本体の削除

      await repository.delete('task1');

      // 子タスクが再帰的に削除されることを確認
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM gantt_tasks WHERE id = ?'),
        ['task2']
      );
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM gantt_tasks WHERE id = ?'),
        ['task3']
      );
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM gantt_tasks WHERE id = ?'),
        ['task1']
      );
    });
  });
});