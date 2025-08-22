"use client";

import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Todo } from "@/lib/db/types";

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onClick: (todo: Todo) => void;
}

const priorityConfig = {
  high: { 
    label: "高", 
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800"
  },
  medium: { 
    label: "中", 
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800"
  },
  low: { 
    label: "低", 
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
};

export function TodoItem({ todo, onToggleComplete, onClick }: TodoItemProps) {
  const isOverdue = todo.due_date && 
    !todo.completed && 
    isBefore(new Date(todo.due_date), startOfDay(new Date()));

  const isDueSoon = todo.due_date && 
    !todo.completed && 
    !isOverdue &&
    isBefore(new Date(todo.due_date), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return "今日";
    if (daysDiff === 1) return "明日";
    if (daysDiff === -1) return "昨日";
    if (daysDiff > 0 && daysDiff <= 7) return `${daysDiff}日後`;
    
    return format(date, "yyyy年MM月dd日", { locale: ja });
  };

  const getDueDateStatus = () => {
    if (!todo.due_date) return null;
    
    if (isOverdue) {
      return {
        icon: AlertTriangle,
        className: "text-red-600 dark:text-red-400",
        tooltip: "期限切れ",
      };
    }
    
    if (isDueSoon) {
      return {
        icon: Clock,
        className: "text-orange-600 dark:text-orange-400",
        tooltip: "期限が近づいています",
      };
    }
    
    return {
      icon: Calendar,
      className: "text-gray-500 dark:text-gray-400",
      tooltip: "期限",
    };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      data-testid="todo-item"
      className={cn(
        "group relative p-4 border rounded-lg transition-all duration-200",
        "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600",
        todo.completed && "bg-gray-50 dark:bg-gray-900/50",
        isOverdue && "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20",
        isDueSoon && !isOverdue && "border-orange-200 dark:border-orange-900",
        !isOverdue && !isDueSoon && priorityConfig[todo.priority].borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggleComplete(todo.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5"
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        
        <div 
          className="flex-1 cursor-pointer min-w-0"
          onClick={() => onClick(todo)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-medium leading-tight",
                  todo.completed && "line-through text-gray-500 dark:text-gray-500"
                )}
              >
                {todo.title}
              </h3>
              
              {todo.description && (
                <p 
                  className={cn(
                    "text-sm mt-1 text-gray-600 dark:text-gray-400",
                    todo.completed && "text-gray-400 dark:text-gray-600"
                  )}
                >
                  {todo.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                {todo.due_date && dueDateStatus && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn("flex items-center gap-1 text-sm", dueDateStatus.className)}>
                          <dueDateStatus.icon className="w-3.5 h-3.5" />
                          <span>{formatDueDate(todo.due_date)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dueDateStatus.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {todo.completed && todo.completed_at && (
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    完了: {format(new Date(todo.completed_at), "yyyy/MM/dd HH:mm")}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  priorityConfig[todo.priority].className
                )}
              >
                {priorityConfig[todo.priority].label}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual indicator for overdue/due soon */}
      {(isOverdue || isDueSoon) && (
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
            isOverdue ? "bg-red-500" : "bg-orange-500"
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}