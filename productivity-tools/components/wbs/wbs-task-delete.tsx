"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { WBSTask } from "@/lib/db/types";

interface WBSTaskDeleteProps {
  task: WBSTask;
  onDelete: (taskId: string) => void;
  hasChildren?: boolean;
}

export function WBSTaskDelete({
  task,
  onDelete,
  hasChildren = false,
}: WBSTaskDeleteProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 整数番号かどうかを判定
  const isIntegerNumber = (hierarchyNumber?: string): boolean => {
    if (!hierarchyNumber) return false;
    return /^\d+$/.test(hierarchyNumber);
  };

  const handleDelete = () => {
    onDelete(task.id);
    setIsOpen(false);
  };

  const isInteger = isIntegerNumber(task.hierarchy_number);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="タスクを削除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>タスクを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold">{task.hierarchy_number} {task.title}</span> を削除します。
            {isInteger && hasChildren && (
              <span className="block mt-2 text-red-600">
                注意: このタスクは整数番号であり、子タスク（小数番号）も一緒に削除されます。
              </span>
            )}
            <span className="block mt-2">この操作は取り消せません。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}