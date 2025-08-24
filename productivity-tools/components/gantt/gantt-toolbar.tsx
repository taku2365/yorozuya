"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Calendar,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Menu,
  Plus,
  Printer,
  Settings,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { GanttViewMode, GanttExportFormat } from '@/lib/types/gantt';

interface GanttToolbarProps {
  viewMode: GanttViewMode;
  showCriticalPath: boolean;
  showDependencies: boolean;
  showProgress: boolean;
  onViewModeChange: (mode: GanttViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToday: () => void;
  onExport: (format: GanttExportFormat) => void;
  onPrint: () => void;
  onToggleCriticalPath: () => void;
  onToggleDependencies: () => void;
  onToggleProgress: () => void;
  onAddTask: () => void;
  onSettings: () => void;
}

const viewModeLabels: Record<GanttViewMode, string> = {
  day: '日',
  week: '週',
  month: '月',
  quarter: '四半期',
  year: '年',
};

export function GanttToolbar({
  viewMode,
  showCriticalPath,
  showDependencies,
  showProgress,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onToday,
  onExport,
  onPrint,
  onToggleCriticalPath,
  onToggleDependencies,
  onToggleProgress,
  onAddTask,
  onSettings,
}: GanttToolbarProps) {
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '+':
          case '=':
            e.preventDefault();
            onZoomIn();
            break;
          case '-':
            e.preventDefault();
            onZoomOut();
            break;
          case 't':
            e.preventDefault();
            onToday();
            break;
          case 'n':
            e.preventDefault();
            onAddTask();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut, onToday, onAddTask]);

  const handleExport = useCallback((format: GanttExportFormat) => {
    onExport(format);
    setShowExportMenu(false);
  }, [onExport]);

  const ToggleButton = ({ 
    label, 
    pressed, 
    onClick, 
    icon: Icon 
  }: { 
    label: string; 
    pressed: boolean; 
    onClick: () => void; 
    icon: React.ElementType;
  }) => (
    <button
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "p-2 rounded transition-colors",
        pressed ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
    const [show, setShow] = useState(false);
    
    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {children}
        </div>
        {show && (
          <div 
            role="tooltip"
            className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap z-[100]"
            style={{ transform: 'translateX(-25%)' }}
          >
            {content}
            <div className="absolute top-full left-1/4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div 
        data-testid="gantt-toolbar"
        role="toolbar"
        aria-label="ガントチャートツールバー"
        className="flex items-center justify-between p-2 bg-white border-b"
      >
        <button
          aria-label="新規タスク"
          onClick={onAddTask}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            data-testid="view-mode-select"
            onClick={() => setShowViewModeMenu(!showViewModeMenu)}
            className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-50"
          >
            {viewModeLabels[viewMode]}
            <ChevronDown className="w-4 h-4" />
          </button>

          {showViewModeMenu && (
            <div className="absolute top-full mt-1 bg-white border rounded shadow-lg z-50">
              {Object.entries(viewModeLabels).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => {
                    onViewModeChange(mode as GanttViewMode);
                    setShowViewModeMenu(false);
                  }}
                  className={cn(
                    "block w-full px-4 py-2 text-left hover:bg-gray-100",
                    viewMode === mode && "bg-blue-50 text-blue-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          aria-label="メニュー"
          onClick={() => setShowMobileMenu(true)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <Menu className="w-5 h-5" />
        </button>

        {showMobileMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg">
              <div className="p-4">
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="absolute top-4 right-4"
                >
                  ✕
                </button>
                <h3 className="font-semibold mb-4">表示設定</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showCriticalPath}
                      onChange={onToggleCriticalPath}
                    />
                    クリティカルパス
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showDependencies}
                      onChange={onToggleDependencies}
                    />
                    依存関係
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showProgress}
                      onChange={onToggleProgress}
                    />
                    進捗表示
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      data-testid="gantt-toolbar"
      role="toolbar"
      aria-label="ガントチャートツールバー"
      className="flex items-center justify-between p-2 bg-white border-b"
    >
      <div className="flex items-center gap-2">
        <Tooltip content="新規タスク (Ctrl+N)">
          <button
            aria-label="新規タスク"
            onClick={onAddTask}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="h-6 w-px bg-gray-300" />

        <div className="relative">
          <button
            data-testid="view-mode-select"
            onClick={() => setShowViewModeMenu(!showViewModeMenu)}
            className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-50"
          >
            {viewModeLabels[viewMode]}
            <ChevronDown className="w-4 h-4" />
          </button>

          {showViewModeMenu && (
            <div className="absolute top-full mt-1 bg-white border rounded shadow-lg z-50">
              {Object.entries(viewModeLabels).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => {
                    onViewModeChange(mode as GanttViewMode);
                    setShowViewModeMenu(false);
                  }}
                  className={cn(
                    "block w-full px-4 py-2 text-left hover:bg-gray-100",
                    viewMode === mode && "bg-blue-50 text-blue-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <Tooltip content="拡大 (Ctrl++)">
          <button
            aria-label="拡大"
            onClick={onZoomIn}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="縮小 (Ctrl+-)">
          <button
            aria-label="縮小"
            onClick={onZoomOut}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="今日へ移動 (Ctrl+T)">
          <button
            onClick={onToday}
            className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded"
          >
            <Calendar className="w-4 h-4" />
            今日
          </button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <ToggleButton
          label="クリティカルパス"
          pressed={showCriticalPath}
          onClick={onToggleCriticalPath}
          icon={showCriticalPath ? Eye : EyeOff}
        />

        <ToggleButton
          label="依存関係"
          pressed={showDependencies}
          onClick={onToggleDependencies}
          icon={showDependencies ? Eye : EyeOff}
        />

        <ToggleButton
          label="進捗表示"
          pressed={showProgress}
          onClick={onToggleProgress}
          icon={showProgress ? Eye : EyeOff}
        />

        <div className="h-6 w-px bg-gray-300" />

        <div className="relative">
          <button
            aria-label="エクスポート"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Download className="w-4 h-4" />
          </button>

          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border rounded shadow-lg z-50">
              <button
                onClick={() => handleExport('png')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                PNG画像
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                CSV
              </button>
            </div>
          )}
        </div>

        <button
          aria-label="印刷"
          onClick={onPrint}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <Printer className="w-4 h-4" />
        </button>

        <button
          aria-label="設定"
          onClick={onSettings}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}