import { test, expect } from '@playwright/test';

test.describe('ビュー間統合機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('統合ストアの動作確認', () => {
    test('UnifiedTaskStoreによるタスクの一元管理', async ({ page }) => {
      // ToDoでタスクを作成
      await page.getByRole('tab', { name: 'ToDo' }).click();
      await page.getByRole('button', { name: '新規タスク' }).click();
      await page.getByLabel('タイトル').fill('統合テストタスク');
      await page.getByLabel('説明').fill('全ビューで共有されるタスク');
      await page.getByRole('button', { name: '作成' }).click();

      // WBSビューで同じタスクが表示されることを確認
      await page.getByRole('tab', { name: 'WBS' }).click();
      await expect(page.getByText('統合テストタスク')).toBeVisible();

      // カンバンビューでも表示されることを確認
      await page.getByRole('tab', { name: 'カンバン' }).click();
      await expect(page.getByTestId('kanban-card').filter({ hasText: '統合テストタスク' })).toBeVisible();
    });

    test('ViewStoreによるビュー状態の保持', async ({ page }) => {
      // WBSビューで特定のタスクを展開
      await page.getByRole('tab', { name: 'WBS' }).click();
      await page.getByTestId('expand-button-task-1').click();
      
      // カンバンビューに切り替え
      await page.getByRole('tab', { name: 'カンバン' }).click();
      
      // WBSビューに戻る
      await page.getByRole('tab', { name: 'WBS' }).click();
      
      // 展開状態が保持されていることを確認
      await expect(page.getByTestId('task-1-children')).toBeVisible();
    });

    test('FilterStoreによる統一フィルタリング', async ({ page }) => {
      // グローバルフィルタを設定
      await page.getByRole('button', { name: 'フィルター' }).click();
      await page.getByLabel('ステータス').selectOption('in_progress');
      await page.getByLabel('優先度').selectOption('high');
      await page.getByRole('button', { name: '適用' }).click();

      // 各ビューでフィルタが適用されていることを確認
      const views = ['ToDo', 'WBS', 'カンバン', 'ガント'];
      for (const view of views) {
        await page.getByRole('tab', { name: view }).click();
        
        // 進行中・高優先度のタスクのみ表示
        const tasks = page.locator('[data-testid^="task-"]');
        const count = await tasks.count();
        
        for (let i = 0; i < count; i++) {
          const task = tasks.nth(i);
          await expect(task).toHaveAttribute('data-status', 'in_progress');
          await expect(task).toHaveAttribute('data-priority', 'high');
        }
      }
    });
  });

  test.describe('ビューアダプターの動作確認', () => {
    test('TodoAdapterによるデータ変換', async ({ page }) => {
      // ToDoでタスクを作成
      await page.getByRole('tab', { name: 'ToDo' }).click();
      await page.getByRole('button', { name: '新規タスク' }).click();
      await page.getByLabel('タイトル').fill('ToDo専用タスク');
      await page.getByLabel('優先度').selectOption('high');
      await page.getByLabel('期限').fill('2024-12-31');
      await page.getByRole('button', { name: '作成' }).click();

      // WBSビューで適切に変換されて表示
      await page.getByRole('tab', { name: 'WBS' }).click();
      const wbsTask = page.getByTestId('wbs-task').filter({ hasText: 'ToDo専用タスク' });
      await expect(wbsTask).toBeVisible();
      await expect(wbsTask).toHaveAttribute('data-status', 'not_started');
    });

    test('WBSAdapterによる階層構造の保持', async ({ page }) => {
      // WBSで階層タスクを作成
      await page.getByRole('tab', { name: 'WBS' }).click();
      await page.getByRole('button', { name: '新規タスク' }).click();
      await page.getByLabel('タイトル').fill('親タスク');
      await page.getByLabel('階層番号').fill('1');
      await page.getByRole('button', { name: '作成' }).click();

      await page.getByTestId('add-child-task-1').click();
      await page.getByLabel('タイトル').fill('子タスク');
      await page.getByLabel('階層番号').fill('1.1');
      await page.getByRole('button', { name: '作成' }).click();

      // ガントチャートで階層が保持されていることを確認
      await page.getByRole('tab', { name: 'ガント' }).click();
      const parentTask = page.getByTestId('gantt-task-parent');
      const childTask = page.getByTestId('gantt-task-child');
      
      await expect(parentTask).toBeVisible();
      await expect(childTask).toHaveAttribute('data-parent-id', 'parent-task-id');
    });

    test('KanbanAdapterによるレーン情報の管理', async ({ page }) => {
      // カンバンでカードを作成
      await page.getByRole('tab', { name: 'カンバン' }).click();
      await page.getByTestId('add-card-in-progress').click();
      await page.getByLabel('タイトル').fill('進行中のタスク');
      await page.getByLabel('ラベル').click();
      await page.getByText('urgent').click();
      await page.getByRole('button', { name: '作成' }).click();

      // ToDoビューで優先度が正しく推測されていることを確認
      await page.getByRole('tab', { name: 'ToDo' }).click();
      const todoTask = page.getByTestId('todo-item').filter({ hasText: '進行中のタスク' });
      await expect(todoTask).toHaveAttribute('data-priority', 'urgent');
    });

    test('GanttAdapterによる日程情報の同期', async ({ page }) => {
      // ガントチャートでタスクを作成
      await page.getByRole('tab', { name: 'ガント' }).click();
      await page.getByRole('button', { name: '新規タスク' }).click();
      await page.getByLabel('タイトル').fill('ガントタスク');
      await page.getByLabel('開始日').fill('2024-01-01');
      await page.getByLabel('終了日').fill('2024-01-10');
      await page.getByRole('button', { name: '作成' }).click();

      // WBSビューで日付が同期されていることを確認
      await page.getByRole('tab', { name: 'WBS' }).click();
      const wbsTask = page.getByTestId('wbs-task').filter({ hasText: 'ガントタスク' });
      await expect(wbsTask).toHaveAttribute('data-start-date', '2024-01-01');
      await expect(wbsTask).toHaveAttribute('data-end-date', '2024-01-10');
    });
  });

  test.describe('ドラッグ&ドロップ連携', () => {
    test('ToDoからカンバンへのドラッグ&ドロップ', async ({ page }) => {
      // ToDoビューでタスクを作成
      await page.getByRole('tab', { name: 'ToDo' }).click();
      await page.getByRole('button', { name: '新規タスク' }).click();
      await page.getByLabel('タイトル').fill('ドラッグテストタスク');
      await page.getByRole('button', { name: '作成' }).click();

      // タスクをドラッグ
      const todoItem = page.getByTestId('todo-item').filter({ hasText: 'ドラッグテストタスク' });
      
      // カンバンビューのタブをドロップターゲットとして表示
      const kanbanTab = page.getByRole('tab', { name: 'カンバン' });
      await todoItem.hover();
      await page.mouse.down();
      await kanbanTab.hover();
      
      // ドロップ可能インジケーターを確認
      await expect(kanbanTab).toHaveClass(/drop-target-active/);
      
      // カンバンビューに切り替えてドロップ
      await kanbanTab.click();
      const todoLane = page.getByTestId('kanban-lane-todo');
      await todoLane.hover();
      await page.mouse.up();

      // カンバンにタスクが追加されたことを確認
      await expect(page.getByTestId('kanban-card').filter({ hasText: 'ドラッグテストタスク' })).toBeVisible();
    });

    test('カンバンレーン間のドラッグ&ドロップ', async ({ page }) => {
      await page.getByRole('tab', { name: 'カンバン' }).click();
      
      // ToDoレーンにカードを作成
      await page.getByTestId('add-card-todo').click();
      await page.getByLabel('タイトル').fill('移動テストカード');
      await page.getByRole('button', { name: '作成' }).click();

      // カードを進行中レーンにドラッグ
      const card = page.getByTestId('kanban-card').filter({ hasText: '移動テストカード' });
      const inProgressLane = page.getByTestId('kanban-lane-in-progress');
      
      await card.dragTo(inProgressLane);

      // ステータスが更新されたことを確認
      await expect(card).toHaveAttribute('data-status', 'in_progress');
      
      // 他のビューでもステータスが更新されていることを確認
      await page.getByRole('tab', { name: 'ToDo' }).click();
      const todoItem = page.getByTestId('todo-item').filter({ hasText: '移動テストカード' });
      await expect(todoItem).not.toHaveAttribute('data-completed', 'true');
    });

    test('WBSからガントチャートへのドラッグ&ドロップ', async ({ page }) => {
      // WBSでタスクを作成
      await page.getByRole('tab', { name: 'WBS' }).click();
      await page.getByRole('button', { name: '新規タスク' }).click();
      await page.getByLabel('タイトル').fill('WBSからガントへ');
      await page.getByRole('button', { name: '作成' }).click();

      // ガントチャートビューにドラッグ
      const wbsTask = page.getByTestId('wbs-task').filter({ hasText: 'WBSからガントへ' });
      const ganttTab = page.getByRole('tab', { name: 'ガント' });
      
      await wbsTask.hover();
      await page.mouse.down();
      await ganttTab.hover();
      await ganttTab.click();
      
      // ガントチャートの特定の日付にドロップ
      const ganttTimeline = page.getByTestId('gantt-timeline-2024-01-15');
      await ganttTimeline.hover();
      await page.mouse.up();

      // ガントタスクが作成され、日付が設定されたことを確認
      const ganttTask = page.getByTestId('gantt-task').filter({ hasText: 'WBSからガントへ' });
      await expect(ganttTask).toBeVisible();
      await expect(ganttTask).toHaveAttribute('data-start-date', '2024-01-15');
    });

    test('ドラッグ中のビジュアルフィードバック', async ({ page }) => {
      await page.getByRole('tab', { name: 'ToDo' }).click();
      
      const todoItem = page.getByTestId('todo-item').first();
      
      // ドラッグ開始
      await todoItem.hover();
      await page.mouse.down();
      
      // ドラッグ中のスタイルを確認
      await expect(todoItem).toHaveClass(/dragging/);
      await expect(todoItem).toHaveCSS('opacity', '0.5');
      
      // 各ビュータブのドロップ可能状態を確認
      const tabs = ['WBS', 'カンバン', 'ガント'];
      for (const tab of tabs) {
        const tabElement = page.getByRole('tab', { name: tab });
        await tabElement.hover();
        await expect(tabElement).toHaveClass(/can-drop/);
      }
      
      await page.mouse.up();
    });

    test('エラーハンドリング：必須データ不足', async ({ page }) => {
      await page.getByRole('tab', { name: 'ToDo' }).click();
      
      // ToDoタスクを作成
      await page.getByRole('button', { name: '新規タスク' }).click();
      await page.getByLabel('タイトル').fill('エラーテストタスク');
      await page.getByRole('button', { name: '作成' }).click();

      // カンバンビューに切り替えて、レーンではない場所にドロップ
      const todoItem = page.getByTestId('todo-item').filter({ hasText: 'エラーテストタスク' });
      await todoItem.dragTo(page.getByRole('heading', { name: 'カンバンボード' }));

      // エラーメッセージが表示されることを確認
      await expect(page.getByText('必須データが不足しています: laneId')).toBeVisible();
    });
  });

  test.describe('パフォーマンステスト', () => {
    test('大量タスクでの統合動作', async ({ page }) => {
      // 100個のタスクを作成
      await page.evaluate(() => {
        const tasks = Array.from({ length: 100 }, (_, i) => ({
          id: `perf-test-${i}`,
          title: `パフォーマンステスト ${i}`,
          status: ['todo', 'in_progress', 'done'][i % 3],
          priority: ['low', 'medium', 'high'][i % 3],
          views: ['todo', 'wbs', 'kanban', 'gantt'],
        }));
        
        // UnifiedTaskStoreに直接追加
        window.__testUtils__.addTasks(tasks);
      });

      // 各ビューでの表示速度を測定
      const views = ['ToDo', 'WBS', 'カンバン', 'ガント'];
      
      for (const view of views) {
        const startTime = Date.now();
        await page.getByRole('tab', { name: view }).click();
        await page.waitForSelector('[data-testid^="task-"]');
        const endTime = Date.now();
        
        // 1秒以内に表示されることを確認
        expect(endTime - startTime).toBeLessThan(1000);
      }

      // フィルタリング性能
      const filterStartTime = Date.now();
      await page.getByRole('button', { name: 'フィルター' }).click();
      await page.getByLabel('ステータス').selectOption('in_progress');
      await page.getByRole('button', { name: '適用' }).click();
      const filterEndTime = Date.now();
      
      // フィルタリングが200ms以内に完了
      expect(filterEndTime - filterStartTime).toBeLessThan(200);
    });
  });
});