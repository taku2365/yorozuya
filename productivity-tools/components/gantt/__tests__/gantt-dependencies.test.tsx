import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GanttDependencies } from '../gantt-dependencies';
import type { GanttTask, GanttDependency } from '@/lib/types/gantt';

// モックデータ
const mockTasks: GanttTask[] = [
  {
    id: 'task1',
    title: 'タスク1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-05'),
    progress: 50,
    dependencies: [],
    isCriticalPath: true,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task2',
    title: 'タスク2',
    startDate: new Date('2024-01-06'),
    endDate: new Date('2024-01-10'),
    progress: 30,
    dependencies: ['task1'],
    isCriticalPath: true,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task3',
    title: 'タスク3',
    startDate: new Date('2024-01-08'),
    endDate: new Date('2024-01-12'),
    progress: 0,
    dependencies: ['task1'],
    isCriticalPath: false,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task4',
    title: 'タスク4',
    startDate: new Date('2024-01-11'),
    endDate: new Date('2024-01-15'),
    progress: 0,
    dependencies: ['task2', 'task3'],
    isCriticalPath: true,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockDependencies: GanttDependency[] = [
  {
    id: 'dep1',
    fromTaskId: 'task1',
    toTaskId: 'task2',
    type: 'finish-to-start',
    createdAt: new Date(),
  },
  {
    id: 'dep2',
    fromTaskId: 'task1',
    toTaskId: 'task3',
    type: 'finish-to-start',
    createdAt: new Date(),
  },
  {
    id: 'dep3',
    fromTaskId: 'task2',
    toTaskId: 'task4',
    type: 'finish-to-start',
    createdAt: new Date(),
  },
  {
    id: 'dep4',
    fromTaskId: 'task3',
    toTaskId: 'task4',
    type: 'finish-to-start',
    createdAt: new Date(),
  },
];

describe('GanttDependencies', () => {
  const defaultProps = {
    tasks: mockTasks,
    dependencies: mockDependencies,
    startDate: new Date('2023-12-25'),
    endDate: new Date('2024-01-20'),
    viewMode: 'day' as const,
    taskPositions: new Map<string, { x: number; y: number; width: number; height: number }>(),
  };

  beforeEach(() => {
    // タスクの位置情報をモック
    defaultProps.taskPositions.set('task1', { x: 100, y: 50, width: 100, height: 30 });
    defaultProps.taskPositions.set('task2', { x: 210, y: 100, width: 100, height: 30 });
    defaultProps.taskPositions.set('task3', { x: 250, y: 150, width: 100, height: 30 });
    defaultProps.taskPositions.set('task4', { x: 360, y: 200, width: 100, height: 30 });
  });

  describe('依存関係の表示', () => {
    it('依存関係の線が正しく描画される', () => {
      render(<GanttDependencies {...defaultProps} />);
      
      // SVG要素が存在する
      const svg = screen.getByTestId('gantt-dependencies-svg');
      expect(svg).toBeInTheDocument();
      
      // 各依存関係の線が描画される
      expect(screen.getByTestId('dependency-line-dep1')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-line-dep2')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-line-dep3')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-line-dep4')).toBeInTheDocument();
    });

    it('finish-to-start依存関係が正しい形状で描画される', () => {
      render(<GanttDependencies {...defaultProps} />);
      
      const depLine = screen.getByTestId('dependency-line-dep1');
      
      // パス要素である
      expect(depLine.tagName).toBe('path');
      
      // 矢印マーカーが適用されている
      expect(depLine).toHaveAttribute('marker-end', 'url(#arrow-finish-to-start)');
    });

    it('クリティカルパスの依存関係が強調表示される', () => {
      render(<GanttDependencies {...defaultProps} />);
      
      // task1 -> task2 -> task4 がクリティカルパス
      const criticalDep1 = screen.getByTestId('dependency-line-dep1');
      const criticalDep3 = screen.getByTestId('dependency-line-dep3');
      const nonCriticalDep2 = screen.getByTestId('dependency-line-dep2');
      
      // クリティカルパスは赤色で太い
      expect(criticalDep1).toHaveClass('stroke-red-500');
      expect(criticalDep3).toHaveClass('stroke-red-500');
      expect(criticalDep1).toHaveAttribute('stroke-width', '3');
      
      // 非クリティカルパスは灰色で細い
      expect(nonCriticalDep2).toHaveClass('stroke-gray-400');
      expect(nonCriticalDep2).toHaveAttribute('stroke-width', '2');
    });
  });

  describe('依存関係のタイプ', () => {
    it('start-to-start依存関係が正しく描画される', () => {
      const ssDepedency: GanttDependency = {
        id: 'dep-ss',
        fromTaskId: 'task1',
        toTaskId: 'task2',
        type: 'start-to-start',
        createdAt: new Date(),
      };
      
      render(
        <GanttDependencies 
          {...defaultProps} 
          dependencies={[ssDepedency]}
        />
      );
      
      const depLine = screen.getByTestId('dependency-line-dep-ss');
      expect(depLine).toHaveAttribute('marker-end', 'url(#arrow-start-to-start)');
    });

    it('finish-to-finish依存関係が正しく描画される', () => {
      const ffDepedency: GanttDependency = {
        id: 'dep-ff',
        fromTaskId: 'task1',
        toTaskId: 'task2',
        type: 'finish-to-finish',
        createdAt: new Date(),
      };
      
      render(
        <GanttDependencies 
          {...defaultProps} 
          dependencies={[ffDepedency]}
        />
      );
      
      const depLine = screen.getByTestId('dependency-line-dep-ff');
      expect(depLine).toHaveAttribute('marker-end', 'url(#arrow-finish-to-finish)');
    });

    it('start-to-finish依存関係が正しく描画される', () => {
      const sfDepedency: GanttDependency = {
        id: 'dep-sf',
        fromTaskId: 'task1',
        toTaskId: 'task2',
        type: 'start-to-finish',
        createdAt: new Date(),
      };
      
      render(
        <GanttDependencies 
          {...defaultProps} 
          dependencies={[sfDepedency]}
        />
      );
      
      const depLine = screen.getByTestId('dependency-line-dep-sf');
      expect(depLine).toHaveAttribute('marker-end', 'url(#arrow-start-to-finish)');
    });
  });

  describe('依存関係の曲線', () => {
    it('依存関係が曲線で描画される', () => {
      render(<GanttDependencies {...defaultProps} />);
      
      const depLine = screen.getByTestId('dependency-line-dep1');
      const pathData = depLine.getAttribute('d');
      
      // ベジェ曲線のコマンドが含まれている
      expect(pathData).toContain('C'); // Cubic Bezier
    });

    it('タスクが垂直に並んでいる場合は垂直線で描画される', () => {
      // task1とtask2を垂直に配置（finish-to-startなのでx座標を調整）
      defaultProps.taskPositions.set('task1', { x: 100, y: 50, width: 100, height: 30 });
      defaultProps.taskPositions.set('task2', { x: 195, y: 100, width: 100, height: 30 });
      
      render(<GanttDependencies {...defaultProps} />);
      
      const depLine = screen.getByTestId('dependency-line-dep1');
      const pathData = depLine.getAttribute('d');
      
      // 垂直線のパスが生成される
      expect(pathData).toMatch(/M \d+ \d+ L \d+ \d+/); // Move to, Line to
    });
  });

  describe('ホバー効果', () => {
    it('依存関係の線にホバーすると情報が表示される', async () => {
      render(<GanttDependencies {...defaultProps} />);
      
      const depLine = screen.getByTestId('dependency-line-dep1');
      
      // ホバー可能なクラスが適用されている
      expect(depLine).toHaveClass('cursor-pointer');
      
      // title属性で情報が表示される
      expect(depLine).toHaveAttribute('data-tooltip', 'タスク1 → タスク2');
    });
  });

  describe('パフォーマンス', () => {
    it('大量の依存関係でも正常に動作する', () => {
      // 100個の依存関係を生成
      const manyDependencies: GanttDependency[] = [];
      for (let i = 0; i < 100; i++) {
        manyDependencies.push({
          id: `dep${i}`,
          fromTaskId: 'task1',
          toTaskId: 'task2',
          type: 'finish-to-start',
          createdAt: new Date(),
        });
      }
      
      const { container } = render(
        <GanttDependencies 
          {...defaultProps} 
          dependencies={manyDependencies}
        />
      );
      
      // すべての依存関係が描画される
      const paths = container.querySelectorAll('path[data-testid^="dependency-line-"]');
      expect(paths).toHaveLength(100);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なaria属性が設定される', () => {
      render(<GanttDependencies {...defaultProps} />);
      
      const svg = screen.getByTestId('gantt-dependencies-svg');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-label', '依存関係図');
    });

    it('各依存関係にaria-labelが設定される', () => {
      render(<GanttDependencies {...defaultProps} />);
      
      const depLine = screen.getByTestId('dependency-line-dep1');
      expect(depLine).toHaveAttribute('aria-label', 'タスク1からタスク2への依存関係');
    });
  });
});