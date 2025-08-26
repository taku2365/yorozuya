import { test, expect } from '@playwright/test';

test.describe('Simple Transfer Test', () => {
  test('should access integrated page without errors', async ({ page }) => {
    // コンソールエラーを収集
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // ページにアクセス
    await page.goto('/integrated');
    
    // エラーチェック
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
    
    // 基本的な要素が表示されているかチェック
    await expect(page.locator('text=統合タスク管理')).toBeVisible();
    
    // ToDoビューがデフォルトで表示されているかチェック
    await expect(page.getByRole('tab', { name: /ToDo/, selected: true })).toBeVisible();
  });
  
  test('should create a simple todo', async ({ page }) => {
    await page.goto('/integrated');
    
    // 新規ToDo作成ボタンをクリック
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    
    // フォームが表示されるまで待機
    await page.waitForSelector('[placeholder="ToDoのタイトルを入力"]');
    
    // タイトルを入力
    await page.getByPlaceholder('ToDoのタイトルを入力').fill('テストタスク');
    
    // 作成ボタンをクリック
    await page.getByRole('button', { name: '作成' }).click();
    
    // 作成されたタスクが表示されるまで待機
    await expect(page.getByText('テストタスク')).toBeVisible();
  });
});