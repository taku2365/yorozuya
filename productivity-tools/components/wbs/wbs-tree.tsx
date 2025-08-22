"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import type { WBSTask } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WBSTreeProps {
  tasks: WBSTask[];
  onTaskClick: (task: WBSTask) => void;
}

interface WBSTreeItemProps {
  task: WBSTask;
  level: number;
  onTaskClick: (task: WBSTask) => void;
}

function WBSTreeItem({ task, level, onTaskClick }: WBSTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = task.children && task.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer",
          level > 0 && "ml-6"
        )}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={`${isExpanded ? "collapse" : "expand"} ${task.title}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}

        <div
          className="flex-1 flex items-center gap-4"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex-1">
            <div className="font-medium">{task.title}</div>
            {task.assignee && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <User className="h-3 w-3" />
                {task.assignee}
              </div>
            )}
          </div>

          {(task.estimated_hours || task.actual_hours) && (
            <div className="text-sm text-gray-500">
              {task.actual_hours && <span>{task.actual_hours}h</span>}
              {task.estimated_hours && task.actual_hours && " / "}
              {task.estimated_hours && <span>{task.estimated_hours}h</span>}
            </div>
          )}

          <div className="flex items-center gap-2 w-32">
            <Progress value={task.progress} className="h-2" />
            <span className="text-sm text-gray-600 w-12 text-right">
              {task.progress}%
            </span>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {task.children!.map((child) => (
            <WBSTreeItem
              key={child.id}
              task={child}
              level={level + 1}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WBSTree({ tasks, onTaskClick }: WBSTreeProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        タスクがありません
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <WBSTreeItem
          key={task.id}
          task={task}
          level={0}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}