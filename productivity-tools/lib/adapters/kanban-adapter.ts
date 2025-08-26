import type { KanbanCard } from '@/lib/types';
import type { UnifiedTask, TaskStatus, TaskPriority } from '@/lib/types/unified-task';
import { BaseAdapter } from './base-adapter';

export class KanbanAdapter extends BaseAdapter<KanbanCard> {
  /**
   * KanbanCardをUnifiedTaskに変換
   */
  toUnifiedTask(kanbanCard: KanbanCard): UnifiedTask {
    this.validateKanbanCard(kanbanCard);
    
    return {
      id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: kanbanCard.title,
      description: kanbanCard.description,
      status: this.mapLaneIdToStatus(kanbanCard.laneId),
      priority: this.inferPriorityFromLabels(kanbanCard.labels),
      views: ['kanban'],
      metadata: this.createMetadata(kanbanCard),
      assigneeId: kanbanCard.assignee,
      tags: kanbanCard.labels?.map(label => label.name) || [],
      dueDate: kanbanCard.dueDate ? new Date(kanbanCard.dueDate) : undefined,
      createdAt: kanbanCard.createdAt ? new Date(kanbanCard.createdAt) : new Date(),
      updatedAt: kanbanCard.updatedAt ? new Date(kanbanCard.updatedAt) : new Date(),
    };
  }

  /**
   * UnifiedTaskをKanbanCardに変換
   */
  fromUnifiedTask(unifiedTask: UnifiedTask): KanbanCard {
    const originalId = unifiedTask.metadata.kanban?.originalId;
    const cardId = originalId || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: cardId,
      title: unifiedTask.title,
      description: unifiedTask.description,
      laneId: unifiedTask.metadata.kanban?.laneId || this.mapStatusToLaneId(unifiedTask.status),
      position: unifiedTask.metadata.kanban?.position || 0,
      assignee: unifiedTask.assigneeId,
      labels: unifiedTask.metadata.kanban?.labels || [],
      dueDate: unifiedTask.dueDate ? this.formatDate(unifiedTask.dueDate) : undefined,
      createdAt: unifiedTask.createdAt ? unifiedTask.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: unifiedTask.updatedAt ? unifiedTask.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * UnifiedTaskがKanbanCardに変換可能かチェック
   */
  canConvert(unifiedTask: UnifiedTask): boolean {
    return unifiedTask.views.includes('kanban');
  }

  /**
   * KanbanCardのメタデータを作成
   */
  createMetadata(kanbanCard: KanbanCard): Record<string, any> {
    return {
      kanban: {
        originalId: kanbanCard.id,
        laneId: kanbanCard.laneId,
        position: kanbanCard.position,
        labels: kanbanCard.labels || [],
      },
    };
  }

  /**
   * KanbanCardの検証
   */
  validateKanbanCard(kanbanCard: KanbanCard): void {
    if (!kanbanCard.title || kanbanCard.title.trim() === '') {
      throw new Error('タイトルは必須です');
    }
    
    if (!kanbanCard.laneId || kanbanCard.laneId.trim() === '') {
      throw new Error('レーンIDは必須です');
    }
  }

  /**
   * レーンIDからステータスを推測
   */
  private mapLaneIdToStatus(laneId: string): TaskStatus {
    const lowerLaneId = laneId.toLowerCase();
    
    if (lowerLaneId.includes('done') || lowerLaneId.includes('complete')) {
      return 'done';
    }
    if (lowerLaneId.includes('progress') || lowerLaneId.includes('doing') || lowerLaneId.includes('review')) {
      return 'in_progress';
    }
    if (lowerLaneId.includes('cancel')) {
      return 'cancelled';
    }
    
    return 'todo';
  }

  /**
   * ステータスからレーンIDを推測
   */
  private mapStatusToLaneId(status: TaskStatus): string {
    const statusLaneMap: Record<TaskStatus, string> = {
      'todo': 'todo',
      'in_progress': 'in-progress',
      'done': 'done',
      'cancelled': 'cancelled',
    };
    
    return statusLaneMap[status] || 'todo';
  }

  /**
   * ラベルから優先度を推測
   */
  private inferPriorityFromLabels(labels?: KanbanCard['labels']): TaskPriority {
    if (!labels || labels.length === 0) return 'medium';
    
    const labelNames = labels.map(label => label.name.toLowerCase());
    
    if (labelNames.some(name => name.includes('urgent') || name.includes('critical'))) {
      return 'urgent';
    }
    if (labelNames.some(name => name.includes('high') || name.includes('important'))) {
      return 'high';
    }
    if (labelNames.some(name => name.includes('low'))) {
      return 'low';
    }
    
    return 'medium';
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