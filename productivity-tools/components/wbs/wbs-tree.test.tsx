import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WBSTree } from "./wbs-tree";
import type { WBSTask } from "@/lib/db/types";

const mockTasks: WBSTask[] = [
  {
    id: "1",
    title: "プロジェクト全体",
    position: 0,
    progress: 50,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    children: [
      {
        id: "2",
        title: "設計フェーズ",
        parent_id: "1",
        position: 0,
        progress: 100,
        estimated_hours: 40,
        actual_hours: 38,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        children: [],
      },
      {
        id: "3",
        title: "実装フェーズ",
        parent_id: "1",
        position: 1,
        progress: 20,
        estimated_hours: 80,
        actual_hours: 16,
        assignee: "田中太郎",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        children: [
          {
            id: "4",
            title: "フロントエンド実装",
            parent_id: "3",
            position: 0,
            progress: 30,
            estimated_hours: 40,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            children: [],
          },
        ],
      },
    ],
  },
];

describe("WBSTree", () => {
  it("renders root tasks", () => {
    render(<WBSTree tasks={mockTasks} onTaskClick={vi.fn()} />);
    
    expect(screen.getByText("プロジェクト全体")).toBeInTheDocument();
  });

  it("shows expand/collapse button for tasks with children", () => {
    render(<WBSTree tasks={mockTasks} onTaskClick={vi.fn()} />);
    
    // Initially expanded, so it shows collapse button
    const collapseButton = screen.getByRole("button", { name: /collapse プロジェクト全体/i });
    expect(collapseButton).toBeInTheDocument();
  });

  it("expands and collapses tasks", () => {
    render(<WBSTree tasks={mockTasks} onTaskClick={vi.fn()} />);
    
    // Initially, child tasks should be visible
    expect(screen.getByText("設計フェーズ")).toBeInTheDocument();
    expect(screen.getByText("実装フェーズ")).toBeInTheDocument();
    
    // Collapse
    const collapseButton = screen.getByRole("button", { name: /collapse プロジェクト全体/i });
    fireEvent.click(collapseButton);
    
    // Child tasks should be hidden
    expect(screen.queryByText("設計フェーズ")).not.toBeInTheDocument();
    expect(screen.queryByText("実装フェーズ")).not.toBeInTheDocument();
  });

  it("shows progress bar", () => {
    render(<WBSTree tasks={mockTasks} onTaskClick={vi.fn()} />);
    
    // Check for progress indicators
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("shows estimated and actual hours", () => {
    render(<WBSTree tasks={mockTasks} onTaskClick={vi.fn()} />);
    
    // For design phase task - check for the specific format "38h / 40h"
    const designPhaseHours = screen.getByText((content, element) => {
      return element?.textContent === "38h / 40h";
    });
    expect(designPhaseHours).toBeInTheDocument();
  });

  it("shows assignee when present", () => {
    render(<WBSTree tasks={mockTasks} onTaskClick={vi.fn()} />);
    
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
  });

  it("calls onTaskClick when task is clicked", () => {
    const handleTaskClick = vi.fn();
    render(<WBSTree tasks={mockTasks} onTaskClick={handleTaskClick} />);
    
    fireEvent.click(screen.getByText("設計フェーズ"));
    
    expect(handleTaskClick).toHaveBeenCalledWith(mockTasks[0].children![0]);
  });

  it("shows empty state when no tasks", () => {
    render(<WBSTree tasks={[]} onTaskClick={vi.fn()} />);
    
    expect(screen.getByText("タスクがありません")).toBeInTheDocument();
  });

  it("shows task hierarchy with indentation", () => {
    render(<WBSTree tasks={mockTasks} onTaskClick={vi.fn()} />);
    
    // Verify nested task is rendered
    expect(screen.getByText("フロントエンド実装")).toBeInTheDocument();
  });
});