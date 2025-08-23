import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GanttChart } from '../gantt-chart';
import type { GanttTask } from '@/lib/types/gantt';

// モックデータ
const mockTasks: GanttTask[] = [
  {
    id: 'task1',
    title: 'タスク1',
    icon: 'folder',
    color: 'blue',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-05'),
    progress: 50,
    dependencies: [],
    isCriticalPath: false,
    children: ['task2', 'task3'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task2',
    title: 'タスク2',
    icon: 'document',
    color: 'green',
    parentId: 'task1',
    startDate: new Date('2024-01-02'),
    endDate: new Date('2024-01-04'),
    progress: 75,
    dependencies: [],
    isCriticalPath: false,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task3',
    title: 'タスク3',
    icon: 'person',
    color: 'red',
    parentId: 'task1',
    startDate: new Date('2024-01-03'),
    endDate: new Date('2024-01-05'),
    progress: 25,
    dependencies: ['task2'],
    isCriticalPath: true,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('GanttChart', () => {
  const mockOnTaskUpdate = vi.fn();
  const mockOnTaskClick = vi.fn();
  const mockOnDependencyCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的な表示', () => {
    it('ガントチャートが正しくレンダリングされる', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // タイムラインが表示される
      expect(screen.getByTestId('gantt-timeline')).toBeInTheDocument();

      // タスクリストが表示される
      expect(screen.getByTestId('gantt-task-list')).toBeInTheDocument();

      // カレンダーヘッダーが表示される
      expect(screen.getByTestId('gantt-calendar-header')).toBeInTheDocument();
    });

    it('タスクが階層構造で表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // 親タスクが表示される（タスクリスト内のみ）
      const taskList = screen.getByTestId('gantt-task-list');
      expect(within(taskList).getByText('タスク1')).toBeInTheDocument();

      // 子タスクがインデントされて表示される
      const task2 = within(taskList).getByText('タスク2');
      const task3 = within(taskList).getByText('タスク3');
      
      expect(task2.closest('[data-indent]')).toHaveAttribute('data-indent', '1');
      expect(task3.closest('[data-indent]')).toHaveAttribute('data-indent', '1');
    });

    it('タスクアイコンが正しく表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // フォルダアイコン
      expect(screen.getByTestId('icon-folder-task1')).toBeInTheDocument();
      
      // ドキュメントアイコン
      expect(screen.getByTestId('icon-document-task2')).toBeInTheDocument();
      
      // 人物アイコン
      expect(screen.getByTestId('icon-person-task3')).toBeInTheDocument();
    });

    it('現在日付線が表示される', () => {
      // 現在日付がタスク期間内に含まれるモックデータを作成
      const today = new Date();
      const tasksWithToday: GanttTask[] = [
        {
          id: 'task1',
          title: 'タスク1',
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7日前
          endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),   // 7日後
          progress: 50,
          dependencies: [],
          isCriticalPath: false,
          children: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(
        <GanttChart
          tasks={tasksWithToday}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      const todayLine = screen.getByTestId('gantt-today-line');
      expect(todayLine).toBeInTheDocument();
      expect(todayLine).toHaveClass('bg-red-500');
    });
  });

  describe('ビューモードの切り替え', () => {
    it('日ビューが正しく表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          viewMode="day"
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // 日付が個別に表示される
      const calendarHeader = screen.getByTestId('gantt-calendar-header');
      expect(calendarHeader).toHaveTextContent('1');
      expect(calendarHeader).toHaveTextContent('2');
      expect(calendarHeader).toHaveTextContent('3');
    });

    it('週ビューが正しく表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          viewMode="week"
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // 週番号が表示される
      const weekLabels = screen.getAllByText(/第\d+週/);
      expect(weekLabels.length).toBeGreaterThan(0);
    });

    it('月ビューが正しく表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          viewMode="month"
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // 月が表示される
      const monthLabels = screen.getAllByText(/2024年\d+月/);
      expect(monthLabels.length).toBeGreaterThan(0);
      expect(monthLabels[0]).toHaveTextContent('2024年1月');
    });

    it('四半期ビューが正しく表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          viewMode="quarter"
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // 四半期が表示される（テキストが分割されている可能性がある）
      const calendarHeader = screen.getByTestId('gantt-calendar-header');
      // タスクの期間が2024年1月なのでQ1が表示されるはず
      expect(calendarHeader.textContent).toMatch(/Q\d+ \d{4}/);
    });
  });

  describe('カレンダーヘッダー', () => {
    it('年月と日付が正しく表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          viewMode="day"
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      const calendarHeader = screen.getByTestId('gantt-calendar-header');
      
      // 年月が表示される
      expect(calendarHeader).toHaveTextContent('2024年1月');
      
      // 日付が表示される
      expect(calendarHeader).toHaveTextContent('1');
      expect(calendarHeader).toHaveTextContent('2');
      expect(calendarHeader).toHaveTextContent('3');
      
      // 曜日が表示される
      expect(calendarHeader).toHaveTextContent(/月|火|水|木|金|土|日/);
    });
  });

  describe('インタラクション', () => {
    it('タスクをクリックするとonTaskClickが呼ばれる', async () => {
      const user = userEvent.setup();
      
      render(
        <GanttChart
          tasks={mockTasks}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      const taskList = screen.getByTestId('gantt-task-list');
      const task1 = within(taskList).getByText('タスク1');
      await user.click(task1);

      expect(mockOnTaskClick).toHaveBeenCalledWith(expect.objectContaining({
        id: 'task1',
        title: 'タスク1'
      }));
    });

    it('タスクの展開・折りたたみができる', async () => {
      const user = userEvent.setup();
      
      render(
        <GanttChart
          tasks={mockTasks}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // 初期状態では子タスクが表示されている
      const taskList = screen.getByTestId('gantt-task-list');
      expect(within(taskList).getByText('タスク2')).toBeInTheDocument();
      expect(within(taskList).getByText('タスク3')).toBeInTheDocument();

      // 親タスクの展開ボタンをクリック
      const expandButton = screen.getByTestId('expand-button-task1');
      await user.click(expandButton);

      // 子タスクが非表示になる
      await waitFor(() => {
        expect(within(taskList).queryByText('タスク2')).not.toBeInTheDocument();
        expect(within(taskList).queryByText('タスク3')).not.toBeInTheDocument();
      });

      // もう一度クリックすると再表示される
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(within(taskList).getByText('タスク2')).toBeInTheDocument();
        expect(within(taskList).getByText('タスク3')).toBeInTheDocument();
      });
    });
  });

  describe('タスクバーの表示', () => {
    it('タスクバーが正しい位置と幅で表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          viewMode="day"
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // タスク1のバー（1月1日〜1月5日 = 5日間）
      const taskBar1 = screen.getByTestId('task-bar-task1');
      expect(taskBar1).toBeInTheDocument();
      
      // スタイルが適用されているか確認（%幅を持つ）
      const style = window.getComputedStyle(taskBar1);
      expect(style.width).toMatch(/\d+(\.\d+)?%/);

      // タスクの色が適用される
      expect(taskBar1).toHaveClass('bg-blue-500');

      // タスク3のバー（クリティカルパス）
      const taskBar3 = screen.getByTestId('task-bar-task3');
      expect(taskBar3).toHaveClass('bg-red-500', 'ring-2', 'ring-red-600');
    });

    it('進捗率が表示される', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // タスク1の進捗（50%）
      const progress1 = screen.getByTestId('task-progress-task1');
      expect(progress1).toHaveStyle({ width: '50%' });

      // タスク2の進捗（75%）
      const progress2 = screen.getByTestId('task-progress-task2');
      expect(progress2).toHaveStyle({ width: '75%' });
    });
  });

  describe('パフォーマンス', () => {
    it('大量のタスクでも正常に動作する', () => {
      // 100個のタスクを生成
      const manyTasks: GanttTask[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task${i}`,
        title: `タスク${i}`,
        startDate: new Date(2024, 0, 1 + i),
        endDate: new Date(2024, 0, 2 + i),
        progress: Math.random() * 100,
        dependencies: [],
        isCriticalPath: false,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const { container } = render(
        <GanttChart
          tasks={manyTasks}
          onTaskUpdate={mockOnTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      // 大量のタスクでも正常にレンダリングされる
      const taskBars = screen.getAllByTestId(/^task-bar-/);
      expect(taskBars.length).toBeGreaterThan(0);
      
      // 仮想スクロールが適用されている場合
      const virtualScroll = container.querySelector('[data-virtual-scroll]');
      if (virtualScroll) {
        // 表示されているタスクの数が制限されている（ビューポート内のみ）
        expect(taskBars.length).toBeLessThanOrEqual(50);
      } else {
        // すべてのタスクが表示されている
        expect(taskBars.length).toBe(100);
      }
    });
  });
});