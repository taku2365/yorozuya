"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KanbanCard } from "@/lib/db/types";
import type { CreateCardDto, UpdateCardDto } from "@/lib/repositories/kanban-repository";

interface KanbanCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: KanbanCard | null;
  laneId?: string;
  onSubmit: (data: CreateCardDto | UpdateCardDto) => void;
}

export function KanbanCardDialog({
  open,
  onOpenChange,
  card,
  laneId,
  onSubmit,
}: KanbanCardDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState("");

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || "");
      setLabels(card.labels || "");
    } else {
      setTitle("");
      setDescription("");
      setLabels("");
    }
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      labels: labels.trim() || undefined,
    };

    if (card) {
      // Update existing card
      onSubmit(data);
    } else if (laneId) {
      // Create new card
      onSubmit({
        ...data,
        lane_id: laneId,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{card ? "カードを編集" : "新しいカード"}</DialogTitle>
            <DialogDescription>
              {card
                ? "カードの情報を編集します"
                : "新しいカードを作成します"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="カードのタイトル"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="カードの説明（任意）"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="labels">ラベル</Label>
              <Input
                id="labels"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="ラベル（カンマ区切り）"
              />
              <p className="text-xs text-muted-foreground">
                例: バグ, 優先度高, UI改善
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{card ? "更新" : "作成"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}