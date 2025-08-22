"use client";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
import type { TodoFilter as TodoFilterType } from "@/lib/repositories/todo-repository";

interface TodoFilterProps {
  filter: TodoFilterType | null;
  onFilterChange: (filter: TodoFilterType | null) => void;
  onSortChange?: (sort: string) => void;
  sortBy?: string | null;
  sortOrder?: "asc" | "desc";
}

export function TodoFilter({ filter, onFilterChange, onSortChange, sortBy, sortOrder }: TodoFilterProps) {
  const getActiveFilterValue = () => {
    if (!filter) return "all";
    if (filter.overdue) return "overdue";
    if (filter.completed === false) return "incomplete";
    if (filter.completed === true) return "completed";
    if (filter.priority) return `priority-${filter.priority}`;
    return "all";
  };

  const handleFilterChange = (value: string) => {
    if (value === "all") {
      onFilterChange(null);
    } else if (value === "incomplete") {
      onFilterChange({ completed: false });
    } else if (value === "completed") {
      onFilterChange({ completed: true });
    } else if (value === "overdue") {
      onFilterChange({ overdue: true });
    }
  };

  const handlePriorityFilter = (priority: "low" | "medium" | "high") => {
    if (filter?.priority === priority) {
      onFilterChange(null);
    } else {
      onFilterChange({ priority });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <ToggleGroup
        type="single"
        value={getActiveFilterValue()}
        onValueChange={handleFilterChange}
      >
        <ToggleGroupItem value="all">すべて</ToggleGroupItem>
        <ToggleGroupItem value="incomplete">未完了</ToggleGroupItem>
        <ToggleGroupItem value="completed">完了済み</ToggleGroupItem>
        <ToggleGroupItem value="overdue">期限切れ</ToggleGroupItem>
      </ToggleGroup>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={filter?.priority ? "default" : "outline"} 
            size="sm"
          >
            優先度
            {filter?.priority && (
              <span className="ml-1">
                ({filter.priority === "high" ? "高" : filter.priority === "medium" ? "中" : "低"})
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem 
            onClick={() => handlePriorityFilter("high")}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            高 {filter?.priority === "high" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handlePriorityFilter("medium")}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            中 {filter?.priority === "medium" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handlePriorityFilter("low")}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            低 {filter?.priority === "low" && "✓"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {onSortChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={sortBy ? "default" : "outline"} 
              size="sm"
            >
              並び替え
              {sortBy && (
                <span className="ml-1">
                  ({sortBy === "created_at" ? "作成日" : sortBy === "due_date" ? "期限日" : "優先度"})
                  {sortOrder === "desc" ? " ↓" : " ↑"}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onSortChange("created_at")}>
              作成日 {sortBy === "created_at" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("due_date")}>
              期限日 {sortBy === "due_date" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("priority")}>
              優先度 {sortBy === "priority" && "✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {filter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(null)}
          className="ml-auto"
        >
          <X className="w-4 h-4 mr-1" />
          フィルターをクリア
        </Button>
      )}
    </div>
  );
}