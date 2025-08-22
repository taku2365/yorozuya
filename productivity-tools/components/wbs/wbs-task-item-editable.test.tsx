import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WBSTaskItemEditable } from "./wbs-task-item-editable";
import type { WBSTask } from "@/lib/db/types";

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

const mockTask: WBSTask = {
  id: "1",
  title: "プロジェクト企画",
  position: 0,
  progress: 30,
  estimated_hours: 40,
  actual_hours: 12,
  assignee: "田中太郎",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("WBSTaskItemEditable", () => {
  it("renders task in view mode by default", () => {
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={0}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    
    expect(screen.getByText("プロジェクト企画")).toBeInTheDocument();
    expect(screen.getByText("40h")).toBeInTheDocument();
    expect(screen.getByText("12h")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("enters edit mode when clicking edit button", () => {
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={0}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    
    expect(screen.getByDisplayValue("プロジェクト企画")).toBeInTheDocument();
    expect(screen.getByDisplayValue("40")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12")).toBeInTheDocument();
  });

  it("updates task when saving inline edit", async () => {
    const handleUpdate = vi.fn();
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={0}
        onUpdate={handleUpdate}
        onDelete={vi.fn()}
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    
    // Change values
    fireEvent.change(screen.getByDisplayValue("プロジェクト企画"), {
      target: { value: "プロジェクト企画（更新）" }
    });
    
    fireEvent.change(screen.getByDisplayValue("40"), {
      target: { value: "50" }
    });
    
    // Save
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    
    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith("1", {
        title: "プロジェクト企画（更新）",
        estimated_hours: 50,
        actual_hours: 12,
      });
    });
  });

  it("cancels edit mode without saving changes", () => {
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={0}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    
    // Change value
    fireEvent.change(screen.getByDisplayValue("プロジェクト企画"), {
      target: { value: "変更されたタイトル" }
    });
    
    // Cancel
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    
    // Should show original value
    expect(screen.getByText("プロジェクト企画")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("変更されたタイトル")).not.toBeInTheDocument();
  });

  it("updates progress with slider", async () => {
    const handleUpdate = vi.fn();
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={0}
        onUpdate={handleUpdate}
        onDelete={vi.fn()}
      />
    );
    
    // Find and simulate slider interaction using keyboard
    const progressSlider = screen.getByRole("slider");
    
    // Focus the slider and use arrow keys to change value
    progressSlider.focus();
    fireEvent.keyDown(progressSlider, { key: 'ArrowRight' });
    
    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith("1", {
        progress: 35, // 30 + 5 (step)
      });
    });
  });

  it("shows delete confirmation dialog", () => {
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={0}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    
    expect(screen.getByText("タスクを削除しますか？")).toBeInTheDocument();
    expect(screen.getByText(/このタスクを削除すると、元に戻すことはできません/)).toBeInTheDocument();
  });

  it("deletes task when confirmed", async () => {
    const handleDelete = vi.fn();
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={0}
        onUpdate={handleDelete}
        onDelete={handleDelete}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    
    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith("1");
    });
  });

  it("shows indentation for nested tasks", () => {
    render(
      <WBSTaskItemEditable
        task={mockTask}
        level={2}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    
    const taskItem = screen.getByTestId("wbs-task-item");
    expect(taskItem).toHaveClass("ml-12"); // 2 levels * 6 = 12
  });
});