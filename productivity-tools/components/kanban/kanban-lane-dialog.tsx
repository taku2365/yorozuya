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
import type { KanbanLane } from "@/lib/db/types";
import type { CreateLaneDto, UpdateLaneDto } from "@/lib/repositories/kanban-repository";

interface KanbanLaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lane?: KanbanLane | null;
  onSubmit: (data: CreateLaneDto | UpdateLaneDto) => void;
}

export function KanbanLaneDialog({
  open,
  onOpenChange,
  lane,
  onSubmit,
}: KanbanLaneDialogProps) {
  const [title, setTitle] = useState("");
  const [wipLimit, setWipLimit] = useState("");

  useEffect(() => {
    if (lane) {
      setTitle(lane.title);
      setWipLimit(lane.wip_limit?.toString() || "");
    } else {
      setTitle("");
      setWipLimit("");
    }
  }, [lane]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      wip_limit: wipLimit ? parseInt(wipLimit) : undefined,
    };

    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{lane ? "レーンを編集" : "新しいレーン"}</DialogTitle>
            <DialogDescription>
              {lane
                ? "レーンの情報を編集します"
                : "新しいレーンを作成します"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">レーン名</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="レーンの名前"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wipLimit">WIP制限</Label>
              <Input
                id="wipLimit"
                type="number"
                min="1"
                value={wipLimit}
                onChange={(e) => setWipLimit(e.target.value)}
                placeholder="制限なし"
              />
              <p className="text-xs text-muted-foreground">
                レーンに同時に存在できるカードの最大数
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{lane ? "更新" : "作成"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}