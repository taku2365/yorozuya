import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoItem } from "./todo-item";
import type { Todo } from "@/lib/db/types";

// Mock date-fns to have consistent test results
vi.mock("date-fns", async () => {
  const actual = await vi.importActual("date-fns");
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (formatStr === "yyyy年MM月dd日") {
        return new Date(date).toISOString().split("T")[0];
      }
      return new Date(date).toISOString();
    }),
  };
});

describe("TodoItem", () => {
  const mockOnToggleComplete = vi.fn();
  const mockOnClick = vi.fn();
  
  // Set a fixed date for consistent testing
  const mockNow = new Date("2024-01-15T10:00:00Z");
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
    id: "1",
    title: "Test Todo",
    description: "Test Description",
    priority: "medium",
    completed: false,
    created_at: mockNow.toISOString(),
    updated_at: mockNow.toISOString(),
    ...overrides,
  });

  describe("Basic Rendering", () => {
    it("renders todo title and description", () => {
      const todo = createTodo();
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByText("Test Todo")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });

    it("displays priority badge", () => {
      const todo = createTodo({ priority: "high" });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByText("高")).toBeInTheDocument();
    });

    it("shows completed state with strikethrough", () => {
      const todo = createTodo({ 
        completed: true, 
        completed_at: mockNow.toISOString() 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const title = screen.getByText("Test Todo");
      expect(title).toHaveClass("line-through");
    });
  });

  describe("Due Date Display", () => {
    it("shows 'today' for due date today", () => {
      const todo = createTodo({ 
        due_date: mockNow.toISOString() 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByText("今日")).toBeInTheDocument();
    });

    it("shows 'tomorrow' for due date tomorrow", () => {
      const tomorrow = new Date(mockNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todo = createTodo({ 
        due_date: tomorrow.toISOString() 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByText("明日")).toBeInTheDocument();
    });

    it("shows 'yesterday' for due date yesterday", () => {
      const yesterday = new Date(mockNow);
      yesterday.setDate(yesterday.getDate() - 1);
      const todo = createTodo({ 
        due_date: yesterday.toISOString() 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByText("昨日")).toBeInTheDocument();
    });

    it("shows days remaining for near future dates", () => {
      const future = new Date(mockNow);
      future.setDate(future.getDate() + 5);
      const todo = createTodo({ 
        due_date: future.toISOString() 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByText("5日後")).toBeInTheDocument();
    });
  });

  describe("Visual Warnings", () => {
    it("highlights overdue todos with red border", () => {
      const overdue = new Date(mockNow);
      overdue.setDate(overdue.getDate() - 2);
      const todo = createTodo({ 
        due_date: overdue.toISOString(),
        completed: false 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const todoItem = screen.getByTestId("todo-item");
      expect(todoItem).toHaveClass("border-red-300");
    });

    it("highlights todos due soon with orange border", () => {
      const dueSoon = new Date(mockNow);
      dueSoon.setDate(dueSoon.getDate() + 2);
      const todo = createTodo({ 
        due_date: dueSoon.toISOString(),
        completed: false 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const todoItem = screen.getByTestId("todo-item");
      expect(todoItem).toHaveClass("border-orange-200");
    });

    it("does not highlight completed overdue todos", () => {
      const overdue = new Date(mockNow);
      overdue.setDate(overdue.getDate() - 2);
      const todo = createTodo({ 
        due_date: overdue.toISOString(),
        completed: true 
      });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const todoItem = screen.getByTestId("todo-item");
      expect(todoItem).not.toHaveClass("border-red-300");
    });
  });

  describe("Interactions", () => {
    it("calls onToggleComplete when checkbox is clicked", () => {
      const todo = createTodo();
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      
      expect(mockOnToggleComplete).toHaveBeenCalledWith("1");
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("calls onClick when todo item is clicked", () => {
      const todo = createTodo();
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      fireEvent.click(screen.getByText("Test Todo"));
      
      expect(mockOnClick).toHaveBeenCalledWith(todo);
      expect(mockOnToggleComplete).not.toHaveBeenCalled();
    });

    it("does not trigger onClick when checkbox is clicked", () => {
      const todo = createTodo();
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper checkbox label", () => {
      const todo = createTodo({ completed: false });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("aria-label", 'Mark "Test Todo" as complete');
    });

    it("updates checkbox label for completed todos", () => {
      const todo = createTodo({ completed: true });
      render(
        <TodoItem 
          todo={todo} 
          onToggleComplete={mockOnToggleComplete} 
          onClick={mockOnClick} 
        />
      );
      
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("aria-label", 'Mark "Test Todo" as incomplete');
    });
  });
});