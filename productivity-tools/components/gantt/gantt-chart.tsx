"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  User,
  FileCode
} from 'lucide-react';
import type { GanttTask, GanttViewMode } from '@/lib/types/gantt';
import { GanttCalendarHeader } from './gantt-calendar-header';
import { GanttTaskBar } from './gantt-task-bar';
import { GanttTimeline } from './gantt-timeline';

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode?: GanttViewMode;
  onTaskUpdate?: (task: GanttTask) => void;
  onTaskClick?: (task: GanttTask) => void;
  onDependencyCreate?: (fromId: string, toId: string) => void;
  enableHierarchyDragDrop?: boolean;
}

export function GanttChart({
  tasks,
  viewMode = 'day',
  onTaskUpdate,
  onTaskClick,
  onDependencyCreate,
  enableHierarchyDragDrop = false,
}: GanttChartProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    new Set(tasks.filter(t => t.children && t.children.length > 0).map(t => t.id))
  );
  const [isDraggingHierarchy, setIsDraggingHierarchy] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dependencyCreationStart, setDependencyCreationStart] = useState<string | null>(null);
  const [dependencyCreationEnd, setDependencyCreationEnd] = useState<{ x: number; y: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // タスクを階層構造に整理
  const taskTree = useMemo(() => {
    const taskMap = new Map<string, GanttTask>();
    const rootTasks: GanttTask[] = [];

    // タスクマップを作成
    tasks.forEach(task => {
      taskMap.set(task.id, task);
    });

    // ルートタスクを特定
    tasks.forEach(task => {
      if (!task.parentId) {
        rootTasks.push(task);
      }
    });

    return { taskMap, rootTasks };
  }, [tasks]);

  // 表示するタスクリストを生成（階層順）
  const visibleTasks = useMemo(() => {
    const result: Array<{ task: GanttTask; level: number }> = [];

    const addTask = (task: GanttTask, level: number) => {
      result.push({ task, level });

      if (expandedTasks.has(task.id) && task.children) {
        task.children.forEach(childId => {
          const childTask = taskTree.taskMap.get(childId);
          if (childTask) {
            addTask(childTask, level + 1);
          }
        });
      }
    };

    taskTree.rootTasks.forEach(task => addTask(task, 0));
    return result;
  }, [taskTree, expandedTasks]);

  // 日付範囲を計算
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    }

    let minDate = tasks[0].startDate;
    let maxDate = tasks[0].endDate;

    tasks.forEach(task => {
      if (task.startDate < minDate) minDate = task.startDate;
      if (task.endDate > maxDate) maxDate = task.endDate;
    });

    // 余白を追加
    const start = new Date(minDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 7);

    return { start, end };
  }, [tasks]);

  const toggleExpand = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // 階層ドラッグ&ドロップハンドラ
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    if (!enableHierarchyDragDrop) return;
    setIsDraggingHierarchy(true);
    setDraggedTaskId(taskId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }, [enableHierarchyDragDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isDraggingHierarchy) return;
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }, [isDraggingHierarchy]);

  const handleDragEnter = useCallback((e: React.DragEvent, taskId: string) => {
    if (!isDraggingHierarchy || draggedTaskId === taskId) return;
    setDropTargetId(taskId);
  }, [isDraggingHierarchy, draggedTaskId]);

  const handleDrop = useCallback((e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    // 循環参照チェック
    const draggedTask = taskTree.taskMap.get(draggedTaskId);
    const targetTask = taskTree.taskMap.get(targetTaskId);
    
    if (draggedTask && targetTask) {
      // 対象タスクがドラッグ中タスクの子孫でないか確認
      let current = targetTask;
      while (current.parentId) {
        if (current.parentId === draggedTaskId) {
          setErrorMessage('循環参照を作成できません');
          setTimeout(() => setErrorMessage(null), 3000);
          return;
        }
        current = taskTree.taskMap.get(current.parentId) || current;
      }

      onTaskUpdate?.({
        ...draggedTask,
        parentId: targetTaskId,
      });
    }

    setIsDraggingHierarchy(false);
    setDraggedTaskId(null);
    setDropTargetId(null);
  }, [draggedTaskId, taskTree, onTaskUpdate]);

  // 依存関係作成ハンドラ
  const handleDependencyStart = useCallback((taskId: string) => {
    setDependencyCreationStart(taskId);
  }, []);

  const handleDependencyMove = useCallback((e: MouseEvent) => {
    if (!dependencyCreationStart) return;
    setDependencyCreationEnd({ x: e.clientX, y: e.clientY });
  }, [dependencyCreationStart]);

  const handleDependencyEnd = useCallback((targetTaskId: string) => {
    if (!dependencyCreationStart || dependencyCreationStart === targetTaskId) return;

    // 循環依存チェック
    const wouldCreateCycle = checkCyclicDependency(tasks, dependencyCreationStart, targetTaskId);
    if (wouldCreateCycle) {
      setErrorMessage('循環依存を作成することはできません');
      setTimeout(() => setErrorMessage(null), 3000);
    } else {
      onDependencyCreate?.(dependencyCreationStart, targetTaskId);
    }

    setDependencyCreationStart(null);
    setDependencyCreationEnd(null);
  }, [dependencyCreationStart, tasks, onDependencyCreate]);

  // キーボード操作ハンドラ
  const handleKeyDown = useCallback((e: React.KeyboardEvent, task: GanttTask) => {
    const moveAmount = 1; // 1日単位
    
    if (e.shiftKey && e.key === 'ArrowRight') {
      // タスクを右に移動
      const newStartDate = new Date(task.startDate);
      newStartDate.setDate(newStartDate.getDate() + moveAmount);
      const newEndDate = new Date(task.endDate);
      newEndDate.setDate(newEndDate.getDate() + moveAmount);
      
      onTaskUpdate?.({
        ...task,
        startDate: newStartDate,
        endDate: newEndDate,
      });
    } else if (e.shiftKey && e.key === 'ArrowLeft') {
      // タスクを左に移動
      const newStartDate = new Date(task.startDate);
      newStartDate.setDate(newStartDate.getDate() - moveAmount);
      const newEndDate = new Date(task.endDate);
      newEndDate.setDate(newEndDate.getDate() - moveAmount);
      
      onTaskUpdate?.({
        ...task,
        startDate: newStartDate,
        endDate: newEndDate,
      });
    } else if (e.ctrlKey && e.key === 'ArrowRight') {
      // 終了日を延長
      const newEndDate = new Date(task.endDate);
      newEndDate.setDate(newEndDate.getDate() + moveAmount);
      
      onTaskUpdate?.({
        ...task,
        endDate: newEndDate,
      });
    } else if (e.ctrlKey && e.key === 'ArrowLeft') {
      // 開始日を前倒し
      const newStartDate = new Date(task.startDate);
      newStartDate.setDate(newStartDate.getDate() - moveAmount);
      
      if (newStartDate < task.endDate) {
        onTaskUpdate?.({
          ...task,
          startDate: newStartDate,
        });
      }
    }
  }, [onTaskUpdate]);

  const getTaskIcon = (icon?: string) => {
    switch (icon) {
      case 'folder':
        return <Folder className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'person':
        return <User className="w-4 h-4" />;
      case 'task':
        return <FileCode className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="gantt-chart w-full h-full overflow-hidden border border-gray-200 rounded-lg">
      <div className="flex h-full">
        {/* タスクリスト部分 */}
        <div className="w-80 border-r border-gray-200 flex-shrink-0">
          <div className="h-16 border-b border-gray-200 flex items-center px-4 bg-gray-50">
            <span className="font-semibold">タスク名</span>
          </div>
          <div 
            data-testid="gantt-task-list"
            className="overflow-y-auto"
            style={{ height: 'calc(100% - 4rem)' }}
          >
            {visibleTasks.map(({ task, level }) => (
              <div
                key={task.id}
                data-indent={level}
                draggable={enableHierarchyDragDrop}
                className={cn(
                  "flex items-center h-10 px-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer",
                  task.isCriticalPath && "bg-red-50",
                  dropTargetId === task.id && "bg-blue-100",
                  draggedTaskId === task.id && "opacity-50"
                )}
                style={{ paddingLeft: `${level * 24 + 8}px` }}
                onClick={() => onTaskClick?.(task)}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, task.id)}
                onDrop={(e) => handleDrop(e, task.id)}
                onKeyDown={(e) => handleKeyDown(e, task)}
              >
                {task.children && task.children.length > 0 && (
                  <button
                    data-testid={`expand-button-${task.id}`}
                    className="mr-1 p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(task.id);
                    }}
                  >
                    {expandedTasks.has(task.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
                {task.icon && (
                  <span 
                    data-testid={`icon-${task.icon}-${task.id}`}
                    className="mr-2 text-gray-600"
                  >
                    {getTaskIcon(task.icon)}
                  </span>
                )}
                <span className="truncate">{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ガントチャート部分 */}
        <div className="flex-1 overflow-hidden">
          <GanttCalendarHeader
            startDate={dateRange.start}
            endDate={dateRange.end}
            viewMode={viewMode}
          />
          <div 
            data-testid="gantt-timeline"
            className="relative overflow-x-auto overflow-y-auto"
            style={{ height: 'calc(100% - 4rem)' }}
          >
            <GanttTimeline
              startDate={dateRange.start}
              endDate={dateRange.end}
              viewMode={viewMode}
              tasks={visibleTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskClick={onTaskClick}
              onDependencyStart={handleDependencyStart}
              onDependencyEnd={handleDependencyEnd}
            />
            
            {/* 依存関係作成ライン */}
            {dependencyCreationStart && dependencyCreationEnd && (
              <svg
                data-testid="dependency-creation-line"
                className="absolute inset-0 pointer-events-none z-40"
                style={{ overflow: 'visible' }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2={dependencyCreationEnd.x}
                  y2={dependencyCreationEnd.y}
                  stroke="blue"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

// 循環依存チェック関数
function checkCyclicDependency(tasks: GanttTask[], fromId: string, toId: string): boolean {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const visited = new Set<string>();
  
  function hasCycle(taskId: string, target: string): boolean {
    if (taskId === target) return true;
    if (visited.has(taskId)) return false;
    
    visited.add(taskId);
    const task = taskMap.get(taskId);
    if (!task || !task.dependencies) return false;
    
    for (const depId of task.dependencies) {
      if (hasCycle(depId, target)) return true;
    }
    
    return false;
  }
  
  return hasCycle(fromId, toId);
}