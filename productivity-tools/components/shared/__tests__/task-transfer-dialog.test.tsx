import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskTransferDialog } from '../task-transfer-dialog';
import type { Todo } from '@/lib/db/types';

describe('TaskTransferDialog', () => {
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
  ];

  const mockOnTransfer = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが表示される', () => {
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('タスクを他のビューへ移動')).toBeInTheDocument();
  });

  it('タスクリストが表示される', () => {
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('タスク1')).toBeInTheDocument();
    expect(screen.getByText('タスク2')).toBeInTheDocument();
  });

  it('ビュー選択オプションが表示される', () => {
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('WBS')).toBeInTheDocument();
    expect(screen.getByText('カンバン')).toBeInTheDocument();
    expect(screen.getByText('ガント')).toBeInTheDocument();
    
    // 元のビューは表示されない
    expect(screen.queryByText('ToDo')).not.toBeInTheDocument();
  });

  it('タスクを選択できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    const task1Checkbox = screen.getByRole('checkbox', { name: /タスク1を選択/ });
    await user.click(task1Checkbox);

    expect(screen.getByText('1件選択中')).toBeInTheDocument();
  });

  it('ビューを選択できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    const wbsCheckbox = screen.getByRole('checkbox', { name: /WBS/ });
    await user.click(wbsCheckbox);

    // タスクも選択する必要がある
    const task1Checkbox = screen.getByRole('checkbox', { name: /タスク1を選択/ });
    await user.click(task1Checkbox);

    const transferButton = screen.getByText('転送');
    expect(transferButton).not.toBeDisabled();
  });

  it('同期設定を切り替えられる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    const syncToggle = screen.getByRole('switch', { name: /自動同期を有効にする/ });
    expect(syncToggle).toBeChecked(); // デフォルトはON
    
    await user.click(syncToggle);
    expect(syncToggle).not.toBeChecked();
  });

  it('転送を実行できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    // タスクを選択
    const task1Checkbox = screen.getByRole('checkbox', { name: /タスク1を選択/ });
    await user.click(task1Checkbox);

    // ビューを選択
    const wbsCheckbox = screen.getByRole('checkbox', { name: /WBS/ });
    await user.click(wbsCheckbox);

    // 転送実行
    const transferButton = screen.getByText('転送');
    await user.click(transferButton);

    expect(mockOnTransfer).toHaveBeenCalledWith({
      taskIds: ['1'],
      targetViews: ['wbs'],
      syncEnabled: true,
    });
  });

  it('タスクもビューも選択していない場合、転送ボタンが無効になる', () => {
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    const transferButton = screen.getByText('転送');
    expect(transferButton).toBeDisabled();
  });

  it('キャンセルボタンでダイアログを閉じる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('キャンセル');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('同期の説明が表示される', () => {
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/進捗や完了状態が自動的に同期されます/)).toBeInTheDocument();
  });

  it('複数のビューに転送できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskTransferDialog
        isOpen={true}
        tasks={mockTasks}
        sourceView="todo"
        onTransfer={mockOnTransfer}
        onClose={mockOnClose}
      />
    );

    // タスクを選択
    const task1Checkbox = screen.getByRole('checkbox', { name: /タスク1を選択/ });
    await user.click(task1Checkbox);

    // 複数のビューを選択
    const wbsCheckbox = screen.getByRole('checkbox', { name: /WBS/ });
    const kanbanCheckbox = screen.getByRole('checkbox', { name: /カンバン/ });
    await user.click(wbsCheckbox);
    await user.click(kanbanCheckbox);

    // 転送実行
    const transferButton = screen.getByText('転送');
    await user.click(transferButton);

    expect(mockOnTransfer).toHaveBeenCalledWith({
      taskIds: ['1'],
      targetViews: ['wbs', 'kanban'],
      syncEnabled: true,
    });
  });
});