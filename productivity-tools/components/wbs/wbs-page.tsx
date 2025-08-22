"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useWBSStore } from "@/lib/stores/wbs-store";
import { WBSTreeEnhanced } from "./wbs-tree-enhanced";
import { WBSTaskFormEnhanced } from "./wbs-task-form-enhanced";
import type { WBSTask } from "@/lib/db/types";
import type { CreateWBSTaskDto } from "@/lib/repositories/wbs-repository";

export function WBSPage() {
  const { 
    tasks, 
    isLoading, 
    error, 
    fetchTasks,
    createTask,
    updateTask,
  } = useWBSStore();
  
  const [selectedTask, setSelectedTask] = useState<WBSTask | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [parentTask, setParentTask] = useState<WBSTask | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-600">エラー: {error}</div>
      </div>
    );
  }

  const handleCreate = async (data: CreateWBSTaskDto) => {
    await createTask(data);
    setIsCreateOpen(false);
    setParentTask(null);
  };

  const handleUpdate = async (data: Partial<WBSTask>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, data);
      setIsEditOpen(false);
      setSelectedTask(null);
    }
  };

  const handleTaskClick = (task: WBSTask) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  const handleCreateSubTask = (parent: WBSTask) => {
    setParentTask(parent);
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          タスクを読み込んでいます...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">WBS（作業分解構造）</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規タスク作成
        </Button>
      </div>

      <div className="space-y-4">
        <WBSTreeEnhanced 
          tasks={tasks} 
          onTaskClick={handleTaskClick}
          showTaskNumbers={true}
          colorByStatus={true}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentTask ? `子タスクを作成（親: ${parentTask.title}）` : "新規タスク作成"}
            </DialogTitle>
          </DialogHeader>
          <WBSTaskFormEnhanced
            parentTask={parentTask}
            onSubmit={handleCreate}
            onCancel={() => {
              setIsCreateOpen(false);
              setParentTask(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タスクを編集</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <WBSTaskFormEnhanced
              task={selectedTask}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditOpen(false);
                setSelectedTask(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}