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