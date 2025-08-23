"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Calculator, Download, Plus } from 'lucide-react';
import type { GanttTask } from '@/lib/types/gantt';

interface GanttCriticalPathProps {
  tasks: GanttTask[];
  onCalculateCriticalPath: () => Promise<string[]>;
  onTaskUpdate: (task: GanttTask) => void;
  showOptimizations?: boolean;
  onExport?: (data: CriticalPathExport) => void;
}

interface CriticalPathExport {
  criticalPath: string[];
  totalDuration: number;
  tasks: GanttTask[];
}

export function GanttCriticalPath({
  tasks,
  onCalculateCriticalPath,
  onTaskUpdate,
  showOptimizations = false,
  onExport,
}: GanttCriticalPathProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBufferDialog, setShowBufferDialog] = useState<{ from: string; to: string } | null>(null);
  const [bufferDays, setBufferDays] = useState('');

  // クリティカルパスのタスクを取得
  const criticalTasks = useMemo(() => {
    return tasks.filter(task => task.isCriticalPath);
  }, [tasks]);

  // クリティカルパスの順序を計算
  const orderedCriticalTasks = useMemo(() => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const result: GanttTask[] = [];
    const visited = new Set<string>();

    // 開始タスクを見つける（依存関係がないか、依存先がクリティカルパスでない）
    const startTasks = criticalTasks.filter(task => {
      if (!task.dependencies || task.dependencies.length === 0) return true;
      return !task.dependencies.some(depId => {
        const depTask = taskMap.get(depId);
        return depTask?.isCriticalPath;
      });
    });

    // DFSで順序付け
    function visit(task: GanttTask) {
      if (visited.has(task.id)) return;
      visited.add(task.id);
      result.push(task);

      // このタスクに依存しているクリティカルパスのタスクを探す
      criticalTasks.forEach(t => {
        if (t.dependencies?.includes(task.id)) {
          visit(t);
        }
      });
    }

    startTasks.forEach(visit);
    return result;
  }, [criticalTasks, tasks]);

  // 総期間を計算
  const totalDuration = useMemo(() => {
    if (orderedCriticalTasks.length === 0) return 0;
    const start = Math.min(...orderedCriticalTasks.map(t => t.startDate.getTime()));
    const end = Math.max(...orderedCriticalTasks.map(t => t.endDate.getTime()));
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [orderedCriticalTasks]);

  // 全体の進捗率を計算
  const overallProgress = useMemo(() => {
    if (criticalTasks.length === 0) return 0;
    const totalProgress = criticalTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / criticalTasks.length);
  }, [criticalTasks]);

  // クリティカルパスを再計算
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      await onCalculateCriticalPath();
    } finally {
      setIsCalculating(false);
    }
  }, [onCalculateCriticalPath]);

  // バッファを追加
  const handleAddBuffer = useCallback(() => {
    if (!showBufferDialog || !bufferDays) return;

    const days = parseInt(bufferDays, 10);
    if (isNaN(days) || days <= 0) return;

    const targetTask = tasks.find(t => t.id === showBufferDialog.to);
    if (targetTask) {
      const newStartDate = new Date(targetTask.startDate);
      newStartDate.setDate(newStartDate.getDate() + days);
      const newEndDate = new Date(targetTask.endDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      onTaskUpdate({
        ...targetTask,
        startDate: newStartDate,
        endDate: newEndDate,
      });
    }

    setShowBufferDialog(null);
    setBufferDays('');
  }, [showBufferDialog, bufferDays, tasks, onTaskUpdate]);

  // エクスポート
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport({
        criticalPath: orderedCriticalTasks.map(t => t.id),
        totalDuration,
        tasks: orderedCriticalTasks,
      });
    }
  }, [onExport, orderedCriticalTasks, totalDuration]);

  // 最適化提案を生成
  const optimizations = useMemo(() => {
    if (!showOptimizations) return [];

    const suggestions: string[] = [];

    // 並行実行可能なタスクを検出
    const parallelTasks = tasks.filter(t => 
      !t.isCriticalPath && 
      t.dependencies?.length === 1 &&
      tasks.some(other => 
        !other.isCriticalPath && 
        other.id !== t.id &&
        JSON.stringify(other.dependencies) === JSON.stringify(t.dependencies)
      )
    );

    if (parallelTasks.length > 0) {
      const taskNames = parallelTasks.map(t => t.title).join('、');
      suggestions.push(`${taskNames}は並行実行可能です。`);
    }

    // 進捗の遅いクリティカルパスタスクを検出
    const slowTasks = criticalTasks.filter(t => (t.progress || 0) < 30);
    slowTasks.forEach(task => {
      suggestions.push(`${task.title}にリソース追加で期間短縮を検討してください。`);
    });

    return suggestions;
  }, [tasks, criticalTasks, showOptimizations]);

  return (
    <div data-testid="critical-path-panel" className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          クリティカルパス: {criticalTasks.length}タスク
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <Calculator className="w-4 h-4" />
            {isCalculating ? '計算中...' : 'クリティカルパスを再計算'}
          </button>
          {onExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <Download className="w-4 h-4" />
              エクスポート
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          総期間: {totalDuration}日
        </div>
        <div className="relative w-full h-6 bg-gray-200 rounded">
          <div
            data-testid="critical-path-progress"
            className="absolute left-0 top-0 h-full bg-red-500 rounded transition-all"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {overallProgress}%
          </span>
        </div>
      </div>

      <div data-testid="critical-path-tasks" className="space-y-2">
        {orderedCriticalTasks.map((task, index) => {
          const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const nextTask = orderedCriticalTasks[index + 1];
          const buffer = nextTask ? 
            Math.max(0, Math.floor((nextTask.startDate.getTime() - task.endDate.getTime()) / (1000 * 60 * 60 * 24))) :
            0;

          return (
            <div key={task.id}>
              <div
                data-testid={`critical-task-${task.id}`}
                className={cn(
                  "flex items-center justify-between p-2 rounded",
                  task.isCriticalPath ? "border-2 border-red-500 bg-red-50" : "border border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <span>{task.title}</span>
                  <span className="text-sm text-gray-500" data-task-id={task.id}>
                    {duration}日間
                  </span>
                </div>
                <div className="text-sm">
                  {task.progress || 0}%
                </div>
              </div>

              {nextTask && (
                <div
                  data-testid={`buffer-${task.id}-${nextTask.id}`}
                  className="flex items-center justify-between px-4 py-1 ml-4 text-sm text-gray-600"
                >
                  <span>↓ バッファ: {buffer}日</span>
                  <button
                    data-testid={`add-buffer-${task.id}-${nextTask.id}`}
                    onClick={() => setShowBufferDialog({ from: task.id, to: nextTask.id })}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showOptimizations && optimizations.length > 0 && (
        <div data-testid="optimization-suggestions" className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-semibold text-sm mb-2">最適化提案</h4>
          <ul className="text-sm space-y-1">
            {optimizations.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* バッファ追加ダイアログ */}
      {showBufferDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80">
            <h3 className="font-semibold mb-4">バッファ時間を追加</h3>
            <div className="mb-4">
              <label htmlFor="buffer-days" className="block text-sm font-medium mb-1">
                バッファ日数
              </label>
              <input
                id="buffer-days"
                type="number"
                value={bufferDays}
                onChange={(e) => setBufferDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowBufferDialog(null);
                  setBufferDays('');
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddBuffer}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}