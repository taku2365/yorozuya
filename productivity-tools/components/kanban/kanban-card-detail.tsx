"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit2, Archive, Trash2 } from "lucide-react";
import type { KanbanCard } from "@/lib/db/types";

interface KanbanCardDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: KanbanCard | null;
  onEdit: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function KanbanCardDetail({
  open,
  onOpenChange,
  card,
  onEdit,
  onArchive,
  onDelete,
}: KanbanCardDetailProps) {
  if (!card) return null;

  const labels = card.labels?.split(",").map((label) => label.trim()) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{card.title}</DialogTitle>
              <DialogDescription className="mt-2">
                作成日: {format(new Date(card.created_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onEdit();
                  onOpenChange(false);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onArchive(card.id);
                  onOpenChange(false);
                }}
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`「${card.title}」を削除してもよろしいですか？`)) {
                    onDelete(card.id);
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {card.description && (
            <div>
              <h4 className="text-sm font-semibold mb-2">説明</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {card.description}
              </p>
            </div>
          )}

          {labels.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">ラベル</h4>
              <div className="flex flex-wrap gap-2">
                {labels.map((label, index) => (
                  <Badge key={index} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p>
              最終更新: {format(new Date(card.updated_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}