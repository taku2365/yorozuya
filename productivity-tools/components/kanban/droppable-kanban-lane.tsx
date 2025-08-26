"use client";

import React from 'react';
import { DroppableView } from '@/components/shared/droppable-view';
import { KanbanLane } from './kanban-lane';
import type { KanbanLane as KanbanLaneType, KanbanCard } from '@/lib/types';

interface DroppableKanbanLaneProps {
  lane: KanbanLaneType;
  cards: KanbanCard[];
  onAddCard: (laneId: string) => void;
  onEditCard: (card: KanbanCard) => void;
  onDeleteCard: (id: string) => void;
  onMoveCard: (cardId: string, targetLaneId: string, position: number) => void;
}

export function DroppableKanbanLane({
  lane,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onMoveCard,
}: DroppableKanbanLaneProps) {
  return (
    <DroppableView
      id={lane.id}
      view="kanban"
      data={{
        laneId: lane.id,
        position: cards.length,
      }}
    >
      <KanbanLane
        lane={lane}
        cards={cards}
        onAddCard={onAddCard}
        onEditCard={onEditCard}
        onDeleteCard={onDeleteCard}
        onMoveCard={onMoveCard}
      />
    </DroppableView>
  );
}