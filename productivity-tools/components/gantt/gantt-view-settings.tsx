"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface GanttViewSettingsData {
  showWeekends: boolean;
  showHolidays: boolean;
  workingHours: { start: number; end: number };
  theme: 'light' | 'dark';
  dateFormat: string;
  firstDayOfWeek: number;
  defaultTaskDuration: number;
  autoSchedule: boolean;
  showTaskLabels: boolean;
  compactMode: boolean;
}

interface GanttViewSettingsProps {
  isOpen: boolean;
  settings: GanttViewSettingsData;
  onClose: () => void;
  onSave: (settings: GanttViewSettingsData) => void;
}

const defaultSettings: GanttViewSettingsData = {
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
};

export function GanttViewSettings({
  isOpen,
  settings,
  onClose,
  onSave,
}: GanttViewSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [errors, setErrors] = useState<Partial<Record<keyof GanttViewSettingsData, string>>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const validateSettings = (): boolean => {
    const newErrors: typeof errors = {};

    if (localSettings.workingHours.start >= localSettings.workingHours.end) {
      newErrors.workingHours = '開始時間は終了時間より前に設定してください';
    }

    if (!localSettings.defaultTaskDuration || localSettings.defaultTaskDuration < 1) {
      newErrors.defaultTaskDuration = '期間は1以上の数値を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateSettings()) {
      onSave(localSettings);
      onClose();
    }
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
    onSave(defaultSettings);
    setShowResetConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        data-testid="settings-overlay"
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div 
        data-testid="gantt-view-settings"
        className="absolute inset-x-4 inset-y-10 md:inset-x-auto md:inset-y-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">ガントチャート設定</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* 表示設定 */}
          <section className="mb-6">
            <h3 className="font-medium mb-3">表示設定</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.showWeekends}
                  onChange={(e) => setLocalSettings({ ...localSettings, showWeekends: e.target.checked })}
                />
                <span>週末を表示</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.showHolidays}
                  onChange={(e) => setLocalSettings({ ...localSettings, showHolidays: e.target.checked })}
                />
                <span>祝日を表示</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.showTaskLabels}
                  onChange={(e) => setLocalSettings({ ...localSettings, showTaskLabels: e.target.checked })}
                />
                <span>タスクラベルを表示</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.compactMode}
                  onChange={(e) => setLocalSettings({ ...localSettings, compactMode: e.target.checked })}
                />
                <span>コンパクト表示</span>
              </label>
            </div>
          </section>

          {/* 作業時間 */}
          <section className="mb-6">
            <h3 className="font-medium mb-3">作業時間</h3>
            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="start-time" className="block text-sm mb-1">開始時間</label>
                <input
                  id="start-time"
                  type="number"
                  min="0"
                  max="23"
                  value={localSettings.workingHours.start}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    workingHours: { ...localSettings.workingHours, start: parseInt(e.target.value) || 0 }
                  })}
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label htmlFor="end-time" className="block text-sm mb-1">終了時間</label>
                <input
                  id="end-time"
                  type="number"
                  min="0"
                  max="23"
                  value={localSettings.workingHours.end}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    workingHours: { ...localSettings.workingHours, end: parseInt(e.target.value) || 0 }
                  })}
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
            </div>
            {errors.workingHours && (
              <p className="text-red-500 text-sm mt-1">{errors.workingHours}</p>
            )}
          </section>

          {/* カレンダー設定 */}
          <section className="mb-6">
            <h3 className="font-medium mb-3">カレンダー設定</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="first-day" className="block text-sm mb-1">週の開始曜日</label>
                <select
                  id="first-day"
                  value={localSettings.firstDayOfWeek}
                  onChange={(e) => setLocalSettings({ ...localSettings, firstDayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="0">日曜日</option>
                  <option value="1">月曜日</option>
                </select>
              </div>
              <div>
                <label htmlFor="date-format" className="block text-sm mb-1">日付フォーマット</label>
                <select
                  id="date-format"
                  value={localSettings.dateFormat}
                  onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value })}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
            </div>
          </section>

          {/* タスク設定 */}
          <section className="mb-6">
            <h3 className="font-medium mb-3">タスク設定</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="default-duration" className="block text-sm mb-1">
                  新規タスクのデフォルト期間（日）
                </label>
                <input
                  id="default-duration"
                  type="number"
                  min="1"
                  value={localSettings.defaultTaskDuration}
                  onChange={(e) => setLocalSettings({ 
                    ...localSettings, 
                    defaultTaskDuration: parseInt(e.target.value) || 1 
                  })}
                  className="w-20 px-2 py-1 border rounded"
                />
                {errors.defaultTaskDuration && (
                  <p className="text-red-500 text-sm mt-1">{errors.defaultTaskDuration}</p>
                )}
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.autoSchedule}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoSchedule: e.target.checked })}
                />
                <span>自動スケジューリング</span>
              </label>
            </div>
          </section>

          {/* テーマ */}
          <section className="mb-6">
            <h3 className="font-medium mb-3">テーマ</h3>
            <div className="flex gap-2">
              <button
                aria-label="ライトテーマ"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                className={cn(
                  "px-4 py-2 rounded",
                  localSettings.theme === 'light' 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                ライト
              </button>
              <button
                aria-label="ダークテーマ"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'dark' })}
                className={cn(
                  "px-4 py-2 rounded",
                  localSettings.theme === 'dark' 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                ダーク
              </button>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-red-600 hover:text-red-700"
          >
            デフォルトに戻す
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* リセット確認ダイアログ */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <p className="mb-4">設定をデフォルトに戻しますか？</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}