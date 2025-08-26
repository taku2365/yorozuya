import type { WBSTask } from '@/lib/types';
import type { UnifiedTask, TaskStatus } from '@/lib/types/unified-task';
import { BaseAdapter } from './base-adapter';

export class WBSAdapter extends BaseAdapter<WBSTask> {
  /**
   * WBSTaskをUnifiedTaskに変換
   */
  toUnifiedTask(wbsTask: WBSTask): UnifiedTask {
    this.validateWBSTask(wbsTask);
    
    return {
      id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: wbsTask.title,
      description: wbsTask.description,
      status: this.mapWBSStatusToUnified(wbsTask.status),
      priority: 'medium', // WBSには優先度がないのでデフォルト値
      progress: wbsTask.progress,
      views: ['wbs'],
      metadata: this.createMetadata(wbsTask),
      parentId: wbsTask.parentId,
      order: wbsTask.order,
      assigneeId: wbsTask.assignee,
      startDate: wbsTask.startDate ? new Date(wbsTask.startDate) : undefined,
      endDate: wbsTask.endDate ? new Date(wbsTask.endDate) : undefined,
      dueDate: wbsTask.dueDate ? new Date(wbsTask.dueDate) : undefined,
      createdAt: wbsTask.createdAt ? new Date(wbsTask.createdAt) : new Date(),
      updatedAt: wbsTask.updatedAt ? new Date(wbsTask.updatedAt) : new Date(),
    };
  }

  /**
   * UnifiedTaskをWBSTaskに変換
   */
  fromUnifiedTask(unifiedTask: UnifiedTask): WBSTask {
    const originalId = unifiedTask.metadata.wbs?.originalId;
    const wbsId = originalId || `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: wbsId,
      title: unifiedTask.title,
      description: unifiedTask.description,
      status: this.mapUnifiedStatusToWBS(unifiedTask.status),
      progress: unifiedTask.progress || 0,
      parentId: unifiedTask.parentId || null,
      order: unifiedTask.order || 0,
      hierarchyNumber: unifiedTask.metadata.wbs?.hierarchyNumber || '',
      estimatedHours: unifiedTask.metadata.wbs?.estimatedHours,
      actualHours: unifiedTask.metadata.wbs?.actualHours,
      assignee: unifiedTask.assigneeId,
      reviewer: undefined, // UnifiedTaskには含まれない
      startDate: unifiedTask.startDate ? this.formatDate(unifiedTask.startDate) : undefined,
      endDate: unifiedTask.endDate ? this.formatDate(unifiedTask.endDate) : undefined,
      dueDate: unifiedTask.dueDate ? this.formatDate(unifiedTask.dueDate) : undefined,
      workDays: unifiedTask.metadata.wbs?.workDays,
      remarks: unifiedTask.metadata.wbs?.remarks,
      createdAt: unifiedTask.createdAt ? unifiedTask.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: unifiedTask.updatedAt ? unifiedTask.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * UnifiedTaskがWBSTaskに変換可能かチェック
   */
  canConvert(unifiedTask: UnifiedTask): boolean {
    return unifiedTask.views.includes('wbs');
  }

  /**
   * WBSTaskのメタデータを作成
   */
  createMetadata(wbsTask: WBSTask): Record<string, any> {
    return {
      wbs: {
        originalId: wbsTask.id,
        hierarchyNumber: wbsTask.hierarchyNumber,
        estimatedHours: wbsTask.estimatedHours,
        actualHours: wbsTask.actualHours,
        workDays: wbsTask.workDays,
        remarks: wbsTask.remarks,
      },
    };
  }

  /**
   * WBSTaskの検証
   */
  validateWBSTask(wbsTask: WBSTask): void {
    if (!wbsTask.title || wbsTask.title.trim() === '') {
      throw new Error('タイトルは必須です');
    }
    
    if (wbsTask.progress < 0 || wbsTask.progress > 100) {
      throw new Error('進捗率は0〜100の間で指定してください');
    }
  }

  /**
   * WBSのステータスをUnifiedTaskのステータスにマッピング
   */
  private mapWBSStatusToUnified(status: WBSTask['status']): TaskStatus {
    const statusMap: Record<WBSTask['status'], TaskStatus> = {
      'not_started': 'todo',
      'in_progress': 'in_progress',
      'working': 'in_progress',
      'completed': 'done',
    };
    
    return statusMap[status] || 'todo';
  }

  /**
   * UnifiedTaskのステータスをWBSのステータスにマッピング
   */
  private mapUnifiedStatusToWBS(status: TaskStatus): WBSTask['status'] {
    const statusMap: Record<TaskStatus, WBSTask['status']> = {
      'todo': 'not_started',
      'in_progress': 'in_progress',
      'done': 'completed',
      'cancelled': 'not_started',
    };
    
    return statusMap[status] || 'not_started';
  }

  /**
   * 日付をYYYY-MM-DD形式にフォーマット
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}