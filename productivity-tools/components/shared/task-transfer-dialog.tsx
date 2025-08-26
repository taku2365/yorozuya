"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TaskSelector } from './task-selector';
import { ArrowRight, Info } from 'lucide-react';
import type { Todo, WBSTask, KanbanCard } from '@/lib/db/types';

type TaskType = Todo | WBSTask | KanbanCard;
type ViewType = 'todo' | 'wbs' | 'kanban' | 'gantt';

interface TaskTransferDialogProps {
  isOpen: boolean;
  tasks: TaskType[];
  sourceView: ViewType;
  onTransfer: (params: {
    taskIds: string[];
    targetViews: ViewType[];
    syncEnabled: boolean;
  }) => void;
  onClose: () => void;
}

interface ViewOption {
  id: ViewType;
  label: string;
  description: string;
}

const viewOptions: ViewOption[] = [
  { id: 'todo', label: 'ToDo', description: 'シンプルなタスク管理' },
  { id: 'wbs', label: 'WBS', description: '階層的な作業分解' },
  { id: 'kanban', label: 'カンバン', description: 'ステータスベースの管理' },
  { id: 'gantt', label: 'ガント', description: 'タイムライン管理' },
];

export function TaskTransferDialog({
  isOpen,
  tasks,
  sourceView,
  onTransfer,
  onClose,
}: TaskTransferDialogProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedViews, setSelectedViews] = useState<ViewType[]>([]);
  const [syncEnabled, setSyncEnabled] = useState(true);

  // ToDoタスクとして扱うためのアダプター関数
  const adaptTasksToTodo = (tasks: TaskType[]): Todo[] => {
    return tasks.map(task => {
      if ('title' in task && 'completed' in task) {
        // すでにTodo型
        return task as Todo;
      } else if ('name' in task) {
        // WBSタスク
        const wbsTask = task as WBSTask;
        return {
          id: wbsTask.id,
          title: wbsTask.name,
          description: wbsTask.description || '',
          completed: wbsTask.status === 'completed',
          priority: 'medium' as const,
          due_date: wbsTask.end_date || null,
          tags: [],
          created_at: wbsTask.created_at,
          updated_at: wbsTask.updated_at,
        };
      } else {
        // カンバンカード
        const card = task as KanbanCard;
        return {
          id: card.id,
          title: card.title,
          description: card.description || '',
          completed: false,
          priority: card.priority || 'medium',
          due_date: card.dueDate,
          tags: card.tags || [],
          created_at: card.created_at,
          updated_at: card.updated_at,
        };
      }
    });
  };

  // 転送可能なビューオプション（現在のビューを除く）
  const availableViews = viewOptions.filter(view => view.id !== sourceView);

  const handleViewToggle = (viewId: ViewType) => {
    setSelectedViews(prev =>
      prev.includes(viewId)
        ? prev.filter(v => v !== viewId)
        : [...prev, viewId]
    );
  };

  const handleTransfer = () => {
    onTransfer({
      taskIds: selectedTaskIds,
      targetViews: selectedViews,
      syncEnabled,
    });
    onClose();
  };

  const isTransferDisabled = selectedTaskIds.length === 0 || selectedViews.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>タスクを他のビューへ移動</DialogTitle>
          <DialogDescription>
            選択したタスクを他のビューにコピーまたは移動します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-6">
          {/* タスク選択 */}
          <div>
            <TaskSelector
              tasks={adaptTasksToTodo(tasks)}
              selectedIds={selectedTaskIds}
              onSelectionChange={setSelectedTaskIds}
            />
          </div>

          <Separator />

          {/* 転送先ビュー選択 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">転送先を選択</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {availableViews.map(view => (
                <label
                  key={view.id}
                  className={`
                    flex items-start space-x-3 p-3 rounded-lg border cursor-pointer
                    transition-colors hover:bg-muted/50
                    ${selectedViews.includes(view.id) ? 'bg-muted/30 border-primary' : ''}
                  `}
                >
                  <Checkbox
                    checked={selectedViews.includes(view.id)}
                    onCheckedChange={() => handleViewToggle(view.id)}
                    aria-label={view.label}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <span className="font-medium text-sm">{view.label}</span>
                    <p className="text-xs text-muted-foreground">
                      {view.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* 同期設定 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sync-toggle" className="text-sm font-medium">
                  自動同期を有効にする
                </Label>
                <p className="text-xs text-muted-foreground">
                  進捗や完了状態が自動的に同期されます
                </p>
              </div>
              <Switch
                id="sync-toggle"
                checked={syncEnabled}
                onCheckedChange={setSyncEnabled}
                aria-label="自動同期を有効にする"
              />
            </div>

            {syncEnabled && (
              <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">同期について</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>ToDoの完了状態 → WBSの進捗100%、カンバンの完了レーン</li>
                    <li>WBSの進捗更新 → 他のビューの状態に反映</li>
                    <li>カンバンのレーン移動 → 進捗や完了状態に反映</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={isTransferDisabled}
            className="gap-2"
          >
            転送
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}