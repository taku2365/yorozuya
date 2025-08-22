"use client";

import { TodoItem } from "./todo-item";
import { Loader2 } from "lucide-react";
import type { Todo } from "@/lib/db/types";
import type { TodoFilter } from "@/lib/repositories/todo-repository";
import { useTodoStore } from "@/lib/stores/todo-store";

interface TodoListProps {
  todos: Todo[];
  filter?: TodoFilter;
  isLoading?: boolean;
  onTodoClick: (todo: Todo) => void;
}


export function TodoList({ todos, filter, isLoading, onTodoClick }: TodoListProps) {
  const { toggleTodoComplete } = useTodoStore();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">ToDoを読み込んでいます...</p>
      </div>
    );
  }

  // Apply filter
  const filteredTodos = filter
    ? todos.filter((todo) => {
        if (filter.completed !== undefined && todo.completed !== filter.completed) {
          return false;
        }
        if (filter.priority && todo.priority !== filter.priority) {
          return false;
        }
        return true;
      })
    : todos;

  if (filteredTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="text-6xl">📝</div>
        <p className="text-gray-500">
          {filter ? "条件に一致するToDoがありません" : "ToDoがありません"}
        </p>
        {filter && (
          <p className="text-sm text-gray-400">
            フィルターを変更するか、新しいToDoを作成してください
          </p>
        )}
      </div>
    );
  }


  return (
    <div className="space-y-2" role="list">
      {filteredTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={toggleTodoComplete}
          onClick={onTodoClick}
        />
      ))}
    </div>
  );
}