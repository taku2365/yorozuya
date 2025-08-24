import { Database } from "./database";

interface Migration {
  version: number;
  name: string;
  up: (db: Database) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: async (db: Database) => {
      // Initial schema is created in database.ts createTables method
      // This migration is just to mark version 1
    },
  },
  {
    version: 2,
    name: "add_wbs_enhancements",
    up: async (db: Database) => {
      // Add new columns to wbs_tasks table
      const alterTableSql = `
        ALTER TABLE wbs_tasks 
        ADD COLUMN reviewer TEXT;
        
        ALTER TABLE wbs_tasks 
        ADD COLUMN due_date TEXT;
      `;
      
      try {
        // SQLite doesn't support multiple ALTER TABLE in one statement
        // Check if columns exist before adding
        const tables = await db.execute(
          "SELECT * FROM pragma_table_info('wbs_tasks') WHERE name IN ('reviewer', 'due_date')"
        );
        
        if (!tables.some((t: any) => t.name === 'reviewer')) {
          await db.execute("ALTER TABLE wbs_tasks ADD COLUMN reviewer TEXT");
        }
        
        if (!tables.some((t: any) => t.name === 'due_date')) {
          await db.execute("ALTER TABLE wbs_tasks ADD COLUMN due_date TEXT");
        }
      } catch (error) {
        // Columns might already exist
        console.log("WBS enhancement columns might already exist", error);
      }
    },
  },
  {
    version: 3,
    name: "add_wbs_professional_features",
    up: async (db: Database) => {
      // Add new columns for professional WBS features
      try {
        // Check if columns exist before adding
        const tables = await db.execute(
          "SELECT * FROM pragma_table_info('wbs_tasks') WHERE name IN ('hierarchy_number', 'start_date', 'end_date', 'work_days', 'remarks')"
        );
        
        const existingColumns = tables.map((t: any) => t.name);
        
        if (!existingColumns.includes('hierarchy_number')) {
          await db.execute("ALTER TABLE wbs_tasks ADD COLUMN hierarchy_number TEXT");
        }
        if (!existingColumns.includes('start_date')) {
          await db.execute("ALTER TABLE wbs_tasks ADD COLUMN start_date TEXT");
        }
        if (!existingColumns.includes('end_date')) {
          await db.execute("ALTER TABLE wbs_tasks ADD COLUMN end_date TEXT");
        }
        if (!existingColumns.includes('work_days')) {
          await db.execute("ALTER TABLE wbs_tasks ADD COLUMN work_days REAL");
        }
        if (!existingColumns.includes('remarks')) {
          await db.execute("ALTER TABLE wbs_tasks ADD COLUMN remarks TEXT");
        }
      } catch (error) {
        console.log("WBS professional feature columns might already exist", error);
      }
    },
  },
  {
    version: 4,
    name: "add_kanban_archive",
    up: async (db: Database) => {
      try {
        // Check if column exists before adding
        const tables = await db.execute(
          "SELECT * FROM pragma_table_info('kanban_cards') WHERE name = 'archived'"
        );
        
        if (tables.length === 0) {
          await db.execute("ALTER TABLE kanban_cards ADD COLUMN archived INTEGER DEFAULT 0");
        }
      } catch (error) {
        console.log("Archived column might already exist", error);
      }
    },
  },
  {
    version: 5,
    name: "add_gantt_enhancements",
    up: async (db: Database) => {
      try {
        // Add new columns to gantt_tasks table
        const columns = await db.execute(
          "SELECT * FROM pragma_table_info('gantt_tasks')"
        );
        
        const existingColumns = columns.map((c: any) => c.name);
        
        if (!existingColumns.includes('icon')) {
          await db.execute("ALTER TABLE gantt_tasks ADD COLUMN icon TEXT CHECK(icon IN ('folder', 'document', 'person', 'task'))");
        }
        if (!existingColumns.includes('color')) {
          await db.execute("ALTER TABLE gantt_tasks ADD COLUMN color TEXT");
        }
        if (!existingColumns.includes('category')) {
          await db.execute("ALTER TABLE gantt_tasks ADD COLUMN category TEXT");
        }
        if (!existingColumns.includes('parent_id')) {
          await db.execute("ALTER TABLE gantt_tasks ADD COLUMN parent_id TEXT");
        }
        if (!existingColumns.includes('assignee')) {
          await db.execute("ALTER TABLE gantt_tasks ADD COLUMN assignee TEXT");
        }
        if (!existingColumns.includes('assignee_icon')) {
          await db.execute("ALTER TABLE gantt_tasks ADD COLUMN assignee_icon TEXT");
        }
        if (!existingColumns.includes('group_id')) {
          await db.execute("ALTER TABLE gantt_tasks ADD COLUMN group_id TEXT");
        }
        
        // Create gantt_groups table
        await db.execute(`
          CREATE TABLE IF NOT EXISTS gantt_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            created_at INTEGER NOT NULL
          )
        `);
        
        // Add foreign key index
        await db.execute("CREATE INDEX IF NOT EXISTS idx_gantt_parent ON gantt_tasks(parent_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_gantt_group ON gantt_tasks(group_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_gantt_assignee ON gantt_tasks(assignee)");
        
      } catch (error) {
        console.log("Gantt enhancement columns might already exist", error);
      }
    },
  },
  {
    version: 6,
    name: "add_unified_tasks",
    up: async (db: Database) => {
      try {
        // Create unified_tasks table
        await db.execute(`
          CREATE TABLE IF NOT EXISTS unified_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            
            -- Status management
            status TEXT NOT NULL CHECK(status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
            priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
            progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
            
            -- Date management
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            due_date TEXT,
            
            -- Assignees
            assignee_id TEXT,
            assignee_name TEXT,
            reviewer_id TEXT,
            reviewer_name TEXT,
            
            -- Hierarchy
            parent_id TEXT,
            task_order INTEGER NOT NULL DEFAULT 0,
            hierarchy_level INTEGER NOT NULL DEFAULT 0,
            
            -- Source information
            source_type TEXT NOT NULL CHECK(source_type IN ('todo', 'wbs', 'kanban', 'gantt')),
            source_id TEXT NOT NULL,
            
            -- Metadata stored as JSON
            metadata TEXT NOT NULL DEFAULT '{}',
            
            FOREIGN KEY (parent_id) REFERENCES unified_tasks(id) ON DELETE CASCADE
          )
        `);
        
        // Create task_mappings table for tracking relationships
        await db.execute(`
          CREATE TABLE IF NOT EXISTS task_mappings (
            unified_id TEXT PRIMARY KEY,
            todo_id TEXT,
            wbs_id TEXT,
            kanban_card_id TEXT,
            gantt_task_id TEXT,
            
            FOREIGN KEY (unified_id) REFERENCES unified_tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
            FOREIGN KEY (wbs_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (kanban_card_id) REFERENCES kanban_cards(id) ON DELETE CASCADE,
            FOREIGN KEY (gantt_task_id) REFERENCES gantt_tasks(id) ON DELETE CASCADE
          )
        `);
        
        // Create task_tags table
        await db.execute(`
          CREATE TABLE IF NOT EXISTS task_tags (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            tag TEXT NOT NULL,
            
            FOREIGN KEY (task_id) REFERENCES unified_tasks(id) ON DELETE CASCADE,
            UNIQUE(task_id, tag)
          )
        `);
        
        // Create task_labels table
        await db.execute(`
          CREATE TABLE IF NOT EXISTS task_labels (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            label_id TEXT NOT NULL,
            label_name TEXT NOT NULL,
            label_color TEXT NOT NULL,
            
            FOREIGN KEY (task_id) REFERENCES unified_tasks(id) ON DELETE CASCADE,
            UNIQUE(task_id, label_id)
          )
        `);
        
        // Create task_history table
        await db.execute(`
          CREATE TABLE IF NOT EXISTS task_history (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            action TEXT NOT NULL,
            changes TEXT NOT NULL DEFAULT '{}',
            
            FOREIGN KEY (task_id) REFERENCES unified_tasks(id) ON DELETE CASCADE
          )
        `);
        
        // Create indexes for performance
        await db.execute("CREATE INDEX IF NOT EXISTS idx_unified_status ON unified_tasks(status)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_unified_priority ON unified_tasks(priority)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_unified_assignee ON unified_tasks(assignee_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_unified_parent ON unified_tasks(parent_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_unified_source ON unified_tasks(source_type, source_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_unified_dates ON unified_tasks(start_date, end_date, due_date)");
        
        await db.execute("CREATE INDEX IF NOT EXISTS idx_mappings_todo ON task_mappings(todo_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_mappings_wbs ON task_mappings(wbs_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_mappings_kanban ON task_mappings(kanban_card_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_mappings_gantt ON task_mappings(gantt_task_id)");
        
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tags_task ON task_tags(task_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tags_tag ON task_tags(tag)");
        
        await db.execute("CREATE INDEX IF NOT EXISTS idx_labels_task ON task_labels(task_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_labels_label ON task_labels(label_id)");
        
        await db.execute("CREATE INDEX IF NOT EXISTS idx_history_task ON task_history(task_id)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_history_timestamp ON task_history(timestamp)");
        
      } catch (error) {
        console.log("Error creating unified tasks schema", error);
        throw error;
      }
    },
  },
];

export async function runMigrations(db: any): Promise<void> {
  // Create migrations table
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // Handle both real Database and mock db
  if (db.exec) {
    db.exec(createTableSql);
  } else if (db.execute) {
    await db.execute(createTableSql);
  }

  // Get current version
  const currentVersion = await getMigrationVersion(db);

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      
      await migration.up(db);
      
      if (db.execute) {
        // Check if migration was already recorded (for duplicate version numbers)
        const existing = await db.execute(
          "SELECT version FROM migrations WHERE version = ? AND name = ?",
          [migration.version, migration.name]
        );
        
        if (existing.length === 0) {
          await db.execute(
            "INSERT INTO migrations (version, name) VALUES (?, ?)",
            [migration.version, migration.name]
          );
        }
      }
    }
  }
}

export async function getMigrationVersion(db: any): Promise<number> {
  const result = await db.execute("SELECT MAX(version) as version FROM migrations");
  return result[0]?.version || 0;
}