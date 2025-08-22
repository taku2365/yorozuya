import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WBSTaskForm } from "./wbs-task-form";
import type { WBSTask } from "@/lib/db/types";

const mockTask: WBSTask = {
  id: "1",
  title: "既存のタスク",
  position: 0,
  progress: 50,
  estimated_hours: 40,
  actual_hours: 20,
  assignee: "田中太郎",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockParentTask: WBSTask = {
  id: "parent-1",
  title: "親タスク",
  position: 0,
  progress: 0,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("WBSTaskForm", () => {
  it("renders empty form for new task", () => {
    render(<WBSTaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    
    expect(screen.getByLabelText("タスク名")).toHaveValue("");
    expect(screen.getByLabelText("見積時間（時間）")).toHaveValue("");
    expect(screen.getByLabelText("実績時間（時間）")).toHaveValue("");
    expect(screen.getByLabelText("担当者")).toHaveValue("");
    expect(screen.getByRole("button", { name: "作成" })).toBeInTheDocument();
  });

  it("renders form with task data for editing", () => {
    render(<WBSTaskForm task={mockTask} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    
    expect(screen.getByLabelText("タスク名")).toHaveValue("既存のタスク");
    expect(screen.getByLabelText("見積時間（時間）")).toHaveValue("40");
    expect(screen.getByLabelText("実績時間（時間）")).toHaveValue("20");
    expect(screen.getByLabelText("担当者")).toHaveValue("田中太郎");
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
  });

  it("shows parent task selector when parent is provided", () => {
    render(
      <WBSTaskForm 
        parentTask={mockParentTask} 
        onSubmit={vi.fn()} 
        onCancel={vi.fn()} 
      />
    );
    
    expect(screen.getByText("親タスク: 親タスク")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    render(<WBSTaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    
    fireEvent.click(screen.getByRole("button", { name: "作成" }));
    
    await waitFor(() => {
      expect(screen.getByText("タスク名は必須です")).toBeInTheDocument();
    });
  });

  it("validates numeric fields", async () => {
    render(<WBSTaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    
    fireEvent.change(screen.getByLabelText("見積時間（時間）"), {
      target: { value: "abc" }
    });
    
    fireEvent.change(screen.getByLabelText("実績時間（時間）"), {
      target: { value: "-10" }
    });
    
    fireEvent.blur(screen.getByLabelText("見積時間（時間）"));
    fireEvent.blur(screen.getByLabelText("実績時間（時間）"));
    
    await waitFor(() => {
      expect(screen.getByText("見積時間は数値で入力してください")).toBeInTheDocument();
      expect(screen.getByText("実績時間は0以上の数値で入力してください")).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const handleSubmit = vi.fn();
    render(<WBSTaskForm onSubmit={handleSubmit} onCancel={vi.fn()} />);
    
    fireEvent.change(screen.getByLabelText("タスク名"), {
      target: { value: "新しいタスク" }
    });
    
    fireEvent.change(screen.getByLabelText("見積時間（時間）"), {
      target: { value: "20" }
    });
    
    fireEvent.change(screen.getByLabelText("担当者"), {
      target: { value: "山田花子" }
    });
    
    fireEvent.click(screen.getByRole("button", { name: "作成" }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: "新しいタスク",
        estimated_hours: 20,
        actual_hours: undefined,
        assignee: "山田花子",
        parent_id: undefined,
      });
    });
  });

  it("calls onCancel when cancel button is clicked", () => {
    const handleCancel = vi.fn();
    render(<WBSTaskForm onSubmit={vi.fn()} onCancel={handleCancel} />);
    
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    
    expect(handleCancel).toHaveBeenCalled();
  });

  it("includes parent_id when parent task is provided", async () => {
    const handleSubmit = vi.fn();
    render(
      <WBSTaskForm 
        parentTask={mockParentTask}
        onSubmit={handleSubmit} 
        onCancel={vi.fn()} 
      />
    );
    
    fireEvent.change(screen.getByLabelText("タスク名"), {
      target: { value: "子タスク" }
    });
    
    fireEvent.click(screen.getByRole("button", { name: "作成" }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: "子タスク",
        estimated_hours: undefined,
        actual_hours: undefined,
        assignee: undefined,
        parent_id: "parent-1",
      });
    });
  });
});