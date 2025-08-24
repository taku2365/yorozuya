import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewSwitcher, MiniViewSwitcher } from '../view-switcher';
import { ViewType } from '@/lib/types/unified';

describe('ViewSwitcher', () => {
  const mockOnViewChange = vi.fn();
  
  beforeEach(() => {
    mockOnViewChange.mockClear();
  });

  describe('tabs mode', () => {
    it('should render all view options as tabs', () => {
      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="tabs"
        />
      );

      expect(screen.getByText('ToDo')).toBeInTheDocument();
      expect(screen.getByText('WBS')).toBeInTheDocument();
      expect(screen.getByText('カンバン')).toBeInTheDocument();
      expect(screen.getByText('ガント')).toBeInTheDocument();
    });

    it('should highlight current view', () => {
      render(
        <ViewSwitcher
          currentView="wbs"
          onViewChange={mockOnViewChange}
          mode="tabs"
        />
      );

      const wbsButton = screen.getByRole('button', { name: /WBS/i });
      expect(wbsButton).toHaveClass('bg-primary'); // default variant styles
    });

    it('should call onViewChange when clicking a tab', () => {
      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="tabs"
        />
      );

      fireEvent.click(screen.getByText('カンバン'));
      expect(mockOnViewChange).toHaveBeenCalledWith('kanban');
    });

    it('should display task counts when showTaskCount is true', () => {
      const taskCounts: Record<ViewType, number> = {
        todo: 5,
        wbs: 10,
        kanban: 3,
        gantt: 7
      };

      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="tabs"
          showTaskCount
          taskCounts={taskCounts}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should hide icons in compact mode', () => {
      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="tabs"
          displayMode="compact"
        />
      );

      // In compact mode, text is still shown but icons have no margin
      const todoButton = screen.getByRole('button', { name: /ToDo/i });
      const icon = todoButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).not.toHaveClass('mr-2');
    });
  });

  describe('dropdown mode', () => {
    it('should render as a dropdown button', () => {
      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="dropdown"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('ToDo');
    });

    it('should show all options when dropdown is opened', () => {
      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="dropdown"
        />
      );

      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByText('ビューを選択')).toBeInTheDocument();
      expect(screen.getAllByText('ToDo').length).toBeGreaterThan(1); // One in button, one in menu
      expect(screen.getByText('WBS')).toBeInTheDocument();
      expect(screen.getByText('カンバン')).toBeInTheDocument();
      expect(screen.getByText('ガント')).toBeInTheDocument();
    });

    it('should show descriptions in detailed mode', () => {
      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="dropdown"
          displayMode="detailed"
        />
      );

      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByText('シンプルなタスク管理')).toBeInTheDocument();
      expect(screen.getByText('階層的なタスク分解')).toBeInTheDocument();
      expect(screen.getByText('ビジュアルなワークフロー')).toBeInTheDocument();
      expect(screen.getByText('タイムラインビュー')).toBeInTheDocument();
    });
  });

  describe('grid mode', () => {
    it('should render all views as grid items', () => {
      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="grid"
        />
      );

      expect(screen.getByText('ToDo')).toBeInTheDocument();
      expect(screen.getByText('WBS')).toBeInTheDocument();
      expect(screen.getByText('カンバン')).toBeInTheDocument();
      expect(screen.getByText('ガント')).toBeInTheDocument();
      
      // Grid mode always shows descriptions
      expect(screen.getByText('シンプルなタスク管理')).toBeInTheDocument();
      expect(screen.getByText('階層的なタスク分解')).toBeInTheDocument();
    });

    it('should mark current view with a badge', () => {
      render(
        <ViewSwitcher
          currentView="kanban"
          onViewChange={mockOnViewChange}
          mode="grid"
        />
      );

      expect(screen.getByText('現在')).toBeInTheDocument();
    });

    it('should display task counts in grid mode', () => {
      const taskCounts: Record<ViewType, number> = {
        todo: 5,
        wbs: 10,
        kanban: 3,
        gantt: 7
      };

      render(
        <ViewSwitcher
          currentView="todo"
          onViewChange={mockOnViewChange}
          mode="grid"
          showTaskCount
          taskCounts={taskCounts}
        />
      );

      expect(screen.getByText('5 タスク')).toBeInTheDocument();
      expect(screen.getByText('10 タスク')).toBeInTheDocument();
      expect(screen.getByText('3 タスク')).toBeInTheDocument();
      expect(screen.getByText('7 タスク')).toBeInTheDocument();
    });
  });
});

describe('MiniViewSwitcher', () => {
  const mockOnViewChange = vi.fn();
  
  beforeEach(() => {
    mockOnViewChange.mockClear();
  });

  it('should render as icon button', () => {
    render(
      <MiniViewSwitcher
        currentView="todo"
        onViewChange={mockOnViewChange}
      />
    );

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('should show dropdown menu on click', () => {
    render(
      <MiniViewSwitcher
        currentView="todo"
        onViewChange={mockOnViewChange}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText('ToDo')).toBeInTheDocument();
    expect(screen.getByText('WBS')).toBeInTheDocument();
    expect(screen.getByText('カンバン')).toBeInTheDocument();
    expect(screen.getByText('ガント')).toBeInTheDocument();
  });

  it('should call onViewChange when selecting an option', () => {
    render(
      <MiniViewSwitcher
        currentView="todo"
        onViewChange={mockOnViewChange}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('ガント'));
    
    expect(mockOnViewChange).toHaveBeenCalledWith('gantt');
  });
});