"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import type { Todo } from "@/lib/db/types";
import type { CreateTodoDto } from "@/lib/repositories/todo-repository";

interface TodoFormProps {
  todo?: Todo;
  onSubmit: (data: CreateTodoDto) => void | Promise<void>;
  onCancel: () => void;
}

export function TodoForm({ todo, onSubmit, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title || "");
  const [description, setDescription] = useState(todo?.description || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    todo?.priority || "medium"
  );
  const [dueDate, setDueDate] = useState(
    todo?.due_date ? todo.due_date.split("T")[0] : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (touched.title && !title.trim()) {
      newErrors.title = "タイトルは必須です";
    }
    
    if (touched.title && title.trim().length > 100) {
      newErrors.title = "タイトルは100文字以内で入力してください";
    }
    
    if (touched.description && description.length > 500) {
      newErrors.description = "説明は500文字以内で入力してください";
    }
    
    if (touched.dueDate && dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = "期限は今日以降の日付を選択してください";
      }
    }
    
    setErrors(newErrors);
  }, [title, description, dueDate, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ title: true, description: true, dueDate: true });
    
    // Validate all fields
    const validationErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      validationErrors.title = "タイトルは必須です";
    }
    
    if (title.trim().length > 100) {
      validationErrors.title = "タイトルは100文字以内で入力してください";
    }
    
    if (description.length > 500) {
      validationErrors.description = "説明は500文字以内で入力してください";
    }
    
    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        validationErrors.dueDate = "期限は今日以降の日付を選択してください";
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      // Clear form on successful submission (only for new todos)
      if (!todo) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setTouched({});
      }
    } catch (error) {
      setErrors({ submit: "保存中にエラーが発生しました" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick date presets
  const datePresets = [
    { label: "今日", value: format(new Date(), "yyyy-MM-dd") },
    { label: "明日", value: format(addDays(new Date(), 1), "yyyy-MM-dd") },
    { label: "来週", value: format(addDays(new Date(), 7), "yyyy-MM-dd") },
    { label: "来月", value: format(addDays(new Date(), 30), "yyyy-MM-dd") },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="flex items-center gap-1">
          タイトル
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched({ ...touched, title: true })}
          placeholder="ToDoのタイトルを入力"
          required
          maxLength={100}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-red-600">
            {errors.title}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {title.length}/100文字
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setTouched({ ...touched, description: true })}
          placeholder="詳細な説明を入力（任意）"
          rows={3}
          maxLength={500}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-600">
            {errors.description}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {description.length}/500文字
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">優先度</Label>
          <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
            <SelectTrigger id="priority" aria-label="優先度">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  高
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  中
                </span>
              </SelectItem>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  低
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            期限
          </Label>
          <Input
            id="due_date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            onBlur={() => setTouched({ ...touched, dueDate: true })}
            min={format(new Date(), "yyyy-MM-dd")}
            aria-invalid={!!errors.dueDate}
            aria-describedby={errors.dueDate ? "dueDate-error" : undefined}
            className={errors.dueDate ? "border-red-500" : ""}
          />
          {errors.dueDate && (
            <p id="dueDate-error" className="text-sm text-red-600">
              {errors.dueDate}
            </p>
          )}
          <div className="flex gap-1 flex-wrap">
            {datePresets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setDueDate(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

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
            todo ? "更新" : "作成"
          )}
        </Button>
      </div>
    </form>
  );
}