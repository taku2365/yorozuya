"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { KanbanLane, KanbanCard } from "@/lib/db/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KanbanCardComponent } from "./kanban-card";
import { cn } from "@/lib/utils";

interface KanbanLaneProps {
  lane: KanbanLane;
  cards: KanbanCard[];
  onAddCard: (laneId: string) => void;
  onEditCard: (card: KanbanCard) => void;
  onDeleteCard: (id: string) => void;
  onEditLane: (lane: KanbanLane) => void;
  onDeleteLane: (id: string) => void;
  isWipLimitReached: boolean;
}

export function KanbanLaneComponent({
  lane,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onEditLane,
  onDeleteLane,
  isWipLimitReached,
}: KanbanLaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: lane.id,
  });

  const cardIds = cards.map((card) => card.id);

  return (
    <div className="flex-shrink-0 w-80">
      <Card
        ref={setNodeRef}
        className={cn(
          "h-full transition-colors",
          isOver && "border-primary bg-primary/5",
          isWipLimitReached && "border-destructive"
        )}
      >
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{lane.title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {cards.length}
                {lane.wip_limit && ` / ${lane.wip_limit}`}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddCard(lane.id)}
                disabled={isWipLimitReached}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditLane(lane)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    レーンを編集
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteLane(lane.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    レーンを削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {isWipLimitReached && (
            <p className="text-xs text-destructive mt-1">
              WIP制限に達しています
            </p>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="min-h-[100px]">
              {cards.map((card) => (
                <KanbanCardComponent
                  key={card.id}
                  card={card}
                  onEdit={onEditCard}
                  onDelete={onDeleteCard}
                />
              ))}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}