"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTooltipPosition } from '@/hooks/use-tooltip-position';
import type { GanttTask, GanttViewMode } from '@/lib/types/gantt';

interface GanttTaskBarProps {
  task: GanttTask;
  startDate: Date;
  endDate: Date;
  viewMode: GanttViewMode;
  level: number;
  onUpdate?: (task: GanttTask) => void;
  onTaskClick?: (task: GanttTask) => void;
  onTaskEdit?: (task: GanttTask) => void;
  onDependencyStart?: (taskId: string) => void;
  onDependencyEnd?: (taskId: string) => void;
}

export function GanttTaskBar({
  task,
  startDate,
  endDate,
  viewMode,
  level,
  onUpdate,
  onTaskClick,
  onTaskEdit,
  onDependencyStart,
  onDependencyEnd,
}: GanttTaskBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; startDate: Date; endDate: Date } | null>(null);
  const taskBarRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // ツールチップの動的位置を計算
  const tooltipPosition = useTooltipPosition(taskBarRef, tooltipRef, showTooltip);

  // タスクバーの位置とサイズを計算
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const taskStart = Math.max(0, Math.floor((task.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const taskDuration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const left = (taskStart / totalDays) * 100;
  const width = (taskDuration / totalDays) * 100;

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '-');
  };

  // タスクバーの色を取得
  const getBarColor = () => {
    if (task.isCriticalPath) {
      return 'bg-red-500 ring-2 ring-red-600';
    }
    
    switch (task.color) {
      case 'red':
        return 'bg-red-500';
      case 'blue':
        return 'bg-blue-500';
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'purple':
        return 'bg-purple-500';
      case 'gray':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
    });
  }, [isResizing, task]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart) return;
    
    if (isDragging) {
      // ドラッグによる移動処理
      const deltaX = e.clientX - dragStart.x;
      const dayWidth = taskBarRef.current?.parentElement?.offsetWidth || 1000;
      const daysToMove = Math.round(deltaX / (dayWidth / totalDays));
      
      if (daysToMove !== 0) {
        const newStartDate = new Date(dragStart.startDate);
        newStartDate.setDate(newStartDate.getDate() + daysToMove);
        const newEndDate = new Date(dragStart.endDate);
        newEndDate.setDate(newEndDate.getDate() + daysToMove);
        
        onUpdate?.({
          ...task,
          startDate: newStartDate,
          endDate: newEndDate,
        });
      }
    } else if (isResizing) {
      // リサイズ処理
      const deltaX = e.clientX - dragStart.x;
      const dayWidth = taskBarRef.current?.parentElement?.offsetWidth || 1000;
      const daysToResize = Math.round(deltaX / (dayWidth / totalDays));
      
      if (daysToResize !== 0) {
        if (isResizing === 'left') {
          const newStartDate = new Date(dragStart.startDate);
          newStartDate.setDate(newStartDate.getDate() + daysToResize);
          if (newStartDate < task.endDate) {
            onUpdate?.({
              ...task,
              startDate: newStartDate,
            });
          }
        } else {
          const newEndDate = new Date(dragStart.endDate);
          newEndDate.setDate(newEndDate.getDate() + daysToResize);
          if (newEndDate > task.startDate) {
            onUpdate?.({
              ...task,
              endDate: newEndDate,
            });
          }
        }
      }
    }
  }, [dragStart, isDragging, isResizing, onUpdate, task, totalDays]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    setDragStart(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskClick?.(task);
  }, [onTaskClick, task]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskEdit?.(task);
  }, [onTaskEdit, task]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onTaskClick?.(task);
    }
  }, [onTaskClick, task]);

  const handleResizeMouseDown = useCallback((position: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(position);
    setDragStart({
      x: e.clientX,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
    });
  }, [task]);

  // Escキーでキャンセル
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDragging(false);
      setIsResizing(null);
      setDragStart(null);
    }
  }, []);

  // マウスイベントリスナーの設定
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleEscKey]);

  // 進捗率の幅を計算
  const progressWidth = task.progress || 0;

  return (
    <>
      <div
        ref={taskBarRef}
        data-testid={`task-bar-${task.id}`}
        role="button"
        aria-label={task.title}
        tabIndex={0}
        className={cn(
          "absolute top-2 h-6 rounded cursor-pointer transition-all",
          getBarColor(),
          (isDragging || isResizing) && "opacity-70 z-50",
          "hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        )}
        style={{ left: `${left}%`, width: `${width}%` }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* 左側リサイズハンドル */}
        <div
          data-testid={`resize-handle-left-${task.id}`}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white hover:bg-opacity-50"
          onMouseDown={handleResizeMouseDown('left')}
        />
        
        {/* 右側リサイズハンドル */}
        <div
          data-testid={`resize-handle-right-${task.id}`}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white hover:bg-opacity-50"
          onMouseDown={handleResizeMouseDown('right')}
        />

        {/* 進捗バー */}
        {progressWidth > 0 && (
          <div
            data-testid={`task-progress-${task.id}`}
            className="absolute inset-0 bg-black bg-opacity-20 rounded pointer-events-none"
            style={{ width: `${progressWidth}%` }}
          />
        )}

        {/* タスクタイトル（バー内に表示） */}
        <div className="px-2 text-xs text-white truncate leading-6 pointer-events-none">
          {task.title}
        </div>

        {/* 依存関係の接続ポイント */}
        {task.dependencies && task.dependencies.length > 0 && (
          <div 
            data-testid={`dependency-connector-left-${task.id}`}
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white border-2 border-current rounded-full cursor-pointer" 
            onMouseUp={() => onDependencyEnd?.(task.id)}
          />
        )}
        {task.children && task.children.length > 0 && (
          <div 
            data-testid={`dependency-connector-right-${task.id}`}
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white border-2 border-current rounded-full cursor-pointer" 
            onMouseDown={(e) => {
              e.stopPropagation();
              onDependencyStart?.(task.id);
            }}
          />
        )}
      </div>

      {/* ツールチップ */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          data-testid={`task-tooltip-${task.id}`}
          className="fixed z-50 p-2 bg-gray-800 text-white text-xs rounded shadow-lg pointer-events-none"
          style={{
            ...tooltipPosition,
            whiteSpace: 'nowrap',
          }}
        >
          <div className="font-semibold">{task.title}</div>
          <div>{formatDate(task.startDate)} 〜 {formatDate(task.endDate)}</div>
          <div>進捗: {task.progress || 0}%</div>
          {task.assignee && <div>担当: {task.assignee}</div>}
        </div>
      )}
    </>
  );
}