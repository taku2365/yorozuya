"use client";

import { useState, useRef } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WBSTask } from "@/lib/db/types";

interface WBSTaskReorderProps {
  tasks: WBSTask[];
  onReorder: (draggedTaskId: string, targetTaskId: string, position: "before" | "after") => void;
}

export function WBSTaskReorder({
  tasks,
  onReorder,
}: WBSTaskReorderProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);
  const draggedTaskRef = useRef<WBSTask | null>(null);

  // 整数番号かどうかを判定
  const isIntegerNumber = (hierarchyNumber?: string): boolean => {
    if (!hierarchyNumber) return false;
    return /^\d+$/.test(hierarchyNumber);
  };

  // 小数番号が整数番号より上に移動可能かチェック
  const canReorder = (draggedTask: WBSTask, targetTask: WBSTask, position: "before" | "after"): boolean => {
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

    const rect = (e.target as HTMLElement).getBoundingClientRect();
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

    if (draggedTaskRef.current && dropPosition && canReorder(draggedTaskRef.current, task, dropPosition)) {
      onReorder(draggedTaskRef.current.id, task.id, dropPosition);
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

  return (
    <div className="wbs-task-reorder">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "relative",
            draggedTaskId === task.id && "opacity-50"
          )}
        >
          {dropTargetId === task.id && dropPosition === "before" && (
            <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500" />
          )}
          
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, task)}
            onDragOver={(e) => handleDragOver(e, task)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, task)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 p-2 hover:bg-gray-50 cursor-move",
              isIntegerNumber(task.hierarchy_number) && "font-semibold bg-blue-50"
            )}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="font-mono text-sm">{task.hierarchy_number}</span>
            <span>{task.title}</span>
          </div>

          {dropTargetId === task.id && dropPosition === "after" && (
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </div>
      ))}
    </div>
  );
}