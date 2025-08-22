import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { KanbanRepository } from "./kanban-repository";
import type { KanbanCard, KanbanLane } from "../db/types";

// Mock the database
vi.mock("../db/database");

describe("KanbanRepository", () => {
  let repository: KanbanRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
    };
    repository = new KanbanRepository(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Lane operations", () => {
    describe("createLane", () => {
      it("should create a new lane", async () => {
        const newLane = {
          title: "In Progress",
          position: 1,
          wip_limit: 5,
        };

        mockDb.execute.mockResolvedValueOnce([]);

        const result = await repository.createLane(newLane);

        expect(result).toMatchObject({
          id: expect.any(String),
          title: newLane.title,
          position: newLane.position,
          wip_limit: newLane.wip_limit,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        });

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO kanban_lanes"),
          expect.arrayContaining([
            expect.any(String), // id
            newLane.title,
            newLane.position,
            newLane.wip_limit,
          ])
        );
      });
    });

    describe("findAllLanes", () => {
      it("should return all lanes ordered by position", async () => {
        const mockLanes = [
          { id: "1", title: "To Do", position: 0, created_at: "2024-01-01", updated_at: "2024-01-01" },
          { id: "2", title: "In Progress", position: 1, wip_limit: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
          { id: "3", title: "Done", position: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
        ];

        mockDb.execute.mockResolvedValueOnce(mockLanes);

        const result = await repository.findAllLanes();

        expect(result).toEqual(mockLanes);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("SELECT * FROM kanban_lanes ORDER BY position"),
          []
        );
      });
    });

    describe("updateLane", () => {
      it("should update a lane", async () => {
        const updateData = {
          title: "Updated Lane",
          wip_limit: 10,
        };

        // Mock UPDATE execution
        mockDb.execute.mockResolvedValueOnce([]);
        
        // Mock SELECT for findLaneById
        mockDb.execute.mockResolvedValueOnce([
          {
            id: "1",
            title: "Updated Lane",
            position: 0,
            wip_limit: 10,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          }
        ]);

        const result = await repository.updateLane("1", updateData);

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE kanban_lanes SET"),
          expect.arrayContaining([updateData.title, updateData.wip_limit, "1"])
        );
        
        expect(result).toMatchObject({
          id: "1",
          title: "Updated Lane",
          wip_limit: 10,
        });
      });
    });

    describe("deleteLane", () => {
      it("should delete a lane and its cards", async () => {
        mockDb.execute.mockResolvedValueOnce([]); // Delete cards
        mockDb.execute.mockResolvedValueOnce([]); // Delete lane

        await repository.deleteLane("1");

        expect(mockDb.execute).toHaveBeenCalledTimes(2);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM kanban_cards WHERE lane_id = ?"),
          ["1"]
        );
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM kanban_lanes WHERE id = ?"),
          ["1"]
        );
      });
    });
  });

  describe("Card operations", () => {
    describe("createCard", () => {
      it("should create a new card", async () => {
        const newCard = {
          title: "New Task",
          description: "Task description",
          lane_id: "lane-1",
          position: 0,
          labels: "bug,urgent",
          todo_id: "todo-123",
        };

        // Mock lane for WIP check
        mockDb.execute.mockResolvedValueOnce([
          { id: "lane-1", wip_limit: null }
        ]);
        
        // Mock insert
        mockDb.execute.mockResolvedValueOnce([]);

        const result = await repository.createCard(newCard);

        expect(result).toMatchObject({
          id: expect.any(String),
          title: newCard.title,
          description: newCard.description,
          lane_id: newCard.lane_id,
          position: newCard.position,
          labels: newCard.labels,
          todo_id: newCard.todo_id,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        });
      });

      it("should enforce WIP limit", async () => {
        // Mock lane with WIP limit of 2
        mockDb.execute.mockResolvedValueOnce([
          { id: "lane-1", wip_limit: 2 }
        ]);
        
        // Mock 2 existing cards (at limit)
        mockDb.execute.mockResolvedValueOnce([
          { id: "card-1" },
          { id: "card-2" }
        ]);

        const newCard = {
          title: "New Task",
          lane_id: "lane-1",
        };

        await expect(repository.createCard(newCard)).rejects.toThrow("WIP limit exceeded");
      });
    });

    describe("findCardsByLane", () => {
      it("should return cards for a specific lane", async () => {
        const mockCards = [
          { id: "1", title: "Card 1", lane_id: "lane-1", position: 0 },
          { id: "2", title: "Card 2", lane_id: "lane-1", position: 1 },
        ];

        mockDb.execute.mockResolvedValueOnce(mockCards);

        const result = await repository.findCardsByLane("lane-1");

        expect(result).toEqual(mockCards);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("SELECT * FROM kanban_cards WHERE lane_id = ? ORDER BY position"),
          ["lane-1"]
        );
      });
    });

    describe("moveCard", () => {
      it("should move a card to a different lane", async () => {
        // Mock target lane (no WIP limit)
        mockDb.execute.mockResolvedValueOnce([
          { id: "lane-2", wip_limit: null }
        ]);

        mockDb.execute.mockResolvedValueOnce([]);

        await repository.moveCard("card-1", "lane-2", 3);

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE kanban_cards SET lane_id = ?, position = ?"),
          ["lane-2", 3, expect.any(String), "card-1"]
        );
      });

      it("should enforce WIP limit when moving cards", async () => {
        // Mock target lane with WIP limit
        mockDb.execute.mockResolvedValueOnce([
          { id: "lane-2", wip_limit: 1 }
        ]);
        
        // Mock 1 existing card (at limit)
        mockDb.execute.mockResolvedValueOnce([
          { id: "existing-card" }
        ]);

        await expect(repository.moveCard("card-1", "lane-2", 0)).rejects.toThrow("WIP limit exceeded");
      });
    });

    describe("updateCard", () => {
      it("should update a card", async () => {
        const updateData = {
          title: "Updated Card",
          description: "New description",
          labels: "feature,done",
        };

        // Mock UPDATE execution
        mockDb.execute.mockResolvedValueOnce([]);
        
        // Mock SELECT for findCardById
        mockDb.execute.mockResolvedValueOnce([
          {
            id: "card-1",
            title: "Updated Card",
            description: "New description",
            labels: "feature,done",
            lane_id: "lane-1",
            position: 0,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          }
        ]);

        const result = await repository.updateCard("card-1", updateData);

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE kanban_cards SET"),
          expect.arrayContaining([
            updateData.title,
            updateData.description,
            updateData.labels,
            "card-1"
          ])
        );
        
        expect(result).toMatchObject({
          id: "card-1",
          title: "Updated Card",
          description: "New description",
          labels: "feature,done",
        });
      });
    });

    describe("deleteCard", () => {
      it("should delete a card", async () => {
        mockDb.execute.mockResolvedValueOnce([]);

        await repository.deleteCard("card-1");

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM kanban_cards WHERE id = ?"),
          ["card-1"]
        );
      });
    });

    describe("searchCards", () => {
      it("should search cards by keyword", async () => {
        const mockCards = [
          { id: "1", title: "Bug fix", description: "Fix login issue" },
          { id: "2", title: "Feature", description: "Add bug reporting" },
        ];

        mockDb.execute.mockResolvedValueOnce(mockCards);

        const result = await repository.searchCards("bug");

        expect(result).toEqual(mockCards);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("WHERE (title LIKE ? OR description LIKE ?)"),
          ["%bug%", "%bug%"]
        );
      });
    });

    describe("findCardsByLabel", () => {
      it("should find cards by label", async () => {
        const mockCards = [
          { id: "1", title: "Card 1", labels: "bug,urgent" },
          { id: "2", title: "Card 2", labels: "bug,feature" },
        ];

        mockDb.execute.mockResolvedValueOnce(mockCards);

        const result = await repository.findCardsByLabel("bug");

        expect(result).toEqual(mockCards);
        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.stringContaining("WHERE labels LIKE ?"),
          ["%bug%"]
        );
      });
    });
  });

  describe("Board operations", () => {
    describe("getBoardData", () => {
      it("should return complete board data with lanes and cards", async () => {
        const mockLanes = [
          { id: "1", title: "To Do", position: 0 },
          { id: "2", title: "Done", position: 1 },
        ];
        
        const mockCards = [
          { id: "card-1", title: "Card 1", lane_id: "1", position: 0 },
          { id: "card-2", title: "Card 2", lane_id: "2", position: 0 },
        ];

        mockDb.execute.mockResolvedValueOnce(mockLanes);
        mockDb.execute.mockResolvedValueOnce(mockCards);

        const result = await repository.getBoardData();

        expect(result).toEqual({
          lanes: mockLanes,
          cards: mockCards,
        });
      });
    });
  });
});