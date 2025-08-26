import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterStore } from '../filter-store';

describe('FilterStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useFilterStore.getState().reset();
  });

  describe('グローバルフィルタ', () => {
    it('検索クエリを設定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setSearchQuery('タスク検索');
      });
      
      expect(result.current.searchQuery).toBe('タスク検索');
    });

    it('ステータスフィルタを設定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setStatusFilter(['todo', 'in_progress']);
      });
      
      expect(result.current.statusFilter).toEqual(['todo', 'in_progress']);
    });

    it('優先度フィルタを設定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setPriorityFilter(['high', 'medium']);
      });
      
      expect(result.current.priorityFilter).toEqual(['high', 'medium']);
    });

    it('担当者フィルタを設定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setAssigneeFilter(['user-1', 'user-2']);
      });
      
      expect(result.current.assigneeFilter).toEqual(['user-1', 'user-2']);
    });

    it('タグフィルタを設定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setTagFilter(['urgent', 'bug']);
      });
      
      expect(result.current.tagFilter).toEqual(['urgent', 'bug']);
    });

    it('プロジェクトフィルタを設定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setProjectFilter(['proj-1']);
      });
      
      expect(result.current.projectFilter).toEqual(['proj-1']);
    });

    it('日付範囲フィルタを設定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      act(() => {
        result.current.setDateRangeFilter(start, end);
      });
      
      expect(result.current.dateRangeFilter).toEqual({ start, end });
    });
  });

  describe('保存されたフィルタ', () => {
    it('フィルタを保存できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setStatusFilter(['todo']);
        result.current.setPriorityFilter(['high']);
        result.current.saveFilter('緊急タスク');
      });
      
      expect(result.current.savedFilters).toHaveLength(1);
      expect(result.current.savedFilters[0].name).toBe('緊急タスク');
      expect(result.current.savedFilters[0].filter.statusFilter).toEqual(['todo']);
      expect(result.current.savedFilters[0].filter.priorityFilter).toEqual(['high']);
    });

    it('保存されたフィルタを適用できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      // フィルタを保存
      act(() => {
        result.current.setStatusFilter(['in_progress']);
        result.current.setPriorityFilter(['medium']);
        result.current.setTagFilter(['feature']);
        result.current.saveFilter('フィルタ1');
      });
      
      const savedFilterId = result.current.savedFilters[0].id;
      
      // リセットして保存されたフィルタを適用
      act(() => {
        result.current.clearAllFilters();
      });
      
      act(() => {
        result.current.applySavedFilter(savedFilterId);
      });
      
      expect(result.current.statusFilter).toEqual(['in_progress']);
      expect(result.current.priorityFilter).toEqual(['medium']);
      expect(result.current.tagFilter).toEqual(['feature']);
    });

    it('保存されたフィルタを削除できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.saveFilter('削除予定');
      });
      
      const filterId = result.current.savedFilters[0].id;
      
      act(() => {
        result.current.deleteSavedFilter(filterId);
      });
      
      expect(result.current.savedFilters).toHaveLength(0);
    });

    it('保存されたフィルタを更新できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.saveFilter('更新前');
      });
      
      const filterId = result.current.savedFilters[0].id;
      
      act(() => {
        result.current.updateSavedFilter(filterId, {
          name: '更新後',
          filter: { statusFilter: ['done'] },
        });
      });
      
      expect(result.current.savedFilters[0].name).toBe('更新後');
      expect(result.current.savedFilters[0].filter.statusFilter).toEqual(['done']);
    });
  });

  describe('フィルタのプリセット', () => {
    it('デフォルトプリセットが存在する', () => {
      const { result } = renderHook(() => useFilterStore());
      
      const presets = result.current.getFilterPresets();
      expect(presets).toContainEqual(
        expect.objectContaining({ name: 'アクティブなタスク' })
      );
      expect(presets).toContainEqual(
        expect.objectContaining({ name: '今週の期限' })
      );
      expect(presets).toContainEqual(
        expect.objectContaining({ name: '高優先度' })
      );
    });

    it('プリセットを適用できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.applyPreset('active');
      });
      
      expect(result.current.statusFilter).toEqual(['todo', 'in_progress']);
    });
  });

  describe('フィルタの組み合わせ', () => {
    it('複数のフィルタを組み合わせて適用できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setMultipleFilters({
          statusFilter: ['todo'],
          priorityFilter: ['high'],
          assigneeFilter: ['user-1'],
          tagFilter: ['urgent'],
        });
      });
      
      expect(result.current.statusFilter).toEqual(['todo']);
      expect(result.current.priorityFilter).toEqual(['high']);
      expect(result.current.assigneeFilter).toEqual(['user-1']);
      expect(result.current.tagFilter).toEqual(['urgent']);
    });

    it('現在のフィルタを取得できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setStatusFilter(['todo']);
        result.current.setPriorityFilter(['high']);
        result.current.setSearchQuery('検索');
      });
      
      const currentFilter = result.current.getCurrentFilter();
      
      expect(currentFilter).toEqual({
        searchQuery: '検索',
        statusFilter: ['todo'],
        priorityFilter: ['high'],
        assigneeFilter: [],
        tagFilter: [],
        projectFilter: [],
        dateRangeFilter: null,
      });
    });

    it('フィルタがアクティブかどうか判定できる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      expect(result.current.hasActiveFilters()).toBe(false);
      
      act(() => {
        result.current.setStatusFilter(['todo']);
      });
      
      expect(result.current.hasActiveFilters()).toBe(true);
    });
  });

  describe('フィルタのクリア', () => {
    it('特定のフィルタをクリアできる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setStatusFilter(['todo']);
        result.current.setPriorityFilter(['high']);
        result.current.clearFilter('status');
      });
      
      expect(result.current.statusFilter).toEqual([]);
      expect(result.current.priorityFilter).toEqual(['high']);
    });

    it('すべてのフィルタをクリアできる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setStatusFilter(['todo']);
        result.current.setPriorityFilter(['high']);
        result.current.setSearchQuery('検索');
        result.current.clearAllFilters();
      });
      
      expect(result.current.statusFilter).toEqual([]);
      expect(result.current.priorityFilter).toEqual([]);
      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('リセット機能', () => {
    it('すべての状態をリセットできる', () => {
      const { result } = renderHook(() => useFilterStore());
      
      act(() => {
        result.current.setStatusFilter(['todo']);
        result.current.setPriorityFilter(['high']);
        result.current.saveFilter('保存フィルタ');
        result.current.reset();
      });
      
      expect(result.current.statusFilter).toEqual([]);
      expect(result.current.priorityFilter).toEqual([]);
      expect(result.current.savedFilters).toEqual([]);
    });
  });
});