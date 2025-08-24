import { test, expect } from '@playwright/test';

test.describe('統合UI基盤', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrated');
  });

  test('ページが正常に読み込まれること', async ({ page }) => {
    await expect(page.getByText('統合タスク管理デモ')).toBeVisible();
  });

  test.describe('ViewSwitcher - タブモード', () => {
    test('すべてのビューオプションが表示されること', async ({ page }) => {
      const tabSection = page.locator('div').filter({ hasText: 'タブモード' }).first();
      
      await expect(tabSection.getByRole('button', { name: /ToDo/ })).toBeVisible();
      await expect(tabSection.getByRole('button', { name: /WBS/ })).toBeVisible();
      await expect(tabSection.getByRole('button', { name: /カンバン/ })).toBeVisible();
      await expect(tabSection.getByRole('button', { name: /ガント/ })).toBeVisible();
    });

    test('ビューを切り替えられること', async ({ page }) => {
      const tabSection = page.locator('div').filter({ hasText: 'タブモード' }).first();
      
      // Click on WBS tab
      await tabSection.getByRole('button', { name: /WBS/ }).click();
      
      // Check that the content area updates
      await expect(page.getByText('WBS ビュー')).toBeVisible();
    });

    test('タスクカウントが表示されること', async ({ page }) => {
      const tabSection = page.locator('div').filter({ hasText: 'タブモード' }).first();
      
      // Check that task counts are visible (should have numbers in badges)
      const todoButton = tabSection.locator('button').filter({ hasText: 'ToDo' });
      const badge = todoButton.locator('span').filter({ hasText: /\d+/ });
      await expect(badge).toBeVisible();
    });
  });

  test.describe('ViewSwitcher - ドロップダウンモード', () => {
    test('ドロップダウンが開閉できること', async ({ page }) => {
      const dropdownSection = page.locator('div').filter({ hasText: 'ドロップダウンモード' }).first();
      const dropdownButton = dropdownSection.locator('button').filter({ hasText: /ToDo|WBS|カンバン|ガント/ }).first();
      
      // Click to open dropdown
      await dropdownButton.click();
      
      // Check dropdown menu is visible
      await expect(page.getByText('ビューを選択')).toBeVisible();
      
      // Check all options are visible
      await expect(page.getByText('シンプルなタスク管理')).toBeVisible();
      await expect(page.getByText('階層的なタスク分解')).toBeVisible();
      await expect(page.getByText('ビジュアルなワークフロー')).toBeVisible();
      await expect(page.getByText('タイムラインビュー')).toBeVisible();
    });

    test('ドロップダウンからビューを選択できること', async ({ page }) => {
      const dropdownSection = page.locator('div').filter({ hasText: 'ドロップダウンモード' }).first();
      const dropdownButton = dropdownSection.locator('button').filter({ hasText: /ToDo|WBS|カンバン|ガント/ }).first();
      
      // Open dropdown
      await dropdownButton.click();
      
      // Select Kanban
      await page.getByRole('menuitem').filter({ hasText: 'カンバン' }).click();
      
      // Check that the view changed
      await expect(page.getByText('KANBAN ビュー')).toBeVisible();
    });
  });

  test.describe('ViewSwitcher - グリッドモード', () => {
    test('グリッドレイアウトで表示されること', async ({ page }) => {
      const gridSection = page.locator('div').filter({ hasText: 'グリッドモード' }).first();
      
      // Check all grid items are visible
      const todoCard = gridSection.locator('button').filter({ hasText: 'ToDo' });
      const wbsCard = gridSection.locator('button').filter({ hasText: 'WBS' });
      const kanbanCard = gridSection.locator('button').filter({ hasText: 'カンバン' });
      const ganttCard = gridSection.locator('button').filter({ hasText: 'ガント' });
      
      await expect(todoCard).toBeVisible();
      await expect(wbsCard).toBeVisible();
      await expect(kanbanCard).toBeVisible();
      await expect(ganttCard).toBeVisible();
      
      // Check descriptions are visible in grid mode
      await expect(gridSection.getByText('シンプルなタスク管理')).toBeVisible();
      await expect(gridSection.getByText('階層的なタスク分解')).toBeVisible();
    });

    test('現在のビューにバッジが表示されること', async ({ page }) => {
      const gridSection = page.locator('div').filter({ hasText: 'グリッドモード' }).first();
      
      // Should have "現在" badge on the active view
      await expect(gridSection.getByText('現在')).toBeVisible();
    });

    test('グリッドからビューを選択できること', async ({ page }) => {
      const gridSection = page.locator('div').filter({ hasText: 'グリッドモード' }).first();
      
      // Click on Gantt card
      await gridSection.locator('button').filter({ hasText: 'ガント' }).click();
      
      // Check view changed
      await expect(page.getByText('GANTT ビュー')).toBeVisible();
    });
  });

  test.describe('グローバル検索', () => {
    test('検索ボタンをクリックで検索ダイアログが開くこと', async ({ page }) => {
      await page.getByRole('button', { name: 'タスクを検索...' }).click();
      
      // Check search dialog appears
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByPlaceholder('タスクを検索...')).toBeVisible();
    });

    test('キーボードショートカット (Cmd+K) で検索が開くこと', async ({ page }) => {
      // Press Cmd+K (or Ctrl+K on non-Mac)
      await page.keyboard.press('Meta+k');
      
      // Check search dialog appears
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByPlaceholder('タスクを検索...')).toBeVisible();
    });

    test('検索結果が表示されること', async ({ page }) => {
      // Open search
      await page.getByRole('button', { name: 'タスクを検索...' }).click();
      
      // Type search query
      await page.getByPlaceholder('タスクを検索...').fill('タスク');
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Check results are displayed
      await expect(page.getByText(/\d+ 件の結果/)).toBeVisible();
    });

    test('検索結果がツール別にグループ化されること', async ({ page }) => {
      // Open search
      await page.getByRole('button', { name: 'タスクを検索...' }).click();
      
      // Type search query
      await page.getByPlaceholder('タスクを検索...').fill('タスク');
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Check that results are grouped by tool
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText(/TODO|WBS|KANBAN|GANTT/)).toBeVisible();
    });

    test('Escキーで検索ダイアログが閉じること', async ({ page }) => {
      // Open search
      await page.getByRole('button', { name: 'タスクを検索...' }).click();
      
      // Press Esc
      await page.keyboard.press('Escape');
      
      // Check dialog is closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('統一フィルター', () => {
    test('フィルターボタンをクリックでサイドバーが開くこと', async ({ page }) => {
      await page.getByRole('button', { name: 'フィルター' }).click();
      
      // Check filter sidebar appears
      await expect(page.getByRole('heading', { name: 'フィルター設定' })).toBeVisible();
    });

    test('ステータスフィルターが適用できること', async ({ page }) => {
      // Open filter
      await page.getByRole('button', { name: 'フィルター' }).click();
      
      // Check status filter options
      await expect(page.getByText('未着手')).toBeVisible();
      await expect(page.getByText('進行中')).toBeVisible();
      await expect(page.getByText('完了')).toBeVisible();
      
      // Click on a status checkbox
      await page.getByRole('checkbox', { name: /進行中/ }).click();
      
      // Check that filter is applied (active filter badge should appear)
      await expect(page.getByText('アクティブなフィルター')).toBeVisible();
    });

    test('優先度フィルターが適用できること', async ({ page }) => {
      // Open filter
      await page.getByRole('button', { name: 'フィルター' }).click();
      
      // Click on priority checkbox
      await page.getByRole('checkbox', { name: /高/ }).click();
      
      // Check that filter is applied
      await expect(page.getByText('アクティブなフィルター')).toBeVisible();
    });

    test('検索フィルターが適用できること', async ({ page }) => {
      // Open filter
      await page.getByRole('button', { name: 'フィルター' }).click();
      
      // Type in search field
      await page.getByPlaceholder('タスクを検索...').fill('テスト');
      
      // Check that filter is applied
      await expect(page.getByText('アクティブなフィルター')).toBeVisible();
    });

    test('フィルターをリセットできること', async ({ page }) => {
      // Open filter
      await page.getByRole('button', { name: 'フィルター' }).click();
      
      // Apply some filters
      await page.getByRole('checkbox', { name: /進行中/ }).click();
      await page.getByPlaceholder('タスクを検索...').fill('テスト');
      
      // Click reset
      await page.getByRole('button', { name: 'リセット' }).click();
      
      // Check filters are cleared
      await expect(page.getByText('アクティブなフィルター')).not.toBeVisible();
    });

    test('日付範囲フィルターが設定できること', async ({ page }) => {
      // Open filter
      await page.getByRole('button', { name: 'フィルター' }).click();
      
      // Select date field
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: '作成日' }).click();
      
      // Check date pickers appear
      await expect(page.getByRole('button', { name: '開始日' })).toBeVisible();
      await expect(page.getByRole('button', { name: '終了日' })).toBeVisible();
    });
  });

  test.describe('統合レイアウト', () => {
    test('ヘッダーと検索バーが表示されること', async ({ page }) => {
      const layout = page.locator('.border.rounded-lg');
      
      // Check header with search and filter buttons
      await expect(layout.getByRole('button', { name: /検索/ })).toBeVisible();
      await expect(layout.getByRole('button', { name: /フィルター/ })).toBeVisible();
      await expect(layout.getByRole('button', { name: /設定/ })).toBeVisible();
    });

    test('タブナビゲーションでビューを切り替えられること', async ({ page }) => {
      const layout = page.locator('.border.rounded-lg');
      
      // Click on tabs within the integrated layout
      await layout.getByRole('tab', { name: 'WBS' }).click();
      
      // Check content updates
      await expect(page.getByText('WBS ビュー')).toBeVisible();
      
      await layout.getByRole('tab', { name: 'カンバン' }).click();
      await expect(page.getByText('KANBAN ビュー')).toBeVisible();
    });
  });

  test.describe('レスポンシブデザイン', () => {
    test('モバイルビューでUIが適切に表示されること', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that the page still loads
      await expect(page.getByText('統合タスク管理デモ')).toBeVisible();
      
      // Check that components adapt to mobile
      // Grid mode should still be visible but may have different layout
      const gridSection = page.locator('div').filter({ hasText: 'グリッドモード' }).first();
      await expect(gridSection).toBeVisible();
    });

    test('タブレットビューでUIが適切に表示されること', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that all main components are visible
      await expect(page.getByText('統合タスク管理デモ')).toBeVisible();
      await expect(page.getByText('タブモード')).toBeVisible();
      await expect(page.getByText('ドロップダウンモード')).toBeVisible();
      await expect(page.getByText('グリッドモード')).toBeVisible();
    });
  });
});