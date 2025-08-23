import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GanttCriticalPath } from '../gantt-critical-path';
import type { GanttTask } from '@/lib/types/gantt';

// モックデータ
const mockTasks: GanttTask[] = [
  {
    id: 'task1',
    title: '設計',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-05'),
    progress: 100,
    dependencies: [],
    isCriticalPath: true,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task2',
    title: '実装A',
    startDate: new Date('2024-01-06'),
    endDate: new Date('2024-01-10'),
    progress: 50,
    dependencies: ['task1'],
    isCriticalPath: true,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task3',
    title: '実装B',
    startDate: new Date('2024-01-08'),
    endDate: new Date('2024-01-12'),
    progress: 30,
    dependencies: ['task1'],
    isCriticalPath: false,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task4',
    title: 'テスト',
    startDate: new Date('2024-01-11'),
    endDate: new Date('2024-01-15'),
    progress: 0,
    dependencies: ['task2', 'task3'],
    isCriticalPath: true,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task5',
    title: 'ドキュメント作成',
    startDate: new Date('2024-01-06'),
    endDate: new Date('2024-01-08'),
    progress: 80,
    dependencies: ['task1'],
    isCriticalPath: false,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('GanttCriticalPath', () => {
  const mockOnCalculateCriticalPath = vi.fn();
  const mockOnTaskUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('クリティカルパスの表示', () => {
    it('クリティカルパス情報が表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      // クリティカルパスパネルが表示される
      expect(screen.getByTestId('critical-path-panel')).toBeInTheDocument();

      // クリティカルパスのタスク数が表示される
      expect(screen.getByText('クリティカルパス: 3タスク')).toBeInTheDocument();

      // 総期間が表示される
      expect(screen.getByText(/総期間: \d+日/)).toBeInTheDocument();
    });

    it('クリティカルパスのタスクリストが表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      // クリティカルパスのタスクが順番に表示される
      const criticalTasks = screen.getByTestId('critical-path-tasks');
      expect(within(criticalTasks).getByText('1. 設計')).toBeInTheDocument();
      expect(within(criticalTasks).getByText('2. 実装A')).toBeInTheDocument();
      expect(within(criticalTasks).getByText('3. テスト')).toBeInTheDocument();
    });

    it('各タスクの期間が表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      // 各タスクの期間
      expect(screen.getByText('5日間')).toBeInTheDocument();
      expect(screen.getByText('5日間', { selector: '[data-task-id="task2"]' })).toBeInTheDocument();
    });
  });

  describe('クリティカルパスの計算', () => {
    it('計算ボタンをクリックするとクリティカルパスが再計算される', async () => {
      const user = userEvent.setup();
      mockOnCalculateCriticalPath.mockResolvedValue(['task1', 'task2', 'task4']);

      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      const calculateButton = screen.getByText('クリティカルパスを再計算');
      await user.click(calculateButton);

      await waitFor(() => {
        expect(mockOnCalculateCriticalPath).toHaveBeenCalled();
      });
    });

    it('計算中はローディング状態が表示される', async () => {
      const user = userEvent.setup();
      let resolveCalculation: (value: string[]) => void;
      const calculationPromise = new Promise<string[]>(resolve => {
        resolveCalculation = resolve;
      });
      mockOnCalculateCriticalPath.mockReturnValue(calculationPromise);

      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      const calculateButton = screen.getByText('クリティカルパスを再計算');
      await user.click(calculateButton);

      // ローディング状態
      expect(screen.getByText('計算中...')).toBeInTheDocument();

      // 計算完了
      resolveCalculation!(['task1', 'task2', 'task4']);

      await waitFor(() => {
        expect(screen.queryByText('計算中...')).not.toBeInTheDocument();
      });
    });
  });

  describe('バッファ時間の管理', () => {
    it('バッファ時間が表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      // タスク間のバッファ
      expect(screen.getByTestId('buffer-task1-task2')).toBeInTheDocument();
      expect(screen.getByText('0日')).toBeInTheDocument();
    });

    it('バッファ時間を追加できる', async () => {
      const user = userEvent.setup();
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      const addBufferButton = screen.getByTestId('add-buffer-task1-task2');
      await user.click(addBufferButton);

      // バッファ入力ダイアログが表示される
      const bufferInput = screen.getByLabelText('バッファ日数');
      await user.type(bufferInput, '2');

      const confirmButton = screen.getByText('追加');
      await user.click(confirmButton);

      // タスクの更新が呼ばれる
      await waitFor(() => {
        expect(mockOnTaskUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'task2',
            startDate: new Date('2024-01-08'), // 2日後ろにずれる
          })
        );
      });
    });
  });

  describe('最適化提案', () => {
    it('並行実行可能なタスクの提案が表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
          showOptimizations
        />
      );

      const optimizations = screen.getByTestId('optimization-suggestions');
      
      // 実装Bとドキュメント作成は並行実行可能
      expect(within(optimizations).getByText(/実装B.*ドキュメント作成.*並行実行可能/)).toBeInTheDocument();
    });

    it('期間短縮の提案が表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
          showOptimizations
        />
      );

      const optimizations = screen.getByTestId('optimization-suggestions');
      
      // 進捗の遅いタスクへのリソース追加提案
      expect(within(optimizations).getByText(/テスト.*リソース追加.*期間短縮/)).toBeInTheDocument();
    });
  });

  describe('視覚的表示', () => {
    it('クリティカルパスが視覚的に強調表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      // クリティカルパスのタスクが赤で表示
      const criticalTask = screen.getByTestId('critical-task-task1');
      expect(criticalTask).toHaveClass('border-red-500', 'bg-red-50');

      // 非クリティカルパスのタスクは通常表示
      const nonCriticalTask = screen.getByTestId('critical-task-task3');
      expect(nonCriticalTask).not.toHaveClass('border-red-500');
    });

    it('プログレスバーでクリティカルパスの進捗が表示される', () => {
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
        />
      );

      const progressBar = screen.getByTestId('critical-path-progress');
      
      // 全体の進捗率が計算される（100 + 50 + 0）/ 3 = 50%
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });
  });

  describe('エクスポート機能', () => {
    it('クリティカルパス情報をエクスポートできる', async () => {
      const user = userEvent.setup();
      const mockExport = vi.fn();
      
      render(
        <GanttCriticalPath
          tasks={mockTasks}
          onCalculateCriticalPath={mockOnCalculateCriticalPath}
          onTaskUpdate={mockOnTaskUpdate}
          onExport={mockExport}
        />
      );

      const exportButton = screen.getByText('エクスポート');
      await user.click(exportButton);

      expect(mockExport).toHaveBeenCalledWith({
        criticalPath: ['task1', 'task2', 'task4'],
        totalDuration: 15,
        tasks: expect.any(Array),
      });
    });
  });
});