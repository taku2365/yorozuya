import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WBSTaskDelete } from "./wbs-task-delete";
import type { WBSTask } from "@/lib/db/types";

describe("WBSTaskDelete", () => {
  const mockTask: WBSTask = {
    id: "1",
    title: "テストタスク",
    hierarchy_number: "1",
    parent_id: undefined,
    position: 0,
    progress: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it("削除ボタンが表示される", () => {
    render(<WBSTaskDelete task={mockTask} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByTitle("タスクを削除");
    expect(deleteButton).toBeInTheDocument();
  });

  it("削除ボタンをクリックすると確認ダイアログが表示される", () => {
    render(<WBSTaskDelete task={mockTask} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByTitle("タスクを削除");
    fireEvent.click(deleteButton);
    
    expect(screen.getByText("タスクを削除しますか？")).toBeInTheDocument();
    expect(screen.getByText(/1 テストタスク/)).toBeInTheDocument();
  });

  it("整数番号タスクで子タスクがある場合、警告メッセージが表示される", () => {
    render(<WBSTaskDelete task={mockTask} onDelete={mockOnDelete} hasChildren={true} />);
    
    const deleteButton = screen.getByTitle("タスクを削除");
    fireEvent.click(deleteButton);
    
    expect(screen.getByText(/注意: このタスクは整数番号であり、子タスク（小数番号）も一緒に削除されます/)).toBeInTheDocument();
  });

  it("小数番号タスクの場合、警告メッセージが表示されない", () => {
    const decimalTask = { ...mockTask, hierarchy_number: "1.1" };
    render(<WBSTaskDelete task={decimalTask} onDelete={mockOnDelete} hasChildren={true} />);
    
    const deleteButton = screen.getByTitle("タスクを削除");
    fireEvent.click(deleteButton);
    
    expect(screen.queryByText(/注意: このタスクは整数番号であり/)).not.toBeInTheDocument();
  });

  it("削除を確認するとonDeleteが呼ばれる", () => {
    render(<WBSTaskDelete task={mockTask} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByTitle("タスクを削除");
    fireEvent.click(deleteButton);
    
    const confirmButton = screen.getByText("削除");
    fireEvent.click(confirmButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith("1");
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("キャンセルをクリックするとダイアログが閉じる", () => {
    render(<WBSTaskDelete task={mockTask} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByTitle("タスクを削除");
    fireEvent.click(deleteButton);
    
    const cancelButton = screen.getByText("キャンセル");
    fireEvent.click(cancelButton);
    
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});