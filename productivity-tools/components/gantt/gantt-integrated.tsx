"use client";

import React, { useState } from 'react';
import { GanttProvider } from '@/components/gantt/gantt-context';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { GanttToolbar } from '@/components/gantt/gantt-toolbar';
import { GanttViewSettings, type GanttViewSettingsData } from '@/components/gantt/gantt-view-settings';
import { GanttCriticalPath } from '@/components/gantt/gantt-critical-path';
import { GanttTaskDialog } from '@/components/gantt/gantt-task-dialog';
import { useGantt } from '@/components/gantt/gantt-context';
import type { GanttExportFormat, GanttTask } from '@/lib/types/gantt';

function GanttPageContent() {
  const {
    tasks,
    dependencies,
    viewMode,
    setViewMode,
    zoomIn,
    zoomOut,
    calculateCriticalPath,
    createTask,
    updateTask,
    createDependency,
  } = useGantt();

  const [showSettings, setShowSettings] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<GanttTask | undefined>(undefined);
  const [settings, setSettings] = useState<GanttViewSettingsData>({
    showWeekends: true,
    showHolidays: true,
    workingHours: { start: 9, end: 18 },
    theme: 'light',
    dateFormat: 'YYYY-MM-DD',
    firstDayOfWeek: 1,
    defaultTaskDuration: 1,
    autoSchedule: true,
    showTaskLabels: true,
    compactMode: false,
  });

  const handleToday = () => {
    // 今日の日付にスクロール
    const today = new Date();
    const timeline = document.querySelector('[data-testid="gantt-timeline"]');
    if (timeline) {
      const todayElement = timeline.querySelector(`[data-date="${today.toISOString().split('T')[0]}"]`);
      todayElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleExport = async (format: GanttExportFormat) => {
    // エクスポート処理
    switch (format) {
      case 'png':
        // PNG画像としてエクスポート
        const canvas = document.createElement('canvas');
        // ... canvas描画処理 ...
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gantt-chart-${new Date().toISOString()}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
        break;
      case 'pdf':
        // PDF生成
        break;
      case 'excel':
        // Excel形式でエクスポート
        break;
      case 'csv':
        // CSV形式でエクスポート
        break;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddTask = () => {
    setSelectedTask(undefined);
    setShowTaskDialog(true);
  };
  
  const handleTaskSubmit = async (data: Partial<GanttTask>) => {
    if (selectedTask) {
      // 既存タスクの更新
      await updateTask({ ...selectedTask, ...data });
    } else {
      // 新規タスク作成
      await createTask(data);
    }
    setShowTaskDialog(false);
  };

  const handleSettingsSave = (newSettings: GanttViewSettingsData) => {
    setSettings(newSettings);
    // 設定を適用
  };

  return (
    <div className="flex flex-col h-full">
      <GanttToolbar
        viewMode={viewMode}
        showCriticalPath={showCriticalPath}
        showDependencies={showDependencies}
        showProgress={showProgress}
        onViewModeChange={setViewMode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onToday={handleToday}
        onExport={handleExport}
        onPrint={handlePrint}
        onToggleCriticalPath={() => setShowCriticalPath(!showCriticalPath)}
        onToggleDependencies={() => setShowDependencies(!showDependencies)}
        onToggleProgress={() => setShowProgress(!showProgress)}
        onAddTask={handleAddTask}
        onSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 flex">
        <div className={showCriticalPath ? 'flex-1' : 'w-full'}>
          <GanttChart
            tasks={tasks}
            dependencies={dependencies}
            showDependencies={showDependencies}
            showProgress={showProgress}
            viewMode={viewMode}
            onTaskUpdate={(task) => {
              updateTask(task);
            }}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setShowTaskDialog(true);
            }}
            onDependencyCreate={(fromId, toId) => {
              createDependency(fromId, toId);
            }}
            enableHierarchyDragDrop
          />
        </div>

        {showCriticalPath && (
          <div className="w-96 border-l p-4">
            <GanttCriticalPath
              tasks={tasks}
              onCalculateCriticalPath={calculateCriticalPath}
              onTaskUpdate={updateTask}
              showOptimizations
              onExport={(data) => {
                // クリティカルパスデータのエクスポート
                console.log('Export critical path:', data);
              }}
            />
          </div>
        )}
      </div>

      <GanttViewSettings
        isOpen={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
      
      <GanttTaskDialog
        isOpen={showTaskDialog}
        task={selectedTask}
        onClose={() => setShowTaskDialog(false)}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}

export function GanttIntegrated() {
  return (
    <GanttProvider>
      <GanttPageContent />
    </GanttProvider>
  );
}