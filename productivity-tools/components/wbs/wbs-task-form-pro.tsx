"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { WBSTask } from "@/lib/db/types";
import type { CreateWBSTaskDto } from "@/lib/repositories/wbs-repository";
import { calculateWorkDays } from "@/lib/utils/work-days";

interface WBSTaskFormProProps {
  task?: WBSTask;
  parentTask?: WBSTask | null;
  isInsertMode?: boolean; // 挿入モードかどうか
  onSubmit: (data: CreateWBSTaskDto | Partial<WBSTask>) => void | Promise<void>;
  onCancel: () => void;
}

export function WBSTaskFormPro({
  task,
  parentTask,
  isInsertMode = false,
  onSubmit,
  onCancel,
}: WBSTaskFormProProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [hierarchyNumber, setHierarchyNumber] = useState(task?.hierarchy_number || "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [reviewer, setReviewer] = useState(task?.reviewer || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    task?.start_date ? new Date(task.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    task?.end_date ? new Date(task.end_date) : undefined
  );
  const [workDays, setWorkDays] = useState<number | undefined>(task?.work_days);
  const [estimatedHours, setEstimatedHours] = useState(
    task?.estimated_hours?.toString() || ""
  );
  const [actualHours, setActualHours] = useState(
    task?.actual_hours?.toString() || ""
  );
  const [progress, setProgress] = useState(task?.progress?.toString() || "0");
  const [remarks, setRemarks] = useState(task?.remarks || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 開始日と終了日から工数を自動計算
  useEffect(() => {
    if (startDate && endDate) {
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");
      const days = calculateWorkDays(start, end);
      if (days !== null) {
        setWorkDays(days);
      }
    } else {
      setWorkDays(undefined);
    }
  }, [startDate, endDate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "タスク名は必須です";
    }

    // 新規作成時かつ挿入モードでない場合、階層番号の検証
    if (!task && !isInsertMode && !parentTask) {
      if (hierarchyNumber && !/^\d+$/.test(hierarchyNumber)) {
        newErrors.hierarchyNumber = "整数番号のみ入力可能です（例: 1, 2, 3）";
      }
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.dateRange = "終了日は開始日より後である必要があります";
    }

    if (estimatedHours && isNaN(Number(estimatedHours))) {
      newErrors.estimatedHours = "数値を入力してください";
    }

    if (actualHours && isNaN(Number(actualHours))) {
      newErrors.actualHours = "数値を入力してください";
    }

    const progressNum = Number(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      newErrors.progress = "0-100の数値を入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: CreateWBSTaskDto | Partial<WBSTask> = {
      title: title.trim(),
      hierarchy_number: hierarchyNumber || undefined,
      assignee: assignee || undefined,
      reviewer: reviewer || undefined,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      work_days: workDays,
      estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
      actual_hours: actualHours ? Number(actualHours) : undefined,
      progress: Number(progress),
      remarks: remarks || undefined,
    };

    if (!task && parentTask) {
      (data as CreateWBSTaskDto).parent_id = parentTask.id;
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="hierarchy_number">
            階層番号
            {isInsertMode && (
              <span className="ml-2 text-xs text-gray-500">（自動採番）</span>
            )}
          </Label>
          <Input
            id="hierarchy_number"
            type="text"
            value={hierarchyNumber}
            onChange={(e) => setHierarchyNumber(e.target.value)}
            placeholder={!task && !isInsertMode && !parentTask ? "1" : "1.1.1"}
            readOnly={!!task || isInsertMode} // 編集時と挿入モード時は読み取り専用
            disabled={isInsertMode}
            className={errors.hierarchyNumber ? "border-red-500" : ""}
          />
          {errors.hierarchyNumber && (
            <p className="text-sm text-red-600">{errors.hierarchyNumber}</p>
          )}
          {!task && !isInsertMode && !parentTask && (
            <p className="text-xs text-gray-500">整数番号のみ入力可能です</p>
          )}
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
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label htmlFor="reviewer">レビュー者</Label>
          <Input
            id="reviewer"
            type="text"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="レビュー者名を入力"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>開始日</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "yyyy-MM-dd") : "開始日を選択"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>終了日</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "yyyy-MM-dd") : "終了日を選択"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {errors.dateRange && (
        <p className="text-sm text-red-600">{errors.dateRange}</p>
      )}

      {workDays !== undefined && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            営業日ベースの工数: <strong>{workDays}日</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">見積時間（時間）</Label>
          <Input
            id="estimated_hours"
            type="text"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="例: 40"
            className={errors.estimatedHours ? "border-red-500" : ""}
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
            placeholder="例: 35"
            className={errors.actualHours ? "border-red-500" : ""}
          />
          {errors.actualHours && (
            <p className="text-sm text-red-600">{errors.actualHours}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">備考</Label>
        <Textarea
          id="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="タスクの詳細説明、完了条件、進捗状況などを記載"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">{task ? "更新" : "作成"}</Button>
      </div>
    </form>
  );
}