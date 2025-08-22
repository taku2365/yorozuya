import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoList } from "./todo-list";
import type { Todo } from "@/lib/db/types";

// Mock the current date for consistent testing
const mockNow = new Date("2024-01-15T10:00:00Z");

const mockTodos: Todo[] = [
  {
    id: "1",
    title: "Buy groceries",
    description: "Milk, eggs, bread",
    priority: "high",
    completed: false,
    due_date: new Date(mockNow.getTime() + 86400000).toISOString(), // Tomorrow
    created_at: mockNow.toISOString(),
    updated_at: mockNow.toISOString(),
  },
  {
    id: "2",
    title: "Finish report",
    description: "Monthly sales report",
    priority: "medium",
    completed: true,
    completed_at: mockNow.toISOString(),
    due_date: new Date(mockNow.getTime() - 86400000).toISOString(), // Yesterday
    created_at: mockNow.toISOString(),
    updated_at: mockNow.toISOString(),
  },
  {
    id: "3",
    title: "Call client",
    priority: "low",
    completed: false,
    due_date: new Date(mockNow.getTime() - 172800000).toISOString(), // 2 days ago (overdue)
    created_at: mockNow.toISOString(),
    updated_at: mockNow.toISOString(),
  },
];

describe("TodoList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it("renders all todos", () => {
    render(<TodoList todos={mockTodos} onTodoClick={vi.fn()} />);
    
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Finish report")).toBeInTheDocument();
    expect(screen.getByText("Call client")).toBeInTheDocument();
  });

  it("shows description when available", () => {
    render(<TodoList todos={mockTodos} onTodoClick={vi.fn()} />);
    
    expect(screen.getByText("Milk, eggs, bread")).toBeInTheDocument();
    expect(screen.getByText("Monthly sales report")).toBeInTheDocument();
  });

  it("displays priority badges", () => {
    render(<TodoList todos={mockTodos} onTodoClick={vi.fn()} />);
    
    expect(screen.getByText("高")).toBeInTheDocument();
    expect(screen.getByText("中")).toBeInTheDocument();
    expect(screen.getByText("低")).toBeInTheDocument();
  });

  it("shows completed status", () => {
    render(<TodoList todos={mockTodos} onTodoClick={vi.fn()} />);
    
    const completedTodo = screen.getByText("Finish report");
    expect(completedTodo).toHaveClass("line-through");
  });

  it("highlights overdue todos in red", () => {
    render(<TodoList todos={mockTodos} onTodoClick={vi.fn()} />);
    
    const overdueTodo = screen.getByText("Call client").closest('[data-testid="todo-item"]');
    expect(overdueTodo).toHaveClass("border-red-300");
  });

  it("calls onTodoClick when a todo is clicked", () => {
    const handleClick = vi.fn();
    render(<TodoList todos={mockTodos} onTodoClick={handleClick} />);
    
    fireEvent.click(screen.getByText("Buy groceries"));
    expect(handleClick).toHaveBeenCalledWith(mockTodos[0]);
  });

  it("filters todos based on filter prop", () => {
    const filter = { completed: false };
    render(<TodoList todos={mockTodos} filter={filter} onTodoClick={vi.fn()} />);
    
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Call client")).toBeInTheDocument();
    expect(screen.queryByText("Finish report")).not.toBeInTheDocument();
  });

  it("shows empty state when no todos", () => {
    render(<TodoList todos={[]} onTodoClick={vi.fn()} />);
    
    expect(screen.getByText("ToDoがありません")).toBeInTheDocument();
  });

  it("shows due date for todos", () => {
    render(<TodoList todos={mockTodos} onTodoClick={vi.fn()} />);
    
    // Check that due dates are displayed
    // Due dates now show as relative dates (e.g. "今日", "明日", etc.)
    expect(screen.getByText("明日")).toBeInTheDocument(); // For tomorrow's date
    expect(screen.getByText("2024年01月13日")).toBeInTheDocument(); // For overdue date
  });

  it("shows loading state when isLoading is true", () => {
    render(<TodoList todos={[]} isLoading={true} onTodoClick={vi.fn()} />);
    
    expect(screen.getByText("ToDoを読み込んでいます...")).toBeInTheDocument();
  });
});