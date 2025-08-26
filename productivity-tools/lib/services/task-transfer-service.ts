import { TaskLinkRepository } from '@/lib/repositories/task-link-repository';
import { TodoRepository } from '@/lib/repositories/todo-repository';
import { WBSRepository } from '@/lib/repositories/wbs-repository';
import { KanbanRepository } from '@/lib/repositories/kanban-repository';
import { GanttRepository } from '@/lib/repositories/gantt-repository';
import { getDatabase } from '@/lib/db/singleton';
import { TodoAdapter } from '@/lib/adapters/todo-adapter';
import { WBSAdapter } from '@/lib/adapters/wbs-adapter';
import { KanbanAdapter } from '@/lib/adapters/kanban-adapter';
import { GanttAdapter } from '@/lib/adapters/gantt-adapter';
import type { TaskLink } from '@/lib/db/types/task-link';
import type { Todo, WBSTask, KanbanCard, GanttTask } from '@/lib/db/types';

type ViewType = 'todo' | 'wbs' | 'kanban' | 'gantt';

interface TransferResult {
  success: boolean;
  transferred: Array<{
    taskId: string;
    targetView: ViewType;
    newId: string;
  }>;
  errors: string[];
}

export class TaskTransferService {
  private linkRepo: TaskLinkRepository | null = null;
  private todoRepo: TodoRepository | null = null;
  private wbsRepo: WBSRepository | null = null;
  private kanbanRepo: KanbanRepository | null = null;
  private ganttRepo: GanttRepository | null = null;
  
  private todoAdapter = new TodoAdapter();
  private wbsAdapter = new WBSAdapter();
  private kanbanAdapter = new KanbanAdapter();
  private ganttAdapter = new GanttAdapter();

  private async initRepositories() {
    if (!this.todoRepo) {
      const db = await getDatabase();
      this.linkRepo = new TaskLinkRepository();
      this.todoRepo = new TodoRepository(db);
      this.wbsRepo = new WBSRepository(db);
      this.kanbanRepo = new KanbanRepository(db);
      this.ganttRepo = new GanttRepository(db);
    }
  }

  /**
   * タスクを他のビューに転送
   */
  async transferTasks(params: {
    sourceView: ViewType;
    taskIds: string[];
    targetViews: ViewType[];
    syncEnabled: boolean;
  }): Promise<TransferResult> {
    console.log('[TaskTransferService] transferTasks called with:', params);
    await this.initRepositories();
    const { sourceView, taskIds, targetViews, syncEnabled } = params;
    const result: TransferResult = {
      success: true,
      transferred: [],
      errors: [],
    };

    for (const taskId of taskIds) {
      try {
        console.log('[TaskTransferService] Processing task:', taskId);
        // 既存のリンクをチェック
        if (!this.linkRepo) throw new Error('LinkRepository not initialized');
        try {
          const existingLink = await this.linkRepo.findByViewAndOriginalId(sourceView, taskId);
          if (existingLink) {
            const task = await this.getTaskByViewAndId(sourceView, taskId);
            result.errors.push(`タスク「${task?.title || taskId}」は既に他のビューにリンクされています`);
            result.success = false;
            continue;
          }
        } catch (dbError) {
          console.error('データベースエラー:', dbError);
          // テーブルが存在しない場合も処理を継続
        }

        // ソースタスクを取得
        const sourceTask = await this.getTaskByViewAndId(sourceView, taskId);
        if (!sourceTask) {
          result.errors.push(`タスクID ${taskId} が見つかりません`);
          result.success = false;
          continue;
        }

        // 各ターゲットビューに転送
        const createdTasks: Array<{ viewType: ViewType; originalId: string }> = [];
        
        for (const targetView of targetViews) {
          const newTask = await this.createTaskInView(sourceTask, sourceView, targetView);
          if (newTask) {
            createdTasks.push({ viewType: targetView, originalId: newTask.id });
            result.transferred.push({
              taskId,
              targetView,
              newId: newTask.id,
            });
          }
        }

        // リンクグループを作成
        if (createdTasks.length > 0) {
          if (!this.linkRepo) throw new Error('LinkRepository not initialized');
          await this.linkRepo.createLinkGroup(
            { viewType: sourceView, originalId: taskId },
            createdTasks,
            syncEnabled
          );
        }
      } catch (error) {
        result.errors.push(`タスク ${taskId} の転送中にエラー: ${error}`);
        result.success = false;
      }
    }

    return result;
  }

