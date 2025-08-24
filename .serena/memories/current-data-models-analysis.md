# Current Data Models Analysis for Task 10 (データモデル統合)

## 1. Current Entity Models

### 1.1 Todo Entity (`lib/db/types.ts`)
```typescript
interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: "high" | "medium" | "low";
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

### 1.2 WBS Task Entity (`lib/db/types.ts`)
```typescript
interface WBSTask {
  id: string;
  title: string;
  parent_id?: string;
  position: number;
  hierarchy_number?: string; // 階層番号（例: "1.1.1"）
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  assignee?: string;
  reviewer?: string;
  start_date?: string; // 開始日
  end_date?: string; // 終了日
  due_date?: string;
  work_days?: number; // 工数（人日）
  remarks?: string; // 備考
  dependencies?: string[];
  created_at: string;
  updated_at: string;
  children?: WBSTask[]; // Runtime property, not in DB
}
```

### 1.3 Kanban Entities (`lib/db/types.ts`)
```typescript
interface KanbanLane {
  id: string;
  title: string;
  position: number;
  wip_limit?: number;
  created_at: string;
  updated_at: string;
}

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  lane_id: string;
  position: number;
  labels?: string;
  todo_id?: string; // Links to Todo
  archived?: boolean;
  created_at: string;
  updated_at: string;
}
```

### 1.4 Gantt Entities
Two versions exist with some differences:

#### Database Version (`lib/db/types.ts`)
```typescript
interface GanttTask {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  progress: number;
  wbs_task_id?: string; // Links to WBS
  created_at: string;
  updated_at: string;
}

interface GanttDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  type: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish";
  created_at: string;
}
```

#### Extended Version (`lib/types/gantt.ts`)
```typescript
interface GanttTask {
  id: string;
  title: string;
  icon?: GanttTaskIcon;
  color?: GanttTaskColor;
  category?: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: string[];
  isCriticalPath: boolean;
  parentId?: string;
  children?: string[];
  assignee?: string;
  assigneeIcon?: string;
  groupId?: string;
  wbsTaskId?: string; // Links to WBS
  createdAt: Date;
  updatedAt: Date;
}
```

## 2. Database Schema (SQLite)

### 2.1 todos table
- id (TEXT PRIMARY KEY)
- title (TEXT NOT NULL)
- description (TEXT)
- due_date (TEXT)
- priority (TEXT CHECK)
- completed (BOOLEAN DEFAULT 0)
- completed_at (TEXT)
- created_at (TEXT)
- updated_at (TEXT)

### 2.2 wbs_tasks table
- id (TEXT PRIMARY KEY)
- title (TEXT NOT NULL)
- parent_id (TEXT FK)
- position (INTEGER)
- hierarchy_number (TEXT) - Added in migration v3
- estimated_hours (REAL)
- actual_hours (REAL)
- progress (INTEGER DEFAULT 0)
- assignee (TEXT)
- reviewer (TEXT) - Added in migration v2
- start_date (TEXT) - Added in migration v3
- end_date (TEXT) - Added in migration v3
- due_date (TEXT) - Added in migration v2
- work_days (REAL) - Added in migration v3
- remarks (TEXT) - Added in migration v3
- created_at (TEXT)
- updated_at (TEXT)

### 2.3 kanban_lanes table
- id (TEXT PRIMARY KEY)
- title (TEXT NOT NULL)
- position (INTEGER)
- wip_limit (INTEGER)
- created_at (TEXT)
- updated_at (TEXT)

### 2.4 kanban_cards table
- id (TEXT PRIMARY KEY)
- title (TEXT NOT NULL)
- description (TEXT)
- lane_id (TEXT FK)
- position (INTEGER)
- labels (TEXT)
- todo_id (TEXT FK) - Links to todos
- archived (INTEGER DEFAULT 0) - Added in migration v4
- created_at (TEXT)
- updated_at (TEXT)

### 2.5 gantt_tasks table
- id (TEXT PRIMARY KEY)
- title (TEXT NOT NULL)
- start_date (TEXT NOT NULL)
- end_date (TEXT NOT NULL)
- progress (INTEGER DEFAULT 0)
- wbs_task_id (TEXT FK) - Links to wbs_tasks
- icon (TEXT CHECK) - Added in migration v5
- color (TEXT) - Added in migration v5
- category (TEXT) - Added in migration v5
- parent_id (TEXT) - Added in migration v5
- assignee (TEXT) - Added in migration v5
- assignee_icon (TEXT) - Added in migration v5
- group_id (TEXT) - Added in migration v5
- created_at (TEXT)
- updated_at (TEXT)

### 2.6 gantt_dependencies table
- id (TEXT PRIMARY KEY)
- predecessor_id (TEXT FK)
- successor_id (TEXT FK)
- type (TEXT DEFAULT 'finish-to-start')
- created_at (TEXT)

### 2.7 gantt_groups table (Added in migration v5)
- id (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- color (TEXT NOT NULL)
- created_at (INTEGER NOT NULL)

## 3. Current Relationships

1. **Kanban → Todo**: kanban_cards.todo_id → todos.id
2. **Gantt → WBS**: gantt_tasks.wbs_task_id → wbs_tasks.id
3. **WBS Hierarchy**: wbs_tasks.parent_id → wbs_tasks.id (self-referencing)
4. **Gantt Dependencies**: gantt_dependencies linking gantt_tasks
5. **Gantt Hierarchy**: gantt_tasks.parent_id → gantt_tasks.id (self-referencing)
6. **Gantt Groups**: gantt_tasks.group_id → gantt_groups.id

## 4. Key Observations for Integration

### 4.1 Overlapping Concepts
- **Title**: All entities have title
- **Progress**: WBS and Gantt both track progress
- **Dates**: Multiple date fields across entities (due_date, start_date, end_date)
- **Assignee**: WBS and Gantt both have assignee
- **Hierarchy**: Both WBS and Gantt support parent-child relationships
- **Status/State**: Implicit in different ways (Todo: completed, Kanban: lane_id, WBS/Gantt: progress)

### 4.2 Unique Features by Tool
- **Todo**: priority, completed/completed_at
- **WBS**: hierarchy_number, estimated_hours, actual_hours, work_days, reviewer, remarks
- **Kanban**: lanes with WIP limits, card positions, labels, archived state
- **Gantt**: dependencies, critical path, icons, colors, categories, groups

### 4.3 Integration Challenges
1. **Date Synchronization**: 
   - Todo has due_date
   - WBS has start_date, end_date, due_date
   - Gantt has start_date, end_date
   
2. **Status Representation**:
   - Todo: boolean completed
   - Kanban: lane-based status
   - WBS/Gantt: percentage progress
   
3. **Hierarchical Structure**:
   - WBS has hierarchy_number for display
   - Both WBS and Gantt support parent_id
   
4. **Multiple Type Systems**:
   - Database types use snake_case strings
   - Runtime types use camelCase with Date objects

## 5. Recommendations for Task 10

### 5.1 Unified Task Model Approach
Create a new unified_tasks table that consolidates common fields while maintaining tool-specific tables for unique features.

### 5.2 Status Mapping Strategy
- Map Todo completed → 'done' status
- Map Kanban lanes → predefined statuses
- Map progress percentages → status thresholds

### 5.3 Date Handling
- Standardize all dates to ISO 8601 strings in DB
- Convert to Date objects at runtime
- Establish clear rules for date synchronization

### 5.4 Migration Path
1. Create new unified model
2. Build adapters for existing repositories
3. Gradual migration with backward compatibility
4. Update UI components to use unified model