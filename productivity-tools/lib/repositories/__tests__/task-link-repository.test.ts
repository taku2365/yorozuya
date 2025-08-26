import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskLinkRepository } from '../task-link-repository';
import { getDatabase } from '@/lib/db/client';
import type { TaskLink, CreateTaskLinkDto } from '@/lib/db/types/task-link';

vi.mock('@/lib/db/client');

describe('TaskLinkRepository', () => {
  let repository: TaskLinkRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    };
    (getDatabase as any).mockReturnValue(mockDb);
    repository = new TaskLinkRepository();
  });

  describe('create', () => {
    it('新しいタスクリンクを作成できる', async () => {
      const dto: CreateTaskLinkDto = {
        unifiedId: 'todo:123',
        viewType: 'todo',
        originalId: '123',
        syncEnabled: true,
      };

      mockDb.run.mockReturnValue({ lastInsertRowid: 1 });
      mockDb.prepare.mockReturnValueOnce({
        get: vi.fn().mockReturnValue({
          id: '1',
          ...dto,
          createdAt: '2024-01-01T00:00:00Z',
          lastSyncedAt: '2024-01-01T00:00:00Z',
        }),
      });

      const result = await repository.create(dto);

      expect(result).toMatchObject({
        id: '1',
        unifiedId: 'todo:123',
        viewType: 'todo',
        originalId: '123',
        syncEnabled: true,
      });
    });
  });

  describe('findByUnifiedId', () => {
    it('統一IDで関連するすべてのリンクを取得できる', async () => {
      const unifiedId = 'todo:123';
      const mockLinks = [
        {
          id: '1',
          unifiedId,
          viewType: 'todo',
          originalId: '123',
          syncEnabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastSyncedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          unifiedId,
          viewType: 'wbs',
          originalId: '456',
          syncEnabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastSyncedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockDb.all.mockReturnValue(mockLinks);

      const result = await repository.findByUnifiedId(unifiedId);

      expect(result).toHaveLength(2);
      expect(result[0].viewType).toBe('todo');
      expect(result[1].viewType).toBe('wbs');
    });
  });

  describe('findByViewAndOriginalId', () => {
    it('ビュータイプとオリジナルIDでリンクを取得できる', async () => {
      const mockLink = {
        id: '1',
        unifiedId: 'todo:123',
        viewType: 'todo',
        originalId: '123',
        syncEnabled: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastSyncedAt: '2024-01-01T00:00:00Z',
      };

      mockDb.get.mockReturnValue(mockLink);

      const result = await repository.findByViewAndOriginalId('todo', '123');

      expect(result).toEqual(mockLink);
    });

    it('存在しない場合はnullを返す', async () => {
      mockDb.get.mockReturnValue(undefined);

      const result = await repository.findByViewAndOriginalId('todo', '999');

      expect(result).toBeNull();
    });
  });

  describe('updateSyncStatus', () => {
    it('同期状態を更新できる', async () => {
      mockDb.run.mockReturnValue({ changes: 1 });

      await repository.updateSyncStatus('todo:123', false);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE task_links')
      );
    });
  });

  describe('createLinkGroup', () => {
    it('複数のビューにタスクリンクを作成できる', async () => {
      const originalTask = { viewType: 'todo' as const, originalId: '123' };
      const targetViews = ['wbs', 'kanban'] as const;

      // モック設定
      let linkId = 1;
      mockDb.run.mockImplementation(() => ({ lastInsertRowid: linkId++ }));
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockImplementation(() => ({
          id: String(linkId - 1),
          unifiedId: 'todo:123',
          viewType: targetViews[linkId - 2] || 'todo',
          originalId: linkId === 1 ? '123' : `generated-${linkId - 2}`,
          syncEnabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastSyncedAt: '2024-01-01T00:00:00Z',
        })),
      });

      const result = await repository.createLinkGroup(
        originalTask,
        targetViews,
        true
      );

      expect(result.unifiedId).toBe('todo:123');
      expect(result.links).toHaveLength(3); // オリジナル + 2つのターゲット
      expect(result.syncEnabled).toBe(true);
    });
  });
});