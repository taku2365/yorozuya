"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { GanttTask, GanttDependency, GanttViewMode } from '@/lib/types/gantt';

interface GanttDependenciesProps {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  startDate: Date;
  endDate: Date;
  viewMode: GanttViewMode;
  taskPositions: Map<string, { x: number; y: number; width: number; height: number }>;
}

export function GanttDependencies({
  tasks,
  dependencies,
  startDate,
  endDate,
  viewMode,
  taskPositions,
}: GanttDependenciesProps) {
  // タスクマップを作成
  const taskMap = new Map(tasks.map(task => [task.id, task]));

  // クリティカルパスの依存関係を特定
  const isCriticalDependency = (fromTaskId: string, toTaskId: string): boolean => {
    const fromTask = taskMap.get(fromTaskId);
    const toTask = taskMap.get(toTaskId);
    return !!(fromTask?.isCriticalPath && toTask?.isCriticalPath);
  };

  // 依存関係の線を生成
  const generatePath = (
    fromPos: { x: number; y: number; width: number; height: number },
    toPos: { x: number; y: number; width: number; height: number },
    type: GanttDependency['type']
  ): string => {
    let startX: number, startY: number, endX: number, endY: number;

    // 依存関係タイプに応じて開始・終了位置を決定
    switch (type) {
      case 'start-to-start':
        startX = fromPos.x;
        startY = fromPos.y + fromPos.height / 2;
        endX = toPos.x;
        endY = toPos.y + toPos.height / 2;
        break;
      case 'finish-to-finish':
        startX = fromPos.x + fromPos.width;
        startY = fromPos.y + fromPos.height / 2;
        endX = toPos.x + toPos.width;
        endY = toPos.y + toPos.height / 2;
        break;
      case 'start-to-finish':
        startX = fromPos.x;
        startY = fromPos.y + fromPos.height / 2;
        endX = toPos.x + toPos.width;
        endY = toPos.y + toPos.height / 2;
        break;
      case 'finish-to-start':
      default:
        startX = fromPos.x + fromPos.width;
        startY = fromPos.y + fromPos.height / 2;
        endX = toPos.x;
        endY = toPos.y + toPos.height / 2;
        break;
    }

    // 垂直に並んでいる場合は直線
    if (Math.abs(startX - endX) < 10 && startY !== endY) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    // ベジェ曲線で接続
    const controlX1 = startX + (endX - startX) * 0.5;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.5;
    const controlY2 = endY;

    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  return (
    <svg
      data-testid="gantt-dependencies-svg"
      className="absolute inset-0 pointer-events-none"
      role="img"
      aria-label="依存関係図"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* 矢印マーカーの定義 */}
        <marker
          id="arrow-finish-to-start"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
        </marker>
        <marker
          id="arrow-start-to-start"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
        </marker>
        <marker
          id="arrow-finish-to-finish"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
        </marker>
        <marker
          id="arrow-start-to-finish"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
        </marker>
      </defs>

      {dependencies.map(dep => {
        const fromPos = taskPositions.get(dep.fromTaskId);
        const toPos = taskPositions.get(dep.toTaskId);
        
        if (!fromPos || !toPos) return null;

        const fromTask = taskMap.get(dep.fromTaskId);
        const toTask = taskMap.get(dep.toTaskId);
        const isCritical = isCriticalDependency(dep.fromTaskId, dep.toTaskId);

        return (
          <path
            key={dep.id}
            data-testid={`dependency-line-${dep.id}`}
            d={generatePath(fromPos, toPos, dep.type)}
            fill="none"
            className={cn(
              "pointer-events-auto cursor-pointer transition-all",
              isCritical ? "stroke-red-500" : "stroke-gray-400",
              "hover:stroke-blue-500"
            )}
            strokeWidth={isCritical ? 3 : 2}
            markerEnd={`url(#arrow-${dep.type})`}
            data-tooltip={`${fromTask?.title || 'タスク'} → ${toTask?.title || 'タスク'}`}
            aria-label={`${fromTask?.title || 'タスク'}から${toTask?.title || 'タスク'}への依存関係`}
          />
        );
      })}
    </svg>
  );
}