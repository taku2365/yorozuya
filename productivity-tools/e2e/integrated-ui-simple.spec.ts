import { test, expect } from '@playwright/test';

test.describe('統合UI基盤 - 簡易版', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrated');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('基本的なUIコンポーネントが表示されること', async ({ page }) => {
    // ページタイトル
    await expect(page.getByText('統合タスク管理デモ')).toBeVisible();
    
    // 各モードのセクション
    await expect(page.getByText('タブモード')).toBeVisible();
    await expect(page.getByText('ドロップダウンモード')).toBeVisible();
    await expect(page.getByText('グリッドモード')).toBeVisible();
    
    // グローバル検索
    await expect(page.getByText('タスクを検索...')).toBeVisible();
    
    // フィルターボタン
    await expect(page.getByRole('button', { name: 'フィルター' })).toBeVisible();
  });

  test('ViewSwitcherタブでビューを切り替えられること', async ({ page }) => {
    // タブモードセクションを取得
    const tabSection = page.locator('h2:has-text("タブモード")').locator('..').first();
    
    // WBSタブをクリック
    await tabSection.getByRole('button', { name: /WBS/ }).click();
    
    // コンテンツエリアが更新されることを確認
    await expect(page.getByText('WBS ビュー')).toBeVisible();
    
    // カンバンタブをクリック
    await tabSection.getByRole('button', { name: /カンバン/ }).click();
    await expect(page.getByText('KANBAN ビュー')).toBeVisible();
  });

  test('グローバル検索が動作すること', async ({ page }) => {
    // 検索ボタンをクリック
    await page.getByText('タスクを検索...').click();
    
    // 検索ダイアログが表示される
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByPlaceholder('タスクを検索...')).toBeVisible();
    
    // 検索キーワードを入力
    await page.getByPlaceholder('タスクを検索...').fill('タスク');
    
    // 検索結果が表示されるまで待つ
    await page.waitForTimeout(500);
    
    // 結果カウントが表示される
    await expect(page.getByText(/\d+ 件の結果/)).toBeVisible();
    
    // Escで閉じる
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('フィルターサイドバーが開閉できること', async ({ page }) => {
    // フィルターボタンをクリック
    await page.getByRole('button', { name: 'フィルター' }).click();
    
    // シートが開くのを待つ
    await page.waitForTimeout(500);
    
    // フィルターサイドバーが表示される
    await expect(page.getByText('フィルター設定')).toBeVisible();
    
    // フィルターコンポーネント内の要素を確認
    const filterSheet = page.locator('[role="dialog"]');
    await expect(filterSheet.getByText('ステータス')).toBeVisible();
    
    // ステータスオプションが表示される
    await expect(filterSheet.getByText('未着手')).toBeVisible();
    await expect(filterSheet.getByText('進行中')).toBeVisible();
    await expect(filterSheet.getByText('完了')).toBeVisible();
  });

  test('統合レイアウトが正しく表示されること', async ({ page }) => {
    // 統合レイアウトコンテナを確認
    const layout = page.locator('.border.rounded-lg.h-96');
    await expect(layout).toBeVisible();
    
    // レイアウト内のタブナビゲーション
    const tabs = layout.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
    
    // タブオプションの確認
    await expect(tabs.getByRole('tab', { name: 'ToDo' })).toBeVisible();
    await expect(tabs.getByRole('tab', { name: 'WBS' })).toBeVisible();
    await expect(tabs.getByRole('tab', { name: 'カンバン' })).toBeVisible();
    await expect(tabs.getByRole('tab', { name: 'ガント' })).toBeVisible();
  });
});