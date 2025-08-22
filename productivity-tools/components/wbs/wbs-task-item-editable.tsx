"use client";

import { useState } from "react";
import { Edit2, Save, X, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WBSTask } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface WBSTaskItemEditableProps {
  task: WBSTask;
  level: number;
  onUpdate: (taskId: string, updates: Partial<WBSTask>) => void;
  onDelete: (taskId: string) => void;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
}

export function WBSTaskItemEditable({
  task,
  level,
  onUpdate,
  onDelete,
  onToggleExpand,
  isExpanded = true,
  hasChildren = false,
}: WBSTaskItemEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedEstimatedHours, setEditedEstimatedHours] = useState(
    task.estimated_hours?.toString() || ""
  );
  const [editedActualHours, setEditedActualHours] = useState(
    task.actual_hours?.toString() || ""
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSave = () => {
    onUpdate(task.id, {
      title: editedTitle,
      estimated_hours: editedEstimatedHours ? Number(editedEstimatedHours) : undefined,
      actual_hours: editedActualHours ? Number(editedActualHours) : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(task.title);
    setEditedEstimatedHours(task.estimated_hours?.toString() || "");
    setEditedActualHours(task.actual_hours?.toString() || "");
    setIsEditing(false);
  };

  const handleProgressChange = (value: number[]) => {
    onUpdate(task.id, { progress: value[0] });
  };

  const handleDelete = () => {
    onDelete(task.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        data-testid="wbs-task-item"
        className={cn(
          "group flex items-center gap-2 p-2 hover:bg-gray-50 rounded",
          level > 0 && `ml-${level * 6}`
        )}
      >
        {hasChildren && onToggleExpand && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}

        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Input
                type="number"
                value={editedEstimatedHours}
                onChange={(e) => setEditedEstimatedHours(e.target.value)}
                placeholder="見積"
                className="w-20"
              />
              <Input
                type="number"
                value={editedActualHours}
                onChange={(e) => setEditedActualHours(e.target.value)}
                placeholder="実績"
                className="w-20"
              />
              <Button size="sm" onClick={handleSave} aria-label="保存">
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                aria-label="キャンセル"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="flex-1 font-medium">{task.title}</span>
              
              {(task.estimated_hours || task.actual_hours) && (
                <div className="text-sm text-gray-500">
                  {task.actual_hours && <span>{task.actual_hours}h</span>}
                  {task.estimated_hours && task.actual_hours && " / "}
                  {task.estimated_hours && <span>{task.estimated_hours}h</span>}
                </div>
              )}

              <div className="flex items-center gap-2 w-48">
                <span className="sr-only" id="progress-label">進捗率</span>
                <Slider
                  value={[task.progress]}
                  onValueChange={handleProgressChange}
                  max={100}
                  step={5}
                  className="flex-1"
                  aria-labelledby="progress-label"
                />
                <span className="text-sm text-gray-600 w-12 text-right">
                  {task.progress}%
                </span>
              </div>

              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  aria-label="編集"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(true)}
                  aria-label="削除"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タスクを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このタスクを削除すると、元に戻すことはできません。
              {hasChildren && "子タスクも同時に削除されます。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}