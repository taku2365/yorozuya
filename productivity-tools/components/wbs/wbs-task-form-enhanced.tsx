"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { WBSTask } from "@/lib/db/types";

interface WBSTaskFormEnhancedProps {
  task?: WBSTask;
  parentTask?: WBSTask | null;
  onSubmit: (data: {
    title: string;
    estimated_hours?: number;
    actual_hours?: number;
    assignee?: string;
    reviewer?: string;
    due_date?: string;
    parent_id?: string;
    progress?: number;
  }) => void | Promise<void>;
  onCancel: () => void;
}

export function WBSTaskFormEnhanced({ 
  task, 
  parentTask, 
  onSubmit, 
  onCancel 
}: WBSTaskFormEnhancedProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [estimatedHours, setEstimatedHours] = useState(
    task?.estimated_hours?.toString() || ""
  );
  const [actualHours, setActualHours] = useState(
    task?.actual_hours?.toString() || ""
  );
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [reviewer, setReviewer] = useState(task?.reviewer || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );
  const [progress, setProgress] = useState(task?.progress?.toString() || "0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 見積もり時間から作業日数を計算
  const workDays = estimatedHours ? Math.ceil(Number(estimatedHours) / 8) : null;

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (estimatedHours && isNaN(Number(estimatedHours))) {
      newErrors.estimatedHours = "見積時間は数値で入力してください";
    } else if (estimatedHours && Number(estimatedHours) < 0) {
      newErrors.estimatedHours = "見積時間は0以上の数値で入力してください";
    }

    if (actualHours) {
      const actualHoursNum = Number(actualHours);
      if (isNaN(actualHoursNum)) {
        newErrors.actualHours = "実績時間は数値で入力してください";
      } else if (actualHoursNum < 0) {
        newErrors.actualHours = "実績時間は0以上の数値で入力してください";
      }
    }

    if (progress && (isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) {
      newErrors.progress = "進捗率は0〜100の数値で入力してください";
    }

    // 作業日数の妥当性チェック
    if (workDays && workDays > 5) {
      newErrors.estimatedHours = "タスクは2-5日で完了できる粒度にしてください（現在: " + workDays + "日）";
    }

    setErrors(newErrors);
  }, [estimatedHours, actualHours, progress, workDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const validationErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      validationErrors.title = "タスク名は必須です";
    }

    // 進捗率と実績時間の整合性チェック
    if (Number(progress) > 0 && !actualHours) {
      validationErrors.actualHours = "進捗がある場合は実績時間を入力してください";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
        actual_hours: actualHours ? Number(actualHours) : undefined,
        assignee: assignee.trim() || undefined,
        reviewer: reviewer.trim() || undefined,
        due_date: dueDate ? dueDate.toISOString() : undefined,
        parent_id: parentTask?.id,
        progress: Number(progress),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {parentTask && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">親タスク: {parentTask.title}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">
          タスク名 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスク名を入力"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">見積時間（時間）</Label>
          <div className="relative">
            <Input
              id="estimated_hours"
              type="text"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="例: 16"
              className={errors.estimatedHours ? "border-red-500" : ""}
            />
            {workDays && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                約{workDays}日
              </div>
            )}
          </div>
          {errors.estimatedHours && (
            <p className="text-sm text-red-600">{errors.estimatedHours}</p>
          )}
          <p className="text-xs text-gray-500">
            推奨: 2-5日で完了できる粒度（16-40時間）
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual_hours">実績時間（時間）</Label>
          <Input
            id="actual_hours"
            type="text"
            value={actualHours}
            onChange={(e) => setActualHours(e.target.value)}
            placeholder="例: 12"
            className={errors.actualHours ? "border-red-500" : ""}
          />
          {errors.actualHours && (
            <p className="text-sm text-red-600">{errors.actualHours}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="progress">進捗率（%）</Label>
        <div className="flex items-center gap-2">
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className={cn("w-24", errors.progress ? "border-red-500" : "")}
          />
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {errors.progress && (
          <p className="text-sm text-red-600">{errors.progress}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignee">
            <Users className="inline-block w-3 h-3 mr-1" />
            担当者
          </Label>
          <Input
            id="assignee"
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="担当者名を入力"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reviewer">
            <Users className="inline-block w-3 h-3 mr-1" />
            レビュー者
          </Label>
          <Input
            id="reviewer"
            type="text"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="レビュー者名を入力"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">期限</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? (
                format(dueDate, "yyyy年MM月dd日", { locale: ja })
              ) : (
                "期限を選択"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              locale={ja}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </>
          ) : (
            task ? "更新" : "作成"
          )}
        </Button>
      </div>
    </form>
  );
}