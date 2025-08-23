import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanFilter } from "./kanban-filter";

describe("KanbanFilter", () => {
  const mockProps = {
    labels: ["バグ", "機能追加", "UI改善", "優先度高"],
    selectedLabels: ["バグ"],
    onLabelToggle: vi.fn(),
    searchQuery: "テスト",
    onSearchChange: vi.fn(),
  };

  it("検索ボックスを表示する", () => {
    render(<KanbanFilter {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText("カードを検索...");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue("テスト");
  });

  it("検索クエリの変更でonSearchChangeが呼ばれる", async () => {
    const user = userEvent.setup();
    const onSearchChangeMock = vi.fn();
    render(<KanbanFilter {...mockProps} onSearchChange={onSearchChangeMock} />);
    
    const searchInput = screen.getByPlaceholderText("カードを検索...");
    await user.clear(searchInput);
    await user.type(searchInput, "新");
    
    // clearと最初の文字入力が呼ばれることを確認
    expect(onSearchChangeMock).toHaveBeenCalledWith("");
    expect(onSearchChangeMock).toHaveBeenCalledWith("新");
  });

  it("フィルタクリアボタンを表示する（アクティブなフィルタがある場合）", () => {
    render(<KanbanFilter {...mockProps} />);
    
    expect(screen.getByText("フィルタをクリア")).toBeInTheDocument();
  });

  it("フィルタクリアボタンを表示しない（アクティブなフィルタがない場合）", () => {
    render(
      <KanbanFilter
        {...mockProps}
        selectedLabels={[]}
        searchQuery=""
      />
    );
    
    expect(screen.queryByText("フィルタをクリア")).not.toBeInTheDocument();
  });

  it("フィルタクリアボタンをクリックするとフィルタがリセットされる", async () => {
    const user = userEvent.setup();
    render(<KanbanFilter {...mockProps} />);
    
    const clearButton = screen.getByText("フィルタをクリア");
    await user.click(clearButton);
    
    expect(mockProps.onLabelToggle).toHaveBeenCalledWith("バグ");
    expect(mockProps.onSearchChange).toHaveBeenCalledWith("");
  });

  it("ラベルフィルタセクションを展開できる", async () => {
    const user = userEvent.setup();
    render(<KanbanFilter {...mockProps} />);
    
    // 初期状態では展開されていない
    expect(screen.queryByText("機能追加")).not.toBeInTheDocument();
    
    // 展開ボタンをクリック
    const expandButton = screen.getByText(/ラベルでフィルタ/);
    await user.click(expandButton);
    
    // ラベルが表示される
    expect(screen.getByText("バグ")).toBeInTheDocument();
    expect(screen.getByText("機能追加")).toBeInTheDocument();
    expect(screen.getByText("UI改善")).toBeInTheDocument();
    expect(screen.getByText("優先度高")).toBeInTheDocument();
  });

  it("選択されたラベルは異なるスタイルで表示される", async () => {
    const user = userEvent.setup();
    render(<KanbanFilter {...mockProps} />);
    
    // ラベルセクションを展開
    const expandButton = screen.getByText(/ラベルでフィルタ/);
    await user.click(expandButton);
    
    // 選択されたラベル（バグ）のBadgeコンポーネントを確認
    const selectedBadge = screen.getByText("バグ").closest('.inline-flex');
    const unselectedBadge = screen.getByText("機能追加").closest('.inline-flex');
    
    // 選択されたラベルと選択されていないラベルが異なるvariantを持つことを確認
    expect(selectedBadge).toHaveClass("bg-primary");
    expect(unselectedBadge).toHaveClass("border");
  });

  it("ラベルをクリックするとonLabelToggleが呼ばれる", async () => {
    const user = userEvent.setup();
    render(<KanbanFilter {...mockProps} />);
    
    // ラベルセクションを展開
    const expandButton = screen.getByText(/ラベルでフィルタ/);
    await user.click(expandButton);
    
    // ラベルをクリック
    const label = screen.getByText("機能追加");
    await user.click(label);
    
    expect(mockProps.onLabelToggle).toHaveBeenCalledWith("機能追加");
  });

  it("ラベルがない場合はラベルセクションを表示しない", () => {
    render(
      <KanbanFilter
        {...mockProps}
        labels={[]}
      />
    );
    
    expect(screen.queryByText(/ラベルでフィルタ/)).not.toBeInTheDocument();
  });
});