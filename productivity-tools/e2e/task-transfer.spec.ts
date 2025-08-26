import { test, expect } from '@playwright/test';

test.use({
  // タイムアウトを60秒に設定
  timeout: 60000,
});

test.describe('タスク転送機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrated');
    await page.waitForLoadState('networkidle');
    // ToDoビューがデフォルトで表示されていることを確認
    await page.waitForSelector('text=ToDo管理', { timeout: 10000 });
  });

  test('ToDoからWBSへタスクを転送できる', async ({ page }) => {
    // ToDoビューで新しいタスクを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[placeholder="ToDoのタイトルを入力"]', { state: 'visible' });
    await page.getByPlaceholder('ToDoのタイトルを入力').fill('転送テストタスク');
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForTimeout(500); // 作成を待つ

    // 転送ダイアログを開く
    await page.getByRole('button', { name: /他のビューへ移動/ }).click();
    await page.waitForSelector('text=タスクを他のビューへ移動', { state: 'visible', timeout: 5000 });
    
    // タスクを選択
    await page.getByRole('checkbox', { name: /転送テストタスクを選択/ }).check();
    
    // WBSを転送先として選択
    await page.getByRole('checkbox', { name: /WBS/ }).check();
    
    // 転送実行
    const transferButton = page.getByRole('button', { name: '転送' });
    await transferButton.scrollIntoViewIfNeeded();
    await transferButton.click();
    
    // 成功メッセージを確認
    await expect(page.getByText('転送完了')).toBeVisible();
    
    // WBSビューに切り替え
    await page.getByRole('button', { name: 'WBS' }).click();
    await page.waitForTimeout(500);
    
    // タスクがWBSに存在することを確認
    await expect(page.getByText('転送テストタスク')).toBeVisible();
  });

  test('複数のビューに同時に転送できる', async ({ page }) => {
    // ToDoビューで新しいタスクを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[placeholder="ToDoのタイトルを入力"]', { state: 'visible' });
    await page.getByPlaceholder('ToDoのタイトルを入力').fill('複数転送テスト');
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForTimeout(500);

    // 転送ダイアログを開く
    await page.getByRole('button', { name: /他のビューへ移動/ }).click();
    await page.waitForSelector('text=タスクを他のビューへ移動', { state: 'visible', timeout: 5000 });
    
    // タスクを選択
    await page.getByRole('checkbox', { name: /複数転送テストを選択/ }).check();
    
    // WBSとカンバンを転送先として選択
    await page.getByRole('checkbox', { name: /WBS/ }).check();
    await page.getByRole('checkbox', { name: /カンバン/ }).check();
    
    // 転送実行
    const transferButton = page.getByRole('button', { name: '転送' });
    await transferButton.scrollIntoViewIfNeeded();
    await transferButton.click();
    
    // 成功メッセージを確認
    await expect(page.getByText('転送完了')).toBeVisible();
    
    // WBSビューに切り替えて確認
    await page.getByRole('button', { name: 'WBS' }).click();
    await expect(page.getByText('複数転送テスト')).toBeVisible();
    
    // カンバンビューに切り替えて確認
    await page.getByRole('button', { name: 'カンバン' }).click();
    await expect(page.getByText('複数転送テスト')).toBeVisible();
  });

  test('同期設定をオフにできる', async ({ page }) => {
    // ToDoビューで新しいタスクを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[placeholder="ToDoのタイトルを入力"]', { state: 'visible' });
    await page.getByPlaceholder('ToDoのタイトルを入力').fill('同期オフテスト');
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForTimeout(500);

    // 転送ダイアログを開く
    await page.getByRole('button', { name: /他のビューへ移動/ }).click();
    await page.waitForSelector('text=タスクを他のビューへ移動', { state: 'visible', timeout: 5000 });
    
    // タスクを選択
    await page.getByRole('checkbox', { name: /同期オフテストを選択/ }).check();
    
    // WBSを転送先として選択
    await page.getByRole('checkbox', { name: /WBS/ }).check();
    
    // 同期をオフにする
    await page.getByRole('switch', { name: /自動同期を有効にする/ }).click();
    
    // 転送実行
    const transferButton2 = page.getByRole('button', { name: '転送' });
    await transferButton2.scrollIntoViewIfNeeded();
    await transferButton2.click();
    
    // ToDoで完了にする
    await page.getByRole('checkbox', { name: /同期オフテスト/ }).first().check();
    await page.waitForTimeout(500);
    
    // WBSビューに切り替え
    await page.getByRole('button', { name: 'WBS' }).click();
    
    // WBSでは進捗が0%のままであることを確認（同期されていない）
    const progress = await page.locator('text=同期オフテスト').locator('..').locator('text=0%');
    await expect(progress).toBeVisible();
  });

  test('複数タスクを一度に転送できる', async ({ page }) => {
    // ToDoビューで複数のタスクを作成
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: '新規ToDo作成' }).click();
      await page.waitForSelector('[placeholder="ToDoのタイトルを入力"]', { state: 'visible' });
      await page.getByPlaceholder('ToDoのタイトルを入力').fill(`一括転送タスク${i}`);
      await page.getByRole('button', { name: '作成' }).click();
      await page.waitForTimeout(300);
    }

    // 転送ダイアログを開く
    await page.getByRole('button', { name: /他のビューへ移動/ }).click();
    await page.waitForSelector('text=タスクを他のビューへ移動', { state: 'visible', timeout: 5000 });
    
    // すべて選択
    await page.getByRole('checkbox', { name: /すべて選択/ }).check();
    
    // WBSを転送先として選択
    await page.getByRole('checkbox', { name: /WBS/ }).check();
    
    // 転送実行
    const transferButton = page.getByRole('button', { name: '転送' });
    await transferButton.scrollIntoViewIfNeeded();
    await transferButton.click();
    
    // 成功メッセージを確認
    await expect(page.getByText(/3件のタスクを転送しました/)).toBeVisible();
    
    // WBSビューに切り替え
    await page.getByRole('button', { name: 'WBS' }).click();
    
    // すべてのタスクが存在することを確認
    for (let i = 1; i <= 3; i++) {
      await expect(page.getByText(`一括転送タスク${i}`)).toBeVisible();
    }
  });
});