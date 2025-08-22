import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoFilter } from "./todo-filter";

describe("TodoFilter", () => {
  it("renders all filter options", () => {
    render(<TodoFilter filter={null} onFilterChange={vi.fn()} />);
    
    expect(screen.getByText("すべて")).toBeInTheDocument();
    expect(screen.getByText("未完了")).toBeInTheDocument();
    expect(screen.getByText("完了済み")).toBeInTheDocument();
    expect(screen.getByText("期限切れ")).toBeInTheDocument();
  });

  it("shows active filter", () => {
    const filter = { completed: false };
    render(<TodoFilter filter={filter} onFilterChange={vi.fn()} />);
    
    const activeButton = screen.getByText("未完了");
    expect(activeButton).toHaveAttribute("data-state", "on");
  });

  it("calls onFilterChange when filter is clicked", () => {
    const handleFilterChange = vi.fn();
    render(<TodoFilter filter={null} onFilterChange={handleFilterChange} />);
    
    fireEvent.click(screen.getByText("未完了"));
    
    expect(handleFilterChange).toHaveBeenCalledWith({ completed: false });
  });

  it("clears filter when clicking all", () => {
    const handleFilterChange = vi.fn();
    const filter = { completed: false };
    render(<TodoFilter filter={filter} onFilterChange={handleFilterChange} />);
    
    fireEvent.click(screen.getByText("すべて"));
    
    expect(handleFilterChange).toHaveBeenCalledWith(null);
  });

  it("renders priority dropdown button", () => {
    render(<TodoFilter filter={null} onFilterChange={vi.fn()} />);
    
    const priorityButton = screen.getByRole("button", { name: "優先度" });
    expect(priorityButton).toBeInTheDocument();
  });

  it("renders sort dropdown when onSortChange is provided", () => {
    const handleSortChange = vi.fn();
    render(<TodoFilter filter={null} onFilterChange={vi.fn()} onSortChange={handleSortChange} />);
    
    const sortButton = screen.getByRole("button", { name: "並び替え" });
    expect(sortButton).toBeInTheDocument();
  });
});