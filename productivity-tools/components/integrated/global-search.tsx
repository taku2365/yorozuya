"use client"

import React from 'react';
import { Command } from 'cmdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search,
  ListTodo,
  GitBranch,
  Columns3,
  Calendar,
  Clock,
  User,
  Tag,
  Flag,
  ChevronRight
} from 'lucide-react';
import { UnifiedTask, ViewType, TaskStatus, TaskPriority } from '@/lib/types/unified';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface GlobalSearchProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTaskSelect?: (task: UnifiedTask) => void;
  onSearch?: (query: string) => Promise<UnifiedTask[]>;
  className?: string;
}

interface SearchGroup {
  label: string;
  icon: React.ElementType;
  items: UnifiedTask[];
}

const viewTypeIcons: Record<ViewType, React.ElementType> = {
  todo: ListTodo,
  wbs: GitBranch,
  kanban: Columns3,
  gantt: Calendar
};

const statusColors: Record<TaskStatus, string> = {
  not_started: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  on_hold: 'bg-yellow-500',
  cancelled: 'bg-red-500'
};

const statusLabels: Record<TaskStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
  on_hold: '保留',
  cancelled: 'キャンセル'
};

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
  urgent: 'text-purple-600'
};

const priorityLabels: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急'
};

/**
 * グローバル検索コンポーネント
 * Command+K (Ctrl+K) で起動する検索UI
 */
export function GlobalSearch({
  isOpen = false,
  onOpenChange,
  onTaskSelect,
  onSearch,
  className
}: GlobalSearchProps) {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<UnifiedTask[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // キーボードショートカット
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange?.(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  // 検索実行
  React.useEffect(() => {
    if (!search || !onSearch) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await onSearch(search);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, onSearch]);

  // 結果をグループ化
  const groupedResults = React.useMemo(() => {
    const groups = new Map<ViewType, UnifiedTask[]>();
    
    results.forEach(task => {
      const existing = groups.get(task.sourceType) || [];
      groups.set(task.sourceType, [...existing, task]);
    });

    return Array.from(groups.entries()).map(([viewType, tasks]): SearchGroup => ({
      label: viewType.toUpperCase(),
      icon: viewTypeIcons[viewType],
      items: tasks
    }));
  }, [results]);

  const allItems = React.useMemo(() => 
    groupedResults.flatMap(group => group.items),
    [groupedResults]
  );

  const handleSelect = (task: UnifiedTask) => {
    onTaskSelect?.(task);
    onOpenChange?.(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < allItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(allItems[selectedIndex]);
    }
  };

  return (
    <>
      {/* 検索トリガーボタン */}
      <Button
        variant="outline"
        className={cn(
          "relative w-full justify-start text-left font-normal",
          "text-muted-foreground",
          className
        )}
        onClick={() => onOpenChange?.(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="flex-1">タスクを検索...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* 検索ダイアログ */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>タスクを検索</DialogTitle>
          </DialogHeader>
          
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="タスクを検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  検索中...
                </div>
              )}
              
              {!loading && search && results.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  「{search}」に一致するタスクは見つかりませんでした
                </div>
              )}
              
              {!loading && !search && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  タスクを検索するにはキーワードを入力してください
                </div>
              )}
              
              {!loading && groupedResults.map((group, groupIndex) => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    <group.icon className="h-3 w-3" />
                    {group.label}
                  </div>
                  {group.items.map((task, itemIndex) => {
                    const globalIndex = groupedResults
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <button
                        key={task.id}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
                          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => handleSelect(task)}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          {/* ステータスインジケーター */}
                          <div className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            statusColors[task.status]
                          )} />
                          
                          {/* タスク情報 */}
                          <div className="flex-1 text-left">
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </div>
                            )}
                          </div>
                          
                          {/* メタ情報 */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {/* 優先度 */}
                            <span className={cn("font-medium", priorityColors[task.priority])}>
                              {priorityLabels[task.priority]}
                            </span>
                            
                            {/* 期限 */}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{format(task.dueDate, 'MM/dd', { locale: ja })}</span>
                              </div>
                            )}
                            
                            {/* 担当者 */}
                            {task.assigneeName && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{task.assigneeName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <ChevronRight className="ml-2 h-4 w-4 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {results.length > 0 && (
              <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                <span>{results.length} 件の結果</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border px-1">↑</kbd>
                    <kbd className="rounded border px-1">↓</kbd>
                    移動
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border px-1">Enter</kbd>
                    選択
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border px-1">Esc</kbd>
                    閉じる
                  </span>
                </div>
              </div>
            )}
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}