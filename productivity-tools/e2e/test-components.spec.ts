import { test, expect } from '@playwright/test';

test.describe('共通UIコンポーネントのテストページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-components');
  });

  test('ページが正常に読み込まれること', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '共通UIコンポーネントテスト' })).toBeVisible();
  });

  test('成功通知トーストが表示されること', async ({ page }) => {
    await page.getByRole('button', { name: '成功通知' }).click();
    
    // Wait for toast to appear
    await expect(page.locator('li[data-state="open"]')).toBeVisible({ timeout: 3000 });
    
    // Check toast content more specifically
    const toast = page.locator('li[data-state="open"]');
    await expect(toast.getByText('成功')).toBeVisible();
    await expect(toast.getByText('操作が完了しました')).toBeVisible();
  });

  test('確認ダイアログが表示され、キャンセルできること', async ({ page }) => {
    await page.getByRole('button', { name: '削除確認ダイアログ' }).click();
    
    // Check dialog appears
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('データ削除の確認')).toBeVisible();
    await expect(dialog.getByText('このデータを削除してもよろしいですか？')).toBeVisible();
    
    // Cancel dialog
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('ローディングスピナーが表示されること', async ({ page }) => {
    // Check that loading spinners are visible
    const smallSpinner = page.locator('.animate-spin').first();
    await expect(smallSpinner).toBeVisible();
    
    // Check loading button is disabled
    const loadingButton = page.getByRole('button', { name: 'ローディング中' });
    await expect(loadingButton).toBeDisabled();
  });

  test('エラー表示の切り替えができること', async ({ page }) => {
    // Initially error should not be visible
    await expect(page.getByText('接続エラー')).not.toBeVisible();
    
    // Show error
    await page.getByRole('button', { name: 'エラー表示切替' }).click();
    await expect(page.getByText('接続エラー')).toBeVisible();
    await expect(page.getByText('サーバーへの接続に失敗しました')).toBeVisible();
    
    // Hide error
    await page.getByRole('button', { name: 'エラー表示切替' }).click();
    await expect(page.getByText('接続エラー')).not.toBeVisible();
  });

  test('優先度選択ができること', async ({ page }) => {
    // Click priority selector
    const prioritySelect = page.locator('button').filter({ hasText: '優先度を選択してください' });
    await prioritySelect.click();
    
    // Select high priority
    await page.getByRole('option', { name: '🔴 高優先度' }).click();
    
    // Check selection is reflected
    await expect(page.getByText('選択中:')).toBeVisible();
    await expect(page.locator('.bg-red-100').getByText('高')).toBeVisible();
  });

  test('日付選択ができること', async ({ page }) => {
    // Click date picker
    const datePicker = page.getByRole('button', { name: '日付を選択してください' });
    await datePicker.click();
    
    // Calendar should appear
    await expect(page.locator('table')).toBeVisible({ timeout: 2000 });
  });

  test('メンバー選択ができること', async ({ page }) => {
    // Click single member selector
    const memberSelect = page.locator('button').filter({ hasText: 'メンバーを選択してください' }).first();
    await memberSelect.click();
    
    // Should show member options
    await expect(page.getByText('田中太郎')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('佐藤花子')).toBeVisible();
    await expect(page.getByText('山田次郎')).toBeVisible();
    
    // Use a more specific selector for the member item
    const memberItem = page.locator('[cmdk-item]').filter({ hasText: '田中太郎' }).first();
    await memberItem.click({ force: true });
    
    // Wait a bit for selection to process
    await page.waitForTimeout(500);
    
    // Check selection
    await expect(page.getByText('選択されたメンバー: 田中太郎')).toBeVisible();
  });

  test('ラベル選択ができること', async ({ page }) => {
    // Click label selector
    const labelSelect = page.getByRole('button', { name: 'ラベルを選択してください' });
    await labelSelect.click();
    
    // Should show existing labels
    await expect(page.getByText('緊急')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('重要')).toBeVisible();
    
    // Select a label by clicking its container
    const urgentLabel = page.locator('div').filter({ hasText: '緊急' }).first();
    await urgentLabel.click();
    
    // Check selection is reflected
    await expect(page.getByText('選択されたラベル:')).toBeVisible();
  });

  test('新しいラベル作成ができること', async ({ page }) => {
    // Click label selector
    const labelSelect = page.getByRole('button', { name: 'ラベルを選択してください' });
    await labelSelect.click();
    
    // Fill new label name
    await page.getByPlaceholder('ラベル名').fill('テストラベル');
    
    // Create label
    await page.getByRole('button', { name: '作成' }).click();
    
    // Should show success toast - look inside the toast specifically
    await expect(page.locator('li[data-state="open"]')).toBeVisible({ timeout: 3000 });
    const toast = page.locator('li[data-state="open"]');
    await expect(toast.getByText('ラベル作成')).toBeVisible();
  });
});