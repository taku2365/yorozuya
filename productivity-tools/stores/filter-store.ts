import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface DateRange {
  start: Date;
  end: Date;
}

interface FilterState {
  searchQuery: string;
  statusFilter: string[];
  priorityFilter: string[];
  assigneeFilter: string[];
  tagFilter: string[];
  projectFilter: string[];
  dateRangeFilter: DateRange | null;
}

interface SavedFilter {
  id: string;
  name: string;
  filter: FilterState;
  createdAt: Date;
}

interface FilterPreset {
  id: string;
  name: string;
  filter: Partial<FilterState>;
}

type FilterType = 'status' | 'priority' | 'assignee' | 'tag' | 'project' | 'dateRange' | 'search';

interface FilterStore extends FilterState {
  // Saved filters
  savedFilters: SavedFilter[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (statuses: string[]) => void;
  setPriorityFilter: (priorities: string[]) => void;
  setAssigneeFilter: (assignees: string[]) => void;
  setTagFilter: (tags: string[]) => void;
  setProjectFilter: (projects: string[]) => void;
  setDateRangeFilter: (start: Date, end: Date) => void;
  
  // Multiple filters
  setMultipleFilters: (filters: Partial<FilterState>) => void;
  
  // Clear filters
  clearFilter: (type: FilterType) => void;
  clearAllFilters: () => void;
  
  // Saved filters
  saveFilter: (name: string, filter?: FilterState) => void;
  applySavedFilter: (id: string) => void;
  deleteSavedFilter: (id: string) => void;
  updateSavedFilter: (id: string, updates: Partial<SavedFilter>) => void;
  
  // Presets
  getFilterPresets: () => FilterPreset[];
  applyPreset: (presetId: string) => void;
  
  // Utility
  getCurrentFilter: () => FilterState;
  hasActiveFilters: () => boolean;
  reset: () => void;
}

// Default filter presets
const filterPresets: FilterPreset[] = [
  {
    id: 'active',
    name: 'アクティブなタスク',
    filter: {
      statusFilter: ['todo', 'in_progress'],
    },
  },
  {
    id: 'high-priority',
    name: '高優先度',
    filter: {
      priorityFilter: ['high'],
    },
  },
  {
    id: 'this-week',
    name: '今週の期限',
    filter: {
      dateRangeFilter: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  },
  {
    id: 'overdue',
    name: '期限切れ',
    filter: {
      dateRangeFilter: {
        start: new Date('2000-01-01'),
        end: new Date(),
      },
    },
  },
];

const initialState: FilterState = {
  searchQuery: '',
  statusFilter: [],
  priorityFilter: [],
  assigneeFilter: [],
  tagFilter: [],
  projectFilter: [],
  dateRangeFilter: null,
};

export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        savedFilters: [],

        // Set individual filters
        setSearchQuery: (query) => set({ searchQuery: query }),
        setStatusFilter: (statuses) => set({ statusFilter: statuses }),
        setPriorityFilter: (priorities) => set({ priorityFilter: priorities }),
        setAssigneeFilter: (assignees) => set({ assigneeFilter: assignees }),
        setTagFilter: (tags) => set({ tagFilter: tags }),
        setProjectFilter: (projects) => set({ projectFilter: projects }),
        setDateRangeFilter: (start, end) => set({ dateRangeFilter: { start, end } }),

        // Set multiple filters at once
        setMultipleFilters: (filters) => set(filters),

        // Clear specific filter
        clearFilter: (type: FilterType) => {
          switch (type) {
            case 'search':
              set({ searchQuery: '' });
              break;
            case 'status':
              set({ statusFilter: [] });
              break;
            case 'priority':
              set({ priorityFilter: [] });
              break;
            case 'assignee':
              set({ assigneeFilter: [] });
              break;
            case 'tag':
              set({ tagFilter: [] });
              break;
            case 'project':
              set({ projectFilter: [] });
              break;
            case 'dateRange':
              set({ dateRangeFilter: null });
              break;
          }
        },

        // Clear all filters
        clearAllFilters: () => set(initialState),

        // Save current filter
        saveFilter: (name: string, filter?: FilterState) => {
          const filterToSave = filter || get().getCurrentFilter();
          const newFilter: SavedFilter = {
            id: `filter-${Date.now()}`,
            name,
            filter: filterToSave,
            createdAt: new Date(),
          };
          
          set((state) => ({
            savedFilters: [...state.savedFilters, newFilter],
          }));
        },

        // Apply saved filter
        applySavedFilter: (id: string) => {
          const savedFilter = get().savedFilters.find((f) => f.id === id);
          if (savedFilter) {
            set(savedFilter.filter);
          }
        },

        // Delete saved filter
        deleteSavedFilter: (id: string) => {
          set((state) => ({
            savedFilters: state.savedFilters.filter((f) => f.id !== id),
          }));
        },

        // Update saved filter
        updateSavedFilter: (id: string, updates: Partial<SavedFilter>) => {
          set((state) => ({
            savedFilters: state.savedFilters.map((f) =>
              f.id === id ? { ...f, ...updates } : f
            ),
          }));
        },

        // Get filter presets
        getFilterPresets: () => filterPresets,

        // Apply preset
        applyPreset: (presetId: string) => {
          const preset = filterPresets.find((p) => p.id === presetId);
          if (preset) {
            set({ ...initialState, ...preset.filter });
          }
        },

        // Get current filter state
        getCurrentFilter: () => {
          const state = get();
          return {
            searchQuery: state.searchQuery,
            statusFilter: state.statusFilter,
            priorityFilter: state.priorityFilter,
            assigneeFilter: state.assigneeFilter,
            tagFilter: state.tagFilter,
            projectFilter: state.projectFilter,
            dateRangeFilter: state.dateRangeFilter,
          };
        },

        // Check if any filters are active
        hasActiveFilters: () => {
          const state = get();
          return !!(
            state.searchQuery ||
            state.statusFilter.length > 0 ||
            state.priorityFilter.length > 0 ||
            state.assigneeFilter.length > 0 ||
            state.tagFilter.length > 0 ||
            state.projectFilter.length > 0 ||
            state.dateRangeFilter
          );
        },

        // Reset all state
        reset: () => {
          set({
            ...initialState,
            savedFilters: [],
          });
        },
      }),
      {
        name: 'filter-store',
        partialize: (state) => ({
          savedFilters: state.savedFilters,
        }),
      }
    ),
    {
      name: 'filter-store',
    }
  )
);