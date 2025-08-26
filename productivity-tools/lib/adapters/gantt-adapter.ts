import type { GanttTask } from '@/lib/types';
import type { UnifiedTask, TaskStatus, TaskPriority } from '@/lib/types/unified-task';
import { BaseAdapter } from './base-adapter';

export class GanttAdapter extends BaseAdapter<GanttTask> {
  /**
   * GanttTaskをUnifiedTaskに変換
   */
  toUnifiedTask(ganttTask: GanttTask): UnifiedTask {
    this.validateGanttTask(ganttTask);
    
    return {
      id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: ganttTask.title,
      description: ganttTask.description,
      status: ganttTask.status as TaskStatus,
      priority: ganttTask.priority as TaskPriority,
      progress: ganttTask.progress,
      views: ['gantt'],
      metadata: this.createMetadata(ganttTask),
      parentId: ganttTask.parentId === null ? undefined : ganttTask.parentId,
      order: ganttTask.order,
      assigneeId: ganttTask.assigneeId,
      startDate: new Date(ganttTask.startDate),
      endDate: new Date(ganttTask.endDate),
      createdAt: ganttTask.createdAt ? new Date(ganttTask.createdAt) : new Date(),
      updatedAt: ganttTask.updatedAt ? new Date(ganttTask.updatedAt) : new Date(),
    };
  }

  /**
   * UnifiedTaskをGanttTaskに変換
   */
  fromUnifiedTask(unifiedTask: UnifiedTask): GanttTask {
    const originalId = unifiedTask.metadata.gantt?.originalId;
    const ganttId = originalId || `gantt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // デフォルト日付（今日）
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    // startDateの処理
    if (unifiedTask.startDate instanceof Date) {
      startDate = unifiedTask.startDate;
    } else if (unifiedTask.startDate && typeof unifiedTask.startDate === 'string') {
      startDate = new Date(unifiedTask.startDate);
    } else {
      startDate = today;
    }
    
    // endDateの処理
    if (unifiedTask.endDate instanceof Date) {
      endDate = unifiedTask.endDate;
    } else if (unifiedTask.endDate && typeof unifiedTask.endDate === 'string') {
      endDate = new Date(unifiedTask.endDate);
    } else {
      endDate = today;
    }

    return {
      id: ganttId,
      title: unifiedTask.title,
      description: unifiedTask.description,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      progress: unifiedTask.progress || 0,
      dependencies: unifiedTask.metadata.gantt?.dependencies || [],
      assigneeId: unifiedTask.assigneeId,
      assigneeName: undefined, // UnifiedTaskには含まれない
      priority: (unifiedTask.priority || 'medium') as GanttTask['priority'],
      status: (unifiedTask.status || 'not_started') as GanttTask['status'],
      parentId: unifiedTask.parentId || null,
      order: unifiedTask.order,
      icon: unifiedTask.metadata.gantt?.icon,
      color: unifiedTask.metadata.gantt?.color,
      groupId: unifiedTask.metadata.gantt?.groupId,
      groupName: unifiedTask.metadata.gantt?.groupName,
      isMilestone: unifiedTask.metadata.gantt?.isMilestone || false,
      isOnCriticalPath: unifiedTask.metadata.gantt?.criticalPath || false,
      createdAt: unifiedTask.createdAt ? unifiedTask.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: unifiedTask.updatedAt ? unifiedTask.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * UnifiedTaskがGanttTaskに変換可能かチェック
   */
  canConvert(unifiedTask: UnifiedTask): boolean {
    return unifiedTask.views.includes('gantt');
  }

  /**
   * GanttTaskのメタデータを作成
   */
  createMetadata(ganttTask: GanttTask): Record<string, any> {
    return {
      gantt: {
        originalId: ganttTask.id,
        dependencies: ganttTask.dependencies || [],
        icon: ganttTask.icon,
        color: ganttTask.color,
        groupId: ganttTask.groupId,
        groupName: ganttTask.groupName,
        isMilestone: ganttTask.isMilestone || false,
        criticalPath: ganttTask.isOnCriticalPath || false,
      },
    };
  }

  /**
   * GanttTaskの検証
   */
  validateGanttTask(ganttTask: GanttTask): void {
    if (!ganttTask.title || ganttTask.title.trim() === '') {
      throw new Error('タイトルは必須です');
    }
    
    if (new Date(ganttTask.startDate) > new Date(ganttTask.endDate)) {
      throw new Error('開始日は終了日より前である必要があります');
    }
    
    if (ganttTask.progress < 0 || ganttTask.progress > 100) {
      throw new Error('進捗率は0〜100の間で指定してください');
    }
  }

  /**
   * 日付をYYYY-MM-DD形式にフォーマット
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}