import { v4 as uuidv4 } from 'uuid';
import { Database } from '../db/database';
import {
  UnifiedTask,
  UnifiedTaskFilter,
  UnifiedTaskSort,
  TaskMapping,
  BulkTaskOperation,
  TaskHistory,
  UnifiedTaskEvent,
  TaskStatus,
  TaskPriority,
  ViewType,
  Label,
  TaskMetadata
} from '../types/unified';

/**
 * 統一タスクリポジトリ
 * すべてのビューで共通のタスク管理を行う
 */
export class UnifiedTaskRepository {
  constructor(private db: Database) {}

  /**
   * タスクの作成
   */
  async create(
    task: Omit<UnifiedTask, 'id' | 'createdAt' | 'updatedAt'>,
    userId = 'system'
  ): Promise<UnifiedTask> {
    const id = uuidv4();
    const now = new Date();
    
    const newTask: UnifiedTask = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.execute(
      `INSERT INTO unified_tasks (
        id, title, description, status, priority, progress,
        created_at, updated_at, start_date, end_date, due_date,
        assignee_id, assignee_name, reviewer_id, reviewer_name,
        parent_id, task_order, hierarchy_level,
        source_type, source_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTask.id,
        newTask.title,
        newTask.description || null,
        newTask.status,
        newTask.priority,
        newTask.progress,
        newTask.createdAt.toISOString(),
        newTask.updatedAt.toISOString(),
        newTask.startDate?.toISOString() || null,
        newTask.endDate?.toISOString() || null,
        newTask.dueDate?.toISOString() || null,
        newTask.assigneeId || null,
        newTask.assigneeName || null,
        newTask.reviewerId || null,
        newTask.reviewerName || null,
        newTask.parentId || null,
        newTask.order,
        newTask.hierarchyLevel,
        newTask.sourceType,
        newTask.sourceId,
        JSON.stringify(newTask.metadata)
      ]
    );

    // タグの保存
    for (const tag of newTask.tags) {
      await this.addTag(newTask.id, tag);
    }

    // ラベルの保存
    for (const label of newTask.labels) {
      await this.addLabel(newTask.id, label);
    }

    // 履歴の記録
    await this.recordHistory(newTask.id, userId, 'created', {});

    // イベントの発行
    await this.emitEvent({
      type: 'created',
      taskId: newTask.id,
      task: newTask,
      userId,
      timestamp: now,
      source: newTask.sourceType
    });

    return newTask;
  }

  /**
   * タスクの更新
   */
  async update(
    id: string,
    updates: Partial<UnifiedTask>,
    userId = 'system'
  ): Promise<UnifiedTask> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }

    const updatedTask: UnifiedTask = {
      ...existing,
      ...updates,
      id: existing.id, // IDは変更不可
      createdAt: existing.createdAt, // 作成日時は変更不可
      updatedAt: new Date()
    };

    // SQLクエリの構築
    const fields = [
      'title', 'description', 'status', 'priority', 'progress',
      'updated_at', 'start_date', 'end_date', 'due_date',
      'assignee_id', 'assignee_name', 'reviewer_id', 'reviewer_name',
      'parent_id', 'task_order', 'hierarchy_level', 'metadata'
    ];

    const values = [
      updatedTask.title,
      updatedTask.description || null,
      updatedTask.status,
      updatedTask.priority,
      updatedTask.progress,
      updatedTask.updatedAt.toISOString(),
      updatedTask.startDate?.toISOString() || null,
      updatedTask.endDate?.toISOString() || null,
      updatedTask.dueDate?.toISOString() || null,
      updatedTask.assigneeId || null,
      updatedTask.assigneeName || null,
      updatedTask.reviewerId || null,
      updatedTask.reviewerName || null,
      updatedTask.parentId || null,
      updatedTask.order,
      updatedTask.hierarchyLevel,
      JSON.stringify(updatedTask.metadata),
      id
    ];

    await this.db.execute(
      `UPDATE unified_tasks SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
      values
    );

    // タグの更新
    if (updates.tags) {
      await this.updateTags(id, updates.tags);
    }

    // ラベルの更新
    if (updates.labels) {
      await this.updateLabels(id, updates.labels);
    }

    // 変更履歴の記録
    const changes: Record<string, { old: any; new: any }> = {};
    for (const key of Object.keys(updates)) {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        changes[key] = {
          old: (existing as any)[key],
          new: (updatedTask as any)[key]
        };
      }
    }
    await this.recordHistory(id, userId, 'updated', changes);

    // イベントの発行
    await this.emitEvent({
      type: 'updated',
      taskId: id,
      task: updatedTask,
      previousData: existing,
      userId,
      timestamp: updatedTask.updatedAt,
      source: updatedTask.sourceType
    });

