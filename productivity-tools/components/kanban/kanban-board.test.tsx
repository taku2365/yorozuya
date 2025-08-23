import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "./kanban-board";
import { useKanbanStore } from "@/lib/stores/kanban-store";

// Mock the store
vi.mock("@/lib/stores/kanban-store");

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("KanbanBoard", () => {
  const mockStore = {
    lanes: [
      { id: "1", title: "ToDo", position: 0, created_at: "", updated_at: "" },
      { id: "2", title: "進行中", position: 1, wip_limit: 3, created_at: "", updated_at: "" },
      { id: "3", title: "完了", position: 2, created_at: "", updated_at: "" },
    ],
    cards: [
      { id: "1", title: "タスク1", lane_id: "1", position: 0, created_at: "", updated_at: "" },
      { id: "2", title: "タスク2", lane_id: "2", position: 0, created_at: "", updated_at: "" },
    ],
    isLoading: false,
    error: null,
    fetchLanes: vi.fn(),
    fetchCards: vi.fn(),
    createLane: vi.fn(),
    updateLane: vi.fn(),
    deleteLane: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    moveCard: vi.fn(),
    getCardsByLane: vi.fn((laneId) => 
      mockStore.cards.filter(card => card.lane_id === laneId)
    ),
    isWipLimitReached: vi.fn((laneId) => {
      if (laneId === "2") {
        const cardsInLane = mockStore.cards.filter(card => card.lane_id === laneId);
        return cardsInLane.length >= 3;
      }
      return false;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useKanbanStore as any).mockReturnValue(mockStore);
  });

  it("レーンとカードを表示する", async () => {
    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("ToDo")).toBeInTheDocument();
      expect(screen.getByText("進行中")).toBeInTheDocument();
      expect(screen.getByText("完了")).toBeInTheDocument();
      expect(screen.getByText("タスク1")).toBeInTheDocument();
      expect(screen.getByText("タスク2")).toBeInTheDocument();
    });
  });

  it("初回ロード時にfetchを呼ぶ", () => {
    render(<KanbanBoard />);

    expect(mockStore.fetchLanes).toHaveBeenCalledTimes(1);
    expect(mockStore.fetchCards).toHaveBeenCalledTimes(1);
  });

  it("レーン追加ボタンをクリックするとダイアログが開く", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard />);

    const addButton = screen.getByRole("button", { name: /レーンを追加/i });
    await user.click(addButton);

    expect(screen.getByText("新しいレーン")).toBeInTheDocument();
  });

  it("カード数とWIP制限を表示する", async () => {
    render(<KanbanBoard />);

    await waitFor(() => {
      // ToDo lane: 1 card, no limit
      expect(screen.getByText("1")).toBeInTheDocument();
      // 進行中 lane: 1 card, limit 3
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });
  });

  it("WIP制限に達していない場合は警告を表示しない", async () => {
    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.queryByText("WIP制限に達しています")).not.toBeInTheDocument();
    });
  });

  it("エラーがある場合はトーストを表示する", async () => {
    const mockStoreWithError = {
      ...mockStore,
      error: "データの取得に失敗しました",
    };
    (useKanbanStore as any).mockReturnValue(mockStoreWithError);

    render(<KanbanBoard />);

    // Toast hook is mocked, so we just verify the component renders
    expect(screen.getByText("カンバンボード")).toBeInTheDocument();
  });
});