import { v4 as uuidv4 } from 'uuid';
import { Database } from '../db/database';
import { UnifiedTaskRepository } from '../repositories/unified-task-repository';
import { 
  UnifiedTask, 
  TaskStatus, 
  TaskPriority, 
  ViewType,
  TaskMetadata 
} from '../types/unified';

/**
 * 既存データを統一タスクモデルに移行するスクリプト
 */
export class UnifiedTaskMigrator {
  private unifiedRepo: UnifiedTaskRepository;

  constructor(private db: Database) {
    this.unifiedRepo = new UnifiedTaskRepository(db);
  }

  /**
   * すべてのデータを移行
   */
  async migrateAll(): Promise<void> {
    console.log('Starting unified task migration...');
    
    try {
      await this.db.execute('BEGIN TRANSACTION');

      // 既存の統一タスクをクリア（開発時のみ）
      // await this.clearUnifiedTasks();

      // 各ツールのデータを移行
      await this.migrateTodos();
      await this.migrateWbsTasks();
      await this.migrateKanbanCards();
      await this.migrateGanttTasks();

      await this.db.execute('COMMIT');
      console.log('Migration completed successfully!');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Todoデータの移行
   */
  private async migrateTodos(): Promise<void> {
    console.log('Migrating todos...');
    
    const todos = await this.db.execute('SELECT * FROM todos ORDER BY created_at');
    
    for (const todo of todos) {
      // 既に移行済みかチェック
      const existing = await this.unifiedRepo.findBySource('todo', todo.id);
      if (existing) {
        console.log(`Todo ${todo.id} already migrated, skipping...`);
        continue;
      }

      const unifiedTask: Omit<UnifiedTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: todo.title,
        description: todo.description,
        status: todo.completed ? 'completed' : 'not_started',
        priority: this.mapPriority(todo.priority),
        progress: todo.completed ? 100 : 0,
        startDate: undefined,
        endDate: undefined,
        dueDate: todo.due_date ? new Date(todo.due_date) : undefined,
        assigneeId: undefined,
        assigneeName: undefined,
        reviewerId: undefined,
        reviewerName: undefined,
        parentId: undefined,
        order: 0,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        sourceType: 'todo',
        sourceId: todo.id,
        metadata: {
          todo: {}
        }
      };

      const created = await this.unifiedRepo.create(unifiedTask);
      
      // マッピングを作成
      await this.unifiedRepo.setMapping({
        unifiedId: created.id,
        todoId: todo.id
      });

      console.log(`Migrated todo: ${todo.title}`);
    }
  }

  /**
   * WBSタスクの移行
   */
  private async migrateWbsTasks(): Promise<void> {
    console.log('Migrating WBS tasks...');
    
    // 親タスクから順に移行（階層順）
    const wbsTasks = await this.db.execute(
      'SELECT * FROM wbs_tasks ORDER BY parent_id NULLS FIRST, task_order'
    );
    
    // 親子関係のマッピング
    const wbsToUnifiedMap = new Map<string, string>();
    
    for (const wbs of wbsTasks) {
      // 既に移行済みかチェック
      const existing = await this.unifiedRepo.findBySource('wbs', wbs.id);
      if (existing) {
        console.log(`WBS task ${wbs.id} already migrated, skipping...`);
        wbsToUnifiedMap.set(wbs.id, existing.id);
        continue;
      }

      const parentUnifiedId = wbs.parent_id ? wbsToUnifiedMap.get(wbs.parent_id) : undefined;
      
      const unifiedTask: Omit<UnifiedTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: wbs.title,
        description: wbs.description,
        status: this.mapWbsStatus(wbs.progress),
        priority: 'medium', // WBSには優先度がないのでデフォルト値
        progress: wbs.progress || 0,
        startDate: wbs.start_date ? new Date(wbs.start_date) : undefined,
        endDate: wbs.end_date ? new Date(wbs.end_date) : undefined,
        dueDate: wbs.due_date ? new Date(wbs.due_date) : undefined,
        assigneeId: wbs.assignee,
        assigneeName: wbs.assignee,
        reviewerId: wbs.reviewer,
        reviewerName: wbs.reviewer,
        parentId: parentUnifiedId,
        order: wbs.task_order,
        hierarchyLevel: this.calculateHierarchyLevel(wbs.hierarchy_number),
        tags: [],
        labels: [],
        sourceType: 'wbs',
        sourceId: wbs.id,
        metadata: {
          wbs: {
            hierarchyNumber: wbs.hierarchy_number || '',
            estimatedHours: wbs.estimated_hours || undefined,
            actualHours: wbs.actual_hours || undefined,
            workDays: wbs.work_days || undefined,
            remarks: wbs.remarks || undefined,
            isDeliverable: wbs.is_deliverable || false
          }
        }
      };

      const created = await this.unifiedRepo.create(unifiedTask);
      wbsToUnifiedMap.set(wbs.id, created.id);
      
      // マッピングを作成
      await this.unifiedRepo.setMapping({
        unifiedId: created.id,
        wbsId: wbs.id
      });

      console.log(`Migrated WBS task: ${wbs.title}`);
    }
  }

