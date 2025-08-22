import type { WBSTask } from "../db/types";

/**
 * 挿入位置に基づいて新しいタスクの階層番号を決定する
 * @param afterTask - 挿入位置の直前のタスク
 * @param allTasks - 全タスクリスト
 * @returns 新しいタスクの階層番号と親ID
 */
export function determineInsertionHierarchy(
  afterTask: WBSTask,
  allTasks: WBSTask[]
): { hierarchyNumber: string; parentId: string | undefined } {
  const isIntegerNumber = (hierarchyNumber?: string): boolean => {
    if (!hierarchyNumber) return false;
    return /^\d+$/.test(hierarchyNumber);
  };

  // 整数番号の後に挿入する場合
  if (isIntegerNumber(afterTask.hierarchy_number)) {
    // この整数番号タスクの既存の子タスクを探す
    const existingChildren = allTasks.filter(t => t.parent_id === afterTask.id);
    
    if (existingChildren.length === 0) {
      // 子タスクがまだない場合は、最初の子タスクとして作成
      return {
        hierarchyNumber: `${afterTask.hierarchy_number}.1`,
        parentId: afterTask.id
      };
    } else {
      // 既に子タスクがある場合は、最後の子タスクの番号を取得
      const lastChild = existingChildren
        .map(child => {
          const parts = child.hierarchy_number?.split('.') || [];
          const lastPart = parts[parts.length - 1];
          return { child, lastNumber: parseInt(lastPart) || 0 };
        })
        .sort((a, b) => b.lastNumber - a.lastNumber)[0];
      
      const nextNumber = lastChild.lastNumber + 1;
      return {
        hierarchyNumber: `${afterTask.hierarchy_number}.${nextNumber}`,
        parentId: afterTask.id
      };
    }
  } else {
    // 小数番号の後に挿入する場合（同じレベルに兄弟として挿入）
    const parts = afterTask.hierarchy_number?.split('.') || [];
    if (parts.length < 2) {
      throw new Error('Invalid hierarchy number for decimal task');
    }
    
    // 親の階層番号を取得
    const parentParts = parts.slice(0, -1);
    const parentHierarchy = parentParts.join('.');
    
    // 同じ親を持つ兄弟タスクを探す
    const siblings = allTasks.filter(t => {
      const tParts = t.hierarchy_number?.split('.') || [];
      if (tParts.length !== parts.length) return false;
      
      const tParentParts = tParts.slice(0, -1);
      return tParentParts.join('.') === parentHierarchy;
    });
    
    // 最大の番号を見つける
    const maxNumber = siblings
      .map(sibling => {
        const siblingParts = sibling.hierarchy_number?.split('.') || [];
        const lastPart = siblingParts[siblingParts.length - 1];
        return parseInt(lastPart) || 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);
    
    const nextNumber = maxNumber + 1;
    return {
      hierarchyNumber: `${parentHierarchy}.${nextNumber}`,
      parentId: afterTask.parent_id
    };
  }
}

/**
 * 挿入後に影響を受けるタスクの階層番号を更新する
 * @param insertedNumber - 挿入されたタスクの階層番号
 * @param allTasks - 全タスクリスト
 * @returns 更新が必要なタスクのリスト
 */
export function getTasksToRenumber(
  insertedNumber: string,
  allTasks: WBSTask[]
): Array<{ id: string; newHierarchyNumber: string }> {
  const updates: Array<{ id: string; newHierarchyNumber: string }> = [];
  
  const parts = insertedNumber.split('.');
  const parentHierarchy = parts.slice(0, -1).join('.');
  const insertedLastNumber = parseInt(parts[parts.length - 1]);
  
  // 同じ親を持つ兄弟タスクで、挿入位置以降のものを探す
  allTasks.forEach(task => {
    if (!task.hierarchy_number) return;
    
    const taskParts = task.hierarchy_number.split('.');
    if (taskParts.length !== parts.length) return;
    
    const taskParentHierarchy = taskParts.slice(0, -1).join('.');
    if (taskParentHierarchy !== parentHierarchy) return;
    
    const taskLastNumber = parseInt(taskParts[taskParts.length - 1]);
    if (taskLastNumber >= insertedLastNumber) {
      // 番号を1つ増やす
      const newLastNumber = taskLastNumber + 1;
      const newHierarchyNumber = `${parentHierarchy}.${newLastNumber}`;
      updates.push({ id: task.id, newHierarchyNumber });
      
      // この更新により子タスクも更新が必要
      const childUpdates = updateChildrenHierarchy(
        task.hierarchy_number,
        newHierarchyNumber,
        allTasks
      );
      updates.push(...childUpdates);
    }
  });
  
  return updates;
}

/**
 * 親タスクの階層番号が変更された場合、子タスクの階層番号も更新する
 */
function updateChildrenHierarchy(
  oldParentHierarchy: string,
  newParentHierarchy: string,
  allTasks: WBSTask[]
): Array<{ id: string; newHierarchyNumber: string }> {
  const updates: Array<{ id: string; newHierarchyNumber: string }> = [];
  
  allTasks.forEach(task => {
    if (!task.hierarchy_number) return;
    
    // このタスクが変更される親の子タスクかチェック
    if (task.hierarchy_number.startsWith(oldParentHierarchy + '.')) {
      const suffix = task.hierarchy_number.substring(oldParentHierarchy.length);
      const newHierarchyNumber = newParentHierarchy + suffix;
      updates.push({ id: task.id, newHierarchyNumber });
    }
  });
  
  return updates;
}