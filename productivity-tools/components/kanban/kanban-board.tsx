"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useKanbanStore } from "@/lib/stores/kanban-store";
import { KanbanLaneComponent } from "./kanban-lane";
import { KanbanCardComponent } from "./kanban-card";
import { KanbanCardDialog } from "./kanban-card-dialog";
import { KanbanLaneDialog } from "./kanban-lane-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { KanbanCard, KanbanLane } from "@/lib/db/types";
import type { CreateCardDto, UpdateCardDto } from "@/lib/repositories/kanban-repository";
import { useToast } from "@/hooks/use-toast";

export function KanbanBoard() {
  const { toast } = useToast();
  const {
    lanes,
    cards,
    isLoading,
    error,
    fetchLanes,
    fetchCards,
    createLane,
    updateLane,
    deleteLane,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    getCardsByLane,
    isWipLimitReached,
  } = useKanbanStore();

  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [laneDialogOpen, setLaneDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [selectedLane, setSelectedLane] = useState<KanbanLane | null>(null);
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchLanes();
    fetchCards();
  }, [fetchLanes, fetchCards]);

  useEffect(() => {
    if (error) {
      toast({
        title: "エラー",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeCard = cards.find((card) => card.id === active.id);
    setActiveCard(activeCard || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCard = cards.find((card) => card.id === active.id);
    if (!activeCard) return;

    const overLaneId = over.id as string;
    const overLane = lanes.find((lane) => lane.id === overLaneId);
    
    if (!overLane) {
      // Check if over is a card
      const overCard = cards.find((card) => card.id === over.id);
      if (overCard) {
        // Move to the same lane as the over card
        const targetLaneId = overCard.lane_id;
        const targetCards = getCardsByLane(targetLaneId);
        const overIndex = targetCards.findIndex((card) => card.id === overCard.id);
        
        try {
          await moveCard(activeCard.id, targetLaneId, overIndex);
          toast({
            title: "カードを移動しました",
            description: `「${activeCard.title}」を移動しました`,
          });
        } catch (error) {
          // Error handling is done in the store
        }
      }
      return;
    }

    // Move to a different lane
    if (activeCard.lane_id !== overLaneId) {
      const targetCards = getCardsByLane(overLaneId);
      const newPosition = targetCards.length;
      
      try {
        await moveCard(activeCard.id, overLaneId, newPosition);
        toast({
          title: "カードを移動しました",
          description: `「${activeCard.title}」を「${overLane.title}」に移動しました`,
        });
      } catch (error) {
        // Error handling is done in the store
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find((card) => card.id === active.id);
    const overCard = cards.find((card) => card.id === over.id);

    if (!activeCard) return;

    // If dragging over a card in a different lane
    if (overCard && activeCard.lane_id !== overCard.lane_id) {
      const activeCards = getCardsByLane(activeCard.lane_id);
      const overCards = getCardsByLane(overCard.lane_id);

      const activeIndex = activeCards.findIndex((card) => card.id === activeCard.id);
      const overIndex = overCards.findIndex((card) => card.id === overCard.id);

      // This is just for visual feedback during drag
      // Actual move is handled in handleDragEnd
    }
  };

  const handleAddCard = (laneId: string) => {
    setSelectedLaneId(laneId);
    setSelectedCard(null);
    setCardDialogOpen(true);
  };

  const handleEditCard = (card: KanbanCard) => {
    setSelectedCard(card);
    setSelectedLaneId(null);
    setCardDialogOpen(true);
  };

  const handleDeleteCard = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    if (confirm(`「${card.title}」を削除してもよろしいですか？`)) {
      await deleteCard(id);
      toast({
        title: "カードを削除しました",
        description: `「${card.title}」を削除しました`,
      });
    }
  };

  const handleCardSubmit = async (data: CreateCardDto | UpdateCardDto) => {
    if (selectedCard) {
      await updateCard(selectedCard.id, data as UpdateCardDto);
      toast({
        title: "カードを更新しました",
        description: `「${data.title}」を更新しました`,
      });
    } else {
      await createCard(data as CreateCardDto);
      toast({
        title: "カードを作成しました",
        description: `「${data.title}」を作成しました`,
      });
    }
  };

  const handleAddLane = () => {
    setSelectedLane(null);
    setLaneDialogOpen(true);
  };

  const handleEditLane = (lane: KanbanLane) => {
    setSelectedLane(lane);
    setLaneDialogOpen(true);
  };

  const handleDeleteLane = async (id: string) => {
    const lane = lanes.find((l) => l.id === id);
    if (!lane) return;

    const cardsInLane = getCardsByLane(id);
    const message = cardsInLane.length > 0
      ? `「${lane.title}」と${cardsInLane.length}枚のカードを削除してもよろしいですか？`
      : `「${lane.title}」を削除してもよろしいですか？`;

    if (confirm(message)) {
      await deleteLane(id);
      toast({
        title: "レーンを削除しました",
        description: `「${lane.title}」を削除しました`,
      });
    }
  };

  const handleLaneSubmit = async (data: any) => {
    if (selectedLane) {
      await updateLane(selectedLane.id, data);
      toast({
        title: "レーンを更新しました",
        description: `「${data.title}」を更新しました`,
      });
    } else {
      const position = lanes.length;
      await createLane({ ...data, position });
      toast({
        title: "レーンを作成しました",
        description: `「${data.title}」を作成しました`,
      });
    }
  };

  if (isLoading && lanes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">カンバンボード</h2>
        <Button onClick={handleAddLane}>
          <Plus className="mr-2 h-4 w-4" />
          レーンを追加
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={lanes.map((lane) => lane.id)}
            strategy={horizontalListSortingStrategy}
          >
            {lanes.map((lane) => (
              <KanbanLaneComponent
                key={lane.id}
                lane={lane}
                cards={getCardsByLane(lane.id)}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onEditLane={handleEditLane}
                onDeleteLane={handleDeleteLane}
                isWipLimitReached={isWipLimitReached(lane.id)}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeCard ? (
            <KanbanCardComponent
              card={activeCard}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <KanbanCardDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        card={selectedCard}
        laneId={selectedLaneId || undefined}
        onSubmit={handleCardSubmit}
      />

      <KanbanLaneDialog
        open={laneDialogOpen}
        onOpenChange={setLaneDialogOpen}
        lane={selectedLane}
        onSubmit={handleLaneSubmit}
      />
    </div>
  );
}