import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewStore } from '../view-store';

describe('ViewStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useViewStore.getState().reset();
  });

  describe('ビューの切り替え', () => {
    it('初期ビューはtodoである', () => {
      const { result } = renderHook(() => useViewStore());
      expect(result.current.currentView).toBe('todo');
    });

    it('ビューを切り替えることができる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setView('wbs');
      });
      
      expect(result.current.currentView).toBe('wbs');
      expect(result.current.previousView).toBe('todo');
    });

    it('前のビューに戻ることができる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setView('wbs');
        result.current.setView('kanban');
        result.current.goToPreviousView();
      });
      
      expect(result.current.currentView).toBe('wbs');
    });

    it('ビュー履歴を管理する', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setView('wbs');
        result.current.setView('kanban');
        result.current.setView('gantt');
      });
      
      expect(result.current.viewHistory).toEqual(['todo', 'wbs', 'kanban', 'gantt']);
    });
  });

  describe('ビューの設定', () => {
    it('ビューごとの設定を保存できる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.updateViewSettings('wbs', {
          showCompleted: false,
          expandLevel: 2,
        });
      });
      
      expect(result.current.viewSettings.wbs).toEqual({
        showCompleted: false,
        expandLevel: 2,
      });
    });

    it('デフォルト設定を取得できる', () => {
      const { result } = renderHook(() => useViewStore());
      
      const settings = result.current.getViewSettings('todo');
      expect(settings).toEqual({
        showCompleted: true,
        sortBy: 'priority',
        groupBy: null,
      });
    });

    it('カスタム設定とデフォルト設定をマージできる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.updateViewSettings('kanban', {
          wipLimit: 5,
        });
      });
      
      const settings = result.current.getViewSettings('kanban');
      expect(settings).toEqual({
        showCompleted: true,
        wipLimit: 5,
        showEmptyLanes: false,
      });
    });
  });

  describe('ビューの状態', () => {
    it('選択されたタスクを管理する', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setSelectedTaskIds(['task-1', 'task-2']);
      });
      
      expect(result.current.selectedTaskIds).toEqual(['task-1', 'task-2']);
    });

    it('タスクの選択をトグルできる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.toggleTaskSelection('task-1');
        result.current.toggleTaskSelection('task-2');
      });
      
      expect(result.current.selectedTaskIds).toEqual(['task-1', 'task-2']);
      
      act(() => {
        result.current.toggleTaskSelection('task-1');
      });
      
      expect(result.current.selectedTaskIds).toEqual(['task-2']);
    });

    it('すべての選択をクリアできる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setSelectedTaskIds(['task-1', 'task-2']);
        result.current.clearSelection();
      });
      
      expect(result.current.selectedTaskIds).toEqual([]);
    });

    it('展開された項目を管理する', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setExpandedItems(['item-1', 'item-2']);
      });
      
      expect(result.current.expandedItems).toEqual(['item-1', 'item-2']);
    });

    it('項目の展開をトグルできる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.toggleItemExpansion('item-1');
      });
      
      expect(result.current.expandedItems).toContain('item-1');
      
      act(() => {
        result.current.toggleItemExpansion('item-1');
      });
      
      expect(result.current.expandedItems).not.toContain('item-1');
    });
  });

  describe('ビューのレイアウト', () => {
    it('サイドバーの表示状態を管理する', () => {
      const { result } = renderHook(() => useViewStore());
      
      expect(result.current.isSidebarOpen).toBe(true);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.isSidebarOpen).toBe(false);
    });

    it('ビューモードを切り替えできる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setViewMode('compact');
      });
      
      expect(result.current.viewMode).toBe('compact');
    });
  });

  describe('リセット機能', () => {
    it('ビューのみリセットできる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setView('wbs');
        result.current.setSelectedTaskIds(['task-1']);
        result.current.resetView();
      });
      
      expect(result.current.currentView).toBe('todo');
      expect(result.current.selectedTaskIds).toEqual([]);
      expect(result.current.viewSettings).toEqual({});
    });

    it('すべての状態をリセットできる', () => {
      const { result } = renderHook(() => useViewStore());
      
      act(() => {
        result.current.setView('gantt');
        result.current.setSelectedTaskIds(['task-1']);
        result.current.updateViewSettings('gantt', { zoomLevel: 'week' });
        result.current.toggleSidebar();
        result.current.reset();
      });
      
      expect(result.current.currentView).toBe('todo');
      expect(result.current.selectedTaskIds).toEqual([]);
      expect(result.current.viewSettings).toEqual({});
      expect(result.current.isSidebarOpen).toBe(true);
    });
  });
});