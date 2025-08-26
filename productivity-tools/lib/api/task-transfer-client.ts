import { TaskTransferService } from '@/lib/services/task-transfer-service';
import { useTodoStore } from '@/lib/stores/todo-store';
import { useWBSStore } from '@/lib/stores/wbs-store';
import { useKanbanStore } from '@/lib/stores/kanban-store';
import { useGanttStore } from '@/lib/stores/gantt-store';

interface TransferResult {
  success: boolean;
  transferred: Array<{
    taskId: string;
    targetView: 'todo' | 'wbs' | 'kanban' | 'gantt';
    newId: string;
  }>;
  errors: string[];
}

type ViewType = 'todo' | 'wbs' | 'kanban' | 'gantt';

/**
 * クライアントサイドでタスク転送を処理するクラス
 * SQLite WASMデータベースとZustandストアを使用して、
 * ブラウザ内で完結する転送処理を実装
 */
export class TaskTransferClient {
  private transferService: TaskTransferService;

  constructor() {
    this.transferService = new TaskTransferService();
  }

  /**
   * タスクを他のビューに転送
   * クライアントサイドのデータベースで処理し、Zustandストアを更新
   */
  async transferTasks(params: {
    sourceView: ViewType;
    taskIds: string[];
    targetViews: ViewType[];
    syncEnabled: boolean;
  }): Promise<TransferResult> {
    console.log('[TaskTransferClient] transferTasks called with:', params);
    try {
      // TaskTransferServiceを使用してデータベースレベルで転送
      const result = await this.transferService.transferTasks(params);
      console.log('[TaskTransferClient] transferTasks result:', result);

      // 転送が成功した場合、各ビューのZustandストアを更新
      if (result.success && result.transferred.length > 0) {
        await this.updateStoresAfterTransfer(params.sourceView, result.transferred);
      }

      return result;
    } catch (error) {
      console.error('Task transfer error:', error);
      throw new Error(error instanceof Error ? error.message : 'タスク転送に失敗しました');
    }
  }

  /**
   * タスクの変更を他のビューに同期
   * クライアントサイドで処理し、関連するストアを更新
   */
  async syncTask(viewType: string, taskId: string): Promise<void> {
    try {
      // 同期前の状態を取得
      const linkedTasks = await this.transferService.getLinkedTasks(
        viewType as ViewType,
        taskId
      );

      // データベースレベルで同期
      await this.transferService.syncTask(viewType as ViewType, taskId);

      // 同期後、影響を受けたビューのストアを更新
      for (const linked of linkedTasks) {
        if (linked.syncEnabled) {
          await this.refreshStore(linked.viewType);
        }
      }
    } catch (error) {
      console.error('Task sync error:', error);
      throw new Error(error instanceof Error ? error.message : 'タスク同期に失敗しました');
    }
  }

  /**
   * 同期の有効/無効を切り替え
   */
  async toggleSync(viewType: string, taskId: string, enabled: boolean): Promise<void> {
    try {
      await this.transferService.toggleSync(viewType as ViewType, taskId, enabled);
    } catch (error) {
      console.error('Toggle sync error:', error);
      throw new Error(error instanceof Error ? error.message : '同期設定の変更に失敗しました');
    }
  }

  /**
   * リンクされたタスクの情報を取得
   */
  async getLinkedTasks(viewType: ViewType, taskId: string) {
    return this.transferService.getLinkedTasks(viewType, taskId);
  }

  /**
   * 転送後に各ビューのストアを更新
   */
  private async updateStoresAfterTransfer(
    sourceView: ViewType,
    transferred: Array<{ taskId: string; targetView: ViewType; newId: string }>
  ): Promise<void> {
    // 影響を受けたビューのセット
    const affectedViews = new Set<ViewType>([sourceView]);
    transferred.forEach(t => affectedViews.add(t.targetView));

    // 各ビューのストアを更新
    for (const view of affectedViews) {
      await this.refreshStore(view);
    }
  }

  /**
   * 指定されたビューのストアを更新
   */
  private async refreshStore(viewType: ViewType): Promise<void> {
    switch (viewType) {
      case 'todo':
        await useTodoStore.getState().fetchTodos();
        break;
      case 'wbs':
        await useWBSStore.getState().fetchTasks();
        break;
      case 'kanban':
        await useKanbanStore.getState().fetchLanes();
        await useKanbanStore.getState().fetchCards();
        break;
      case 'gantt':
        await useGanttStore.getState().fetchTasks();
        break;
    }
  }
}

// シングルトンインスタンス
let clientInstance: TaskTransferClient | null = null;

/**
 * TaskTransferClientのシングルトンインスタンスを取得
 */
export function getTaskTransferClient(): TaskTransferClient {
  if (!clientInstance) {
    clientInstance = new TaskTransferClient();
  }
  return clientInstance;
}