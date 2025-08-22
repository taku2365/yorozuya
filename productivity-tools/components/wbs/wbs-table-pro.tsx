"use client";

import { useState, useRef } from "react";
import { Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WBSTask } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { WBSTaskDelete } from "./wbs-task-delete";
// import { isParentTask, getHierarchyLevel } from "@/lib/utils/wbs-hierarchy";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WBSTableProProps {
  tasks: WBSTask[];
  onTaskClick: (task: WBSTask) => void;
  onInsertTask: (afterTask: WBSTask) => void;
  // onUpdateTask: (taskId: string, data: Partial<WBSTask>) => void;
  onReorderTask?: (taskId: string, targetTaskId: string, position: "before" | "after") => void;
  onDeleteTask?: (taskId: string) => void;
}

export function WBSTablePro({
  tasks,
  onTaskClick,
  onInsertTask,
  // onUpdateTask,
  onReorderTask,
  onDeleteTask,
}: WBSTableProProps) {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);
  const draggedTaskRef = useRef<WBSTask | null>(null);

  // // 進捗率に基づく背景色を取得
  // const getProgressColor = (progress: number) => {
  //   if (progress === 0) return "bg-gray-100";
  //   if (progress === 100) return "bg-green-100";
  //   if (progress >= 50) return "bg-yellow-100";
  //   return "bg-blue-100";
  // };

  // 進捗率に基づくバーの色を取得
  const getProgressBarColor = (progress: number) => {
    if (progress === 0) return "bg-gray-400";
    if (progress === 100) return "bg-green-600";
    if (progress >= 50) return "bg-yellow-600";
    return "bg-blue-600";
  };

  // 日付フォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return dateString;
  };

  // 工数表示
  const formatWorkDays = (days?: number) => {
    if (days === undefined) return "-";
    return `${days}日`;
  };

  // // 全タスクのフラットなリストを取得
  // const getAllTasks = (taskList: WBSTask[]): WBSTask[] => {
  //   const result: WBSTask[] = [];
  //   const collectTasks = (tasks: WBSTask[]) => {
  //     tasks.forEach(task => {
  //       result.push(task);
  //       if (task.children) {
  //         collectTasks(task.children);
  //       }
  //     });
  //   };
  //   collectTasks(taskList);
  //   return result;
  // };

  // 整数番号かどうかを判定
  const isIntegerNumber = (hierarchyNumber?: string): boolean => {
    if (!hierarchyNumber) return false;
    return /^\d+$/.test(hierarchyNumber);
  };

  // 小数番号が整数番号より上に移動可能かチェック
  const canReorder = (draggedTask: WBSTask, targetTask: WBSTask, position: "before" | "after"): boolean => {
    if (!onReorderTask) return false;
    
    const draggedIsInteger = isIntegerNumber(draggedTask.hierarchy_number);
    const targetIsInteger = isIntegerNumber(targetTask.hierarchy_number);

    // 小数番号は整数番号より上に移動不可
    if (!draggedIsInteger && targetIsInteger && position === "before") {
      return false;
    }

    // 同じ親を持つタスク間でのみ移動可能
    if (draggedTask.parent_id !== targetTask.parent_id) {
      return false;
    }

    return true;
  };

  const handleDragStart = (e: React.DragEvent, task: WBSTask) => {
    setDraggedTaskId(task.id);
    draggedTaskRef.current = task;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, task: WBSTask) => {
    e.preventDefault();
    
    if (!draggedTaskRef.current || draggedTaskRef.current.id === task.id) {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position = y < rect.height / 2 ? "before" : "after";

    // 移動可能かチェック
    if (canReorder(draggedTaskRef.current, task, position)) {
      e.dataTransfer.dropEffect = "move";
      setDropTargetId(task.id);
      setDropPosition(position);
    } else {
      e.dataTransfer.dropEffect = "none";
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.target === e.currentTarget) {
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, task: WBSTask) => {
    e.preventDefault();

    if (draggedTaskRef.current && dropPosition && canReorder(draggedTaskRef.current, task, dropPosition) && onReorderTask) {
      onReorderTask(draggedTaskRef.current.id, task.id, dropPosition);
    }

    setDraggedTaskId(null);
    setDropTargetId(null);
    setDropPosition(null);
    draggedTaskRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDropTargetId(null);
    setDropPosition(null);
    draggedTaskRef.current = null;
  };

  // 子タスクがあるかチェック
  const hasChildTasks = (task: WBSTask): boolean => {
    if (task.children && task.children.length > 0) return true;
    // フラットリストから子タスクを探す
    const allTasks = getAllTasksFlat(tasks);
    return allTasks.some(t => t.parent_id === task.id);
  };

  // 全タスクのフラットなリストを取得
  const getAllTasksFlat = (taskList: WBSTask[]): WBSTask[] => {
    const result: WBSTask[] = [];
    const collectTasks = (tasks: WBSTask[]) => {
      tasks.forEach(task => {
        result.push(task);
        if (task.children) {
          collectTasks(task.children);
        }
      });
    };
    collectTasks(taskList);
    return result;
  };

  // タスクを再帰的にレンダリング
  const renderTaskRow = (task: WBSTask, level: number = 0) => {
    const rows: JSX.Element[] = [];
    const indent = level * 20;
    
    // 整数番号のタスクかどうかを判定
    const isInteger = isIntegerNumber(task.hierarchy_number);
    const hasChildren = hasChildTasks(task);

    rows.push(
      <TableRow
        key={task.id}
        className={cn(
          "cursor-pointer hover:bg-gray-50 relative group",
          // 整数番号のタスクのみ色分け
          isInteger && "bg-blue-50 hover:bg-blue-100 font-semibold",
          draggedTaskId === task.id && "opacity-50"
        )}
        draggable={!!onReorderTask}
        onDragStart={(e) => handleDragStart(e, task)}
        onDragOver={(e) => handleDragOver(e, task)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, task)}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setHoveredTaskId(task.id)}
        onMouseLeave={() => setHoveredTaskId(null)}
        onClick={() => onTaskClick(task)}
      >
        {dropTargetId === task.id && dropPosition === "before" && (
          <td colSpan={8} className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 p-0" />
        )}
        <TableCell className="font-mono text-sm w-20">
          <div className="flex items-center gap-1">
            {onReorderTask && (
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            )}
            <span>{task.hierarchy_number || "-"}</span>
          </div>
        </TableCell>
        <TableCell>
          <div style={{ paddingLeft: `${indent}px` }} className="flex items-center gap-2">
            <span className="font-medium">{task.title}</span>
            {hoveredTaskId === task.id && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertTask(task);
                }}
                title="タスクを挿入"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
        <TableCell className="w-32">{task.assignee || "-"}</TableCell>
        <TableCell className="w-28">{formatDate(task.start_date)}</TableCell>
        <TableCell className="w-28">{formatDate(task.end_date)}</TableCell>
        <TableCell className="w-20 text-right">{formatWorkDays(task.work_days)}</TableCell>
        <TableCell className="w-24">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={cn("h-2 transition-all", getProgressBarColor(task.progress))}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium">{task.progress}%</span>
          </div>
        </TableCell>
        <TableCell className="max-w-xs truncate">{task.remarks || "-"}</TableCell>
        <TableCell className="w-20">
          {onDeleteTask && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <WBSTaskDelete
                task={task}
                onDelete={onDeleteTask}
                hasChildren={hasChildren}
              />
            </div>
          )}
        </TableCell>
        {dropTargetId === task.id && dropPosition === "after" && (
          <td colSpan={8} className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 p-0" />
        )}
      </TableRow>
    );

    // 子タスクをレンダリング
    if (task.children && task.children.length > 0) {
      task.children.forEach((child) => {
        rows.push(...renderTaskRow(child, level + 1));
      });
    }

    return rows;
  };

  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="font-bold text-center w-20">No</TableHead>
            <TableHead className="font-bold">タスク名</TableHead>
            <TableHead className="font-bold w-32">担当者</TableHead>
            <TableHead className="font-bold w-28">開始日</TableHead>
            <TableHead className="font-bold w-28">終了日</TableHead>
            <TableHead className="font-bold w-20 text-right">工数</TableHead>
            <TableHead className="font-bold w-24">進捗率</TableHead>
            <TableHead className="font-bold">備考</TableHead>
            <TableHead className="font-bold w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                タスクがありません
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => renderTaskRow(task))
          )}
        </TableBody>
      </Table>
    </div>
  );
}