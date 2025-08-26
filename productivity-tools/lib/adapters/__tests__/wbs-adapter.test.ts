import { describe, it, expect } from 'vitest';
import { WBSAdapter } from '../wbs-adapter';
import type { WBSTask } from '@/lib/types';
import type { UnifiedTask } from '@/lib/types/unified-task';

describe('WBSAdapter', () => {
  const adapter = new WBSAdapter();

  describe('toUnifiedTask', () => {
    it('WBSTaskをUnifiedTaskに変換できる', () => {
      const wbsTask: WBSTask = {
        id: 'wbs-1',
        title: 'プロジェクトタスク',
        description: 'WBSタスクの説明',
        status: 'in_progress',
        progress: 50,
        parentId: null,
        order: 1,
        hierarchyNumber: '1.1',
        estimatedHours: 16,
        actualHours: 8,
        assignee: '田中太郎',
        reviewer: '佐藤花子',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        dueDate: '2024-01-10',
        workDays: 8,
        remarks: '備考欄の内容',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(wbsTask);

      expect(unifiedTask).toEqual({
        id: expect.stringMatching(/^unified-/),
        title: 'プロジェクトタスク',
        description: 'WBSタスクの説明',
        status: 'in_progress',
        priority: 'medium',
        progress: 50,
        views: ['wbs'],
        metadata: {
          wbs: {
            originalId: 'wbs-1',
            hierarchyNumber: '1.1',
            estimatedHours: 16,
            actualHours: 8,
            workDays: 8,
            remarks: '備考欄の内容',
          },
        },
        parentId: null,
        order: 1,
        assigneeId: '田中太郎',
        projectId: undefined,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        dueDate: new Date('2024-01-10'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('子タスクの親IDを正しく設定する', () => {
      const wbsTask: WBSTask = {
        id: 'wbs-2',
        title: '子タスク',
        status: 'not_started',
        progress: 0,
        parentId: 'wbs-1',
        order: 2,
        hierarchyNumber: '1.1.1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(wbsTask);

      expect(unifiedTask.parentId).toBe('wbs-1');
    });

    it('ステータスを正しくマッピングする', () => {
      const statuses: Array<[WBSTask['status'], UnifiedTask['status']]> = [
        ['not_started', 'todo'],
        ['in_progress', 'in_progress'],
        ['working', 'in_progress'],
        ['completed', 'done'],
      ];

      statuses.forEach(([wbsStatus, expectedStatus]) => {
        const wbsTask: WBSTask = {
          id: 'wbs-test',
          title: 'テスト',
          status: wbsStatus,
          progress: 0,
          parentId: null,
          order: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        const unifiedTask = adapter.toUnifiedTask(wbsTask);
        expect(unifiedTask.status).toBe(expectedStatus);
      });
    });
  });

  describe('fromUnifiedTask', () => {
    it('UnifiedTaskをWBSTaskに変換できる', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'プロジェクトタスク',
        description: '説明文',
        status: 'in_progress',
        priority: 'high',
        views: ['wbs', 'gantt'],
        metadata: {
          wbs: {
            originalId: 'wbs-1',
            hierarchyNumber: '2.1',
            estimatedHours: 24,
            actualHours: 12,
            workDays: 3,
            remarks: 'メタデータの備考',
          },
        },
        parentId: 'parent-1',
        order: 5,
        assigneeId: 'user-1',
        startDate: new Date('2024-01-05'),
        endDate: new Date('2024-01-15'),
        dueDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const wbsTask = adapter.fromUnifiedTask(unifiedTask);

      expect(wbsTask).toEqual({
        id: 'wbs-1',
        title: 'プロジェクトタスク',
        description: '説明文',
        status: 'in_progress',
        progress: 0,
        parentId: 'parent-1',
        order: 5,
        hierarchyNumber: '2.1',
        estimatedHours: 24,
        actualHours: 12,
        assignee: 'user-1',
        startDate: '2024-01-05',
        endDate: '2024-01-15',
        dueDate: '2024-01-15',
        workDays: 3,
        remarks: 'メタデータの備考',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('ステータスを逆マッピングする', () => {
      const statuses: Array<[UnifiedTask['status'], WBSTask['status']]> = [
        ['todo', 'not_started'],
        ['in_progress', 'in_progress'],
        ['done', 'completed'],
        ['cancelled', 'not_started'],
      ];

      statuses.forEach(([unifiedStatus, expectedStatus]) => {
        const unifiedTask: UnifiedTask = {
          id: 'unified-test',
          title: 'テスト',
          status: unifiedStatus,
          views: ['wbs'],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const wbsTask = adapter.fromUnifiedTask(unifiedTask);
        expect(wbsTask.status).toBe(expectedStatus);
      });
    });
  });

  describe('canConvert', () => {
    it('wbs viewを含むタスクは変換可能', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'テスト',
        status: 'todo',
        views: ['wbs', 'gantt'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(adapter.canConvert(unifiedTask)).toBe(true);
    });

    it('wbs viewを含まないタスクは変換不可', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-2',
        title: 'テスト',
        status: 'todo',
        views: ['todo', 'kanban'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(adapter.canConvert(unifiedTask)).toBe(false);
    });
  });

  describe('createMetadata', () => {
    it('WBSTaskのメタデータを作成できる', () => {
      const wbsTask: WBSTask = {
        id: 'wbs-1',
        title: 'テスト',
        status: 'in_progress',
        progress: 75,
        parentId: null,
        order: 1,
        hierarchyNumber: '1.2.3',
        estimatedHours: 40,
        actualHours: 30,
        workDays: 5,
        remarks: 'テスト備考',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const metadata = adapter.createMetadata(wbsTask);

      expect(metadata).toEqual({
        wbs: {
          originalId: 'wbs-1',
          hierarchyNumber: '1.2.3',
          estimatedHours: 40,
          actualHours: 30,
          workDays: 5,
          remarks: 'テスト備考',
        },
      });
    });
  });

  describe('validateWBSTask', () => {
    it('有効なWBSTaskは検証を通過する', () => {
      const wbsTask: WBSTask = {
        id: 'wbs-1',
        title: 'テスト',
        status: 'not_started',
        progress: 0,
        parentId: null,
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateWBSTask(wbsTask)).not.toThrow();
    });

    it('タイトルが空のWBSTaskはエラーになる', () => {
      const wbsTask: WBSTask = {
        id: 'wbs-1',
        title: '',
        status: 'not_started',
        progress: 0,
        parentId: null,
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateWBSTask(wbsTask)).toThrow('タイトルは必須です');
    });

    it('進捗率が不正な値の場合はエラーになる', () => {
      const wbsTask: WBSTask = {
        id: 'wbs-1',
        title: 'テスト',
        status: 'in_progress',
        progress: 150,
        parentId: null,
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateWBSTask(wbsTask)).toThrow('進捗率は0〜100の間で指定してください');
    });
  });
});