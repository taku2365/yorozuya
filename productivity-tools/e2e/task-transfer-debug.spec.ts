import { test, expect } from '@playwright/test';

test.use({
  // タイムアウトを60秒に設定
  timeout: 60000,
});

test.describe('タスク転送デバッグ', () => {
  test.beforeEach(async ({ page }) => {
    // コンソールメッセージを収集
    page.on('console', msg => {
      console.log(`${msg.type()}: ${msg.text()}`);
    });

    await page.goto('/integrated');
    await page.waitForLoadState('networkidle');
    // ToDoビューがデフォルトで表示されていることを確認
    await page.waitForSelector('text=ToDo管理', { timeout: 10000 });
  });

  test('転送機能のエラーを詳細に確認', async ({ page }) => {
    // ToDoビューで新しいタスクを作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[placeholder="ToDoのタイトルを入力"]', { state: 'visible' });
    await page.getByPlaceholder('ToDoのタイトルを入力').fill('転送テストタスク');
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForTimeout(1000); // 作成を待つ

    // 転送ダイアログを開く
    await page.getByRole('button', { name: /他のビューへ移動/ }).click();
    await page.waitForSelector('text=タスクを他のビューへ移動', { state: 'visible', timeout: 5000 });
    
    // タスクを選択
    await page.getByRole('checkbox', { name: /転送テストタスクを選択/ }).check();
    
    // WBSを転送先として選択
    await page.getByRole('checkbox', { name: /WBS/ }).check();
    
    // ネットワークリクエストを監視
    page.on('request', request => {
      if (request.url().includes('transfer')) {
        console.log('転送リクエスト:', request.url(), request.postData());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('transfer')) {
        console.log('転送レスポンス:', response.status(), response.url());
      }
    });
    
    // 転送実行
    const transferButton = page.getByRole('button', { name: '転送' });
    await transferButton.scrollIntoViewIfNeeded();
    await transferButton.click();
    
    // エラーまたは成功メッセージを待つ
    await page.waitForTimeout(3000);
    
    // エラートーストの確認
    const errorToast = page.locator('[role="alert"]');
    if (await errorToast.isVisible()) {
      const errorText = await errorToast.textContent();
      console.error('転送エラー内容:', errorText);
      
      // スクリーンショットを撮る
      await page.screenshot({ path: 'transfer-error.png', fullPage: true });
    }
    
    // 成功トーストの確認
    const successToast = page.getByText('転送完了');
    const isSuccess = await successToast.isVisible();
    
    expect(isSuccess).toBe(true);
  });
});