  /**
   * カンバンカードの移行
   */
  private async migrateKanbanCards(): Promise<void> {
    console.log('Migrating Kanban cards...');
    
    // レーン情報を取得
    const lanes = await this.db.execute('SELECT * FROM kanban_lanes');
    const laneMap = new Map(lanes.map(lane => [lane.id, lane]));
    
    const cards = await this.db.execute(
      'SELECT * FROM kanban_cards WHERE archived = 0 ORDER BY position'
    );
    
    for (const card of cards) {
      // 既に移行済みかチェック
      const existing = await this.unifiedRepo.findBySource('kanban', card.id);
      if (existing) {
        console.log(`Kanban card ${card.id} already migrated, skipping...`);
        continue;
      }

      const lane = laneMap.get(card.lane_id);
      
      // Todoとリンクしている場合、そのUnifiedTaskを探す
      let linkedUnifiedId: string | undefined;
      if (card.todo_id) {
        const linkedTask = await this.unifiedRepo.findBySource('todo', card.todo_id);
        linkedUnifiedId = linkedTask?.id;
      }

      const unifiedTask: Omit<UnifiedTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: card.title,
        description: card.description,
        status: this.mapKanbanStatus(lane?.title || ''),
        priority: this.mapPriority(card.priority),
        progress: lane?.title === '完了' ? 100 : lane?.title === '進行中' ? 50 : 0,
        startDate: undefined,
        endDate: undefined,
        dueDate: card.due_date ? new Date(card.due_date) : undefined,
        assigneeId: card.assignee,
        assigneeName: card.assignee,
        reviewerId: undefined,
        reviewerName: undefined,
        parentId: undefined,
        order: card.position,
        hierarchyLevel: 0,
        tags: card.labels ? card.labels.split(',') : [],
        labels: [],
        sourceType: 'kanban',
        sourceId: card.id,
        metadata: {
          kanban: {
            laneId: card.lane_id,
            laneName: lane?.title || '',
            position: card.position,
            cardColor: card.color || undefined
          }
        }
      };

      const created = await this.unifiedRepo.create(unifiedTask);
      
      // マッピングを作成
      const mapping = await this.unifiedRepo.getMapping(created.id) || {
        unifiedId: created.id,
        todoId: card.todo_id || undefined,
        kanbanCardId: card.id
      };
      
      if (card.todo_id) {
        mapping.todoId = card.todo_id;
      }
      
      await this.unifiedRepo.setMapping(mapping);

      console.log(`Migrated Kanban card: ${card.title}`);
    }
  }

  /**
   * ガントタスクの移行
   */
  private async migrateGanttTasks(): Promise<void> {
    console.log('Migrating Gantt tasks...');
    
    // グループ情報を取得
    const groups = await this.db.execute('SELECT * FROM gantt_groups');
    const groupMap = new Map(groups.map(group => [group.id, group]));
    
    // 親タスクから順に移行
    const ganttTasks = await this.db.execute(
      'SELECT * FROM gantt_tasks ORDER BY parent_id NULLS FIRST, start_date'
    );
    
    // 親子関係のマッピング
    const ganttToUnifiedMap = new Map<string, string>();
    
    for (const gantt of ganttTasks) {
      // 既に移行済みかチェック
      const existing = await this.unifiedRepo.findBySource('gantt', gantt.id);
      if (existing) {
        console.log(`Gantt task ${gantt.id} already migrated, skipping...`);
        ganttToUnifiedMap.set(gantt.id, existing.id);
        continue;
      }

      const parentUnifiedId = gantt.parent_id ? ganttToUnifiedMap.get(gantt.parent_id) : undefined;
      const group = gantt.group_id ? groupMap.get(gantt.group_id) : undefined;
      
      // WBSタスクとリンクしている場合
      let linkedWbsUnifiedId: string | undefined;
      if (gantt.wbs_task_id) {
        const linkedTask = await this.unifiedRepo.findBySource('wbs', gantt.wbs_task_id);
        linkedWbsUnifiedId = linkedTask?.id;
      }

      // 依存関係を取得
      const dependencies = await this.db.execute(
        'SELECT * FROM gantt_dependencies WHERE target_task_id = ?',
        [gantt.id]
      );

      const unifiedTask: Omit<UnifiedTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: gantt.title,
        description: gantt.description,
        status: this.mapGanttStatus(gantt.progress),
        priority: 'medium',
        progress: gantt.progress || 0,
        startDate: new Date(gantt.start_date),
        endDate: new Date(gantt.end_date),
        dueDate: undefined,
        assigneeId: gantt.assignee,
        assigneeName: gantt.assignee,
        reviewerId: undefined,
        reviewerName: undefined,
        parentId: parentUnifiedId,
        order: 0,
        hierarchyLevel: parentUnifiedId ? 1 : 0, // 簡易的な階層レベル
        tags: gantt.category ? [gantt.category] : [],
        labels: [],
        sourceType: 'gantt',
        sourceId: gantt.id,
        metadata: {
          gantt: {
            dependencies: dependencies.map(dep => ({
              id: dep.id,
              sourceTaskId: dep.source_task_id,
              targetTaskId: dep.target_task_id,
              type: dep.type,
              lag: dep.lag || 0
            })),
            icon: gantt.icon || undefined,
            color: gantt.color || undefined,
            groupId: gantt.group_id || undefined,
            groupName: group?.name || undefined,
            isMilestone: false,
            criticalPath: false
          }
        }
      };

      const created = await this.unifiedRepo.create(unifiedTask);
      ganttToUnifiedMap.set(gantt.id, created.id);
      
      // マッピングを作成
      const mapping = await this.unifiedRepo.getMapping(created.id) || {
        unifiedId: created.id,
        wbsId: gantt.wbs_task_id || undefined,
        ganttTaskId: gantt.id
      };
      
      if (gantt.wbs_task_id) {
        mapping.wbsId = gantt.wbs_task_id;
      }
      
      await this.unifiedRepo.setMapping(mapping);

      console.log(`Migrated Gantt task: ${gantt.title}`);
    }
  }

  // ================== Helper Methods ==================

  /**
   * 優先度のマッピング
   */
  private mapPriority(priority: string | number | null): TaskPriority {
    if (typeof priority === 'string') {
      switch (priority.toLowerCase()) {
        case 'high':
        case '高':
          return 'high';
        case 'medium':
        case '中':
          return 'medium';
        case 'low':
        case '低':
          return 'low';
        case 'urgent':
        case '緊急':
          return 'urgent';
        default:
          return 'medium';
      }
    }
    
    // 数値の場合
    if (typeof priority === 'number') {
      if (priority >= 3) return 'high';
      if (priority >= 2) return 'medium';
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * WBSステータスのマッピング
   */
  private mapWbsStatus(progress: number | null): TaskStatus {
    if (!progress || progress === 0) return 'not_started';
    if (progress >= 100) return 'completed';
    return 'in_progress';
  }

  /**
   * カンバンステータスのマッピング
   */
  private mapKanbanStatus(laneName: string): TaskStatus {
    switch (laneName) {
      case 'ToDo':
      case '未着手':
        return 'not_started';
      case '進行中':
      case 'In Progress':
        return 'in_progress';
      case '完了':
      case 'Done':
        return 'completed';
      case '保留':
      case 'On Hold':
        return 'on_hold';
      default:
        return 'not_started';
    }
  }

  /**
   * ガントステータスのマッピング
   */
  private mapGanttStatus(progress: number | null): TaskStatus {
    if (!progress || progress === 0) return 'not_started';
    if (progress >= 100) return 'completed';
    return 'in_progress';
  }

  /**
   * 階層レベルの計算
   */
  private calculateHierarchyLevel(hierarchyNumber: string | null): number {
    if (!hierarchyNumber) return 0;
    return hierarchyNumber.split('.').length - 1;
  }

  /**
   * 統一タスクのクリア（開発用）
   */
  private async clearUnifiedTasks(): Promise<void> {
    console.log('Clearing existing unified tasks...');
    await this.db.execute('DELETE FROM task_history');
    await this.db.execute('DELETE FROM task_labels');
    await this.db.execute('DELETE FROM task_tags');
    await this.db.execute('DELETE FROM task_mappings');
    await this.db.execute('DELETE FROM unified_tasks');
  }
}

// スタンドアロン実行用
if (require.main === module) {
  (async () => {
    try {
      const { initDatabase } = await import('../db/database');
      const db = await initDatabase();
      
      const migrator = new UnifiedTaskMigrator(db);
      await migrator.migrateAll();
      
      // 統計情報を表示
      const stats = await db.execute(
        'SELECT source_type, COUNT(*) as count FROM unified_tasks GROUP BY source_type'
      );
      console.log('\nMigration Statistics:');
      stats.forEach((stat: any) => {
        console.log(`${stat.source_type}: ${stat.count} tasks`);
      });
      
      const total = await db.execute('SELECT COUNT(*) as total FROM unified_tasks');
      console.log(`Total unified tasks: ${total[0].total}`);
      
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  })();
}