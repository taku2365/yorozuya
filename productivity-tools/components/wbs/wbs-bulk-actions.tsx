"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  CheckSquare, 
  Square,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface WBSBulkActionsProps {
  taskCount: number;
  selectedCount: number;
  expandedState: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onResetProgress: () => void;
  className?: string;
}

export function WBSBulkActions({
  taskCount,
  selectedCount,
  expandedState,
  onExpandAll,
  onCollapseAll,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onResetProgress,
  className,
}: WBSBulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleDeleteClick = () => {
    if (selectedCount > 0) {
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = () => {
    onDeleteSelected();
    setShowDeleteDialog(false);
  };

  const handleResetClick = () => {
    if (selectedCount > 0) {
      setShowResetDialog(true);
    }
  };

  const handleResetConfirm = () => {
    onResetProgress();
    setShowResetDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          "bg-gray-50 rounded-lg p-3 flex items-center justify-between",
          className
        )}
        data-testid="wbs-bulk-actions"
      >
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {selectedCount > 0 ? (
              <span>{selectedCount}個のタスクを選択中</span>
            ) : (
              <span>全{taskCount}タスク</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={selectedCount === taskCount ? onDeselectAll : onSelectAll}
            >
              {selectedCount === taskCount ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  すべて解除
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  すべて選択
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand/Collapse Actions */}
          <div className="flex gap-1 mr-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onExpandAll}
              disabled={expandedState}
              aria-label="すべて展開"
              title="すべてのタスクを展開"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCollapseAll}
              disabled={!expandedState}
              aria-label="すべて折りたたむ"
              title="すべてのタスクを折りたたむ"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Actions */}
          {selectedCount > 0 && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetClick}
                className="text-orange-600 hover:text-orange-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                進捗リセット
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                選択を削除
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>選択したタスクを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount}個のタスクとその子タスクが削除されます。
              この操作は元に戻すことができません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Progress Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>進捗をリセットしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              選択した{selectedCount}個のタスクの進捗率が0%にリセットされます。
              実績時間も0にリセットされます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-orange-600 hover:bg-orange-700"
            >
              リセットする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}