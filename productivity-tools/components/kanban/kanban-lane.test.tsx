import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanLaneComponent } from "./kanban-lane";
import type { KanbanLane, KanbanCard } from "@/lib/db/types";

// Mock DnD Kit
vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => children,
  verticalListSortingStrategy: [],
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

describe("KanbanLaneComponent", () => {
  const mockLane: KanbanLane = {
    id: "lane-1",
    title: "ToDo",
    position: 0,
    wip_limit: 3,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };

  const mockCards: KanbanCard[] = [
    {
      id: "card-1",
      title: "タスク1",
      lane_id: "lane-1",
      position: 0,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    {
      id: "card-2",
      title: "タスク2",
      description: "説明文",
      lane_id: "lane-1",
      position: 1,
      labels: "バグ, 優先度高",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  ];

  const mockHandlers = {
    onAddCard: vi.fn(),
    onEditCard: vi.fn(),
    onDeleteCard: vi.fn(),
    onEditLane: vi.fn(),
    onDeleteLane: vi.fn(),
  };

  it("レーンのタイトルとカード数を表示する", () => {
    render(
      <KanbanLaneComponent
        lane={mockLane}
        cards={mockCards}
        {...mockHandlers}
        isWipLimitReached={false}
      />
    );

    expect(screen.getByText("ToDo")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("WIP制限なしの場合はカード数のみ表示", () => {
    const laneWithoutLimit = { ...mockLane, wip_limit: undefined };
    render(
      <KanbanLaneComponent
        lane={laneWithoutLimit}
        cards={mockCards}
        {...mockHandlers}
        isWipLimitReached={false}
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("2 / 3")).not.toBeInTheDocument();
  });

  it("WIP制限に達した場合は警告を表示", () => {
    render(
      <KanbanLaneComponent
        lane={mockLane}
        cards={mockCards}
        {...mockHandlers}
        isWipLimitReached={true}
      />
    );

    expect(screen.getByText("WIP制限に達しています")).toBeInTheDocument();
  });

  it("WIP制限に達した場合は追加ボタンが無効になる", () => {
    render(
      <KanbanLaneComponent
        lane={mockLane}
        cards={mockCards}
        {...mockHandlers}
        isWipLimitReached={true}
      />
    );

    // Plusアイコンを含むボタンを探す
    const addButtons = screen.getAllByRole("button");
    const addButton = addButtons.find(button => {
      // ボタン内にPlusアイコンがあるかチェック
      return button.querySelector('svg.lucide-plus') !== null;
    });
    
    expect(addButton).toBeDefined();
    expect(addButton).toBeDisabled();
  });

  it("カードを表示する", () => {
    render(
      <KanbanLaneComponent
        lane={mockLane}
        cards={mockCards}
        {...mockHandlers}
        isWipLimitReached={false}
      />
    );

    expect(screen.getByText("タスク1")).toBeInTheDocument();
    expect(screen.getByText("タスク2")).toBeInTheDocument();
    expect(screen.getByText("説明文")).toBeInTheDocument();
    expect(screen.getByText("バグ")).toBeInTheDocument();
    expect(screen.getByText("優先度高")).toBeInTheDocument();
  });

  it("追加ボタンをクリックするとonAddCardが呼ばれる", async () => {
    const user = userEvent.setup();
    render(
      <KanbanLaneComponent
        lane={mockLane}
        cards={mockCards}
        {...mockHandlers}
        isWipLimitReached={false}
      />
    );

    // Plusアイコンを含むボタンを探す
    const addButtons = screen.getAllByRole("button");
    const addButton = addButtons.find(button => {
      return button.querySelector('svg.lucide-plus') !== null;
    });
    
    expect(addButton).toBeDefined();
    if (addButton) {
      await user.click(addButton);
      expect(mockHandlers.onAddCard).toHaveBeenCalledWith("lane-1");
    }
  });

  it("レーンメニューからの操作", async () => {
    const user = userEvent.setup();
    render(
      <KanbanLaneComponent
        lane={mockLane}
        cards={mockCards}
        {...mockHandlers}
        isWipLimitReached={false}
      />
    );

    // MoreVerticalアイコンを含むボタンを探す
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons.find(button => {
      return button.querySelector('svg.lucide-ellipsis-vertical') !== null;
    });
    
    expect(menuButton).toBeDefined();
    if (!menuButton) return;
    
    await user.click(menuButton);

    // レーン編集
    const editButton = screen.getByText("レーンを編集");
    await user.click(editButton);
    expect(mockHandlers.onEditLane).toHaveBeenCalledWith(mockLane);

    // メニューを再度開く
    await user.click(menuButton);

    // レーン削除
    const deleteButton = screen.getByText("レーンを削除");
    await user.click(deleteButton);
    expect(mockHandlers.onDeleteLane).toHaveBeenCalledWith("lane-1");
  });
});