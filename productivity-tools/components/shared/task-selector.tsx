"use client";

import React, { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check } from 'lucide-react';
import type { Todo } from '@/lib/db/types';

interface TaskSelectorProps {
  tasks: Todo[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function TaskSelector({ tasks, selectedIds, onSelectionChange }: TaskSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // タスクのフィルタリング
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // 選択状態の管理
  const isAllSelected = filteredTasks.length > 0 && 
    filteredTasks.every(task => selectedIds.includes(task.id));
  const isPartiallySelected = filteredTasks.some(task => selectedIds.includes(task.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      // フィルタされたタスクの選択を解除
      const filteredIds = filteredTasks.map(t => t.id);
      onSelectionChange(selectedIds.filter(id => !filteredIds.includes(id)));
    } else {
      // フィルタされたタスクを選択に追加
      const newSelection = [...new Set([...selectedIds, ...filteredTasks.map(t => t.id)])];
      onSelectionChange(newSelection);
    }
  };

  const handleSelectTask = (taskId: string) => {
    if (selectedIds.includes(taskId)) {
      onSelectionChange(selectedIds.filter(id => id !== taskId));
    } else {
      onSelectionChange([...selectedIds, taskId]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">タスクを選択</h3>
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.length}件選択中
            </span>
          )}
        </div>
        
        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="タスクを検索..."
            className="pl-9"
          />
        </div>
      </div>

      {/* すべて選択 */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center space-x-3 pb-2 border-b">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            aria-label="すべて選択"
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            {...(isPartiallySelected && { 'data-state': 'indeterminate' })}
          />
          <span className="text-sm font-medium">すべて選択</span>
        </div>
      )}

      {/* タスクリスト */}
      <ScrollArea className="h-[300px]">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'タスクが見つかりません' : 'タスクがありません'}
          </div>
        ) : (
          <div className="space-y-2 pr-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                data-testid="task-item"
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                  selectedIds.includes(task.id) ? 'bg-muted/30' : ''
                }`}
              >
                <Checkbox
                  checked={selectedIds.includes(task.id)}
                  onCheckedChange={() => handleSelectTask(task.id)}
                  aria-label={`${task.title}を選択`}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.completed && (
                      <Badge variant="secondary" className="h-5 px-1.5">
                        <Check className="h-3 w-3 mr-1" />
                        完了
                      </Badge>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        期限: {new Date(task.due_date).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}