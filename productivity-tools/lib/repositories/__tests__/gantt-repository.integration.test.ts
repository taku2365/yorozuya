import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GanttRepository } from '../gantt-repository';
import { Database } from '../../db/database';
import { runMigrations } from '../../db/migrations';
import type { CreateGanttTaskDto } from '../../types/gantt';

describe('GanttRepository Integration Tests', () => {
  let db: Database;
  let repository: GanttRepository;

  beforeEach(async () => {
    // インメモリデータベースを作成
    db = new Database();
    await db.init();
    
    // マイグレーションを実行
    await runMigrations(db);
    
    repository = new GanttRepository();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('CRUD操作の統合テスト', () => {
    it('タスクの作成、読み込み、更新、削除ができる', async () => {
      // Create
      const createDto: CreateGanttTaskDto = {
        title: '統合テストタスク',
        icon: 'folder',
        color: 'blue',
        category: 'テスト',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        progress: 0,
      };

      const createdTask = await repository.create(createDto);
      expect(createdTask.id).toBeTruthy();
      expect(createdTask.title).toBe('統合テストタスク');

      // Read
      const foundTask = await repository.findById(createdTask.id);
      expect(foundTask).toBeTruthy();
      expect(foundTask?.title).toBe('統合テストタスク');

      // Update
      const updatedTask = await repository.update(createdTask.id, {
        title: '更新された統合テストタスク',
        progress: 50,
      });
      expect(updatedTask.title).toBe('更新された統合テストタスク');
      expect(updatedTask.progress).toBe(50);

      // Delete
      await repository.delete(createdTask.id);
      const deletedTask = await repository.findById(createdTask.id);
      expect(deletedTask).toBeNull();
    });
  });

  describe('階層構造の統合テスト', () => {
    it('親子関係を持つタスクを作成・管理できる', async () => {
      // 親タスクを作成
      const parentTask = await repository.create({
        title: '親タスク',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      });

      // 子タスクを作成
      const childTask1 = await repository.create({
        title: '子タスク1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        parentId: parentTask.id,
      });

      const childTask2 = await repository.create({
        title: '子タスク2',
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-10'),
        parentId: parentTask.id,
      });

      // 親タスクを削除すると子タスクも削除される
      await repository.delete(parentTask.id);

      const deletedParent = await repository.findById(parentTask.id);
      const deletedChild1 = await repository.findById(childTask1.id);
      const deletedChild2 = await repository.findById(childTask2.id);

      expect(deletedParent).toBeNull();
      expect(deletedChild1).toBeNull();
      expect(deletedChild2).toBeNull();
    });
  });

  describe('依存関係の統合テスト', () => {
    it('タスク間の依存関係を作成・管理できる', async () => {
      // タスクを作成
      const task1 = await repository.create({
        title: 'タスク1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      });

      const task2 = await repository.create({
        title: 'タスク2',
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-10'),
      });

      // 依存関係を作成
      await repository.createDependency(task1.id, task2.id);

      // タスク1のスケジュールを変更
      await repository.updateSchedule(
        task1.id,
        new Date('2024-01-10'),
        new Date('2024-01-15')
      );

      // タスク2のスケジュールが自動調整されることを確認
      const updatedTask2 = await repository.findById(task2.id);
      expect(updatedTask2?.startDate.getTime()).toBeGreaterThan(
        new Date('2024-01-15').getTime()
      );
    });

    it('循環依存を検出する', async () => {
      const task1 = await repository.create({
        title: 'タスク1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      });

      const task2 = await repository.create({
        title: 'タスク2',
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-10'),
      });

      // task1 -> task2の依存関係を作成
      await repository.createDependency(task1.id, task2.id);

      // task2 -> task1の依存関係を作成しようとするとエラー
      await expect(
        repository.createDependency(task2.id, task1.id)
      ).rejects.toThrow('循環依存');
    });
  });

  describe('フィルタリングの統合テスト', () => {
    it('条件に基づいてタスクをフィルタリングできる', async () => {
      // 複数のタスクを作成
      await repository.create({
        title: 'タスクA',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        assignee: 'user1',
        category: '開発',
      });

      await repository.create({
        title: 'タスクB',
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-10'),
        assignee: 'user2',
        category: 'テスト',
      });

      await repository.create({
        title: 'タスクC',
        startDate: new Date('2024-01-11'),
        endDate: new Date('2024-01-15'),
        assignee: 'user1',
        category: '開発',
      });

      // assigneeでフィルタリング
      const user1Tasks = await repository.findAll({ assignee: 'user1' });
      expect(user1Tasks).toHaveLength(2);

      // categoryでフィルタリング
      const devTasks = await repository.findAll({ category: '開発' });
      expect(devTasks).toHaveLength(2);

      // 日付範囲でフィルタリング
      const rangeTasks = await repository.findAll({
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-10'),
        },
      });
      expect(rangeTasks).toHaveLength(2);
    });
  });

  describe('グループ管理の統合テスト', () => {
    it('タスクグループを作成してタスクを割り当てられる', async () => {
      // グループを作成
      const groupId = await repository.createTaskGroup('開発フェーズ', '#ff0000');
      expect(groupId).toBeTruthy();

      // タスクを作成
      const task = await repository.create({
        title: 'グループタスク',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      });

      // タスクをグループに移動
      await repository.moveTaskToGroup(task.id, groupId);

      // グループIDでフィルタリング
      const groupTasks = await repository.findAll({ groupId });
      expect(groupTasks).toHaveLength(1);
      expect(groupTasks[0].groupId).toBe(groupId);
    });
  });

  describe('クリティカルパスの統合テスト', () => {
    it('複雑な依存関係でクリティカルパスを計算できる', async () => {
      // タスクを作成
      const task1 = await repository.create({
        title: 'タスク1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      });

      const task2 = await repository.create({
        title: 'タスク2',
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-15'),
      });

      const task3 = await repository.create({
        title: 'タスク3',
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-08'),
      });

      const task4 = await repository.create({
        title: 'タスク4',
        startDate: new Date('2024-01-16'),
        endDate: new Date('2024-01-20'),
      });

      // 依存関係を作成
      await repository.createDependency(task1.id, task2.id);
      await repository.createDependency(task1.id, task3.id);
      await repository.createDependency(task2.id, task4.id);

      // クリティカルパスを計算
      const criticalPath = await repository.calculateCriticalPath('project1');
      
      // task1 -> task2 -> task4が最長パス
      expect(criticalPath).toEqual([task1.id, task2.id, task4.id]);
    });
  });
});