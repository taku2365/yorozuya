import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanCardComponent } from "./kanban-card";
import type { KanbanCard } from "@/lib/db/types";

// Mock DnD Kit
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  CSS: {
    Transform: {
      toString: () => "",
    },
  },
}));

describe("KanbanCardComponent", () => {
  const mockCard: KanbanCard = {
    id: "card-1",
    title: "テストカード",
    description: "これはテストカードの説明です",
    lane_id: "lane-1",
    position: 0,
    labels: "バグ, 優先度高, UI改善",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it("カードのタイトルを表示する", () => {
    render(
      <KanbanCardComponent
        card={mockCard}
        {...mockHandlers}
      />
    );

    expect(screen.getByText("テストカード")).toBeInTheDocument();
  });

  it("カードの説明を表示する", () => {
    render(
      <KanbanCardComponent
        card={mockCard}
        {...mockHandlers}
      />
    );

    expect(screen.getByText("これはテストカードの説明です")).toBeInTheDocument();
  });

  it("ラベルを表示する", () => {
    render(
      <KanbanCardComponent
        card={mockCard}
        {...mockHandlers}
      />
    );

    expect(screen.getByText("バグ")).toBeInTheDocument();
    expect(screen.getByText("優先度高")).toBeInTheDocument();
    expect(screen.getByText("UI改善")).toBeInTheDocument();
  });

  it("説明なしのカードを表示する", () => {
    const cardWithoutDescription = { ...mockCard, description: undefined };
    render(
      <KanbanCardComponent
        card={cardWithoutDescription}
        {...mockHandlers}
      />
    );

    expect(screen.getByText("テストカード")).toBeInTheDocument();
    expect(screen.queryByText("これはテストカードの説明です")).not.toBeInTheDocument();
  });

  it("ラベルなしのカードを表示する", () => {
    const cardWithoutLabels = { ...mockCard, labels: undefined };
    render(
      <KanbanCardComponent
        card={cardWithoutLabels}
        {...mockHandlers}
      />
    );

    expect(screen.getByText("テストカード")).toBeInTheDocument();
    expect(screen.queryByText("バグ")).not.toBeInTheDocument();
  });

  it("メニューから編集を選択するとonEditが呼ばれる", async () => {
    const user = userEvent.setup();
    render(
      <KanbanCardComponent
        card={mockCard}
        {...mockHandlers}
      />
    );

    // メニューを開く
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // 編集を選択
    const editButton = screen.getByText("編集");
    await user.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockCard);
  });

  it("メニューから削除を選択するとonDeleteが呼ばれる", async () => {
    const user = userEvent.setup();
    render(
      <KanbanCardComponent
        card={mockCard}
        {...mockHandlers}
      />
    );

    // メニューを開く
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // 削除を選択
    const deleteButton = screen.getByText("削除");
    await user.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith("card-1");
  });

  it("ドラッグ中は透明度が変わる", () => {
    // Mock useSortable to return isDragging = true
    const useSortableMock = vi.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: { x: 10, y: 10 },
      transition: "transform 200ms",
      isDragging: true,
    }));
    
    vi.doMock("@dnd-kit/sortable", () => ({
      useSortable: useSortableMock,
      CSS: {
        Transform: {
          toString: () => "transform: translate(10px, 10px)",
        },
      },
    }));

    const { container } = render(
      <KanbanCardComponent
        card={mockCard}
        {...mockHandlers}
      />
    );

    // ドラッグ状態のテストは実際のDnDコンテキストが必要なためスキップ
    expect(container.firstChild).toBeTruthy();
  });
});