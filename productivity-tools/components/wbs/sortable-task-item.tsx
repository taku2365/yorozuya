"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { WBSTask } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  task: WBSTask;
  level: number;
  onTaskClick: (task: WBSTask) => void;
}

export function SortableTaskItem({ task, level, onTaskClick }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 hover:bg-gray-50 rounded",
        isDragging && "opacity-50",
        level > 0 && "ml-6"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onTaskClick(task)}
      >
        {task.title}
      </div>
    </div>
  );
}