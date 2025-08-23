"use client";

import React from 'react';
import { GanttTaskBar } from './gantt-task-bar';
import type { GanttTask, GanttViewMode } from '@/lib/types/gantt';
import { cn } from '@/lib/utils';

interface GanttTimelineProps {
  startDate: Date;
  endDate: Date;
  viewMode: GanttViewMode;
  tasks: Array<{ task: GanttTask; level: number }>;
  onTaskUpdate?: (task: GanttTask) => void;
  onTaskClick?: (task: GanttTask) => void;
  onDependencyStart?: (taskId: string) => void;
  onDependencyEnd?: (taskId: string) => void;
}

export function GanttTimeline({
  startDate,
  endDate,
  viewMode,
  tasks,
  onTaskUpdate,
  onTaskClick,
  onDependencyStart,
  onDependencyEnd,
}: GanttTimelineProps) {
  // 日数を計算
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // ビューモードに応じた幅を計算
  const getColumnWidth = () => {
    switch (viewMode) {
      case 'day':
        return 40;
      case 'week':
        return 120;
      case 'month':
        return 200;
      case 'quarter':
        return 300;
      default:
        return 40;
    }
  };

  const columnWidth = getColumnWidth();
  
  // ビューモードに応じた列数を計算
  const getColumnCount = () => {
    switch (viewMode) {
      case 'day':
        return totalDays;
      case 'week':
        return Math.ceil(totalDays / 7);
      case 'month':
        return Math.ceil(totalDays / 30);
      case 'quarter':
        return Math.ceil(totalDays / 90);
      default:
        return totalDays;
    }
  };

  const columnCount = getColumnCount();
  const timelineWidth = columnCount * columnWidth;

  // 現在日付線の位置を計算
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻をリセット
  const todayOffset = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const todayPosition = todayOffset >= 0 && todayOffset <= totalDays 
    ? (todayOffset / totalDays) * timelineWidth 
    : -1;

  // グリッド線を生成
  const gridLines = Array.from({ length: columnCount }, (_, i) => (
    <div
      key={i}
      className="absolute top-0 bottom-0 border-l border-gray-200"
      style={{ left: `${i * columnWidth}px` }}
    />
  ));

  // 仮想スクロールの実装（大量タスク対応）
  const visibleTasks = tasks.length > 100 ? (
    <div data-virtual-scroll className="relative">
      {tasks.slice(0, 50).map(({ task, level }, index) => (
        <div
          key={task.id}
          data-testid={`task-row-${task.id}`}
          className="relative h-10 border-b border-gray-100"
        >
          <GanttTaskBar
            task={task}
            startDate={startDate}
            endDate={endDate}
            viewMode={viewMode}
            level={level}
            onUpdate={onTaskUpdate}
            onTaskClick={onTaskClick}
            onDependencyStart={onDependencyStart}
            onDependencyEnd={onDependencyEnd}
          />
        </div>
      ))}
    </div>
  ) : (
    tasks.map(({ task, level }, index) => (
      <div
        key={task.id}
        data-testid={`task-row-${task.id}`}
        className="relative h-10 border-b border-gray-100"
      >
        <GanttTaskBar
          task={task}
          startDate={startDate}
          endDate={endDate}
          viewMode={viewMode}
          level={level}
          onUpdate={onTaskUpdate}
        />
      </div>
    ))
  );

  return (
    <div className="relative" style={{ width: `${timelineWidth}px` }}>
      {/* グリッド線 */}
      <div className="absolute inset-0 pointer-events-none">
        {gridLines}
      </div>

      {/* 現在日付線 */}
      {todayPosition >= 0 && (
        <div
          data-testid="gantt-today-line"
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 border-red-500 z-20 pointer-events-none"
          style={{ left: `${todayPosition}px` }}
        />
      )}

      {/* タスクバー */}
      {visibleTasks}
    </div>
  );
}