import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  // Mock date globally instead of using fake timers for better compatibility with userEvent
  const mockDate = new Date("2024-01-15T10:00:00Z");
  const originalDate = global.Date;
  
  beforeEach(() => {
    global.Date = vi.fn((...args) => {
      if (args.length === 0) {
        return mockDate;
      }
      return new originalDate(...args);
    }) as any;
    global.Date.now = () => mockDate.getTime();
    global.Date.parse = originalDate.parse;
    global.Date.UTC = originalDate.UTC;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe("Rendering", () => {
    it("renders empty form for new todo", () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      expect(screen.getByRole("textbox", { name: /タイトル/i })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: /説明/i })).toHaveValue("");
      expect(screen.getByRole("combobox", { name: "優先度" })).toBeInTheDocument();
      expect(screen.getByLabelText(/期限/i)).toHaveValue("");
    });

    it("renders form with todo data for editing", () => {
      render(<TodoForm todo={mockTodo} onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      expect(screen.getByRole("textbox", { name: /タイトル/i })).toHaveValue("Test todo");
      expect(screen.getByRole("textbox", { name: /説明/i })).toHaveValue("Test description");
      expect(screen.getByRole("combobox", { name: "優先度" })).toBeInTheDocument();
      expect(screen.getByLabelText(/期限/i)).toHaveValue("2025-08-25");
    });

    it("shows character count for text fields", () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      expect(screen.getByText("0/100文字")).toBeInTheDocument();
      expect(screen.getByText("0/500文字")).toBeInTheDocument();
    });

    it("shows date preset buttons", () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      expect(screen.getByRole("button", { name: "今日" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "明日" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "来週" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "来月" })).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("shows error when title is empty on blur", async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.getByText("タイトルは必須です")).toBeInTheDocument();
      });
    });

    it("shows error when title exceeds 100 characters", async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      const longTitle = "a".repeat(101);
      
      // Use fireEvent for more stable input handling
      fireEvent.change(titleInput, { target: { value: longTitle } });
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.getByText("タイトルは100文字以内で入力してください")).toBeInTheDocument();
      });
    });

    it("shows error when description exceeds 500 characters", async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const descriptionInput = screen.getByRole("textbox", { name: /説明/i });
      const longDescription = "a".repeat(501);
      
      fireEvent.change(descriptionInput, { target: { value: longDescription } });
      fireEvent.blur(descriptionInput);
      
      expect(await screen.findByText("説明は500文字以内で入力してください")).toBeInTheDocument();
    });

    it("shows error when due date is in the past", async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const dueDateInput = screen.getByLabelText(/期限/i);
      
      fireEvent.change(dueDateInput, { target: { value: "2024-01-14" } });
      fireEvent.blur(dueDateInput);
      
      await waitFor(() => {
        expect(screen.getByText("期限は今日以降の日付を選択してください")).toBeInTheDocument();
      });
    });

    it("prevents form submission with validation errors", async () => {
      const handleSubmit = vi.fn();
      render(<TodoForm onSubmit={handleSubmit} onCancel={vi.fn()} />);
      
      // Submit without filling required fields (title is empty)
      const submitButton = screen.getByRole("button", { name: "作成" });
      fireEvent.click(submitButton);
      
      // Give some time for any async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that onSubmit was NOT called
      expect(handleSubmit).not.toHaveBeenCalled();
      
      // Also verify that the form is still visible (not cleared)
      expect(screen.getByLabelText(/タイトル/i)).toHaveValue("");
    });
  });

  describe("Form Submission", () => {
    it("calls onSubmit with form data", async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<TodoForm onSubmit={handleSubmit} onCancel={vi.fn()} />);
      
      // Fill in the form with only required fields
      await user.type(screen.getByRole("textbox", { name: /タイトル/i }), "New Todo");
      await user.type(screen.getByRole("textbox", { name: /説明/i }), "New Description");
      
      // Submit the form without changing priority or due date
      await user.click(screen.getByRole("button", { name: "作成" }));
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
      });
      
      // Verify the basic form submission works
      expect(handleSubmit).toHaveBeenCalledWith({
        title: "New Todo",
        description: "New Description",
        priority: "medium", // default value
        due_date: undefined, // not set
      });
    });

    it("clears form after successful submission for new todos", async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<TodoForm onSubmit={handleSubmit} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      await user.type(titleInput, "New Todo");
      
      await user.click(screen.getByRole("button", { name: "作成" }));
      
      await waitFor(() => {
        expect(titleInput).toHaveValue("");
      });
    });

    it("does not clear form after submission when editing", async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<TodoForm todo={mockTodo} onSubmit={handleSubmit} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Todo");
      
      await user.click(screen.getByRole("button", { name: "更新" }));
      
      await waitFor(() => {
        expect(titleInput).toHaveValue("Updated Todo");
      });
    });

    it("shows loading state while submitting", async () => {
      const handleSubmit = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      render(<TodoForm onSubmit={handleSubmit} onCancel={vi.fn()} />);
      
      fireEvent.change(screen.getByRole("textbox", { name: /タイトル/i }), {
        target: { value: "New Todo" }
      });
      
      const submitButton = screen.getByRole("button", { name: "作成" });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText("処理中...")).toBeInTheDocument();
      });
      
      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByText("処理中...")).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe("Date Presets", () => {
    it("sets today's date when today button is clicked", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      fireEvent.click(screen.getByRole("button", { name: "今日" }));
      
      expect(screen.getByLabelText(/期限/i)).toHaveValue("2024-01-15");
    });

    it("sets tomorrow's date when tomorrow button is clicked", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      fireEvent.click(screen.getByRole("button", { name: "明日" }));
      
      expect(screen.getByLabelText(/期限/i)).toHaveValue("2024-01-16");
    });

    it("sets next week's date when next week button is clicked", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      fireEvent.click(screen.getByRole("button", { name: "来週" }));
      
      expect(screen.getByLabelText(/期限/i)).toHaveValue("2024-01-22");
    });

    it("sets next month's date when next month button is clicked", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      fireEvent.click(screen.getByRole("button", { name: "来月" }));
      
      expect(screen.getByLabelText(/期限/i)).toHaveValue("2024-02-14");
    });
  });

  describe("User Interactions", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      const handleCancel = vi.fn();
      render(<TodoForm onSubmit={vi.fn()} onCancel={handleCancel} />);
      
      fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
      
      expect(handleCancel).toHaveBeenCalled();
    });

    it("updates character count as user types", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      const titleInput = screen.getByRole("textbox", { name: /タイトル/i });
      fireEvent.change(titleInput, { target: { value: "Hello" } });
      
      expect(screen.getByText("5/100文字")).toBeInTheDocument();
    });

    it("shows visual indicators for priority levels", async () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      
      fireEvent.click(screen.getByRole("combobox", { name: "優先度" }));
      
      await waitFor(() => {
        // Check for colored indicators
        const highOption = screen.getByRole("option", { name: /高/ });
        const mediumOption = screen.getByRole("option", { name: /中/ });
        const lowOption = screen.getByRole("option", { name: /低/ });
        
        expect(highOption.querySelector(".bg-red-500")).toBeInTheDocument();
        expect(mediumOption.querySelector(".bg-yellow-500")).toBeInTheDocument();
        expect(lowOption.querySelector(".bg-blue-500")).toBeInTheDocument();
      });
    });
  });
});