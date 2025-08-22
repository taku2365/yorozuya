import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WBSBulkActions } from "./wbs-bulk-actions";

describe("WBSBulkActions", () => {
  const mockHandlers = {
    onExpandAll: vi.fn(),
    onCollapseAll: vi.fn(),
    onSelectAll: vi.fn(),
    onDeselectAll: vi.fn(),
    onDeleteSelected: vi.fn(),
    onResetProgress: vi.fn(),
  };

  beforeEach(() => {
    Object.values(mockHandlers).forEach(handler => handler.mockClear());
  });

  it("renders with task count", () => {
    render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={0}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText("全10タスク")).toBeInTheDocument();
  });

  it("shows selected count when tasks are selected", () => {
    render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={3}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText("3個のタスクを選択中")).toBeInTheDocument();
  });

  it("toggles between select all and deselect all", () => {
    const { rerender } = render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={0}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    // Initially shows "Select All"
    const selectButton = screen.getByRole("button", { name: /すべて選択/ });
    fireEvent.click(selectButton);
    expect(mockHandlers.onSelectAll).toHaveBeenCalled();
    
    // After all selected, shows "Deselect All"
    rerender(
      <WBSBulkActions
        taskCount={10}
        selectedCount={10}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    const deselectButton = screen.getByRole("button", { name: /すべて解除/ });
    fireEvent.click(deselectButton);
    expect(mockHandlers.onDeselectAll).toHaveBeenCalled();
  });

  it("handles expand and collapse actions", () => {
    const { rerender } = render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={0}
        expandedState={false}
        {...mockHandlers}
      />
    );
    
    // Expand button enabled when collapsed
    const expandButton = screen.getByRole("button", { name: "すべて展開" });
    expect(expandButton).not.toBeDisabled();
    fireEvent.click(expandButton);
    expect(mockHandlers.onExpandAll).toHaveBeenCalled();
    
    // Collapse button disabled when collapsed
    const collapseButton = screen.getByRole("button", { name: "すべて折りたたむ" });
    expect(collapseButton).toBeDisabled();
    
    // After expanding
    rerender(
      <WBSBulkActions
        taskCount={10}
        selectedCount={0}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    // Expand button disabled when expanded
    expect(screen.getByRole("button", { name: "すべて展開" })).toBeDisabled();
    
    // Collapse button enabled when expanded
    const collapseButtonEnabled = screen.getByRole("button", { name: "すべて折りたたむ" });
    expect(collapseButtonEnabled).not.toBeDisabled();
    fireEvent.click(collapseButtonEnabled);
    expect(mockHandlers.onCollapseAll).toHaveBeenCalled();
  });

  it("shows action buttons only when tasks are selected", () => {
    const { rerender } = render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={0}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    // No action buttons when nothing selected
    expect(screen.queryByText("進捗リセット")).not.toBeInTheDocument();
    expect(screen.queryByText("選択を削除")).not.toBeInTheDocument();
    
    // Show action buttons when tasks selected
    rerender(
      <WBSBulkActions
        taskCount={10}
        selectedCount={3}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText("進捗リセット")).toBeInTheDocument();
    expect(screen.getByText("選択を削除")).toBeInTheDocument();
  });

  it("shows delete confirmation dialog", () => {
    render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={3}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByText("選択を削除"));
    
    expect(screen.getByText("選択したタスクを削除しますか？")).toBeInTheDocument();
    expect(screen.getByText(/3個のタスクとその子タスクが削除されます/)).toBeInTheDocument();
  });

  it("confirms task deletion", () => {
    render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={3}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByText("選択を削除"));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    
    expect(mockHandlers.onDeleteSelected).toHaveBeenCalled();
  });

  it("cancels task deletion", () => {
    render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={3}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByText("選択を削除"));
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    
    expect(mockHandlers.onDeleteSelected).not.toHaveBeenCalled();
  });

  it("shows reset progress confirmation dialog", () => {
    render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={5}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByText("進捗リセット"));
    
    expect(screen.getByText("進捗をリセットしますか？")).toBeInTheDocument();
    expect(screen.getByText(/選択した5個のタスクの進捗率が0%にリセットされます/)).toBeInTheDocument();
  });

  it("confirms progress reset", () => {
    render(
      <WBSBulkActions
        taskCount={10}
        selectedCount={5}
        expandedState={true}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByText("進捗リセット"));
    fireEvent.click(screen.getByRole("button", { name: "リセットする" }));
    
    expect(mockHandlers.onResetProgress).toHaveBeenCalled();
  });
});