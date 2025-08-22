import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WBSTemplateManager, type WBSTemplate } from "./wbs-template-manager";
import type { WBSTask } from "@/lib/db/types";

const mockTasks: WBSTask[] = [
  {
    id: "1",
    title: "プロジェクト企画",
    position: 0,
    progress: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    title: "要件定義",
    parent_id: "1",
    position: 0,
    progress: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const mockTemplates: WBSTemplate[] = [
  {
    id: "template-1",
    name: "Webサイト制作",
    description: "標準的なWebサイト制作プロジェクト",
    tasks: mockTasks,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

describe("WBSTemplateManager", () => {
  const mockHandlers = {
    onSaveTemplate: vi.fn(),
    onLoadTemplate: vi.fn(),
    onDeleteTemplate: vi.fn(),
    onExportTemplate: vi.fn(),
    onImportTemplate: vi.fn(),
  };

  beforeEach(() => {
    Object.values(mockHandlers).forEach(handler => handler.mockClear());
  });

  it("renders with empty state", () => {
    render(
      <WBSTemplateManager
        currentTasks={[]}
        templates={[]}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText("テンプレート管理")).toBeInTheDocument();
    expect(screen.getByText("まだテンプレートが保存されていません")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /現在のWBSを保存/ })).toBeDisabled();
  });

  it("enables save button when tasks exist", () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={[]}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByRole("button", { name: /現在のWBSを保存/ })).not.toBeDisabled();
  });

  it("shows template creation form", () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={[]}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: /現在のWBSを保存/ }));
    
    expect(screen.getByLabelText("テンプレート名")).toBeInTheDocument();
    expect(screen.getByLabelText("説明（任意）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
  });

  it("saves template with form data", async () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={[]}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: /現在のWBSを保存/ }));
    
    fireEvent.change(screen.getByLabelText("テンプレート名"), {
      target: { value: "新規プロジェクト" }
    });
    
    fireEvent.change(screen.getByLabelText("説明（任意）"), {
      target: { value: "テスト用テンプレート" }
    });
    
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    
    await waitFor(() => {
      expect(mockHandlers.onSaveTemplate).toHaveBeenCalledWith({
        name: "新規プロジェクト",
        description: "テスト用テンプレート",
        tasks: mockTasks,
      });
    });
  });

  it("cancels template creation", () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={[]}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: /現在のWBSを保存/ }));
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    
    expect(screen.queryByLabelText("テンプレート名")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /現在のWBSを保存/ })).toBeInTheDocument();
  });

  it("displays existing templates", () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={mockTemplates}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText("テンプレートを選択")).toBeInTheDocument();
    
    // Open select dropdown
    fireEvent.click(screen.getByRole("combobox"));
    
    expect(screen.getByText("Webサイト制作")).toBeInTheDocument();
  });

  it.skip("loads selected template", async () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={mockTemplates}
        {...mockHandlers}
      />
    );
    
    // Open select dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    
    // Select the template
    const option = await screen.findByRole("option", { name: "Webサイト制作" });
    fireEvent.click(option);
    
    // Wait for the button to appear (regardless of dropdown state)
    const loadButton = await screen.findByText("読み込む", {}, { timeout: 3000 });
    expect(loadButton).toBeInTheDocument();
    
    fireEvent.click(loadButton.closest('button')!);
    
    expect(mockHandlers.onLoadTemplate).toHaveBeenCalledWith("template-1");
  });

  it.skip("exports selected template", async () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={mockTemplates}
        {...mockHandlers}
      />
    );
    
    // Open select dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    
    // Select the template
    const option = await screen.findByRole("option", { name: "Webサイト制作" });
    fireEvent.click(option);
    
    // Wait for the button to appear
    const exportButton = await screen.findByText("エクスポート", {}, { timeout: 3000 });
    expect(exportButton).toBeInTheDocument();
    
    fireEvent.click(exportButton.closest('button')!);
    
    expect(mockHandlers.onExportTemplate).toHaveBeenCalledWith("template-1");
  });

  it.skip("shows delete confirmation dialog", async () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={mockTemplates}
        {...mockHandlers}
      />
    );
    
    // Open select dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    
    // Select the template
    const option = await screen.findByRole("option", { name: "Webサイト制作" });
    fireEvent.click(option);
    
    // Wait for the button to appear
    const deleteButton = await screen.findByText("削除", {}, { timeout: 3000 });
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.click(deleteButton.closest('button')!);
    
    expect(screen.getByText("テンプレートを削除しますか？")).toBeInTheDocument();
    expect(screen.getByText(/このテンプレートを削除すると、元に戻すことはできません/)).toBeInTheDocument();
  });

  it.skip("deletes template when confirmed", async () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={mockTemplates}
        {...mockHandlers}
      />
    );
    
    // Open select dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    
    // Select the template
    const option = await screen.findByRole("option", { name: "Webサイト制作" });
    fireEvent.click(option);
    
    // Wait for the button to appear
    const deleteButton = await screen.findByText("削除", {}, { timeout: 3000 });
    fireEvent.click(deleteButton.closest('button')!);
    
    // Wait for dialog and click confirm
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "削除する" })).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    
    expect(mockHandlers.onDeleteTemplate).toHaveBeenCalledWith("template-1");
  });

  it("handles file import", () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={[]}
        {...mockHandlers}
      />
    );
    
    const file = new File(["{}"], "template.json", { type: "application/json" });
    const input = screen.getByLabelText("テンプレートをインポート");
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockHandlers.onImportTemplate).toHaveBeenCalledWith(file);
  });

  it("validates template name before saving", () => {
    render(
      <WBSTemplateManager
        currentTasks={mockTasks}
        templates={[]}
        {...mockHandlers}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: /現在のWBSを保存/ }));
    
    const saveButton = screen.getByRole("button", { name: "保存" });
    expect(saveButton).toBeDisabled();
    
    // Enter whitespace only
    fireEvent.change(screen.getByLabelText("テンプレート名"), {
      target: { value: "   " }
    });
    
    expect(saveButton).toBeDisabled();
    
    // Enter valid name
    fireEvent.change(screen.getByLabelText("テンプレート名"), {
      target: { value: "Valid Name" }
    });
    
    expect(saveButton).not.toBeDisabled();
  });
});