import { test, expect } from '@playwright/test';

test.describe('統合ビューナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('統合ビューがナビゲーションに表示されること', async ({ page }) => {
    // 統合ビューページに移動
    await page.goto('/integrated');
    
    // ナビゲーションを確認
    const navLinks = page.locator('nav a');
    const linkTexts = await navLinks.allTextContents();
    
    // 統合ビューのリンクが含まれているか確認
    expect(linkTexts).toContain('統合ビュー');
    
    // リンクの順序を確認
    expect(linkTexts[0]).toBe('統合ビュー');
    expect(linkTexts[1]).toBe('ToDo管理');
    expect(linkTexts[2]).toBe('WBS');
    expect(linkTexts[3]).toBe('カンバン');
    expect(linkTexts[4]).toBe('ガントチャート');
  });

  test('他のページから統合ビューに戻れること', async ({ page }) => {
    // まず統合ページへ移動（ナビゲーションに統合ビューが表示されるようにするため）
    await page.goto('/integrated');
    
    // TodoページへGO - ナビゲーション内のリンクを使用
    await page.locator('nav').getByRole('link', { name: 'ToDo管理' }).click();
    await expect(page).toHaveURL('/todo');
    
    // 統合ビューへ戻る
    await page.locator('nav').getByRole('link', { name: '統合ビュー' }).click();
    await expect(page).toHaveURL('/integrated');
    
    // 統合タスク管理のタイトルが表示されることを確認
    await expect(page.getByRole('heading', { name: '統合タスク管理' })).toBeVisible();
  });

  test('統合ビューのタブ切り替えが正常に動作すること', async ({ page }) => {
    await page.goto('/integrated');
    
    // デフォルトでToDoタブが選択されていることを確認
    const todoTab = page.getByRole('tab', { name: 'ToDo' });
    await expect(todoTab).toHaveAttribute('aria-selected', 'true');
    
    // WBSタブに切り替え
    await page.getByRole('tab', { name: 'WBS' }).click();
    await expect(page.getByRole('tab', { name: 'WBS' })).toHaveAttribute('aria-selected', 'true');
    await expect(todoTab).toHaveAttribute('aria-selected', 'false');
    
    // カンバンタブに切り替え
    await page.getByRole('tab', { name: 'カンバン' }).click();
    await expect(page.getByRole('tab', { name: 'カンバン' })).toHaveAttribute('aria-selected', 'true');
    
    // ガントタブに切り替え
    await page.getByRole('tab', { name: 'ガント' }).click();
    await expect(page.getByRole('tab', { name: 'ガント' })).toHaveAttribute('aria-selected', 'true');
  });

  test('フィルターサイドバーの開閉が正常に動作すること', async ({ page }) => {
    await page.goto('/integrated');
    
    // フィルターボタンをクリック
    await page.getByRole('button', { name: 'フィルター' }).click();
    
    // フィルターサイドバーが開いていることを確認
    await expect(page.getByRole('heading', { name: 'フィルター設定' })).toBeVisible();
    
    // ステータスフィルターの確認
    await expect(page.getByText('ステータス')).toBeVisible();
    await expect(page.getByText('未着手')).toBeVisible();
    await expect(page.getByLabel('進行中')).toBeVisible();
    await expect(page.getByLabel('完了')).toBeVisible();
    
    // 優先度フィルターの確認
    await expect(page.getByText('優先度')).toBeVisible();
    await expect(page.getByLabel('低')).toBeVisible();
    await expect(page.getByLabel('中')).toBeVisible();
    await expect(page.getByLabel('高')).toBeVisible();
    await expect(page.getByLabel('緊急')).toBeVisible();
    
    // サイドバーを閉じる
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'フィルター設定' })).not.toBeVisible();
  });

  test('グローバル検索の動作確認', async ({ page }) => {
    await page.goto('/integrated');
    
    // 検索ボックスをクリック
    await page.getByRole('button', { name: /タスクを検索/ }).click();
    
    // 検索ダイアログが開いていることを確認
    await expect(page.getByPlaceholder('タスクを検索...')).toBeVisible();
    
    // ESCキーで閉じる
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder('タスクを検索...')).not.toBeVisible();
    
    // Cmd+Kで開く
    await page.keyboard.press('Meta+k');
    await expect(page.getByPlaceholder('タスクを検索...')).toBeVisible();
  });

  test('統合ビューでデータベースエラーが発生しないこと', async ({ page }) => {
    await page.goto('/integrated');
    
    // エラーメッセージが表示されていないことを確認
    await expect(page.getByText('エラー: Database not initialized')).not.toBeVisible();
    
    // ToDoコンポーネントが正常に表示されることを確認
    await expect(page.getByRole('heading', { name: 'ToDo管理' })).toBeVisible();
  });
});