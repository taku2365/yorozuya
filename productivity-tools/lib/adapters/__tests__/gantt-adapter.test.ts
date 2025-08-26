import { describe, it, expect } from 'vitest';
import { GanttAdapter } from '../gantt-adapter';
import type { GanttTask } from '@/lib/types';
import type { UnifiedTask } from '@/lib/types/unified-task';

describe('GanttAdapter', () => {
  const adapter = new GanttAdapter();

  describe('toUnifiedTask', () => {
    it('GanttTaskをUnifiedTaskに変換できる', () => {
      const ganttTask: GanttTask = {
        id: 'gantt-1',
        title: 'ガントタスク',
        description: 'タスクの詳細',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        progress: 25,
        dependencies: [
          { id: 'dep-1', sourceId: 'gantt-0', targetId: 'gantt-1', type: 'finish-to-start' },
        ],
        assigneeId: 'member-1',
        assigneeName: '山田太郎',
        priority: 'high',
        status: 'in_progress',
        parentId: null,
        order: 1,
        icon: 'folder',
        color: '#3b82f6',
        groupId: 'group-1',
        groupName: 'フェーズ1',
        isMilestone: false,
        isOnCriticalPath: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(ganttTask);

      expect(unifiedTask).toEqual({
        id: expect.stringMatching(/^unified-/),
        title: 'ガントタスク',
        description: 'タスクの詳細',
        status: 'in_progress',
        priority: 'high',
        progress: 25,
        views: ['gantt'],
        metadata: {
          gantt: {
            originalId: 'gantt-1',
            dependencies: [
              { id: 'dep-1', sourceId: 'gantt-0', targetId: 'gantt-1', type: 'finish-to-start' },
            ],
            icon: 'folder',
            color: '#3b82f6',
            groupId: 'group-1',
            groupName: 'フェーズ1',
            isMilestone: false,
            criticalPath: true,
          },
        },
        parentId: undefined,
        order: 1,
        assigneeId: 'member-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('マイルストーンを正しく変換する', () => {
      const milestone: GanttTask = {
        id: 'gantt-milestone',
        title: 'マイルストーン',
        startDate: '2024-03-01',
        endDate: '2024-03-01',
        progress: 0,
        isMilestone: true,
        status: 'not_started',
        priority: 'high',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(milestone);

      expect(unifiedTask.metadata.gantt?.isMilestone).toBe(true);
      expect(unifiedTask.startDate).toEqual(unifiedTask.endDate);
    });
  });

  describe('fromUnifiedTask', () => {
    it('UnifiedTaskをGanttTaskに変換できる', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'プロジェクトタスク',
        description: '説明',
        status: 'in_progress',
        priority: 'urgent',
        progress: 50,
        views: ['gantt', 'wbs'],
        metadata: {
          gantt: {
            originalId: 'gantt-1',
            dependencies: [
              { id: 'dep-1', sourceId: 'gantt-0', targetId: 'gantt-1', type: 'finish-to-start' },
            ],
            icon: 'document',
            color: '#ef4444',
            groupId: 'group-2',
            groupName: 'フェーズ2',
            isMilestone: false,
            criticalPath: false,
          },
        },
        parentId: 'parent-1',
        order: 3,
        assigneeId: 'user-2',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const ganttTask = adapter.fromUnifiedTask(unifiedTask);

      expect(ganttTask).toEqual({
        id: 'gantt-1',
        title: 'プロジェクトタスク',
        description: '説明',
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        progress: 50,
        dependencies: [
          { id: 'dep-1', sourceId: 'gantt-0', targetId: 'gantt-1', type: 'finish-to-start' },
        ],
        assigneeId: 'user-2',
        priority: 'urgent',
        status: 'in_progress',
        parentId: 'parent-1',
        order: 3,
        icon: 'document',
        color: '#ef4444',
        groupId: 'group-2',
        groupName: 'フェーズ2',
        isMilestone: false,
        isOnCriticalPath: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('日付がない場合は今日の日付を使用する', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-2',
        title: 'テスト',
        status: 'todo',
        views: ['gantt'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ganttTask = adapter.fromUnifiedTask(unifiedTask);

      expect(ganttTask.startDate).toBe(adapter.formatDate(new Date()));
      expect(ganttTask.endDate).toBe(adapter.formatDate(new Date()));
    });
  });

  describe('canConvert', () => {
    it('gantt viewを含むタスクは変換可能', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'テスト',
        status: 'todo',
        views: ['gantt', 'wbs'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(adapter.canConvert(unifiedTask)).toBe(true);
    });

    it('gantt viewを含まないタスクは変換不可', () => {
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
    it('GanttTaskのメタデータを作成できる', () => {
      const ganttTask: GanttTask = {
        id: 'gantt-1',
        title: 'テスト',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        progress: 75,
        dependencies: [],
        icon: 'person',
        color: '#10b981',
        isMilestone: true,
        isOnCriticalPath: true,
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const metadata = adapter.createMetadata(ganttTask);

      expect(metadata).toEqual({
        gantt: {
          originalId: 'gantt-1',
          dependencies: [],
          icon: 'person',
          color: '#10b981',
          groupId: undefined,
          groupName: undefined,
          isMilestone: true,
          criticalPath: true,
        },
      });
    });
  });

  describe('validateGanttTask', () => {
    it('有効なGanttTaskは検証を通過する', () => {
      const ganttTask: GanttTask = {
        id: 'gantt-1',
        title: 'テスト',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        progress: 50,
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateGanttTask(ganttTask)).not.toThrow();
    });

    it('タイトルが空のGanttTaskはエラーになる', () => {
      const ganttTask: GanttTask = {
        id: 'gantt-1',
        title: '',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateGanttTask(ganttTask)).toThrow('タイトルは必須です');
    });

    it('開始日が終了日より後の場合はエラーになる', () => {
      const ganttTask: GanttTask = {
        id: 'gantt-1',
        title: 'テスト',
        startDate: '2024-01-10',
        endDate: '2024-01-01',
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateGanttTask(ganttTask)).toThrow('開始日は終了日より前である必要があります');
    });

    it('進捗率が不正な値の場合はエラーになる', () => {
      const ganttTask: GanttTask = {
        id: 'gantt-1',
        title: 'テスト',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        progress: 150,
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateGanttTask(ganttTask)).toThrow('進捗率は0〜100の間で指定してください');
    });
  });

  describe('formatDate', () => {
    it('日付をYYYY-MM-DD形式にフォーマットできる', () => {
      const date = new Date('2024-12-25');
      expect(adapter.formatDate(date)).toBe('2024-12-25');
    });
  });
});