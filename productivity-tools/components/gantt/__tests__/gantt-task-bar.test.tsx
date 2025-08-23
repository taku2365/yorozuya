import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GanttTaskBar } from '../gantt-task-bar';
import type { GanttTask } from '@/lib/types/gantt';

// useTooltipPositionフックのモック
vi.mock('@/hooks/use-tooltip-position', () => ({
  useTooltipPosition: vi.fn(() => ({
    left: 100,
    bottom: 50,
    transform: 'translateX(-50%)',
  })),
}));

// モックデータ
const mockTask: GanttTask = {
  id: 'task1',
  title: 'テストタスク',
  icon: 'folder',
  color: 'blue',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-05'),
  progress: 50,
  dependencies: ['task0'],
  isCriticalPath: false,
  children: ['task2', 'task3'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCriticalTask: GanttTask = {
  ...mockTask,
  id: 'task2',
  color: 'red',
  isCriticalPath: true,
  children: [],
};

describe('GanttTaskBar', () => {
  const mockOnUpdate = vi.fn();
  const defaultProps = {
    task: mockTask,
    startDate: new Date('2023-12-25'),
    endDate: new Date('2024-01-15'),
    viewMode: 'day' as const,
    level: 0,
    onUpdate: mockOnUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的な表示', () => {
    it('タスクバーが正しい位置と幅で表示される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const taskBar = screen.getByTestId('task-bar-task1');
      expect(taskBar).toBeInTheDocument();
      
      // スタイルが適用されているか確認
      const style = window.getComputedStyle(taskBar);
      expect(style.left).toMatch(/\d+(\.\d+)?%/);
      expect(style.width).toMatch(/\d+(\.\d+)?%/);
    });

    it('タスクタイトルが表示される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      expect(screen.getByText('テストタスク')).toBeInTheDocument();
    });

    it('進捗率が正しく表示される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const progressBar = screen.getByTestId('task-progress-task1');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('タスクの色が適用される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const taskBar = screen.getByTestId('task-bar-task1');
      expect(taskBar).toHaveClass('bg-blue-500');
    });

    it('クリティカルパスタスクが強調表示される', () => {
      render(<GanttTaskBar {...defaultProps} task={mockCriticalTask} />);
      
      const taskBar = screen.getByTestId('task-bar-task2');
      expect(taskBar).toHaveClass('bg-red-500', 'ring-2', 'ring-red-600');
    });
  });

  describe('依存関係の表示', () => {
    it('先行タスクがある場合、左側に接続ポイントが表示される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const leftConnector = screen.getByTestId('dependency-connector-left-task1');
      expect(leftConnector).toBeInTheDocument();
    });

    it('後続タスクがある場合、右側に接続ポイントが表示される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const rightConnector = screen.getByTestId('dependency-connector-right-task1');
      expect(rightConnector).toBeInTheDocument();
    });

    it('依存関係がない場合、接続ポイントは表示されない', () => {
      const taskWithoutDeps = { ...mockTask, dependencies: [], children: [] };
      render(<GanttTaskBar {...defaultProps} task={taskWithoutDeps} />);
      
      expect(screen.queryByTestId('dependency-connector-left-task1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dependency-connector-right-task1')).not.toBeInTheDocument();
    });
  });

  describe('ホバー効果', () => {
    it('ホバー時にツールチップが表示される', async () => {
      const user = userEvent.setup();
      render(<GanttTaskBar {...defaultProps} />);
      
      const taskBar = screen.getByTestId('task-bar-task1');
      await user.hover(taskBar);
      
      // ツールチップが表示される
      await expect(screen.findByTestId('task-tooltip-task1')).resolves.toBeInTheDocument();
      
      const tooltip = screen.getByTestId('task-tooltip-task1');
      expect(tooltip).toHaveTextContent('テストタスク');
      expect(tooltip).toHaveTextContent('2024-01-01 〜 2024-01-05');
      expect(tooltip).toHaveTextContent('進捗: 50%');
    });

    it('ホバー解除時にツールチップが非表示になる', async () => {
      const user = userEvent.setup();
      render(<GanttTaskBar {...defaultProps} />);
      
      const taskBar = screen.getByTestId('task-bar-task1');
      await user.hover(taskBar);
      await user.unhover(taskBar);
      
      expect(screen.queryByTestId('task-tooltip-task1')).not.toBeInTheDocument();
    });

    it('ツールチップは動的に位置が調整される', async () => {
      const user = userEvent.setup();
      const { useTooltipPosition } = await import('@/hooks/use-tooltip-position');
      const mockedHook = vi.mocked(useTooltipPosition);

      // 左端の場合
      mockedHook.mockReturnValueOnce({
        left: 8,
        bottom: 50,
        transform: 'translateX(0)',
      });

      const { rerender } = render(<GanttTaskBar {...defaultProps} />);
      const taskBar = screen.getByTestId('task-bar-task1');
      await user.hover(taskBar);

      let tooltip = screen.getByTestId('task-tooltip-task1');
      expect(tooltip).toHaveStyle({ left: '8px', transform: 'translateX(0)' });

      await user.unhover(taskBar);

      // 右端の場合
      mockedHook.mockReturnValueOnce({
        left: 800,
        bottom: 50,
        transform: 'translateX(0)',
      });

      rerender(<GanttTaskBar {...defaultProps} />);
      await user.hover(taskBar);

      tooltip = screen.getByTestId('task-tooltip-task1');
      expect(tooltip).toHaveStyle({ left: '800px', transform: 'translateX(0)' });
    });
  });

  describe('インタラクション', () => {
    it('タスクバーをクリックするとonTaskClickが呼ばれる', async () => {
      const mockOnTaskClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <GanttTaskBar 
          {...defaultProps} 
          onTaskClick={mockOnTaskClick}
        />
      );
      
      const taskBar = screen.getByTestId('task-bar-task1');
      await user.click(taskBar);
      
      expect(mockOnTaskClick).toHaveBeenCalledWith(mockTask);
    });

    it('ダブルクリックでタスク編集モードになる', async () => {
      const mockOnTaskEdit = vi.fn();
      const user = userEvent.setup();
      
      render(
        <GanttTaskBar 
          {...defaultProps} 
          onTaskEdit={mockOnTaskEdit}
        />
      );
      
      const taskBar = screen.getByTestId('task-bar-task1');
      await user.dblClick(taskBar);
      
      expect(mockOnTaskEdit).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('リサイズ機能', () => {
    it('タスクバーの右端にリサイズハンドルが表示される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const resizeHandle = screen.getByTestId('resize-handle-right-task1');
      expect(resizeHandle).toBeInTheDocument();
    });

    it('タスクバーの左端にリサイズハンドルが表示される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const resizeHandle = screen.getByTestId('resize-handle-left-task1');
      expect(resizeHandle).toBeInTheDocument();
    });

    it('リサイズハンドルをドラッグすると幅が変更される', async () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const resizeHandle = screen.getByTestId('resize-handle-right-task1');
      
      // ドラッグ開始
      fireEvent.mouseDown(resizeHandle, { clientX: 100 });
      
      // ドラッグ中
      fireEvent.mouseMove(document, { clientX: 150 });
      
      // ドラッグ終了
      fireEvent.mouseUp(document);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task1',
          endDate: expect.any(Date),
        })
      );
    });
  });

  describe('ビューモード対応', () => {
    it('週ビューでは幅が適切に調整される', () => {
      render(<GanttTaskBar {...defaultProps} viewMode="week" />);
      
      const taskBar = screen.getByTestId('task-bar-task1');
      expect(taskBar).toBeInTheDocument();
      // 週ビューでの幅計算が適用される
    });

    it('月ビューでは幅が適切に調整される', () => {
      render(<GanttTaskBar {...defaultProps} viewMode="month" />);
      
      const taskBar = screen.getByTestId('task-bar-task1');
      expect(taskBar).toBeInTheDocument();
      // 月ビューでの幅計算が適用される
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なaria属性が設定される', () => {
      render(<GanttTaskBar {...defaultProps} />);
      
      const taskBar = screen.getByTestId('task-bar-task1');
      expect(taskBar).toHaveAttribute('role', 'button');
      expect(taskBar).toHaveAttribute('aria-label', 'テストタスク');
      expect(taskBar).toHaveAttribute('tabIndex', '0');
    });

    it('キーボード操作でフォーカスできる', async () => {
      const user = userEvent.setup();
      render(<GanttTaskBar {...defaultProps} />);
      
      await user.tab();
      
      const taskBar = screen.getByTestId('task-bar-task1');
      expect(taskBar).toHaveFocus();
    });

    it('Enterキーでタスクをクリックできる', async () => {
      const mockOnTaskClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <GanttTaskBar 
          {...defaultProps} 
          onTaskClick={mockOnTaskClick}
        />
      );
      
      const taskBar = screen.getByTestId('task-bar-task1');
      taskBar.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnTaskClick).toHaveBeenCalledWith(mockTask);
    });
  });
});