"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, TreePine, Table } from "lucide-react";
import { useWBSStore } from "@/lib/stores/wbs-store";
import { WBSTreeEnhanced } from "./wbs-tree-enhanced";
import { WBSTablePro } from "./wbs-table-pro";
import { WBSTaskFormPro } from "./wbs-task-form-pro";
import type { WBSTask } from "@/lib/db/types";
import type { CreateWBSTaskDto } from "@/lib/repositories/wbs-repository";
import { TooltipProvider } from "@/components/ui/tooltip";

export function WBSPagePro() {
  const { 
    tasks, 
    isLoading, 
    error, 
    fetchTasks,
    createTask,
    updateTask,
    insertTaskAfter,
    recalculateHierarchyNumbers,
    reorderTask,
    deleteTask,
  } = useWBSStore();
  
  const [selectedTask, setSelectedTask] = useState<WBSTask | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [parentTask, setParentTask] = useState<WBSTask | null>(null);
  const [insertAfterTask, setInsertAfterTask] = useState<WBSTask | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "table">("table");

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    // 階層番号の再計算が必要な場合
    if (tasks.length > 0 && !tasks[0].hierarchy_number) {
      recalculateHierarchyNumbers();
    }
  }, [tasks, recalculateHierarchyNumbers]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-600">エラー: {error}</div>
      </div>
    );
  }

  const handleCreate = async (data: CreateWBSTaskDto) => {
    if (insertAfterTask) {
      // タスク間に挿入
      await insertTaskAfter(insertAfterTask.id, data);
      setInsertAfterTask(null);
    } else {
      // 通常の作成
      await createTask(data);
    }
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

  const handleInsertTask = (afterTask: WBSTask) => {
    setInsertAfterTask(afterTask);
    setIsCreateOpen(true);
  };

  // const handleCreateSubTask = (parent: WBSTask) => {
  //   setParentTask(parent);
  //   setIsCreateOpen(true);
  // };

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
    <TooltipProvider>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">WBS（作業分解構造）- プロフェッショナル</h1>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新規タスク作成
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tree" | "table")}>
          <TabsList className="mb-4">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              テーブルビュー
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              ツリービュー
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-0">
            <WBSTablePro
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onInsertTask={handleInsertTask}
              // onUpdateTask={updateTask}
              onReorderTask={reorderTask}
              onDeleteTask={deleteTask}
            />
          </TabsContent>

          <TabsContent value="tree" className="mt-0">
            <WBSTreeEnhanced 
              tasks={tasks} 
              onTaskClick={handleTaskClick}
              showTaskNumbers={true}
              colorByStatus={true}
            />
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {insertAfterTask
                  ? `タスクを挿入（${insertAfterTask.title}の後）`
                  : parentTask
                  ? `子タスクを作成（親: ${parentTask.title}）`
                  : "新規タスク作成"}
              </DialogTitle>
            </DialogHeader>
            <WBSTaskFormPro
              parentTask={parentTask}
              isInsertMode={!!insertAfterTask}
              onSubmit={handleCreate}
              onCancel={() => {
                setIsCreateOpen(false);
                setParentTask(null);
                setInsertAfterTask(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>タスクを編集</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <WBSTaskFormPro
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
    </TooltipProvider>
  );
}