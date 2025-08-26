import type { Todo } from '@/lib/types';
import type { UnifiedTask, TaskStatus, TaskPriority } from '@/lib/types/unified-task';
import { BaseAdapter } from './base-adapter';

export class TodoAdapter extends BaseAdapter<Todo> {
  /**
   * TodoをUnifiedTaskに変換
   */
  toUnifiedTask(todo: Todo): UnifiedTask {
    this.validateTodo(todo);
    
    return {
      id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: todo.title,
      description: todo.description,
      status: this.mapCompletedToStatus(todo.completed),
      priority: this.mapPriority(todo.priority),
      views: ['todo'],
      metadata: this.createMetadata(todo),
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date(),
      updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : new Date(),
    };
  }

  /**
   * UnifiedTaskをTodoに変換
   */
  fromUnifiedTask(unifiedTask: UnifiedTask): Todo {
    const originalId = unifiedTask.metadata.todo?.originalId;
    const todoId = originalId || `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: todoId,
      title: unifiedTask.title,
      description: unifiedTask.description,
      completed: unifiedTask.status === 'done',
      priority: unifiedTask.priority as Todo['priority'],
      dueDate: unifiedTask.dueDate ? this.formatDate(unifiedTask.dueDate) : undefined,
      createdAt: unifiedTask.createdAt.toISOString(),
      updatedAt: unifiedTask.updatedAt.toISOString(),
    };
  }

  /**
   * UnifiedTaskがTodoに変換可能かチェック
   */
  canConvert(unifiedTask: UnifiedTask): boolean {
    return unifiedTask.views.includes('todo');
  }

  /**
   * Todoのメタデータを作成
   */
  createMetadata(todo: Todo): Record<string, any> {
    return {
      todo: {
        originalId: todo.id,
        completed: todo.completed,
      },
    };
  }

  /**
   * Todoの検証
   */
  validateTodo(todo: Todo): void {
    if (!todo.title || todo.title.trim() === '') {
      throw new Error('タイトルは必須です');
    }
  }

  /**
   * 完了状態をステータスにマッピング
   */
  private mapCompletedToStatus(completed: boolean): TaskStatus {
    return completed ? 'done' : 'todo';
  }

  /**
   * 優先度をマッピング（デフォルト値の処理を含む）
   */
  private mapPriority(priority?: Todo['priority']): TaskPriority {
    if (!priority) return 'medium';
    
    const priorityMap: Record<string, TaskPriority> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
    };
    
    return priorityMap[priority] || 'medium';
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