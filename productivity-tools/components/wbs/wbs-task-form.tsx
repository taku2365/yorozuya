"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { WBSTask } from "@/lib/db/types";

interface WBSTaskFormProps {
  task?: WBSTask;
  parentTask?: WBSTask;
  onSubmit: (data: {
    title: string;
    estimated_hours?: number;
    actual_hours?: number;
    assignee?: string;
    parent_id?: string;
  }) => void | Promise<void>;
  onCancel: () => void;
}

export function WBSTaskForm({ task, parentTask, onSubmit, onCancel }: WBSTaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [estimatedHours, setEstimatedHours] = useState(
    task?.estimated_hours?.toString() || ""
  );
  const [actualHours, setActualHours] = useState(
    task?.actual_hours?.toString() || ""
  );
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (estimatedHours && isNaN(Number(estimatedHours))) {
      newErrors.estimatedHours = "見積時間は数値で入力してください";
    }

    if (actualHours) {
      const actualHoursNum = Number(actualHours);
      if (isNaN(actualHoursNum)) {
        newErrors.actualHours = "実績時間は数値で入力してください";
      } else if (actualHoursNum < 0) {
        newErrors.actualHours = "実績時間は0以上の数値で入力してください";
      }
    }

    setErrors(newErrors);
  }, [estimatedHours, actualHours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const validationErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      validationErrors.title = "タスク名は必須です";
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
        parent_id: parentTask?.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {parentTask && (
        <div className="text-sm text-gray-600">
          親タスク: {parentTask.title}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">タスク名</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスク名を入力"
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">見積時間（時間）</Label>
          <Input
            id="estimated_hours"
            type="text"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            onBlur={() => {
              if (estimatedHours && isNaN(Number(estimatedHours))) {
                setErrors(prev => ({
                  ...prev,
                  estimatedHours: "見積時間は数値で入力してください"
                }));
              }
            }}
            placeholder="例: 8"
          />
          {errors.estimatedHours && (
            <p className="text-sm text-red-600">{errors.estimatedHours}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual_hours">実績時間（時間）</Label>
          <Input
            id="actual_hours"
            type="text"
            value={actualHours}
            onChange={(e) => setActualHours(e.target.value)}
            onBlur={() => {
              const actualHoursNum = Number(actualHours);
              if (actualHours && isNaN(actualHoursNum)) {
                setErrors(prev => ({
                  ...prev,
                  actualHours: "実績時間は数値で入力してください"
                }));
              } else if (actualHours && actualHoursNum < 0) {
                setErrors(prev => ({
                  ...prev,
                  actualHours: "実績時間は0以上の数値で入力してください"
                }));
              }
            }}
            placeholder="例: 6"
          />
          {errors.actualHours && (
            <p className="text-sm text-red-600">{errors.actualHours}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignee">担当者</Label>
        <Input
          id="assignee"
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="担当者名を入力"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
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