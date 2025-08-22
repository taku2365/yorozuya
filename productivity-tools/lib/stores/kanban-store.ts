import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { KanbanLane, KanbanCard } from "../db/types";
import type { 
  CreateLaneDto, 
  UpdateLaneDto, 
  CreateCardDto, 
  UpdateCardDto 
} from "../repositories/kanban-repository";
import { KanbanRepository } from "../repositories/kanban-repository";
import { getDatabase } from "../db/singleton";

interface KanbanState {
  lanes: KanbanLane[];
  cards: KanbanCard[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLanes: (lanes: KanbanLane[]) => void;
  setCards: (cards: KanbanCard[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Lane operations
  fetchLanes: () => Promise<void>;
  createLane: (data: CreateLaneDto) => Promise<void>;
  updateLane: (id: string, data: UpdateLaneDto) => Promise<void>;
  deleteLane: (id: string) => Promise<void>;
  
  // Card operations
  fetchCards: () => Promise<void>;
  createCard: (data: CreateCardDto) => Promise<void>;
  updateCard: (id: string, data: UpdateCardDto) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, targetLaneId: string, newPosition: number) => Promise<void>;
  
  // Utility functions
  getCardsByLane: (laneId: string) => KanbanCard[];
  isWipLimitReached: (laneId: string) => boolean;
  
  // Utility
  reset: () => void;
}

const initialState = {
  lanes: [],
  cards: [],
  isLoading: false,
  error: null,
};

export const useKanbanStore = create<KanbanState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setLanes: (lanes) => set({ lanes }),
        setCards: (cards) => set({ cards }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        
        // Fetch all lanes
        fetchLanes: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            const lanes = await repository.findAllLanes();
            set({ lanes, isLoading: false });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to fetch lanes", isLoading: false });
          }
        },
        
        // Create a new lane
        createLane: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            const newLane = await repository.createLane(data);
            set((state) => ({ 
              lanes: [...state.lanes, newLane],
              isLoading: false 
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to create lane", isLoading: false });
          }
        },
        
        // Update a lane
        updateLane: async (id, data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            const updatedLane = await repository.updateLane(id, data);
            if (updatedLane) {
              set((state) => ({
                lanes: state.lanes.map(lane => 
                  lane.id === id ? updatedLane : lane
                ),
                isLoading: false
              }));
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to update lane", isLoading: false });
          }
        },
        
        // Delete a lane
        deleteLane: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            await repository.deleteLane(id);
            set((state) => ({
              lanes: state.lanes.filter(lane => lane.id !== id),
              cards: state.cards.filter(card => card.lane_id !== id),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to delete lane", isLoading: false });
          }
        },
        
        // Fetch all cards
        fetchCards: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            const cards = await repository.findAllCards();
            set({ cards, isLoading: false });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to fetch cards", isLoading: false });
          }
        },
        
        // Create a new card
        createCard: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            const newCard = await repository.createCard(data);
            set((state) => ({ 
              cards: [...state.cards, newCard],
              isLoading: false 
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to create card", isLoading: false });
            throw error; // Re-throw for WIP limit testing
          }
        },
        
        // Update a card
        updateCard: async (id, data) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            const updatedCard = await repository.updateCard(id, data);
            if (updatedCard) {
              set((state) => ({
                cards: state.cards.map(card => 
                  card.id === id ? updatedCard : card
                ),
                isLoading: false
              }));
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to update card", isLoading: false });
          }
        },
        
        // Delete a card
        deleteCard: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            await repository.deleteCard(id);
            set((state) => ({
              cards: state.cards.filter(card => card.id !== id),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to delete card", isLoading: false });
          }
        },
        
        // Move a card
        moveCard: async (cardId, targetLaneId, newPosition) => {
          set({ isLoading: true, error: null });
          try {
            const db = await getDatabase();
            const repository = new KanbanRepository(db);
            await repository.moveCard(cardId, targetLaneId, newPosition);
            
            // Update card in state
            set((state) => ({
              cards: state.cards.map(card => 
                card.id === cardId 
                  ? { ...card, lane_id: targetLaneId, position: newPosition }
                  : card
              ),
              isLoading: false
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to move card", isLoading: false });
            throw error; // Re-throw for WIP limit testing
          }
        },
        
        // Get cards by lane
        getCardsByLane: (laneId) => {
          const { cards } = get();
          return cards
            .filter(card => card.lane_id === laneId)
            .sort((a, b) => a.position - b.position);
        },
        
        // Check if WIP limit is reached
        isWipLimitReached: (laneId) => {
          const { lanes, cards } = get();
          const lane = lanes.find(l => l.id === laneId);
          if (!lane || !lane.wip_limit) return false;
          
          const cardsInLane = cards.filter(card => card.lane_id === laneId);
          return cardsInLane.length >= lane.wip_limit;
        },
        
        // Reset store
        reset: () => set(initialState),
      }),
      {
        name: "kanban-cache",
        partialize: (state) => ({ lanes: state.lanes, cards: state.cards }),
      }
    )
  )
);