  /**
   * タスクの変更を他のビューに同期
   */
  async syncTask(viewType: ViewType, taskId: string): Promise<void> {
    // タスクリンクを取得
    await this.initRepositories();
    if (!this.linkRepo) throw new Error('LinkRepository not initialized');
    const link = await this.linkRepo.findByViewAndOriginalId(viewType, taskId);
    if (!link) return;

    // 関連するすべてのリンクを取得
    const allLinks = await this.linkRepo!.findByUnifiedId(link.unifiedId);
    const syncEnabledLinks = allLinks.filter(l => l.syncEnabled);

    // ソースタスクを取得
    const sourceTask = await this.getTaskByViewAndId(viewType, taskId);
    if (!sourceTask) return;

    // 他のビューに同期
    for (const targetLink of syncEnabledLinks) {
      if (targetLink.viewType === viewType) continue; // 同じビューはスキップ
      
      await this.updateTaskInView(sourceTask, viewType, targetLink.viewType, targetLink.originalId);
    }

    // 最終同期時刻を更新
    const now = new Date().toISOString();
    for (const targetLink of syncEnabledLinks) {
      await this.linkRepo!.update(targetLink.id, { lastSyncedAt: now });
    }
  }

  /**
   * 同期の有効/無効を切り替え
   */
  async toggleSync(viewType: ViewType, taskId: string, enabled: boolean): Promise<void> {
    await this.initRepositories();
    if (!this.linkRepo) throw new Error('LinkRepository not initialized');
    const link = await this.linkRepo.findByViewAndOriginalId(viewType, taskId);
    if (!link) return;
    
    await this.linkRepo!.updateSyncStatus(link.unifiedId, enabled);
  }

  /**
   * リンクされたタスクの情報を取得
   */
  async getLinkedTasks(viewType: ViewType, taskId: string): Promise<Array<{
    viewType: ViewType;
    task: any;
    syncEnabled: boolean;
  }>> {
    await this.initRepositories();
    if (!this.linkRepo) throw new Error('LinkRepository not initialized');
    const link = await this.linkRepo.findByViewAndOriginalId(viewType, taskId);
    if (!link) return [];

    const allLinks = await this.linkRepo!.findByUnifiedId(link.unifiedId);
    const result = [];

    for (const targetLink of allLinks) {
      const task = await this.getTaskByViewAndId(targetLink.viewType, targetLink.originalId);
      if (task) {
        result.push({
          viewType: targetLink.viewType,
          task,
          syncEnabled: targetLink.syncEnabled,
        });
      }
    }

    return result;
  }

  /**
   * ビューとIDでタスクを取得
   */
  private async getTaskByViewAndId(viewType: ViewType, taskId: string): Promise<any> {
    switch (viewType) {
      case 'todo':
        return this.todoRepo.findById(taskId);
      case 'wbs':
        return this.wbsRepo.findById(taskId);
      case 'kanban':
        return this.kanbanRepo.findCardById(taskId);
      case 'gantt':
        return this.ganttRepo.findById(taskId);
      default:
        return null;
    }
  }

  /**
   * 新しいビューにタスクを作成
   */
  private async createTaskInView(
    sourceTask: any,
    sourceView: ViewType,
    targetView: ViewType
  ): Promise<any> {
    // アダプターを使用してタスクを変換
    const convertedTask = this.convertTask(sourceTask, sourceView, targetView);
    if (!convertedTask) return null;

    switch (targetView) {
      case 'todo':
        return this.todoRepo.create(convertedTask);
      case 'wbs':
        return this.wbsRepo.create(convertedTask);
      case 'kanban':
        // カンバンの場合、デフォルトレーンを取得
        const defaultLane = await this.kanbanRepo.findDefaultLane();
        if (!defaultLane) throw new Error('デフォルトレーンが見つかりません');
        
        // convertedTaskはKanbanCard型なので、CreateCardDto型に変換
        const createCardDto = {
          title: convertedTask.title,
          description: convertedTask.description,
          lane_id: defaultLane.id,
          position: 0,
          labels: convertedTask.labels ? JSON.stringify(convertedTask.labels) : undefined,
          todo_id: undefined,
        };
        
        return this.kanbanRepo.createCard(createCardDto);
      case 'gantt':
        return this.ganttRepo.create(convertedTask);
      default:
        return null;
    }
  }

