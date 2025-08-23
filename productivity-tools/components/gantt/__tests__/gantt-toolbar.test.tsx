import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GanttToolbar } from '../gantt-toolbar';
import type { GanttViewMode, GanttExportFormat } from '@/lib/types/gantt';

describe('GanttToolbar', () => {
  const mockOnViewModeChange = vi.fn();
  const mockOnZoomIn = vi.fn();
  const mockOnZoomOut = vi.fn();
  const mockOnToday = vi.fn();
  const mockOnExport = vi.fn();
  const mockOnPrint = vi.fn();
  const mockOnToggleCriticalPath = vi.fn();
  const mockOnToggleDependencies = vi.fn();
  const mockOnToggleProgress = vi.fn();
  const mockOnAddTask = vi.fn();
  const mockOnSettings = vi.fn();

  const defaultProps = {
    viewMode: 'day' as GanttViewMode,
    showCriticalPath: false,
    showDependencies: true,
    showProgress: true,
    onViewModeChange: mockOnViewModeChange,
    onZoomIn: mockOnZoomIn,
    onZoomOut: mockOnZoomOut,
    onToday: mockOnToday,
    onExport: mockOnExport,
    onPrint: mockOnPrint,
    onToggleCriticalPath: mockOnToggleCriticalPath,
    onToggleDependencies: mockOnToggleDependencies,
    onToggleProgress: mockOnToggleProgress,
    onAddTask: mockOnAddTask,
    onSettings: mockOnSettings,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本機能', () => {
    it('ツールバーが正しくレンダリングされる', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      expect(screen.getByTestId('gantt-toolbar')).toBeInTheDocument();
      expect(screen.getByText('日')).toBeInTheDocument();
      expect(screen.getByLabelText('拡大')).toBeInTheDocument();
      expect(screen.getByLabelText('縮小')).toBeInTheDocument();
      expect(screen.getByText('今日')).toBeInTheDocument();
    });

    it('新規タスクボタンが表示され、クリックできる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const addButton = screen.getByLabelText('新規タスク');
      await user.click(addButton);
      
      expect(mockOnAddTask).toHaveBeenCalled();
    });
  });

  describe('ビューモード切り替え', () => {
    it('ビューモードを切り替えられる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const viewModeSelect = screen.getByTestId('view-mode-select');
      await user.click(viewModeSelect);
      
      // ドロップダウンメニューが表示される
      expect(screen.getByText('週')).toBeInTheDocument();
      expect(screen.getByText('月')).toBeInTheDocument();
      expect(screen.getByText('四半期')).toBeInTheDocument();
      expect(screen.getByText('年')).toBeInTheDocument();
      
      // 週を選択
      await user.click(screen.getByText('週'));
      
      expect(mockOnViewModeChange).toHaveBeenCalledWith('week');
    });

    it('現在のビューモードが選択状態で表示される', () => {
      render(<GanttToolbar {...defaultProps} viewMode="month" />);
      
      expect(screen.getByText('月')).toBeInTheDocument();
    });
  });

  describe('ズーム機能', () => {
    it('拡大ボタンがクリックできる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('拡大');
      await user.click(zoomInButton);
      
      expect(mockOnZoomIn).toHaveBeenCalled();
    });

    it('縮小ボタンがクリックできる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const zoomOutButton = screen.getByLabelText('縮小');
      await user.click(zoomOutButton);
      
      expect(mockOnZoomOut).toHaveBeenCalled();
    });

    it('今日ボタンで現在日付にジャンプできる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const todayButton = screen.getByText('今日');
      await user.click(todayButton);
      
      expect(mockOnToday).toHaveBeenCalled();
    });
  });

  describe('表示オプション', () => {
    it('クリティカルパスの表示を切り替えられる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const toggleButton = screen.getByLabelText('クリティカルパス');
      await user.click(toggleButton);
      
      expect(mockOnToggleCriticalPath).toHaveBeenCalled();
    });

    it('依存関係の表示を切り替えられる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const toggleButton = screen.getByLabelText('依存関係');
      await user.click(toggleButton);
      
      expect(mockOnToggleDependencies).toHaveBeenCalled();
    });

    it('進捗表示を切り替えられる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const toggleButton = screen.getByLabelText('進捗表示');
      await user.click(toggleButton);
      
      expect(mockOnToggleProgress).toHaveBeenCalled();
    });

    it('トグルボタンの状態が正しく表示される', () => {
      render(
        <GanttToolbar 
          {...defaultProps} 
          showCriticalPath={true}
          showDependencies={false}
          showProgress={true}
        />
      );
      
      const criticalPathButton = screen.getByLabelText('クリティカルパス');
      const dependenciesButton = screen.getByLabelText('依存関係');
      const progressButton = screen.getByLabelText('進捗表示');
      
      expect(criticalPathButton).toHaveAttribute('aria-pressed', 'true');
      expect(dependenciesButton).toHaveAttribute('aria-pressed', 'false');
      expect(progressButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('エクスポート機能', () => {
    it('エクスポートメニューが表示される', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const exportButton = screen.getByLabelText('エクスポート');
      await user.click(exportButton);
      
      // エクスポートメニューが表示される
      expect(screen.getByText('PNG画像')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
    });

    it('各エクスポート形式を選択できる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const exportButton = screen.getByLabelText('エクスポート');
      await user.click(exportButton);
      
      // PNG画像を選択
      await user.click(screen.getByText('PNG画像'));
      expect(mockOnExport).toHaveBeenCalledWith('png');
      
      // メニューが閉じる
      expect(screen.queryByText('PDF')).not.toBeInTheDocument();
    });

    it('印刷ボタンがクリックできる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const printButton = screen.getByLabelText('印刷');
      await user.click(printButton);
      
      expect(mockOnPrint).toHaveBeenCalled();
    });
  });

  describe('設定機能', () => {
    it('設定ボタンがクリックできる', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const settingsButton = screen.getByLabelText('設定');
      await user.click(settingsButton);
      
      expect(mockOnSettings).toHaveBeenCalled();
    });
  });

  describe('レスポンシブ対応', () => {
    it('モバイルビューで省略表示される', () => {
      // ビューポートを狭くする
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
      
      render(<GanttToolbar {...defaultProps} />);
      
      // モバイルメニューボタンが表示される
      expect(screen.getByLabelText('メニュー')).toBeInTheDocument();
      
      // 一部のボタンは非表示
      expect(screen.queryByText('四半期')).not.toBeInTheDocument();
    });

    it('モバイルメニューを開くとすべてのオプションが表示される', async () => {
      const user = userEvent.setup();
      global.innerWidth = 500;
      
      render(<GanttToolbar {...defaultProps} />);
      
      const menuButton = screen.getByLabelText('メニュー');
      await user.click(menuButton);
      
      // ドロワーメニューにすべてのオプションが表示される
      expect(screen.getByText('表示設定')).toBeInTheDocument();
      expect(screen.getByText('クリティカルパス')).toBeInTheDocument();
      expect(screen.getByText('依存関係')).toBeInTheDocument();
      expect(screen.getByText('進捗表示')).toBeInTheDocument();
    });
  });

  describe('キーボードショートカット', () => {
    it('キーボードショートカットが動作する', async () => {
      render(<GanttToolbar {...defaultProps} />);
      
      // Ctrl+Plus で拡大
      fireEvent.keyDown(document, { key: '+', ctrlKey: true });
      expect(mockOnZoomIn).toHaveBeenCalled();
      
      // Ctrl+Minus で縮小
      fireEvent.keyDown(document, { key: '-', ctrlKey: true });
      expect(mockOnZoomOut).toHaveBeenCalled();
      
      // Ctrl+T で今日へ
      fireEvent.keyDown(document, { key: 't', ctrlKey: true });
      expect(mockOnToday).toHaveBeenCalled();
      
      // Ctrl+N で新規タスク
      fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
      expect(mockOnAddTask).toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なaria属性が設定されている', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      const toolbar = screen.getByTestId('gantt-toolbar');
      expect(toolbar).toHaveAttribute('role', 'toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'ガントチャートツールバー');
    });

    it('ツールチップが表示される', async () => {
      const user = userEvent.setup();
      render(<GanttToolbar {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('拡大');
      await user.hover(zoomInButton);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('拡大 (Ctrl++)');
      });
    });
  });
});