    return updatedTask;
  }

  /**
   * タスクの削除
   */
  async delete(id: string, userId = 'system'): Promise<void> {
    const task = await this.findById(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    // 子タスクも削除（カスケード削除）
    await this.db.execute('DELETE FROM unified_tasks WHERE id = ?', [id]);

    // イベントの発行
    await this.emitEvent({
      type: 'deleted',
      taskId: id,
      previousData: task,
      userId,
      timestamp: new Date(),
      source: task.sourceType
    });
  }

  /**
   * IDでタスクを検索
   */
  async findById(id: string): Promise<UnifiedTask | null> {
    const results = await this.db.execute(
      'SELECT * FROM unified_tasks WHERE id = ?',
      [id]
    );

    if (results.length === 0) {
      return null;
    }

    return this.rowToTask(results[0]);
  }

  /**
   * フィルタ条件でタスクを検索
   */
  async find(
    filter?: UnifiedTaskFilter,
    sort?: UnifiedTaskSort,
    limit?: number,
    offset?: number
  ): Promise<UnifiedTask[]> {
    let query = 'SELECT * FROM unified_tasks WHERE 1=1';
    const params: any[] = [];

    // フィルタ条件の構築
    if (filter) {
      if (filter.status && filter.status.length > 0) {
        query += ` AND status IN (${filter.status.map(() => '?').join(',')})`;
        params.push(...filter.status);
      }

      if (filter.priority && filter.priority.length > 0) {
        query += ` AND priority IN (${filter.priority.map(() => '?').join(',')})`;
        params.push(...filter.priority);
      }

      if (filter.assigneeIds && filter.assigneeIds.length > 0) {
        query += ` AND assignee_id IN (${filter.assigneeIds.map(() => '?').join(',')})`;
        params.push(...filter.assigneeIds);
      }

      if (filter.viewTypes && filter.viewTypes.length > 0) {
        query += ` AND source_type IN (${filter.viewTypes.map(() => '?').join(',')})`;
        params.push(...filter.viewTypes);
      }

      if (filter.parentId !== undefined) {
        if (filter.parentId === null) {
          query += ' AND parent_id IS NULL';
        } else {
          query += ' AND parent_id = ?';
          params.push(filter.parentId);
        }
      }

      if (filter.dateRange) {
        const { field, from, to } = filter.dateRange;
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (from) {
          query += ` AND ${dbField} >= ?`;
          params.push(from.toISOString());
        }
        if (to) {
          query += ` AND ${dbField} <= ?`;
          params.push(to.toISOString());
        }
      }

      if (filter.searchText) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filter.searchText}%`;
        params.push(searchPattern, searchPattern);
      }
    }

    // ソート条件
    if (sort) {
      if (sort.field === 'customOrder') {
        query += ' ORDER BY task_order ' + sort.direction.toUpperCase();
      } else {
        const dbField = sort.field.replace(/([A-Z])/g, '_$1').toLowerCase();
        query += ` ORDER BY ${dbField} ${sort.direction.toUpperCase()}`;
      }
    } else {
      query += ' ORDER BY task_order ASC';
    }

    // ページネーション
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    if (offset) {
      query += ' OFFSET ?';
      params.push(offset);
    }

    const results = await this.db.execute(query, params);
    return Promise.all(results.map(row => this.rowToTask(row)));
  }

  /**
   * ソースタイプとIDでタスクを検索
   */
  async findBySource(sourceType: ViewType, sourceId: string): Promise<UnifiedTask | null> {
    const results = await this.db.execute(
      'SELECT * FROM unified_tasks WHERE source_type = ? AND source_id = ?',
      [sourceType, sourceId]
    );

    if (results.length === 0) {
      return null;
    }

    return this.rowToTask(results[0]);
  }

  /**
   * タスクマッピングの取得
   */
  async getMapping(unifiedId: string): Promise<TaskMapping | null> {
    const results = await this.db.execute(
      'SELECT * FROM task_mappings WHERE unified_id = ?',
      [unifiedId]
    );

    if (results.length === 0) {
      return null;
    }

    return {
      unifiedId: results[0].unified_id,
      todoId: results[0].todo_id,
      wbsId: results[0].wbs_id,
      kanbanCardId: results[0].kanban_card_id,
      ganttTaskId: results[0].gantt_task_id
    };
  }

  /**
   * タスクマッピングの作成/更新
   */
  async setMapping(mapping: TaskMapping): Promise<void> {
    await this.db.execute(
      `INSERT OR REPLACE INTO task_mappings 
       (unified_id, todo_id, wbs_id, kanban_card_id, gantt_task_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        mapping.unifiedId,
        mapping.todoId || null,
        mapping.wbsId || null,
        mapping.kanbanCardId || null,
        mapping.ganttTaskId || null
      ]
    );
  }

  /**
   * 一括操作の実行
   */
  async bulkOperation(operation: BulkTaskOperation, userId = 'system'): Promise<void> {
    const { taskIds } = operation;

    switch (operation.operation.type) {
      case 'updateStatus':
        for (const taskId of taskIds) {
          await this.update(taskId, { status: operation.operation.status }, userId);
        }
        break;

      case 'updatePriority':
        for (const taskId of taskIds) {
          await this.update(taskId, { priority: operation.operation.priority }, userId);
        }
        break;

      case 'updateAssignee':
        for (const taskId of taskIds) {
          await this.update(taskId, { assigneeId: operation.operation.assigneeId }, userId);
        }
        break;

      case 'addTags':
        for (const taskId of taskIds) {
          const task = await this.findById(taskId);
          if (task) {
            const newTags = [...new Set([...task.tags, ...operation.operation.tags])];
            await this.update(taskId, { tags: newTags }, userId);
          }
        }
        break;

      case 'removeTags':
        for (const taskId of taskIds) {
          const task = await this.findById(taskId);
          if (task) {
            const newTags = task.tags.filter(tag => !operation.operation.tags.includes(tag));
            await this.update(taskId, { tags: newTags }, userId);
          }
        }
        break;

      case 'move':
        for (const taskId of taskIds) {
          await this.update(taskId, { parentId: operation.operation.parentId }, userId);
        }
        break;

      case 'delete':
        for (const taskId of taskIds) {
          await this.delete(taskId, userId);
        }
        break;
    }
  }

  /**
   * タスク履歴の取得
   */
  async getHistory(taskId: string, limit = 50): Promise<TaskHistory[]> {
    const results = await this.db.execute(
      'SELECT * FROM task_history WHERE task_id = ? ORDER BY timestamp DESC LIMIT ?',
      [taskId, limit]
    );

    return results.map(row => ({
      id: row.id,
      taskId: row.task_id,
      timestamp: new Date(row.timestamp),
      userId: row.user_id,
      userName: row.user_name,
      action: row.action,
      changes: JSON.parse(row.changes)
    }));
  }

  // ================== Private Helper Methods ==================

  /**
   * データベース行をタスクオブジェクトに変換
   */
  private async rowToTask(row: any): Promise<UnifiedTask> {
    // タグの取得
    const tagResults = await this.db.execute(
      'SELECT tag FROM task_tags WHERE task_id = ?',
      [row.id]
    );
    const tags = tagResults.map(r => r.tag);

    // ラベルの取得
    const labelResults = await this.db.execute(
      'SELECT label_id, label_name, label_color FROM task_labels WHERE task_id = ?',
      [row.id]
    );
    const labels: Label[] = labelResults.map(r => ({
      id: r.label_id,
      name: r.label_name,
      color: r.label_color
    }));

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as TaskStatus,
      priority: row.priority as TaskPriority,
      progress: row.progress,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      assigneeId: row.assignee_id,
      assigneeName: row.assignee_name,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer_name,
      parentId: row.parent_id,
      order: row.task_order,
      hierarchyLevel: row.hierarchy_level,
      tags,
      labels,
      sourceType: row.source_type as ViewType,
      sourceId: row.source_id,
      metadata: JSON.parse(row.metadata) as TaskMetadata
    };
  }

  /**
   * タグの追加
   */
  private async addTag(taskId: string, tag: string): Promise<void> {
    await this.db.execute(
      'INSERT OR IGNORE INTO task_tags (id, task_id, tag) VALUES (?, ?, ?)',
      [uuidv4(), taskId, tag]
    );
  }

  /**
   * ラベルの追加
   */
  private async addLabel(taskId: string, label: Label): Promise<void> {
    await this.db.execute(
      'INSERT OR IGNORE INTO task_labels (id, task_id, label_id, label_name, label_color) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), taskId, label.id, label.name, label.color]
    );
  }

  /**
   * タグの更新
   */
  private async updateTags(taskId: string, tags: string[]): Promise<void> {
    // 既存のタグを削除
    await this.db.execute('DELETE FROM task_tags WHERE task_id = ?', [taskId]);
    
    // 新しいタグを追加
    for (const tag of tags) {
      await this.addTag(taskId, tag);
    }
  }

  /**
   * ラベルの更新
   */
  private async updateLabels(taskId: string, labels: Label[]): Promise<void> {
    // 既存のラベルを削除
    await this.db.execute('DELETE FROM task_labels WHERE task_id = ?', [taskId]);
    
    // 新しいラベルを追加
    for (const label of labels) {
      await this.addLabel(taskId, label);
    }
  }

  /**
   * 履歴の記録
   */
  private async recordHistory(
    taskId: string,
    userId: string,
    action: string,
    changes: Record<string, { old: any; new: any }>
  ): Promise<void> {
    await this.db.execute(
      `INSERT INTO task_history (id, task_id, timestamp, user_id, user_name, action, changes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        taskId,
        new Date().toISOString(),
        userId,
        userId, // TODO: ユーザー名の解決
        action,
        JSON.stringify(changes)
      ]
    );
  }

  /**
   * イベントの発行
   */
  private async emitEvent(event: UnifiedTaskEvent): Promise<void> {
    // TODO: イベントシステムの実装
    // 現在は何もしない（将来的にEventEmitterやWebSocketsで実装）
    console.log('Task event:', event);
  }
}