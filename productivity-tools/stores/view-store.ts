import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ViewType = 'todo' | 'wbs' | 'kanban' | 'gantt';
type ViewMode = 'default' | 'compact' | 'detailed';

interface ViewSettings {
  [key: string]: any;
  showCompleted?: boolean;
  sortBy?: string;
  groupBy?: string | null;
  expandLevel?: number;
  wipLimit?: number;
  showEmptyLanes?: boolean;
  zoomLevel?: string;
}

interface ViewStore {
  // Current view state
  currentView: ViewType;
  previousView: ViewType | null;
  viewHistory: ViewType[];
  
  // View settings
  viewSettings: Record<ViewType, ViewSettings>;
  
  // UI state
  selectedTaskIds: string[];
  expandedItems: string[];
  isSidebarOpen: boolean;
  viewMode: ViewMode;
  
  // Actions
  setView: (view: ViewType) => void;
  goToPreviousView: () => void;
  updateViewSettings: (view: ViewType, settings: ViewSettings) => void;
  getViewSettings: (view: ViewType) => ViewSettings;
  
  // Selection actions
  setSelectedTaskIds: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Expansion actions
  setExpandedItems: (ids: string[]) => void;
  toggleItemExpansion: (id: string) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Utility
  resetView: () => void;
  reset: () => void;
}

// Default settings for each view
const defaultViewSettings: Record<ViewType, ViewSettings> = {
  todo: {
    showCompleted: true,
    sortBy: 'priority',
    groupBy: null,
  },
  wbs: {
    showCompleted: true,
    expandLevel: 2,
  },
  kanban: {
    showCompleted: true,
    wipLimit: 0,
    showEmptyLanes: false,
  },
  gantt: {
    showCompleted: true,
    zoomLevel: 'month',
  },
};

export const useViewStore = create<ViewStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentView: 'todo',
      previousView: null,
      viewHistory: ['todo'],
      viewSettings: {},
      selectedTaskIds: [],
      expandedItems: [],
      isSidebarOpen: true,
      viewMode: 'default',

      // Set current view
      setView: (view: ViewType) => {
        const current = get().currentView;
        if (current === view) return;
        
        set((state) => ({
          currentView: view,
          previousView: current,
          viewHistory: [...state.viewHistory, view],
        }));
      },

      // Go to previous view
      goToPreviousView: () => {
        const { previousView } = get();
        if (previousView) {
          get().setView(previousView);
        }
      },

      // Update view settings
      updateViewSettings: (view: ViewType, settings: ViewSettings) => {
        set((state) => ({
          viewSettings: {
            ...state.viewSettings,
            [view]: {
              ...state.viewSettings[view],
              ...settings,
            },
          },
        }));
      },

      // Get view settings with defaults
      getViewSettings: (view: ViewType) => {
        const customSettings = get().viewSettings[view] || {};
        const defaults = defaultViewSettings[view] || {};
        return { ...defaults, ...customSettings };
      },

      // Set selected task IDs
      setSelectedTaskIds: (ids: string[]) => set({ selectedTaskIds: ids }),

      // Toggle task selection
      toggleTaskSelection: (id: string) => {
        set((state) => {
          const isSelected = state.selectedTaskIds.includes(id);
          return {
            selectedTaskIds: isSelected
              ? state.selectedTaskIds.filter((taskId) => taskId !== id)
              : [...state.selectedTaskIds, id],
          };
        });
      },

      // Clear selection
      clearSelection: () => set({ selectedTaskIds: [] }),

      // Set expanded items
      setExpandedItems: (ids: string[]) => set({ expandedItems: ids }),

      // Toggle item expansion
      toggleItemExpansion: (id: string) => {
        set((state) => {
          const isExpanded = state.expandedItems.includes(id);
          return {
            expandedItems: isExpanded
              ? state.expandedItems.filter((itemId) => itemId !== id)
              : [...state.expandedItems, id],
          };
        });
      },

      // Toggle sidebar
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      // Set view mode
      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

      // Reset view state
      resetView: () => {
        set({
          currentView: 'todo',
          previousView: null,
          viewHistory: ['todo'],
          selectedTaskIds: [],
          expandedItems: [],
          viewSettings: {},
        });
      },

      // Reset all state
      reset: () => {
        set({
          currentView: 'todo',
          previousView: null,
          viewHistory: ['todo'],
          viewSettings: {},
          selectedTaskIds: [],
          expandedItems: [],
          isSidebarOpen: true,
          viewMode: 'default',
        });
      },
    }),
    {
      name: 'view-store',
    }
  )
);