"use client";

import { useEffect, useState } from "react";
import { TodoList } from "./todo-list";
import { TodoForm } from "./todo-form";
import { TodoFilter } from "./todo-filter";
import { TodoSearch } from "./todo-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTodoStore } from "@/lib/stores/todo-store";
import type { Todo } from "@/lib/db/types";
import type { CreateTodoDto, TodoFilter as TodoFilterType } from "@/lib/repositories/todo-repository";

export function TodoPage() {
  const {
    todos,
    isLoading,
    error,
    filter,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    setFilter,
    searchTodos,
    getFilteredTodos,
  } = useTodoStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleCreate = async (data: CreateTodoDto) => {
    await createTodo(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: CreateTodoDto) => {
    if (editingTodo) {
      await updateTodo(editingTodo.id, data);
      setEditingTodo(null);
    }
  };

  const handleDelete = async () => {
    if (todoToDelete) {
      await deleteTodo(todoToDelete.id);
      setTodoToDelete(null);
      setIsDeleteOpen(false);
      setEditingTodo(null);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    setEditingTodo(todo);
  };

  const handleDeleteClick = (todo: Todo) => {
    setTodoToDelete(todo);
    setIsDeleteOpen(true);
  };

  const handleSearch = (keyword: string) => {
    if (keyword) {
      searchTodos(keyword);
    } else {
      fetchTodos();
    }
  };

  const handleFilterChange = (newFilter: TodoFilterType | null) => {
    setFilter(newFilter);
    fetchTodos();
  };

  const handleSortChange = (newSort: string) => {
    if (sortBy === newSort) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSort);
      setSortOrder("asc");
    }
  };

  // Get filtered and sorted todos
  const displayTodos = getFilteredTodos();
  const sortedTodos = sortBy
    ? [...displayTodos].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "due_date":
            comparison = (a.due_date || "").localeCompare(b.due_date || "");
            break;
          case "priority":
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
          case "created_at":
            comparison = a.created_at.localeCompare(b.created_at);
            break;
          default:
            return 0;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      })
    : displayTodos;

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-600">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ToDo管理</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          新規ToDo作成
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <TodoSearch onSearch={handleSearch} />
        <TodoFilter 
          filter={filter} 
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </div>

      <TodoList 
        todos={sortedTodos} 
        isLoading={isLoading}
        onTodoClick={handleTodoClick} 
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規ToDo作成</DialogTitle>
            <DialogDescription>
              新しいToDoを作成します。必要な情報を入力してください。
            </DialogDescription>
          </DialogHeader>
          <TodoForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ToDo編集</DialogTitle>
            <DialogDescription>
              ToDoの内容を編集します。
            </DialogDescription>
          </DialogHeader>
          {editingTodo && (
            <>
              <TodoForm
                todo={editingTodo}
                onSubmit={handleUpdate}
                onCancel={() => setEditingTodo(null)}
              />
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteClick(editingTodo)}
                  className="w-full"
                >
                  削除
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ToDoの削除</DialogTitle>
            <DialogDescription>
              このToDoを削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}