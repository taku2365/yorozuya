"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ListTodo, 
  GitBranch, 
  Columns3,
  Calendar,
  LayoutGrid,
  List,
  Table
} from 'lucide-react';
import { ViewType } from '@/lib/types/unified';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export type ViewMode = 'tabs' | 'dropdown' | 'grid';
export type DisplayMode = 'default' | 'compact' | 'detailed';

interface ViewOption {
  value: ViewType;
  label: string;
  icon: React.ElementType;
  description?: string;
  badge?: string;
  color?: string;
}

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  mode?: ViewMode;
  displayMode?: DisplayMode;
  showTaskCount?: boolean;
  taskCounts?: Record<ViewType, number>;
  className?: string;
}

const viewOptions: ViewOption[] = [
  {
    value: 'todo',
    label: 'ToDo',
    icon: ListTodo,
    description: 'シンプルなタスク管理',
    color: 'text-blue-600'
  },
  {
    value: 'wbs',
    label: 'WBS',
    icon: GitBranch,
    description: '階層的なタスク分解',
    color: 'text-green-600'
  },
  {
    value: 'kanban',
    label: 'カンバン',
    icon: Columns3,
    description: 'ビジュアルなワークフロー',
    color: 'text-purple-600'
  },
  {
    value: 'gantt',
    label: 'ガント',
    icon: Calendar,
    description: 'タイムラインビュー',
    color: 'text-orange-600'
  }
];

/**
 * ビュー切り替えコンポーネント
 * タブ、ドロップダウン、グリッドの3つのモードをサポート
 */
export function ViewSwitcher({
  currentView,
  onViewChange,
  mode = 'tabs',
  displayMode = 'default',
  showTaskCount = false,
  taskCounts = {},
  className
}: ViewSwitcherProps) {
  // タブモード
  if (mode === 'tabs') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {viewOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.value;
          const taskCount = taskCounts[option.value];

          return (
            <Button
              key={option.value}
              variant={isActive ? 'default' : 'ghost'}
              size={displayMode === 'compact' ? 'sm' : 'default'}
              onClick={() => onViewChange(option.value)}
              className={cn(
                "relative transition-all",
                isActive && option.color
              )}
            >
              <Icon className={cn(
                "h-4 w-4",
                displayMode !== 'compact' && "mr-2"
              )} />
              {displayMode !== 'compact' && (
                <span>{option.label}</span>
              )}
              {showTaskCount && taskCount !== undefined && taskCount > 0 && (
                <Badge 
                  variant={isActive ? 'secondary' : 'outline'} 
                  className="ml-2 h-5 px-1 text-xs"
                >
                  {taskCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  // ドロップダウンモード
  if (mode === 'dropdown') {
    const currentOption = viewOptions.find(opt => opt.value === currentView);
    const CurrentIcon = currentOption?.icon || LayoutGrid;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={cn("w-[200px] justify-between", className)}
          >
            <span className="flex items-center">
              <CurrentIcon className="mr-2 h-4 w-4" />
              {currentOption?.label}
            </span>
            {showTaskCount && taskCounts[currentView] !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {taskCounts[currentView]}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          <DropdownMenuLabel>ビューを選択</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {viewOptions.map((option) => {
            const Icon = option.icon;
            const taskCount = taskCounts[option.value];

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onViewChange(option.value)}
                className={cn(
                  "cursor-pointer",
                  currentView === option.value && "bg-accent"
                )}
              >
                <Icon className={cn("mr-2 h-4 w-4", option.color)} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {showTaskCount && taskCount !== undefined && taskCount > 0 && (
                      <Badge variant="outline" className="ml-2 h-5 px-1 text-xs">
                        {taskCount}
                      </Badge>
                    )}
                  </div>
                  {displayMode === 'detailed' && option.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // グリッドモード
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {viewOptions.map((option) => {
        const Icon = option.icon;
        const isActive = currentView === option.value;
        const taskCount = taskCounts[option.value];

        return (
          <button
            key={option.value}
            onClick={() => onViewChange(option.value)}
            className={cn(
              "relative p-6 rounded-lg border-2 transition-all",
              "hover:shadow-md hover:border-primary/50",
              isActive ? "border-primary bg-primary/5" : "border-border",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <div className="flex flex-col items-center text-center">
              <Icon className={cn("h-8 w-8 mb-2", option.color)} />
              <h3 className="font-semibold">{option.label}</h3>
              {option.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              )}
              {showTaskCount && taskCount !== undefined && taskCount > 0 && (
                <Badge 
                  variant={isActive ? 'default' : 'secondary'} 
                  className="mt-2"
                >
                  {taskCount} タスク
                </Badge>
              )}
            </div>
            {isActive && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="text-xs">
                  現在
                </Badge>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * ミニビュースイッチャー（モバイル向け）
 */
export function MiniViewSwitcher({
  currentView,
  onViewChange,
  className
}: Pick<ViewSwitcherProps, 'currentView' | 'onViewChange' | 'className'>) {
  const iconMap: Record<ViewType, React.ElementType> = {
    todo: List,
    wbs: GitBranch,
    kanban: Table,
    gantt: Calendar
  };

  const CurrentIcon = iconMap[currentView];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={className}
        >
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(iconMap).map(([view, Icon]) => (
          <DropdownMenuItem
            key={view}
            onClick={() => onViewChange(view as ViewType)}
            className={cn(
              "cursor-pointer",
              currentView === view && "bg-accent"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {viewOptions.find(opt => opt.value === view)?.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}