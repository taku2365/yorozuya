import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Todo } from "../db/types";
import type { CreateTodoDto, UpdateTodoDto, TodoFilter } from "../repositories/todo-repository";
import { TodoRepository } from "../repositories/todo-repository";
import { getDatabase } from "../db/singleton";

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  filter: TodoFilter | null;
  
  // Actions
  setTodos: (todos: Todo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: TodoFilter | null) => void;
  
  // CRUD operations
  fetchTodos: () => Promise<void>;
  createTodo: (data: CreateTodoDto) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoDto) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodoComplete: (id: string) => void;
  
  // Search and filter
  searchTodos: (keyword: string) => Promise<void>;
  getFilteredTodos: () => Todo[];
  fetchOverdueTodos: () => Promise<void>;
  
  // Utility
  reset: () => void;
}

const initialState = {
  todos: [],
  isLoading: false,
  error: null,
  filter: null,
};

export const useTodoStore = create<TodoState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setTodos: (todos) => set({ todos }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setFilter: (filter) => set({ filter }),
        
        // Fetch all todos
        fetchTodos: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new TodoRepository(db);
            const todos = await repository.findAll(get().filter || undefined);
            set({ todos, isLoading: false });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to fetch todos", isLoading: false });
          }
        },
        
        // Create a new todo
        createTodo: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new TodoRepository(db);
            const newTodo = await repository.create(data);
            set((state) => ({ 
              todos: [...state.todos, newTodo],
              isLoading: false 
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to create todo", isLoading: false });
          }
        },
        
        // Update a todo
        updateTodo: async (id, data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new TodoRepository(db);
            const updatedTodo = await repository.update(id, data);
            if (updatedTodo) {
              set((state) => ({
                todos: state.todos.map(todo => 
                  todo.id === id ? updatedTodo : todo
                ),
                isLoading: false
              }));
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to update todo", isLoading: false });
          }
        },
        
        // Delete a todo
        deleteTodo: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new TodoRepository(db);
            await repository.delete(id);
            set((state) => ({
              todos: state.todos.filter(todo => todo.id !== id),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to delete todo", isLoading: false });
          }
        },
        
        // Toggle todo completion (optimistic update)
        toggleTodoComplete: (id) => {
          const todo = get().todos.find(t => t.id === id);
          if (todo) {
            // Optimistically update the UI
            set((state) => ({
              todos: state.todos.map(t => 
                t.id === id ? { ...t, completed: !t.completed } : t
              )
            }));
            
            // Then persist to database
            get().updateTodo(id, { 
              completed: !todo.completed,
              completed_at: !todo.completed ? new Date().toISOString() : undefined
            });
          }
        },
        
        // Search todos
        searchTodos: async (keyword) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new TodoRepository(db);
            const todos = await repository.search(keyword);
            set({ todos, isLoading: false });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to search todos", isLoading: false });
          }
        },
        
        // Get filtered todos
        getFilteredTodos: () => {
          const { todos, filter } = get();
          if (!filter) return todos;
          
          return todos.filter(todo => {
            if (filter.completed !== undefined && todo.completed !== filter.completed) {
              return false;
            }
            if (filter.priority && todo.priority !== filter.priority) {
              return false;
            }
            return true;
          });
        },
        
        // Fetch overdue todos
        fetchOverdueTodos: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new TodoRepository(db);
            const todos = await repository.findOverdue();
            set({ todos, isLoading: false });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to fetch overdue todos", isLoading: false });
          }
        },
        
        // Reset store
        reset: () => set(initialState),
      }),
      {
        name: "todos-cache",
        partialize: (state) => ({ todos: state.todos }),
      }
    )
  )
);