"use client";

import { useState, useEffect, useMemo } from "react";
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
import { KanbanCardDetail } from "./kanban-card-detail";
import { KanbanFilter } from "./kanban-filter";
import { Button } from "@/components/ui/button";
import { Plus, Archive } from "lucide-react";
import type { KanbanCard, KanbanLane } from "@/lib/db/types";
import type { CreateCardDto, UpdateCardDto } from "@/lib/repositories/kanban-repository";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function KanbanBoardEnhanced() {
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
    archiveCard,
    getCardsByLane,
    isWipLimitReached,
    getAllLabels,
  } = useKanbanStore();

  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [laneDialogOpen, setLaneDialogOpen] = useState(false);
  const [cardDetailOpen, setCardDetailOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [selectedLane, setSelectedLane] = useState<KanbanLane | null>(null);
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [archivedCards, setArchivedCards] = useState<KanbanCard[]>([]);

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

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (card.archived) return false;
      
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !card.title.toLowerCase().includes(query) &&
          !card.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      
      // Label filter
      if (selectedLabels.length > 0) {
        if (!card.labels) return false;
        const cardLabels = card.labels.split(",").map((l) => l.trim());
        if (!selectedLabels.some((label) => cardLabels.includes(label))) {
          return false;
        }
      }
      
      return true;
    });
  }, [cards, searchQuery, selectedLabels]);

  const getFilteredCardsByLane = (laneId: string) => {
    return filteredCards
      .filter((card) => card.lane_id === laneId)
      .sort((a, b) => a.position - b.position);
  };

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
      const overCard = cards.find((card) => card.id === over.id);
      if (overCard) {
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
    // Visual feedback during drag
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

  const handleCardClick = (card: KanbanCard) => {
    setSelectedCard(card);
    setCardDetailOpen(true);
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

  const handleArchiveCard = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    await archiveCard(id);
    toast({
      title: "カードをアーカイブしました",
      description: `「${card.title}」をアーカイブしました`,
    });
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

  const handleLabelToggle = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const loadArchivedCards = async () => {
    const db = await (await import("@/lib/db/singleton")).getDatabase();
    const repository = new (await import("@/lib/repositories/kanban-repository")).KanbanRepository(db);
    const archived = await repository.findArchivedCards();
    setArchivedCards(archived);
    setArchiveDialogOpen(true);
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
      <div className="mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">カンバンボード</h2>
          <div className="flex items-center gap-2">
            <Button onClick={loadArchivedCards} variant="outline">
              <Archive className="mr-2 h-4 w-4" />
              アーカイブ
            </Button>
            <Button onClick={handleAddLane}>
              <Plus className="mr-2 h-4 w-4" />
              レーンを追加
            </Button>
          </div>
        </div>

        <KanbanFilter
          labels={getAllLabels()}
          selectedLabels={selectedLabels}
          onLabelToggle={handleLabelToggle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
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
                cards={getFilteredCardsByLane(lane.id)}
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

      <KanbanCardDetail
        open={cardDetailOpen}
        onOpenChange={setCardDetailOpen}
        card={selectedCard}
        onEdit={() => {
          setCardDetailOpen(false);
          handleEditCard(selectedCard!);
        }}
        onArchive={handleArchiveCard}
        onDelete={handleDeleteCard}
      />

      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>アーカイブされたカード</DialogTitle>
            <DialogDescription>
              アーカイブされたカードの一覧です
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {archivedCards.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                アーカイブされたカードはありません
              </p>
            ) : (
              archivedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{card.title}</h4>
                    {card.labels && (
                      <div className="flex gap-1 mt-1">
                        {card.labels.split(",").map((label, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {label.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const db = await (await import("@/lib/db/singleton")).getDatabase();
                      const repository = new (await import("@/lib/repositories/kanban-repository")).KanbanRepository(db);
                      await repository.unarchiveCard(card.id);
                      setArchivedCards(prev => prev.filter(c => c.id !== card.id));
                      await fetchCards();
                      toast({
                        title: "カードを復元しました",
                        description: `「${card.title}」を復元しました`,
                      });
                    }}
                  >
                    復元
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}