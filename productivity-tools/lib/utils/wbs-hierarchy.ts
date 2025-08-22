import type { WBSTask } from "../db/types";

/**
 * 階層番号を生成する
 * @param parentNumber 親タスクの階層番号（nullの場合はルートタスク）
 * @param siblingCount 同じ階層の既存タスク数
 * @returns 新しい階層番号
 */
export function generateHierarchyNumber(
  parentNumber: string | null,
  siblingCount: number
): string {
  const nextNumber = siblingCount + 1;
  
  if (!parentNumber) {
    return nextNumber.toString();
  }
  
  return `${parentNumber}.${nextNumber}`;
}

/**
 * 同じ階層の次の番号を取得する
 * @param tasks 全タスクリスト
 * @param parentId 親タスクのID（nullの場合はルートタスク）
 * @returns 次の番号
 */
export function getNextSiblingNumber(
  tasks: WBSTask[],
  parentId: string | null
): number {
  // 同じ親を持つタスクを探す
  const siblings = tasks.filter(task => {
    if (parentId === null) {
      return !task.parent_id;
    }
    return task.parent_id === parentId;
  });
  return siblings.length + 1;
}

/**
 * タスクリストの階層番号を再計算する
 * @param tasks タスクリスト
 * @returns 階層番号が更新されたタスクリスト
 */
export function recalculateHierarchyNumbers(tasks: WBSTask[]): WBSTask[] {
  const result: WBSTask[] = [];
  const taskMap = new Map<string, WBSTask>();
  
  // まずタスクをマップに格納
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task });
  });
  
  // ルートタスクから順番に処理
  const rootTasks = tasks.filter(task => !task.parent_id);
  rootTasks.sort((a, b) => a.position - b.position);
  
  let rootNumber = 1;
  rootTasks.forEach(rootTask => {
    const task = taskMap.get(rootTask.id)!;
    task.hierarchy_number = rootNumber.toString();
    result.push(task);
    
    // 子タスクを再帰的に処理
    processChildren(task, tasks, taskMap, result);
    rootNumber++;
  });
  
  return result;
}

function processChildren(
  parent: WBSTask,
  allTasks: WBSTask[],
  taskMap: Map<string, WBSTask>,
  result: WBSTask[]
) {
  const children = allTasks.filter(task => task.parent_id === parent.id);
  children.sort((a, b) => a.position - b.position);
  
  let childNumber = 1;
  children.forEach(child => {
    const task = taskMap.get(child.id)!;
    task.hierarchy_number = `${parent.hierarchy_number}.${childNumber}`;
    result.push(task);
    
    // 再帰的に子タスクを処理
    processChildren(task, allTasks, taskMap, result);
    childNumber++;
  });
}

/**
 * タスクを指定位置に挿入し、階層番号を再計算する
 * @param tasks 既存のタスクリスト
 * @param newTask 挿入する新しいタスク
 * @param afterIndex 挿入位置（この位置の後に挿入）
 * @returns 更新されたタスクリスト
 */
export function insertTaskBetween(
  tasks: WBSTask[],
  newTask: WBSTask,
  afterIndex: number
): WBSTask[] {
  const result = [...tasks];
  result.splice(afterIndex + 1, 0, newTask);
  
  // position を更新
  result.forEach((task, index) => {
    task.position = index;
  });
  
  // 階層番号を再計算
  return recalculateHierarchyNumbers(result);
}

/**
 * タスクが親タスクかどうかを判定する
 * @param task - 判定対象のタスク
 * @param allTasks - 全タスクリスト
 * @returns 親タスクの場合true
 */
export const isParentTask = (task: WBSTask, allTasks: WBSTask[]): boolean => {
  return allTasks.some(t => t.parent_id === task.id);
};

/**
 * 階層番号から階層レベルを取得する
 * @param hierarchyNumber - 階層番号（例: "1.2.3"）
 * @returns 階層レベル（例: 3）
 */
export const getHierarchyLevel = (hierarchyNumber?: string): number => {
  if (!hierarchyNumber) return 0;
  return hierarchyNumber.split('.').length;
};