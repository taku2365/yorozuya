import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GanttViewSettings } from '../gantt-view-settings';

describe('GanttViewSettings', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultSettings = {
    showWeekends: true,
    showHolidays: true,
    workingHours: { start: 9, end: 18 },
    theme: 'light' as const,
    dateFormat: 'YYYY-MM-DD',
    firstDayOfWeek: 1,
    defaultTaskDuration: 1,
    autoSchedule: true,
    showTaskLabels: true,
    compactMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('設定ダイアログが表示される', () => {
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('gantt-view-settings')).toBeInTheDocument();
      expect(screen.getByText('ガントチャート設定')).toBeInTheDocument();
    });

    it('閉じた状態では何も表示されない', () => {
      render(
        <GanttViewSettings
          isOpen={false}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId('gantt-view-settings')).not.toBeInTheDocument();
    });
  });

  describe('表示設定', () => {
    it('週末表示の切り替えができる', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const weekendToggle = screen.getByLabelText('週末を表示');
      expect(weekendToggle).toBeChecked();

      await user.click(weekendToggle);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          showWeekends: false,
        })
      );
    });

    it('祝日表示の切り替えができる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const holidayToggle = screen.getByLabelText('祝日を表示');
      await user.click(holidayToggle);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          showHolidays: false,
        })
      );
    });

    it('タスクラベル表示の切り替えができる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const labelToggle = screen.getByLabelText('タスクラベルを表示');
      await user.click(labelToggle);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          showTaskLabels: false,
        })
      );
    });

    it('コンパクトモードの切り替えができる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const compactToggle = screen.getByLabelText('コンパクト表示');
      await user.click(compactToggle);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          compactMode: true,
        })
      );
    });
  });

  describe('作業時間設定', () => {
    it('開始時間を変更できる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const startTimeInput = screen.getByLabelText('開始時間');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '8');

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          workingHours: { start: 8, end: 18 },
        })
      );
    });

    it('終了時間を変更できる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const endTimeInput = screen.getByLabelText('終了時間');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '19');

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          workingHours: { start: 9, end: 19 },
        })
      );
    });

    it('無効な作業時間は設定できない', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const startTimeInput = screen.getByLabelText('開始時間');
      const endTimeInput = screen.getByLabelText('終了時間');

      await user.clear(startTimeInput);
      await user.type(startTimeInput, '20');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '8');

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      // エラーメッセージが表示される
      expect(screen.getByText('開始時間は終了時間より前に設定してください')).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('カレンダー設定', () => {
    it('週の開始曜日を変更できる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const firstDaySelect = screen.getByLabelText('週の開始曜日');
      await user.selectOptions(firstDaySelect, '0'); // 日曜日

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          firstDayOfWeek: 0,
        })
      );
    });

    it('日付フォーマットを変更できる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const formatSelect = screen.getByLabelText('日付フォーマット');
      await user.selectOptions(formatSelect, 'MM/DD/YYYY');

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFormat: 'MM/DD/YYYY',
        })
      );
    });
  });

  describe('タスク設定', () => {
    it('デフォルトタスク期間を変更できる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const durationInput = screen.getByLabelText('新規タスクのデフォルト期間（日）');
      await user.clear(durationInput);
      await user.type(durationInput, '5');

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultTaskDuration: 5,
        })
      );
    });

    it('自動スケジューリングの切り替えができる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const autoScheduleToggle = screen.getByLabelText('自動スケジューリング');
      await user.click(autoScheduleToggle);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          autoSchedule: false,
        })
      );
    });
  });

  describe('テーマ設定', () => {
    it('テーマを変更できる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const darkThemeButton = screen.getByLabelText('ダークテーマ');
      await user.click(darkThemeButton);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'dark',
        })
      );
    });
  });

  describe('アクション', () => {
    it('キャンセルボタンで閉じる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('Escキーで閉じる', () => {
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('オーバーレイクリックで閉じる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const overlay = screen.getByTestId('settings-overlay');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('設定をリセットできる', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={{
            ...defaultSettings,
            showWeekends: false,
            theme: 'dark' as const,
          }}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const resetButton = screen.getByText('デフォルトに戻す');
      await user.click(resetButton);

      // 確認ダイアログが表示される
      expect(screen.getByText('設定をデフォルトに戻しますか？')).toBeInTheDocument();

      const confirmButton = screen.getByText('リセット');
      await user.click(confirmButton);

      // デフォルト値で保存される
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          showWeekends: true,
          theme: 'light',
        })
      );
    });
  });

  describe('バリデーション', () => {
    it('必須項目が空の場合エラーが表示される', async () => {
      const user = userEvent.setup();
      render(
        <GanttViewSettings
          isOpen={true}
          settings={defaultSettings}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const durationInput = screen.getByLabelText('新規タスクのデフォルト期間（日）');
      await user.clear(durationInput);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(screen.getByText('期間は1以上の数値を入力してください')).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});