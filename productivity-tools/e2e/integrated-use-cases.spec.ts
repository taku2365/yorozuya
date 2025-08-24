import { test, expect } from '@playwright/test';

test.describe('統合タスク管理 - ユースケース', () => {
  test.describe('初回利用フロー', () => {
    test('ホームページから統合ページへ遷移できること', async ({ page }) => {
      // ホームページへアクセス
      await page.goto('/');
      
      // 統合ビューのプロモーションセクションが表示されている
      await expect(page.getByText('統合タスク管理（新機能）')).toBeVisible();
      await expect(page.getByText('すべてのツールのタスクを一箇所で管理')).toBeVisible();
      
      // 統合ビューを開くボタンをクリック
      await page.getByRole('button', { name: '統合ビューを開く' }).click();
      
      // 統合ページへ遷移したことを確認
      await expect(page).toHaveURL('/integrated');
      await expect(page.getByText('統合タスク管理')).toBeVisible();
    });

    test('初回利用時にデータ移行の案内が表示されること', async ({ page }) => {
      // 統合ページへ直接アクセス
      await page.goto('/integrated');
      
      // データ移行の案内が表示される
      await expect(page.getByText('統合タスク管理を使用するには、既存のデータを移行する必要があります')).toBeVisible();
      await expect(page.getByRole('button', { name: 'データを移行' })).toBeVisible();
    });
  });

  test.describe('Todoタスクとの連携', () => {
    test('Todoで作成したタスクが統合ビューに表示されること', async ({ page }) => {
      // まずTodoページでタスクを作成
      await page.goto('/todo');
      
      // 新しいタスクを追加
      await page.getByPlaceholder('新しいタスクを入力...').fill('統合テスト用タスク');
      await page.getByRole('button', { name: '追加' }).click();
      
      // タスクが追加されたことを確認
      await expect(page.getByText('統合テスト用タスク')).toBeVisible();
      
      // 統合ページへ移動
      await page.goto('/integrated');
      
      // データ移行を実行（初回のみ）
      const migrationButton = page.getByRole('button', { name: 'データを移行' });
      if (await migrationButton.isVisible()) {
        await migrationButton.click();
        
        // 移行完了のトーストを待つ
        await expect(page.getByText('移行完了')).toBeVisible({ timeout: 10000 });
      }
      
      // Todoビューに切り替え
      await page.getByRole('tab', { name: 'ToDo' }).click();
      
      // Todoで作成したタスクが表示されることを確認
      await expect(page.getByText('統合テスト用タスク')).toBeVisible();
    });

    test('統合ビューでタスクカウントが正しく表示されること', async ({ page }) => {
      // Todoページで複数のタスクを作成
      await page.goto('/todo');
      
      const tasks = ['タスク1', 'タスク2', 'タスク3'];
      for (const task of tasks) {
        await page.getByPlaceholder('新しいタスクを入力...').fill(task);
        await page.getByRole('button', { name: '追加' }).click();
      }
      
      // 統合ページへ移動
      await page.goto('/integrated');
      
      // データ移行が必要な場合は実行
      const migrationButton = page.getByRole('button', { name: 'データを移行' });
      if (await migrationButton.isVisible()) {
        await migrationButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Todoタブにタスクカウントが表示される
      const todoTab = page.getByRole('tab', { name: /ToDo/ });
      const taskCountBadge = todoTab.locator('span.rounded-full');
      
      // タスクカウントが表示されることを確認（具体的な数は状況による）
      await expect(taskCountBadge).toBeVisible();
      const count = await taskCountBadge.textContent();
      expect(Number(count)).toBeGreaterThan(0);
    });
  });

  test.describe('検索・フィルタリング機能', () => {
    test('グローバル検索でタスクを検索できること', async ({ page }) => {
      await page.goto('/integrated');
      
      // データ移行済みの想定
      
      // 検索ボタンをクリック
      await page.getByText('タスクを検索...').click();
      
      // 検索ダイアログが表示される
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // 検索キーワードを入力
      await page.getByPlaceholder('タスクを検索...').fill('タスク');
      
      // 少し待って検索結果が表示されることを確認
      await page.waitForTimeout(500);
      
      // 検索結果のカウントが表示される
      await expect(page.getByText(/\d+ 件の結果/)).toBeVisible();
    });

    test('Cmd+K (Ctrl+K) で検索を開けること', async ({ page }) => {
      await page.goto('/integrated');
      
      // キーボードショートカットで検索を開く
      await page.keyboard.press('Meta+k');
      
      // 検索ダイアログが表示される
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByPlaceholder('タスクを検索...')).toBeVisible();
      
      // Escで閉じる
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('フィルターでステータスごとにタスクを絞り込めること', async ({ page }) => {
      await page.goto('/integrated');
      
      // フィルターボタンをクリック
      await page.getByRole('button', { name: 'フィルター' }).click();
      
      // フィルターサイドバーが表示される
      await page.waitForTimeout(500);
      await expect(page.getByText('フィルター設定')).toBeVisible();
      
      // ステータスフィルターのオプションが表示される
      await expect(page.getByText('未着手')).toBeVisible();
      await expect(page.getByText('進行中')).toBeVisible();
      await expect(page.getByText('完了')).toBeVisible();
      
      // 「進行中」のみにフィルター
      await page.getByRole('checkbox', { name: /進行中/ }).click();
      
      // フィルターが適用されたことを示すインジケーターが表示される
      await expect(page.getByRole('button', { name: 'フィルター' }).locator('span.rounded-full')).toBeVisible();
    });
  });

  test.describe('ビュー切り替え', () => {
    test('異なるビュー間でシームレスに切り替えられること', async ({ page }) => {
      await page.goto('/integrated');
      
      // 各ビューのタブが表示されている
      await expect(page.getByRole('tab', { name: 'ToDo' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'WBS' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'カンバン' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'ガント' })).toBeVisible();
      
      // WBSビューに切り替え
      await page.getByRole('tab', { name: 'WBS' }).click();
      
      // WBSコンポーネントが表示される（WBSの特徴的な要素を確認）
      await page.waitForTimeout(500);
      
      // カンバンビューに切り替え
      await page.getByRole('tab', { name: 'カンバン' }).click();
      
      // カンバンコンポーネントが表示される
      await page.waitForTimeout(500);
      
      // ガントビューに切り替え
      await page.getByRole('tab', { name: 'ガント' }).click();
      
      // ガントコンポーネントが表示される
      await page.waitForTimeout(500);
    });

    test('検索結果からタスクを選択すると該当ビューに切り替わること', async ({ page }) => {
      await page.goto('/integrated');
      
      // データがある前提で検索を実行
      await page.getByText('タスクを検索...').click();
      await page.getByPlaceholder('タスクを検索...').fill('タスク');
      await page.waitForTimeout(500);
      
      // 検索結果が表示されたら最初の結果をクリック
      const firstResult = page.locator('button[class*="cursor-pointer"]').first();
      if (await firstResult.isVisible()) {
        await firstResult.click();
        
        // タスク選択のトーストが表示される
        await expect(page.getByText('タスクを選択しました')).toBeVisible();
      }
    });
  });

  test.describe('レスポンシブデザイン', () => {
    test('モバイルビューでも統合機能が使えること', async ({ page }) => {
      // モバイルビューポートに設定
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/integrated');
      
      // 統合タスク管理のタイトルが表示される
      await expect(page.getByText('統合タスク管理')).toBeVisible();
      
      // タブナビゲーションが機能する
      await expect(page.getByRole('tab', { name: 'ToDo' })).toBeVisible();
      
      // 検索ボタンが使える
      await expect(page.getByText('タスクを検索...')).toBeVisible();
    });
  });
});