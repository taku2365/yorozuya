import { useTodoStore } from '@/lib/stores/todo-store';
import { useWBSStore } from '@/lib/stores/wbs-store';
import { useKanbanStore } from '@/lib/stores/kanban-store';
import { useGanttStore } from '@/lib/stores/gantt-store';
import type { Todo, WBSTask, KanbanCard } from '@/lib/db/types';
import type { CreateTodoDto } from '@/lib/repositories/todo-repository';
import type { CreateWBSTaskDto } from '@/lib/repositories/wbs-repository';

export async function syncTodoToWBS(todo: Todo) {
  const wbsStore = useWBSStore.getState();
  const tasks = wbsStore.tasks;
  
  // 次の階層番号を計算
  const topLevelTasks = tasks.filter(t => !t.parentId);
  const nextNumber = topLevelTasks.length + 1;
  
  // ToDoをWBSタスクに変換
  const wbsData: CreateWBSTaskDto = {
    name: todo.title,
    description: todo.description || '',
    status: todo.completed ? 'completed' : 'not_started',
    progress: todo.completed ? 100 : 0,
    parentId: null,
    order: nextNumber - 1,
    hierarchyNumber: nextNumber.toString(),
    assignee: null,
    startDate: todo.dueDate || undefined,
    endDate: todo.dueDate || undefined,
  };

  await wbsStore.createTask(wbsData);
}

export async function syncWBSToTodo(wbsTask: WBSTask) {
  const todoStore = useTodoStore.getState();
  
  // WBSタスクをToDoに変換
  const todoData: CreateTodoDto = {
    title: wbsTask.name,
    description: wbsTask.description || undefined,
    priority: 'medium',
    due_date: wbsTask.endDate || undefined,
  };

  await todoStore.createTodo(todoData);
}

export async function syncTodoToKanban(todo: Todo) {
  const kanbanStore = useKanbanStore.getState();
  const lanes = kanbanStore.lanes;
  
  // デフォルトレーン（todo）を取得
  const todoLane = lanes.find(lane => lane.id === 'todo');
  if (!todoLane) {
    throw new Error('カンバンのToDoレーンが見つかりません');
  }

  const cardData = {
    title: todo.title,
    description: todo.description || '',
    priority: todo.priority,
    dueDate: todo.dueDate || null,
    assignee: null,
    tags: [],
    labels: [],
    order: 0,
  };

  await kanbanStore.createCard(todoLane.id, cardData);
}

export async function syncKanbanToWBS(card: KanbanCard) {
  const wbsStore = useWBSStore.getState();
  
  const wbsData: CreateWBSTaskDto = {
    name: card.title,
    description: card.description || '',
    status: 'not_started',
    progress: 0,
    parentId: null,
    order: 0,
    hierarchyNumber: '',
    assignee: card.assignee || null,
    startDate: card.dueDate || undefined,
    endDate: card.dueDate || undefined,
  };

  await wbsStore.createTask(wbsData);
}

// ビュー名の日本語表示
export function getViewName(view: string): string {
  const viewNames: Record<string, string> = {
    todo: 'ToDoリスト',
    wbs: 'WBS',
    kanban: 'カンバン',
    gantt: 'ガントチャート',
  };
  return viewNames[view] || view;
}