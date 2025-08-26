import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskSelector } from '../task-selector';
import type { Todo } from '@/lib/db/types';

describe('TaskSelector', () => {
  const mockTasks: Todo[] = [
    {
      id: '1',
      title: 'タスク1',
      description: '説明1',
      completed: false,
      priority: 'medium',
      due_date: null,
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'タスク2',
      description: '説明2',
      completed: false,
      priority: 'high',
      due_date: null,
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      title: 'タスク3',
      description: '説明3',
      completed: true,
      priority: 'low',
      due_date: null,
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タスクリストを表示する', () => {
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('タスク1')).toBeInTheDocument();
    expect(screen.getByText('タスク2')).toBeInTheDocument();
    expect(screen.getByText('タスク3')).toBeInTheDocument();
  });

  it('タスクを選択できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const checkbox1 = screen.getByRole('checkbox', { name: /タスク1を選択/ });
    await user.click(checkbox1);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('複数のタスクを選択できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={['1']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const checkbox2 = screen.getByRole('checkbox', { name: /タスク2を選択/ });
    await user.click(checkbox2);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('選択を解除できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const checkbox1 = screen.getByRole('checkbox', { name: /タスク1を選択/ });
    await user.click(checkbox1);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['2']);
  });

  it('すべて選択ができる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getByRole('checkbox', { name: /すべて選択/ });
    await user.click(selectAllCheckbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
  });

  it('すべての選択を解除できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={['1', '2', '3']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getByRole('checkbox', { name: /すべて選択/ });
    await user.click(selectAllCheckbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('タスクの優先度を表示する', () => {
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('高')).toBeInTheDocument();
    expect(screen.getByText('中')).toBeInTheDocument();
    expect(screen.getByText('低')).toBeInTheDocument();
  });

  it('完了タスクには完了マークを表示する', () => {
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const completedTask = screen.getByText('タスク3').closest('[data-testid="task-item"]');
    expect(completedTask).toHaveTextContent('完了');
  });

  it('選択数を表示する', () => {
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('2件選択中')).toBeInTheDocument();
  });

  it('フィルタリングができる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskSelector
        tasks={mockTasks}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const filterInput = screen.getByPlaceholderText('タスクを検索...');
    await user.type(filterInput, 'タスク2');

    expect(screen.getByText('タスク2')).toBeInTheDocument();
    expect(screen.queryByText('タスク1')).not.toBeInTheDocument();
    expect(screen.queryByText('タスク3')).not.toBeInTheDocument();
  });

  it('空の状態を表示する', () => {
    render(
      <TaskSelector
        tasks={[]}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('タスクがありません')).toBeInTheDocument();
  });
});