import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WBSPage } from "./wbs-page";

// Mock the store
const mockUseWBSStore = vi.fn(() => ({
  tasks: [],
  isLoading: false,
  error: null,
  fetchTasks: vi.fn(),
}));

vi.mock("@/lib/stores/wbs-store", () => ({
  useWBSStore: () => mockUseWBSStore(),
}));

describe("WBSPage", () => {
  it("renders the page title", () => {
    render(<WBSPage />);
    
    expect(screen.getByText("WBS（作業分解構造）")).toBeInTheDocument();
  });

  it("renders the create new task button", () => {
    render(<WBSPage />);
    
    expect(screen.getByRole("button", { name: "新規タスク作成" })).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseWBSStore.mockReturnValue({
      tasks: [],
      isLoading: true,
      error: null,
      fetchTasks: vi.fn(),
    });

    render(<WBSPage />);
    
    expect(screen.getByText("タスクを読み込んでいます...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseWBSStore.mockReturnValue({
      tasks: [],
      isLoading: false,
      error: "Failed to load tasks",
      fetchTasks: vi.fn(),
    });

    render(<WBSPage />);
    
    expect(screen.getByText(/エラー: Failed to load tasks/)).toBeInTheDocument();
  });
});