import { describe, it, expect } from 'vitest';
import { KanbanAdapter } from '../kanban-adapter';
import type { KanbanCard } from '@/lib/types';
import type { UnifiedTask } from '@/lib/types/unified-task';

describe('KanbanAdapter', () => {
  const adapter = new KanbanAdapter();

  describe('toUnifiedTask', () => {
    it('KanbanCardをUnifiedTaskに変換できる', () => {
      const kanbanCard: KanbanCard = {
        id: 'card-1',
        title: 'カンバンカード',
        description: 'カードの説明',
        laneId: 'in-progress',
        position: 2,
        assignee: 'user-1',
        labels: [
          { id: 'label-1', name: 'bug', color: '#ff0000' },
          { id: 'label-2', name: 'urgent', color: '#ffaa00' },
        ],
        dueDate: '2024-12-31',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const unifiedTask = adapter.toUnifiedTask(kanbanCard);

      expect(unifiedTask).toEqual({
        id: expect.stringMatching(/^unified-/),
        title: 'カンバンカード',
        description: 'カードの説明',
        status: 'in_progress',
        priority: 'urgent', // urgentラベルから推測
        views: ['kanban'],
        metadata: {
          kanban: {
            originalId: 'card-1',
            laneId: 'in-progress',
            position: 2,
            labels: [
              { id: 'label-1', name: 'bug', color: '#ff0000' },
              { id: 'label-2', name: 'urgent', color: '#ffaa00' },
            ],
          },
        },
        assigneeId: 'user-1',
        tags: ['bug', 'urgent'],
        dueDate: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('レーンIDからステータスを推測する', () => {
      const laneStatusMap: Array<[string, UnifiedTask['status']]> = [
        ['todo', 'todo'],
        ['in-progress', 'in_progress'],
        ['done', 'done'],
        ['backlog', 'todo'],
        ['review', 'in_progress'],
      ];

      laneStatusMap.forEach(([laneId, expectedStatus]) => {
        const kanbanCard: KanbanCard = {
          id: 'card-test',
          title: 'テスト',
          laneId,
          position: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        const unifiedTask = adapter.toUnifiedTask(kanbanCard);
        expect(unifiedTask.status).toBe(expectedStatus);
      });
    });

    it('ラベルから優先度を推測する', () => {
      const labelPriorityMap: Array<[string[], UnifiedTask['priority']]> = [
        [['urgent'], 'urgent'],
        [['high-priority'], 'high'],
        [['low-priority'], 'low'],
        [['feature'], 'medium'],
      ];

      labelPriorityMap.forEach(([labelNames, expectedPriority]) => {
        const kanbanCard: KanbanCard = {
          id: 'card-test',
          title: 'テスト',
          laneId: 'todo',
          position: 0,
          labels: labelNames.map((name, i) => ({
            id: `label-${i}`,
            name,
            color: '#000000',
          })),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        const unifiedTask = adapter.toUnifiedTask(kanbanCard);
        expect(unifiedTask.priority).toBe(expectedPriority);
      });
    });
  });

  describe('fromUnifiedTask', () => {
    it('UnifiedTaskをKanbanCardに変換できる', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'タスクタイトル',
        description: '説明文',
        status: 'in_progress',
        priority: 'high',
        views: ['kanban', 'todo'],
        metadata: {
          kanban: {
            originalId: 'card-1',
            laneId: 'doing',
            position: 5,
            labels: [
              { id: 'label-1', name: 'backend', color: '#0000ff' },
            ],
          },
        },
        assigneeId: 'user-2',
        tags: ['backend', 'api'],
        dueDate: new Date('2024-06-30'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const kanbanCard = adapter.fromUnifiedTask(unifiedTask);

      expect(kanbanCard).toEqual({
        id: 'card-1',
        title: 'タスクタイトル',
        description: '説明文',
        laneId: 'doing',
        position: 5,
        assignee: 'user-2',
        labels: [
          { id: 'label-1', name: 'backend', color: '#0000ff' },
        ],
        dueDate: '2024-06-30',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('ステータスからレーンIDを推測する', () => {
      const statusLaneMap: Array<[UnifiedTask['status'], string]> = [
        ['todo', 'todo'],
        ['in_progress', 'in-progress'],
        ['done', 'done'],
        ['cancelled', 'cancelled'],
      ];

      statusLaneMap.forEach(([status, expectedLaneId]) => {
        const unifiedTask: UnifiedTask = {
          id: 'unified-test',
          title: 'テスト',
          status,
          views: ['kanban'],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const kanbanCard = adapter.fromUnifiedTask(unifiedTask);
        expect(kanbanCard.laneId).toBe(expectedLaneId);
      });
    });
  });

  describe('canConvert', () => {
    it('kanban viewを含むタスクは変換可能', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-1',
        title: 'テスト',
        status: 'todo',
        views: ['kanban', 'gantt'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(adapter.canConvert(unifiedTask)).toBe(true);
    });

    it('kanban viewを含まないタスクは変換不可', () => {
      const unifiedTask: UnifiedTask = {
        id: 'unified-2',
        title: 'テスト',
        status: 'todo',
        views: ['todo', 'wbs'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(adapter.canConvert(unifiedTask)).toBe(false);
    });
  });

  describe('createMetadata', () => {
    it('KanbanCardのメタデータを作成できる', () => {
      const kanbanCard: KanbanCard = {
        id: 'card-1',
        title: 'テスト',
        laneId: 'review',
        position: 3,
        labels: [
          { id: 'label-1', name: 'frontend', color: '#00ff00' },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const metadata = adapter.createMetadata(kanbanCard);

      expect(metadata).toEqual({
        kanban: {
          originalId: 'card-1',
          laneId: 'review',
          position: 3,
          labels: [
            { id: 'label-1', name: 'frontend', color: '#00ff00' },
          ],
        },
      });
    });
  });

  describe('validateKanbanCard', () => {
    it('有効なKanbanCardは検証を通過する', () => {
      const kanbanCard: KanbanCard = {
        id: 'card-1',
        title: 'テスト',
        laneId: 'todo',
        position: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateKanbanCard(kanbanCard)).not.toThrow();
    });

    it('タイトルが空のKanbanCardはエラーになる', () => {
      const kanbanCard: KanbanCard = {
        id: 'card-1',
        title: '',
        laneId: 'todo',
        position: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateKanbanCard(kanbanCard)).toThrow('タイトルは必須です');
    });

    it('レーンIDがないKanbanCardはエラーになる', () => {
      const kanbanCard: KanbanCard = {
        id: 'card-1',
        title: 'テスト',
        laneId: '',
        position: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(() => adapter.validateKanbanCard(kanbanCard)).toThrow('レーンIDは必須です');
    });
  });
});