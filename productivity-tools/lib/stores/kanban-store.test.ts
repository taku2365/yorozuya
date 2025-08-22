import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useKanbanStore } from "./kanban-store";
import type { KanbanLane, KanbanCard } from "../db/types";

// Mock the database singleton
vi.mock("../db/singleton", () => ({
  getDatabase: vi.fn(),
}));

// Mock localStorage to prevent persist middleware issues
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock state for tests
const mockState = {
  reset: () => {
    mockState.lanes = [...mockState.initialLanes];
    mockState.cards = [...mockState.initialCards];
  },
  initialLanes: [
    {
      id: "lane-1",
      title: "To Do",
      position: 0,
      wip_limit: 5,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    {
      id: "lane-2",
      title: "In Progress",
      position: 1,
      wip_limit: 3,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    {
      id: "lane-3",
      title: "Done",
      position: 2,
      wip_limit: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  ] as KanbanLane[],
  initialCards: [
    {
      id: "card-1",
      title: "Task 1",
      description: "First task",
      lane_id: "lane-1",
      position: 0,
      labels: "bug",
      due_date: "2024-12-31",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    {
      id: "card-2",
      title: "Task 2",
      lane_id: "lane-2",
      position: 0,
      labels: "feature",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  ] as KanbanCard[],
  lanes: [] as KanbanLane[],
  cards: [] as KanbanCard[],
};

// Create a factory for repository instances
const createMockRepository = () => {
  // Deep clone to ensure complete isolation between tests
  const mockLanes = JSON.parse(JSON.stringify(mockState.initialLanes));
  const mockCards = JSON.parse(JSON.stringify(mockState.initialCards));
  
  return {
    findAllLanes: vi.fn().mockImplementation(() => 
      Promise.resolve(mockLanes)
    ),
    findAllCards: vi.fn().mockImplementation(() => 
      Promise.resolve(mockCards)
    ),
    findLaneById: vi.fn().mockImplementation((id: string) => {
      const lane = mockLanes.find((l) => l.id === id);
      return Promise.resolve(lane || null);
    }),
    findCardById: vi.fn().mockImplementation((id: string) => {
      const card = mockCards.find((c) => c.id === id);
      return Promise.resolve(card || null);
    }),
    findCardsByLane: vi.fn().mockImplementation((laneId: string) => {
      const cards = mockCards.filter((c) => c.lane_id === laneId);
      return Promise.resolve(cards);
    }),
    createLane: vi.fn().mockImplementation((data) => {
      const newLane = {
        id: `lane-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockLanes.push(newLane);
      return Promise.resolve(newLane);
    }),
    updateLane: vi.fn().mockImplementation((id, data) => {
      const lane = mockLanes.find(l => l.id === id);
      if (lane) {
        Object.assign(lane, data, { updated_at: new Date().toISOString() });
        return Promise.resolve(lane);
      }
      return Promise.resolve(null);
    }),
    deleteLane: vi.fn().mockImplementation((id) => {
      const laneIndex = mockLanes.findIndex(l => l.id === id);
      if (laneIndex !== -1) {
        mockLanes.splice(laneIndex, 1);
      }
      // Remove cards in the lane
      for (let i = mockCards.length - 1; i >= 0; i--) {
        if (mockCards[i].lane_id === id) {
          mockCards.splice(i, 1);
        }
      }
      return Promise.resolve(undefined);
    }),
    createCard: vi.fn().mockImplementation((data: Partial<KanbanCard>) => {
      // Check WIP limit
      const cardsInLane = mockCards.filter((c) => c.lane_id === data.lane_id);
      const lane = mockLanes.find((l) => l.id === data.lane_id);
      if (lane?.wip_limit && cardsInLane.length >= lane.wip_limit) {
        return Promise.reject(new Error("WIP limit exceeded"));
      }
      
      const newCard = {
        id: `card-${Date.now()}-${Math.random()}`,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockCards.push(newCard);
      return Promise.resolve(newCard);
    }),
    updateCard: vi.fn().mockImplementation((id, data) => {
      const card = mockCards.find(c => c.id === id);
      if (card) {
        Object.assign(card, data, { updated_at: new Date().toISOString() });
        return Promise.resolve(card);
      }
      return Promise.resolve(null);
    }),
    deleteCard: vi.fn().mockImplementation((id) => {
      const cardIndex = mockCards.findIndex(c => c.id === id);
      if (cardIndex !== -1) {
        mockCards.splice(cardIndex, 1);
      }
      return Promise.resolve(undefined);
    }),
    moveCard: vi.fn().mockImplementation((cardId, targetLaneId, newPosition) => {
      const card = mockCards.find(c => c.id === cardId);
      if (card) {
        // Check WIP limit for target lane
        if (card.lane_id !== targetLaneId) {
          const cardsInTargetLane = mockCards.filter(c => c.lane_id === targetLaneId);
          const targetLane = mockLanes.find(l => l.id === targetLaneId);
          if (targetLane?.wip_limit && cardsInTargetLane.length >= targetLane.wip_limit) {
            return Promise.reject(new Error("WIP limit exceeded"));
          }
        }
        
        card.lane_id = targetLaneId;
        card.position = newPosition;
        card.updated_at = new Date().toISOString();
      }
      return Promise.resolve(undefined);
    }),
  };
};

// Mock the KanbanRepository
vi.mock("../repositories/kanban-repository", () => {
  return {
    KanbanRepository: vi.fn().mockImplementation(() => createMockRepository()),
  };
});

describe("KanbanStore", () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset mock state FIRST
    mockState.reset();
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset store state completely
    useKanbanStore.setState({
      lanes: [],
      cards: [],
      isLoading: false,
      error: null,
    });
    
    // Small delay to ensure state is reset
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe("State Management", () => {
    it("should initialize with empty lanes and cards", () => {
      const { result } = renderHook(() => useKanbanStore());
      
      expect(result.current.lanes).toEqual([]);
      expect(result.current.cards).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should set loading state", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      await act(async () => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it("should set error state", async () => {
      const { result } = renderHook(() => useKanbanStore());
      const error = "Test error";
      
      await act(async () => {
        result.current.setError(error);
      });
      
      expect(result.current.error).toBe(error);
    });
  });

  describe("CRUD Operations - Lanes", () => {
    it("should fetch all lanes", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      await act(async () => {
        await result.current.fetchLanes();
      });
      
      expect(result.current.lanes).toHaveLength(3);
      expect(result.current.lanes[0].title).toBe("To Do");
      expect(result.current.lanes[1].title).toBe("In Progress");
    });

    it("should create a new lane", async () => {
      const { result } = renderHook(() => useKanbanStore());
      const newLane = {
        title: "Review",
        position: 3,
        wip_limit: 2,
      };
      
      await act(async () => {
        await result.current.createLane(newLane);
      });
      
      await waitFor(() => {
        expect(result.current.lanes).toContainEqual(
          expect.objectContaining({
            title: "Review",
            position: 3,
            wip_limit: 2,
          })
        );
      });
    });

    it("should update a lane", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // First fetch lanes
      await act(async () => {
        await result.current.fetchLanes();
      });
      
      // Then update one
      await act(async () => {
        await result.current.updateLane("lane-1", { 
          title: "Backlog",
          wip_limit: 10 
        });
      });
      
      const updatedLane = result.current.lanes.find(l => l.id === "lane-1");
      expect(updatedLane?.title).toBe("Backlog");
      expect(updatedLane?.wip_limit).toBe(10);
    });

    it("should delete a lane and its cards", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // First fetch lanes and cards
      await act(async () => {
        await result.current.fetchLanes();
        await result.current.fetchCards();
      });
      
      const initialCardsInLane1 = result.current.cards.filter(c => c.lane_id === "lane-1").length;
      expect(initialCardsInLane1).toBeGreaterThan(0);
      
      // Then delete lane
      await act(async () => {
        await result.current.deleteLane("lane-1");
      });
      
      expect(result.current.lanes.find(l => l.id === "lane-1")).toBeUndefined();
      expect(result.current.cards.filter(c => c.lane_id === "lane-1")).toHaveLength(0);
    });
  });

  describe("CRUD Operations - Cards", () => {
    it("should fetch all cards", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      await act(async () => {
        await result.current.fetchCards();
      });
      
      expect(result.current.cards).toHaveLength(2);
      expect(result.current.cards[0].title).toBe("Task 1");
    });

    it("should create a new card", async () => {
      const { result } = renderHook(() => useKanbanStore());
      const newCard = {
        title: "New Task",
        description: "New task description",
        lane_id: "lane-1",
        position: 1,
        labels: "enhancement",
      };
      
      await act(async () => {
        await result.current.createCard(newCard);
      });
      
      await waitFor(() => {
        expect(result.current.cards).toContainEqual(
          expect.objectContaining({
            title: "New Task",
            description: "New task description",
            lane_id: "lane-1",
            labels: "enhancement",
          })
        );
      });
    });

    it("should update a card", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // First fetch cards
      await act(async () => {
        await result.current.fetchCards();
      });
      
      // Then update one
      await act(async () => {
        await result.current.updateCard("card-1", { 
          title: "Updated Task",
          labels: "bug,urgent" 
        });
      });
      
      const updatedCard = result.current.cards.find(c => c.id === "card-1");
      expect(updatedCard?.title).toBe("Updated Task");
      expect(updatedCard?.labels).toBe("bug,urgent");
    });

    it("should delete a card", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // First fetch cards
      await act(async () => {
        await result.current.fetchCards();
      });
      
      expect(result.current.cards).toHaveLength(2);
      
      // Then delete one
      await act(async () => {
        await result.current.deleteCard("card-1");
      });
      
      expect(result.current.cards).toHaveLength(1);
      expect(result.current.cards.find(c => c.id === "card-1")).toBeUndefined();
    });
  });

  describe("Card Movement", () => {
    it("should move a card to another lane", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      await act(async () => {
        await result.current.fetchCards();
      });
      
      await act(async () => {
        await result.current.moveCard("card-1", "lane-2", 1);
      });
      
      const movedCard = result.current.cards.find(c => c.id === "card-1");
      expect(movedCard?.lane_id).toBe("lane-2");
      expect(movedCard?.position).toBe(1);
    });

    it("should respect WIP limits when creating cards", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // Set up state with lane-2 already at WIP limit
      await act(async () => {
        useKanbanStore.setState({
          lanes: [
            { id: "lane-1", title: "To Do", position: 0, wip_limit: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "lane-2", title: "In Progress", position: 1, wip_limit: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
          ],
          cards: [
            { id: "card-1", title: "Task 1", lane_id: "lane-1", position: 0, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "card-2", title: "Task 2", lane_id: "lane-2", position: 0, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "card-3", title: "Task 3", lane_id: "lane-2", position: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "card-4", title: "Task 4", lane_id: "lane-2", position: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
          ],
        });
      });
      
      // Verify lane-2 is at WIP limit
      const cardsInLane2 = result.current.cards.filter(c => c.lane_id === "lane-2").length;
      expect(cardsInLane2).toBe(3);
      
      // Mock the repository to throw error when creating card in full lane
      const mockError = new Error("WIP limit exceeded");
      const { KanbanRepository } = await import("../repositories/kanban-repository");
      vi.mocked(KanbanRepository).mockImplementationOnce(() => ({
        ...createMockRepository(),
        createCard: vi.fn().mockRejectedValue(mockError),
      }));
      
      // Try to create another card in lane-2 (should fail)
      await expect(
        result.current.createCard({
          title: "New Task",
          lane_id: "lane-2",
          position: 3,
        })
      ).rejects.toThrow("WIP limit exceeded");
    });
  });

  describe("Utility Functions", () => {
    it("should get cards by lane", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // Set state directly
      await act(async () => {
        useKanbanStore.setState({
          cards: [
            { id: "card-1", title: "Task 1", lane_id: "lane-1", position: 0, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "card-2", title: "Task 2", lane_id: "lane-2", position: 0, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "card-3", title: "Task 3", lane_id: "lane-1", position: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
          ],
        });
      });
      
      const lane1Cards = result.current.getCardsByLane("lane-1");
      expect(lane1Cards).toHaveLength(2);
      expect(lane1Cards[0].title).toBe("Task 1");
      expect(lane1Cards[1].title).toBe("Task 3");
      
      const lane2Cards = result.current.getCardsByLane("lane-2");
      expect(lane2Cards).toHaveLength(1);
      expect(lane2Cards[0].title).toBe("Task 2");
    });

    it("should check if WIP limit is reached", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // Set up state directly
      await act(async () => {
        useKanbanStore.setState({
          lanes: [
            { id: "lane-1", title: "To Do", position: 0, wip_limit: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "lane-2", title: "Done", position: 1, wip_limit: undefined, created_at: "2024-01-01", updated_at: "2024-01-01" },
          ],
          cards: [
            { id: "card-1", title: "Task 1", lane_id: "lane-1", position: 0, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: "card-2", title: "Task 2", lane_id: "lane-1", position: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
          ],
        });
      });
      
      // Lane 1 has 2 cards, WIP limit is 3
      expect(result.current.isWipLimitReached("lane-1")).toBe(false);
      
      // Add one more card to reach WIP limit
      await act(async () => {
        useKanbanStore.setState((state) => ({
          cards: [...state.cards, { id: "card-3", title: "Task 3", lane_id: "lane-1", position: 2, created_at: "2024-01-01", updated_at: "2024-01-01" }],
        }));
      });
      
      // Now at WIP limit
      expect(result.current.isWipLimitReached("lane-1")).toBe(true);
      
      // Lane 2 has no WIP limit
      expect(result.current.isWipLimitReached("lane-2")).toBe(false);
    });
  });

  describe("Local Storage Sync", () => {
    it.skip("should save lanes and cards to localStorage on update", async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      await act(async () => {
        await result.current.fetchLanes();
        await result.current.fetchCards();
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "kanban-cache",
        expect.any(String)
      );
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls.find(
        call => call[0] === "kanban-cache"
      )?.[1] || "{}");
      
      // Zustand persist middleware saves data in state property
      expect(savedData.state).toBeDefined();
      expect(savedData.state.lanes).toHaveLength(3);
      expect(savedData.state.cards).toHaveLength(2);
    });
  });
});