import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TodoForm } from "./todo-form";
import type { Todo } from "@/lib/db/types";

const mockTodo: Todo = {
  id: "1",
  title: "Test todo",
  description: "Test description",
  priority: "medium",
  completed: false,
  due_date: "2025-08-25T00:00:00Z",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("TodoForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("Basic Functionality", () => {
    it("renders form fields correctly", () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      expect(screen.getByRole("textbox", { name: /タイトル/i })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /説明/i })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "優先度" })).toBeInTheDocument();
      expect(screen.getByLabelText(/期限/i)).toBeInTheDocument();
    });

    it("submits form with valid data", async () => {
      const handleSubmit = vi.fn();
      render(<TodoForm onSubmit={handleSubmit} onCancel={vi.fn()} />);
      
      await act(async () => {
        fireEvent.change(screen.getByRole("textbox", { name: /タイトル/i }), {
          target: { value: "New Todo" },
        });
      });
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "作成" }));
      });
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          title: "New Todo",
          priority: "medium",
          description: undefined,
          due_date: undefined,
        });
      }, { timeout: 1000 });
    });

    it("shows validation error for empty title", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      
      await act(async () => {
        fireEvent.focus(titleInput);
        fireEvent.blur(titleInput);
      });
      
      await waitFor(() => {
        expect(screen.getByText("タイトルは必須です")).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it("displays update button when editing", () => {
      render(<TodoForm todo={mockTodo} onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const handleCancel = vi.fn();
      render(<TodoForm onSubmit={vi.fn()} onCancel={handleCancel} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
      });
      
      expect(handleCancel).toHaveBeenCalled();
    });
  });

  describe("Date Presets", () => {
    it("sets today's date when clicking today button", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "今日" }));
      });
      
      expect(screen.getByLabelText(/期限/i)).toHaveValue("2024-01-15");
    });

    it("sets tomorrow's date when clicking tomorrow button", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "明日" }));
      });
      
      expect(screen.getByLabelText(/期限/i)).toHaveValue("2024-01-16");
    });
  });

  describe("Character Count", () => {
    it("updates character count for title", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: "Hello" } });
      });
      
      expect(screen.getByText("5/100文字")).toBeInTheDocument();
    });

    it("updates character count for description", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const descriptionInput = screen.getByRole("textbox", { name: /説明/i });
      
      await act(async () => {
        fireEvent.change(descriptionInput, { target: { value: "This is a test" } });
      });
      
      expect(screen.getByText("14/500文字")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("disables submit button when there are errors", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      
      await act(async () => {
        fireEvent.focus(titleInput);
        fireEvent.blur(titleInput);
      });
      
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: "作成" });
        expect(submitButton).toBeDisabled();
      }, { timeout: 1000 });
    });

    it("shows loading state during submission", async () => {
      const handleSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      render(<TodoForm onSubmit={handleSubmit} onCancel={vi.fn()} />);
      
      await act(async () => {
        fireEvent.change(screen.getByRole("textbox", { name: /タイトル/i }), {
          target: { value: "Test" },
        });
      });
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "作成" }));
      });
      
      expect(screen.getByText("処理中...")).toBeInTheDocument();
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      
      await waitFor(() => {
        expect(screen.queryByText("処理中...")).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});