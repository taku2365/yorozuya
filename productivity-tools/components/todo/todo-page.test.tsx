import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TodoPage } from "./todo-page";

// Mock the store
const mockUseTodoStore = vi.fn();
vi.mock("@/lib/stores/todo-store", () => ({
  useTodoStore: (selector: any) => mockUseTodoStore(selector),
}));

describe("TodoPage", () => {
  const defaultStoreState = {
    todos: [
      {
        id: "1",
        title: "Test todo",
        description: "Test description",
        priority: "medium",
        completed: false,
        due_date: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
    error: null,
    filter: null,
    fetchTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    toggleTodoComplete: vi.fn(),
    setFilter: vi.fn(),
    searchTodos: vi.fn(),
    getFilteredTodos: vi.fn(),
  };

  beforeEach(() => {
    // Make getFilteredTodos return todos by default
    defaultStoreState.getFilteredTodos.mockReturnValue(defaultStoreState.todos);
    
    mockUseTodoStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector(defaultStoreState);
      }
      return defaultStoreState;
    });
  });

  it("renders todo list and add button", () => {
    render(<TodoPage />);
    
    expect(screen.getByText("Test todo")).toBeInTheDocument();
    expect(screen.getByText("新規ToDo作成")).toBeInTheDocument();
  });

  it("fetches todos on mount", () => {
    const fetchTodos = vi.fn();
    mockUseTodoStore.mockImplementation((selector) => {
      const state = { ...defaultStoreState, fetchTodos };
      return typeof selector === "function" ? selector(state) : state;
    });
    
    render(<TodoPage />);
    
    expect(fetchTodos).toHaveBeenCalledTimes(1);
  });

  it("shows loading state", () => {
    mockUseTodoStore.mockImplementation((selector) => {
      const state = { 
        ...defaultStoreState, 
        isLoading: true,
        getFilteredTodos: vi.fn().mockReturnValue([])
      };
      return typeof selector === "function" ? selector(state) : state;
    });
    
    render(<TodoPage />);
    
    expect(screen.getByText("ToDoを読み込んでいます...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseTodoStore.mockImplementation((selector) => {
      const state = { ...defaultStoreState, error: "Failed to load todos" };
      return typeof selector === "function" ? selector(state) : state;
    });
    
    render(<TodoPage />);
    
    expect(screen.getByText("エラー: Failed to load todos")).toBeInTheDocument();
  });

  it("opens create form when add button is clicked", async () => {
    render(<TodoPage />);
    
    const addButton = screen.getByText("新規ToDo作成");
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    
    expect(screen.getByRole("textbox", { name: /タイトル/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "作成" })).toBeInTheDocument();
  });

  it("opens edit form when todo is clicked", async () => {
    render(<TodoPage />);
    
    const todo = screen.getByText("Test todo");
    fireEvent.click(todo);
    
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    
    expect(screen.getByRole("textbox", { name: /タイトル/i })).toHaveValue("Test todo");
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
  });

  it("creates new todo", async () => {
    const createTodo = vi.fn();
    const state = { 
      ...defaultStoreState, 
      createTodo,
      getFilteredTodos: vi.fn().mockReturnValue(defaultStoreState.todos)
    };
    mockUseTodoStore.mockImplementation((selector) => {
      return typeof selector === "function" ? selector(state) : state;
    });
    
    render(<TodoPage />);
    
    // Open create form
    fireEvent.click(screen.getByText("新規ToDo作成"));
    
    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    
    // Fill form
    fireEvent.change(screen.getByRole("textbox", { name: /タイトル/i }), {
      target: { value: "New todo" },
    });
    
    // Submit
    fireEvent.click(screen.getByText("作成"));
    
    await waitFor(() => {
      expect(createTodo).toHaveBeenCalledWith({
        title: "New todo",
        description: undefined,
        priority: "medium",
        due_date: undefined,
      });
    });
  });

  it("updates existing todo", async () => {
    const updateTodo = vi.fn();
    const state = { 
      ...defaultStoreState, 
      updateTodo,
      getFilteredTodos: vi.fn().mockReturnValue(defaultStoreState.todos)
    };
    mockUseTodoStore.mockImplementation((selector) => {
      return typeof selector === "function" ? selector(state) : state;
    });
    
    render(<TodoPage />);
    
    // Open edit form
    fireEvent.click(screen.getByText("Test todo"));
    
    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    
    // Update title
    fireEvent.change(screen.getByRole("textbox", { name: /タイトル/i }), {
      target: { value: "Updated todo" },
    });
    
    // Submit
    fireEvent.click(screen.getByText("更新"));
    
    await waitFor(() => {
      expect(updateTodo).toHaveBeenCalledWith("1", {
        title: "Updated todo",
        description: "Test description",
        priority: "medium",
        due_date: expect.any(String),
      });
    });
  });

  it("toggles todo completion", () => {
    const toggleTodoComplete = vi.fn();
    const state = { 
      ...defaultStoreState, 
      toggleTodoComplete,
      getFilteredTodos: vi.fn().mockReturnValue(defaultStoreState.todos)
    };
    mockUseTodoStore.mockImplementation((selector) => {
      return typeof selector === "function" ? selector(state) : state;
    });
    
    render(<TodoPage />);
    
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    
    expect(toggleTodoComplete).toHaveBeenCalledWith("1");
  });

  it("deletes todo", async () => {
    const deleteTodo = vi.fn();
    const state = { 
      ...defaultStoreState, 
      deleteTodo,
      getFilteredTodos: vi.fn().mockReturnValue(defaultStoreState.todos)
    };
    mockUseTodoStore.mockImplementation((selector) => {
      return typeof selector === "function" ? selector(state) : state;
    });
    
    render(<TodoPage />);
    
    // Open edit form
    fireEvent.click(screen.getByText("Test todo"));
    
    // Click delete button
    const deleteButton = screen.getByText("削除");
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByText("削除する");
      fireEvent.click(confirmButton);
    });
    
    await waitFor(() => {
      expect(deleteTodo).toHaveBeenCalledWith("1");
    });
  });
});