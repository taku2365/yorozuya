"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Filter,
  Calendar as CalendarIcon,
  Search,
  User,
  Tag,
  Flag
} from 'lucide-react';
import { 
  UnifiedTaskFilter, 
  TaskStatus, 
  TaskPriority,
  ViewType 
} from '@/lib/types/unified';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface UnifiedFilterProps {
  filter: UnifiedTaskFilter;
  onFilterChange: (filter: UnifiedTaskFilter) => void;
  onReset?: () => void;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'not_started', label: '未着手', color: 'bg-gray-500' },
  { value: 'in_progress', label: '進行中', color: 'bg-blue-500' },
  { value: 'completed', label: '完了', color: 'bg-green-500' },
  { value: 'on_hold', label: '保留', color: 'bg-yellow-500' },
  { value: 'cancelled', label: 'キャンセル', color: 'bg-red-500' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: '低', color: 'text-green-600' },
  { value: 'medium', label: '中', color: 'text-yellow-600' },
  { value: 'high', label: '高', color: 'text-red-600' },
  { value: 'urgent', label: '緊急', color: 'text-purple-600' },
];

const viewTypeOptions: { value: ViewType; label: string }[] = [
  { value: 'todo', label: 'ToDo' },
  { value: 'wbs', label: 'WBS' },
  { value: 'kanban', label: 'カンバン' },
  { value: 'gantt', label: 'ガント' },
];

/**
 * 統一フィルターコンポーネント
 * すべてのビューで共通のフィルタリング機能を提供
 */
export function UnifiedFilter({
  filter,
  onFilterChange,
  onReset,
  className,
  isOpen = true,
  onOpenChange
}: UnifiedFilterProps) {
  const hasActiveFilters = React.useMemo(() => {
    return !!(
      filter.status?.length ||
      filter.priority?.length ||
      filter.assigneeIds?.length ||
      filter.tags?.length ||
      filter.viewTypes?.length ||
      filter.searchText ||
      filter.dateRange
    );
  }, [filter]);

  const updateFilter = (updates: Partial<UnifiedTaskFilter>) => {
    onFilterChange({ ...filter, ...updates });
  };

  const handleStatusToggle = (status: TaskStatus) => {
    const current = filter.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    updateFilter({ status: updated.length ? updated : undefined });
  };

  const handlePriorityToggle = (priority: TaskPriority) => {
    const current = filter.priority || [];
    const updated = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority];
    updateFilter({ priority: updated.length ? updated : undefined });
  };

  const handleViewTypeToggle = (viewType: ViewType) => {
    const current = filter.viewTypes || [];
    const updated = current.includes(viewType)
      ? current.filter(v => v !== viewType)
      : [...current, viewType];
    updateFilter({ viewTypes: updated.length ? updated : undefined });
  };

  const handleReset = () => {
    onReset?.();
    onFilterChange({});
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => onOpenChange?.(true)}
        className={className}
      >
        <Filter className="h-4 w-4" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
        )}
      </Button>
    );
  }

  return (
    <div className={cn("space-y-4 p-4", className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" />
          フィルター
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              リセット
            </Button>
          )}
          {onOpenChange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 検索 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          検索
        </Label>
        <Input
          placeholder="タスクを検索..."
          value={filter.searchText || ''}
          onChange={(e) => updateFilter({ searchText: e.target.value || undefined })}
        />
      </div>

      {/* ステータス */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          ステータス
        </Label>
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                checked={filter.status?.includes(option.value) || false}
                onCheckedChange={() => handleStatusToggle(option.value)}
              />
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", option.color)} />
                <span className="text-sm">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 優先度 */}
      <div className="space-y-2">
        <Label>優先度</Label>
        <div className="space-y-2">
          {priorityOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                checked={filter.priority?.includes(option.value) || false}
                onCheckedChange={() => handlePriorityToggle(option.value)}
              />
              <span className={cn("text-sm", option.color)}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ビュータイプ */}
      <div className="space-y-2">
        <Label>元のツール</Label>
        <div className="space-y-2">
          {viewTypeOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                checked={filter.viewTypes?.includes(option.value) || false}
                onCheckedChange={() => handleViewTypeToggle(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 日付範囲 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          日付範囲
        </Label>
        <Select
          value={filter.dateRange?.field || 'none'}
          onValueChange={(value) => {
            if (value !== 'none') {
              updateFilter({
                dateRange: {
                  ...filter.dateRange,
                  field: value as any
                }
              });
            } else {
              updateFilter({ dateRange: undefined });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="日付フィールドを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">なし</SelectItem>
            <SelectItem value="createdAt">作成日</SelectItem>
            <SelectItem value="updatedAt">更新日</SelectItem>
            <SelectItem value="startDate">開始日</SelectItem>
            <SelectItem value="endDate">終了日</SelectItem>
            <SelectItem value="dueDate">期限</SelectItem>
          </SelectContent>
        </Select>

        {filter.dateRange?.field && (
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filter.dateRange.from 
                    ? format(filter.dateRange.from, 'yyyy/MM/dd', { locale: ja })
                    : '開始日'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filter.dateRange.from}
                  onSelect={(date) => updateFilter({
                    dateRange: {
                      ...filter.dateRange!,
                      from: date || undefined
                    }
                  })}
                  locale={ja}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filter.dateRange.to 
                    ? format(filter.dateRange.to, 'yyyy/MM/dd', { locale: ja })
                    : '終了日'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filter.dateRange.to}
                  onSelect={(date) => updateFilter({
                    dateRange: {
                      ...filter.dateRange!,
                      to: date || undefined
                    }
                  })}
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <Label className="text-sm text-muted-foreground mb-2 block">
            アクティブなフィルター
          </Label>
          <div className="flex flex-wrap gap-2">
            {filter.searchText && (
              <Badge variant="secondary" className="gap-1">
                検索: {filter.searchText}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter({ searchText: undefined })}
                />
              </Badge>
            )}
            {filter.status?.map(status => {
              const option = statusOptions.find(o => o.value === status);
              return (
                <Badge key={status} variant="secondary" className="gap-1">
                  {option?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleStatusToggle(status)}
                  />
                </Badge>
              );
            })}
            {filter.priority?.map(priority => {
              const option = priorityOptions.find(o => o.value === priority);
              return (
                <Badge key={priority} variant="secondary" className="gap-1">
                  優先度: {option?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handlePriorityToggle(priority)}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}