  /**
   * 既存のタスクを更新
   */
  private async updateTaskInView(
    sourceTask: any,
    sourceView: ViewType,
    targetView: ViewType,
    targetId: string
  ): Promise<void> {
    // 同期マッピングに基づいて更新内容を決定
    const updates = this.getSyncUpdates(sourceTask, sourceView, targetView);
    if (!updates) return;

    switch (targetView) {
      case 'todo':
        await this.todoRepo.update(targetId, updates);
        break;
      case 'wbs':
        await this.wbsRepo.update(targetId, updates);
        break;
      case 'kanban':
        await this.kanbanRepo.update(targetId, updates);
        break;
      case 'gantt':
        await this.ganttRepo.update(targetId, updates);
        break;
    }
  }

  /**
   * タスクを別のビュー形式に変換
   */
  private convertTask(task: any, sourceView: ViewType, targetView: ViewType): any {
    // ソースビューに応じて統一タスクに変換
    let unifiedTask;
    switch (sourceView) {
      case 'todo':
        unifiedTask = this.todoAdapter.toUnifiedTask(task);
        break;
      case 'wbs':
        unifiedTask = this.wbsAdapter.toUnifiedTask(task);
        break;
      case 'kanban':
        unifiedTask = this.kanbanAdapter.toUnifiedTask(task);
        break;
      case 'gantt':
        unifiedTask = this.ganttAdapter.toUnifiedTask(task);
        break;
      default:
        return null;
    }

    // ターゲットビューに応じて変換
    switch (targetView) {
      case 'todo':
        return this.todoAdapter.fromUnifiedTask(unifiedTask);
      case 'wbs':
        return this.wbsAdapter.fromUnifiedTask(unifiedTask);
      case 'kanban':
        return this.kanbanAdapter.fromUnifiedTask(unifiedTask);
      case 'gantt':
        return this.ganttAdapter.fromUnifiedTask(unifiedTask);
      default:
        return null;
    }
  }

  /**
   * 同期時の更新内容を決定
   */
  private getSyncUpdates(sourceTask: any, sourceView: ViewType, targetView: ViewType): any {
    const updates: any = {};

    // 共通フィールドの同期（タイトル、説明）
    updates.title = sourceTask.title;
    if (sourceTask.description !== undefined) {
      updates.description = sourceTask.description;
    }

    // ToDoからの同期
    if (sourceView === 'todo') {
      const todo = sourceTask as Todo;
      if (targetView === 'wbs') {
        updates.progress = todo.completed ? 100 : 0;
        updates.status = todo.completed ? 'completed' : 'not_started';
        if (todo.due_date) {
          updates.due_date = todo.due_date;
        }
      } else if (targetView === 'kanban') {
        // カンバンの場合、レーン移動が必要（サービス層で別途処理）
        if (todo.due_date) {
          updates.due_date = todo.due_date;
        }
      } else if (targetView === 'gantt') {
        // ガントチャートの同期
        updates.status = todo.completed ? 'completed' : 'in_progress';
        updates.progress = todo.completed ? 100 : 0;
      }
    }
    
    // WBSからの同期
    else if (sourceView === 'wbs') {
      const wbs = sourceTask as WBSTask;
      if (targetView === 'todo') {
        updates.completed = wbs.progress === 100;
        if (wbs.due_date) {
          updates.due_date = wbs.due_date;
        }
      } else if (targetView === 'kanban') {
        // 進捗に応じたレーン移動（サービス層で別途処理）
      } else if (targetView === 'gantt') {
        updates.progress = wbs.progress;
        updates.status = wbs.status;
      }
    }

    // カンバンからの同期
    else if (sourceView === 'kanban') {
      const card = sourceTask as KanbanCard;
      if (targetView === 'todo' || targetView === 'wbs' || targetView === 'gantt') {
        if (card.due_date) {
          updates.due_date = card.due_date;
        }
      }
    }
    
    // ガントチャートからの同期
    else if (sourceView === 'gantt') {
      const gantt = sourceTask as GanttTask;
      if (targetView === 'todo') {
        updates.completed = gantt.progress === 100;
      } else if (targetView === 'wbs') {
        updates.progress = gantt.progress;
        updates.status = gantt.status;
        updates.start_date = gantt.start_date;
        updates.end_date = gantt.end_date;
      }
    }

    return Object.keys(updates).length > 0 ? updates : null;
  }
}