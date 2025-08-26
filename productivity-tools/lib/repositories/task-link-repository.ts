import { getDatabase } from '@/lib/db/singleton';
import type { 
  TaskLink, 
  CreateTaskLinkDto, 
  UpdateTaskLinkDto,
  TaskLinkGroup 
} from '@/lib/db/types/task-link';

export class TaskLinkRepository {
  private async getDb() {
    const db = await getDatabase();
    // task_linksテーブルが存在するか確認
    try {
      const tables = await db.getTables();
      console.log('[TaskLinkRepository] Available tables:', tables);
      if (!tables.includes('task_links')) {
        console.warn('[TaskLinkRepository] task_links table not found, creating...');
        // テーブルを作成
        await db.execute(`
          CREATE TABLE IF NOT EXISTS task_links (
            id TEXT PRIMARY KEY,
            unifiedId TEXT NOT NULL,
            viewType TEXT NOT NULL CHECK(viewType IN ('todo', 'wbs', 'kanban', 'gantt')),
            originalId TEXT NOT NULL,
            syncEnabled INTEGER NOT NULL DEFAULT 1,
            createdAt TEXT NOT NULL,
            lastSyncedAt TEXT NOT NULL,
            
            UNIQUE(viewType, originalId)
          )
        `);
        await db.execute("CREATE INDEX IF NOT EXISTS idx_task_links_unified ON task_links(unifiedId)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_task_links_view ON task_links(viewType, originalId)");
      }
    } catch (error) {
      console.error('[TaskLinkRepository] Error checking/creating table:', error);
    }
    return db;
  }

  async create(data: CreateTaskLinkDto): Promise<TaskLink> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const id = `${data.viewType}:${data.originalId}:${Date.now()}`;
    
    console.log('[TaskLinkRepository] create data:', data);
    console.log('[TaskLinkRepository] create params:', {
      id,
      unifiedId: data.unifiedId,
      viewType: data.viewType,  
      originalId: data.originalId,
      syncEnabled: data.syncEnabled ? 1 : 0,
      createdAt: now,
      lastSyncedAt: now
    });
    console.log('[TaskLinkRepository] create execute values:', [
      id,
      data.unifiedId,
      data.viewType,
      data.originalId,
      data.syncEnabled ? 1 : 0,
      now,
      now
    ]);
    
    await db.execute(
      `INSERT INTO task_links (id, unifiedId, viewType, originalId, syncEnabled, createdAt, lastSyncedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.unifiedId,
        data.viewType,
        data.originalId,
        data.syncEnabled ? 1 : 0,
        now,
        now
      ]
    );
    
    const rows = await db.execute<TaskLink>(
      'SELECT * FROM task_links WHERE id = ?',
      [id]
    );
    
    return rows[0];
  }

  async findByUnifiedId(unifiedId: string): Promise<TaskLink[]> {
    const db = await this.getDb();
    return await db.execute<TaskLink>(
      'SELECT * FROM task_links WHERE unifiedId = ? ORDER BY createdAt',
      [unifiedId]
    );
  }

  async findByViewAndOriginalId(viewType: string, originalId: string): Promise<TaskLink | null> {
    const db = await this.getDb();
    console.log('[TaskLinkRepository] findByViewAndOriginalId:', { viewType, originalId });
    try {
      const rows = await db.execute<TaskLink>(
        'SELECT * FROM task_links WHERE viewType = ? AND originalId = ?',
        [viewType, originalId]
      );
      console.log('[TaskLinkRepository] findByViewAndOriginalId result:', rows);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('[TaskLinkRepository] findByViewAndOriginalId error:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateTaskLinkDto): Promise<TaskLink | null> {
    const db = await this.getDb();
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.syncEnabled !== undefined) {
      updates.push('syncEnabled = ?');
      values.push(data.syncEnabled ? 1 : 0);
    }
    
    if (data.lastSyncedAt !== undefined) {
      updates.push('lastSyncedAt = ?');
      values.push(data.lastSyncedAt);
    }
    
    if (updates.length === 0) return null;
    
    values.push(id);
    
    await db.execute(
      `UPDATE task_links SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const rows = await db.execute<TaskLink>(
      'SELECT * FROM task_links WHERE id = ?',
      [id]
    );
    
    return rows.length > 0 ? rows[0] : null;
  }

  async updateSyncStatus(unifiedId: string, syncEnabled: boolean): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      'UPDATE task_links SET syncEnabled = ? WHERE unifiedId = ?',
      [syncEnabled ? 1 : 0, unifiedId]
    );
  }

  async delete(id: string): Promise<boolean> {
    const db = await this.getDb();
    await db.execute(
      'DELETE FROM task_links WHERE id = ?',
      [id]
    );
    // Since execute doesn't return changes count, we assume success
    return true;
  }

  async deleteByUnifiedId(unifiedId: string): Promise<number> {
    const db = await this.getDb();
    // Get count before deletion
    const rows = await db.execute<{ count: number }>(
      'SELECT COUNT(*) as count FROM task_links WHERE unifiedId = ?',
      [unifiedId]
    );
    const count = rows[0]?.count || 0;
    
    await db.execute(
      'DELETE FROM task_links WHERE unifiedId = ?',
      [unifiedId]
    );
    
    return count;
  }

  /**
   * 複数のビューにタスクリンクを作成
   */
  async createLinkGroup(
    originalTask: { viewType: 'todo' | 'wbs' | 'kanban' | 'gantt', originalId: string },
    createdTasks: Array<{ viewType: 'todo' | 'wbs' | 'kanban' | 'gantt', originalId: string }>,
    syncEnabled: boolean = true
  ): Promise<TaskLinkGroup> {
    const unifiedId = `${originalTask.viewType}:${originalTask.originalId}`;
    const links: TaskLink[] = [];

    // オリジナルタスクのリンクを作成
    const originalLink = await this.create({
      unifiedId,
      viewType: originalTask.viewType,
      originalId: originalTask.originalId,
      syncEnabled,
    });
    links.push(originalLink);

    // ターゲットビューのリンクを作成
    for (const createdTask of createdTasks) {
      if (createdTask.viewType === originalTask.viewType) continue; // 同じビューはスキップ
      
      const link = await this.create({
        unifiedId,
        viewType: createdTask.viewType,
        originalId: createdTask.originalId,
        syncEnabled,
      });
      links.push(link);
    }

    return {
      unifiedId,
      links,
      syncEnabled,
    };
  }
}