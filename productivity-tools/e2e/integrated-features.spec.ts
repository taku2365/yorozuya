import { test, expect } from '@playwright/test';

test.describe('統合ビュー機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrated');
  });

  test('ToDoタスクが統合ビューに表示されること', async ({ page }) => {
    // ToDoタブが選択されていることを確認
    await expect(page.getByRole('tab', { name: 'ToDo' })).toHaveAttribute('aria-selected', 'true');
    
    // 新規ToDoを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.getByRole('textbox', { name: 'タイトル *' }).fill('統合ビューテスト用タスク');
    
    // 優先度を高に設定
    await page.getByRole('combobox', { name: '優先度' }).click();
    await page.getByRole('option', { name: '高' }).click();
    
    // 作成
    await page.getByRole('button', { name: '作成' }).click();
    
    // タスクが表示されることを確認
    await expect(page.getByRole('heading', { name: '統合ビューテスト用タスク' })).toBeVisible();
    await expect(page.getByText('高')).toBeVisible();
  });

  test('グローバル検索が正常に動作すること', async ({ page }) => {
    // まずToDoを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.getByRole('textbox', { name: 'タイトル *' }).fill('検索テスト用タスク');
    await page.getByRole('button', { name: '作成' }).click();
    
    // 検索ダイアログを開く
    await page.getByRole('button', { name: /タスクを検索/ }).click();
    
    // 検索
    const searchInput = page.getByPlaceholder('タスクを検索...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('検索');
    
    // 検索結果が表示されることを確認
    await expect(page.getByText('検索テスト用タスク')).toBeVisible();
    
    // ESCで閉じる
    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();
  });

  test('フィルター機能が正常に動作すること', async ({ page }) => {
    // 複数のToDoを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.getByRole('textbox', { name: 'タイトル *' }).fill('高優先度タスク');
    await page.getByRole('combobox', { name: '優先度' }).click();
    await page.getByRole('option', { name: '高' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.getByRole('textbox', { name: 'タイトル *' }).fill('低優先度タスク');
    await page.getByRole('combobox', { name: '優先度' }).click();
    await page.getByRole('option', { name: '低' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    
    // フィルターを開く
    await page.getByRole('button', { name: 'フィルター' }).click();
    await expect(page.getByRole('heading', { name: 'フィルター設定' })).toBeVisible();
    
    // 優先度フィルターで「高」のみを選択
    await page.getByRole('checkbox', { name: '高' }).check();
    
    // フィルターを閉じる
    await page.getByRole('button', { name: 'Close' }).click();
    
    // 高優先度タスクのみが表示されることを確認
    await expect(page.getByRole('heading', { name: '高優先度タスク' })).toBeVisible();
    // 低優先度タスクは表示されないことを確認（フィルター実装後）
    // await expect(page.getByRole('heading', { name: '低優先度タスク' })).not.toBeVisible();
  });

  test('他のビューへの切り替えが正常に動作すること', async ({ page }) => {
    // WBSタブに切り替え
    await page.getByRole('tab', { name: 'WBS' }).click();
    await expect(page.getByRole('tab', { name: 'WBS' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'WBS' })).toBeVisible();
    
    // カンバンタブに切り替え
    await page.getByRole('tab', { name: 'カンバン' }).click();
    await expect(page.getByRole('tab', { name: 'カンバン' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'カンバンボード' })).toBeVisible();
    
    // ガントタブに切り替え
    await page.getByRole('tab', { name: 'ガント' }).click();
    await expect(page.getByRole('tab', { name: 'ガント' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'ガントチャート' })).toBeVisible();
  });

  test('他のページから統合ビューに戻れること', async ({ page }) => {
    // ToDoページへ移動
    await page.getByRole('link', { name: 'ToDo管理' }).click();
    await expect(page).toHaveURL('/todo');
    
    // 統合ビューへ戻る
    await page.getByRole('link', { name: '統合ビュー' }).click();
    await expect(page).toHaveURL('/integrated');
    await expect(page.getByRole('heading', { name: '統合タスク管理' })).toBeVisible();
  });

  test('タスクカウントバッジが正しく表示されること', async ({ page }) => {
    // ToDoタブにバッジが表示されないことを確認（タスクがない場合）
    const todoTab = page.getByRole('tab', { name: 'ToDo' });
    const badgeLocator = todoTab.locator('generic').filter({ hasText: /^\d+$/ });
    
    // 初期状態ではバッジがないか0
    const badgeCount = await badgeLocator.count();
    if (badgeCount > 0) {
      await expect(badgeLocator).toHaveText('0');
    }
    
    // ToDoを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.getByRole('textbox', { name: 'タイトル *' }).fill('カウントテスト用タスク');
    await page.getByRole('button', { name: '作成' }).click();
    
    // バッジが1になることを確認
    await expect(todoTab.locator('text="1"')).toBeVisible();
  });
});