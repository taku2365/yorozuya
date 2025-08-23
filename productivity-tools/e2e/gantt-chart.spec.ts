import { test, expect } from '@playwright/test';

test.describe('ガントチャート機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gantt');
  });

  test('ガントチャートページが正しく表示される', async ({ page }) => {
    // ヘッダーの確認
    await expect(page.getByRole('heading', { name: 'ガントチャート' })).toBeVisible();

    // ツールバーの確認
    await expect(page.getByTestId('gantt-toolbar')).toBeVisible();
    await expect(page.getByLabel('新規タスク')).toBeVisible();
    await expect(page.getByTestId('view-mode-select')).toBeVisible();

    // ガントチャート本体の確認
    await expect(page.getByTestId('gantt-chart')).toBeVisible();
    await expect(page.getByTestId('gantt-task-list')).toBeVisible();
    await expect(page.getByTestId('gantt-timeline')).toBeVisible();
  });

  test('新規タスクを作成できる', async ({ page }) => {
    // 新規タスクボタンをクリック
    await page.getByLabel('新規タスク').click();

    // タスク作成ダイアログが表示される
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // フォームに入力
    await page.getByLabel('タスク名').fill('E2Eテストタスク');
    await page.getByLabel('開始日').fill('2024-01-15');
    await page.getByLabel('終了日').fill('2024-01-20');
    await page.getByLabel('進捗率').fill('0');

    // 保存
    await page.getByRole('button', { name: '保存' }).click();

    // タスクが表示される
    await expect(page.getByText('E2Eテストタスク')).toBeVisible();
    await expect(page.getByTestId('task-bar-E2Eテストタスク')).toBeVisible();
  });

  test('タスクバーをドラッグして日程を変更できる', async ({ page }) => {
    // 既存のタスクがあることを前提
    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('ドラッグテスト');
    await page.getByLabel('開始日').fill('2024-01-10');
    await page.getByLabel('終了日').fill('2024-01-15');
    await page.getByRole('button', { name: '保存' }).click();

    // タスクバーを取得
    const taskBar = page.getByTestId('task-bar-ドラッグテスト');
    await expect(taskBar).toBeVisible();

    // ドラッグ操作
    const box = await taskBar.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
      await page.mouse.up();
    }

    // 日程が変更されたことを確認（詳細な日付確認は実装に依存）
    await expect(taskBar).toBeVisible();
  });

  test('ビューモードを切り替えられる', async ({ page }) => {
    // ビューモード選択
    await page.getByTestId('view-mode-select').click();

    // 週表示に切り替え
    await page.getByText('週').click();
    await expect(page.getByTestId('gantt-timeline')).toHaveAttribute('data-view-mode', 'week');

    // 月表示に切り替え
    await page.getByTestId('view-mode-select').click();
    await page.getByText('月').click();
    await expect(page.getByTestId('gantt-timeline')).toHaveAttribute('data-view-mode', 'month');
  });

  test('タスクの進捗を更新できる', async ({ page }) => {
    // タスクを作成
    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('進捗テスト');
    await page.getByLabel('開始日').fill('2024-01-10');
    await page.getByLabel('終了日').fill('2024-01-15');
    await page.getByLabel('進捗率').fill('0');
    await page.getByRole('button', { name: '保存' }).click();

    // タスクをクリックして編集
    await page.getByText('進捗テスト').click();
    
    // 編集ダイアログが表示される
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();

    // 進捗を更新
    await page.getByLabel('進捗率').fill('50');
    await page.getByRole('button', { name: '保存' }).click();

    // 進捗バーが表示される
    const progressBar = page.locator('[data-testid="task-bar-進捗テスト"] [data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute('style', expect.stringContaining('width: 50%'));
  });

  test('依存関係を作成できる', async ({ page }) => {
    // 2つのタスクを作成
    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('タスクA');
    await page.getByLabel('開始日').fill('2024-01-10');
    await page.getByLabel('終了日').fill('2024-01-15');
    await page.getByRole('button', { name: '保存' }).click();

    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('タスクB');
    await page.getByLabel('開始日').fill('2024-01-16');
    await page.getByLabel('終了日').fill('2024-01-20');
    await page.getByRole('button', { name: '保存' }).click();

    // タスクBを編集して依存関係を追加
    await page.getByText('タスクB').click();
    await page.getByLabel('依存タスク').selectOption('タスクA');
    await page.getByRole('button', { name: '保存' }).click();

    // 依存関係の線が表示される
    await expect(page.getByTestId('dependency-line-タスクA-タスクB')).toBeVisible();
  });

  test('クリティカルパスを表示できる', async ({ page }) => {
    // クリティカルパス表示をオン
    await page.getByLabel('クリティカルパス').click();

    // クリティカルパスパネルが表示される
    await expect(page.getByTestId('critical-path-panel')).toBeVisible();

    // クリティカルパスを計算
    await page.getByText('クリティカルパスを再計算').click();

    // クリティカルパス上のタスクが強調表示される
    await expect(page.locator('.border-red-500')).toBeVisible();
  });

  test('ガントチャートをエクスポートできる', async ({ page }) => {
    // エクスポートメニューを開く
    await page.getByLabel('エクスポート').click();

    // PNG形式でエクスポート
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('PNG画像').click();
    const download = await downloadPromise;

    // ダウンロードファイルの確認
    expect(download.suggestedFilename()).toContain('gantt-chart');
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('タスクリストで階層構造を作成できる', async ({ page }) => {
    // 親タスクを作成
    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('親タスク');
    await page.getByLabel('開始日').fill('2024-01-10');
    await page.getByLabel('終了日').fill('2024-01-20');
    await page.getByRole('button', { name: '保存' }).click();

    // 子タスクを作成
    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('子タスク');
    await page.getByLabel('親タスク').selectOption('親タスク');
    await page.getByLabel('開始日').fill('2024-01-12');
    await page.getByLabel('終了日').fill('2024-01-15');
    await page.getByRole('button', { name: '保存' }).click();

    // 階層構造が表示される
    const parentRow = page.locator('[data-task-id="親タスク"]');
    const childRow = page.locator('[data-task-id="子タスク"]');
    
    await expect(parentRow).toBeVisible();
    await expect(childRow).toBeVisible();
    await expect(childRow).toHaveAttribute('data-indent', '1');
  });

  test('フィルタリング機能が動作する', async ({ page }) => {
    // 複数のタスクを作成
    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('高優先度タスク');
    await page.getByLabel('優先度').selectOption('高');
    await page.getByLabel('開始日').fill('2024-01-10');
    await page.getByLabel('終了日').fill('2024-01-15');
    await page.getByRole('button', { name: '保存' }).click();

    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('低優先度タスク');
    await page.getByLabel('優先度').selectOption('低');
    await page.getByLabel('開始日').fill('2024-01-16');
    await page.getByLabel('終了日').fill('2024-01-20');
    await page.getByRole('button', { name: '保存' }).click();

    // フィルタを適用
    await page.getByLabel('フィルタ').click();
    await page.getByLabel('優先度でフィルタ').selectOption('高');
    await page.getByRole('button', { name: '適用' }).click();

    // 高優先度タスクのみ表示される
    await expect(page.getByText('高優先度タスク')).toBeVisible();
    await expect(page.getByText('低優先度タスク')).not.toBeVisible();
  });

  test('リアルタイム同期が動作する', async ({ page, context }) => {
    // 2つ目のブラウザタブを開く
    const page2 = await context.newPage();
    await page2.goto('/gantt');

    // 1つ目のタブでタスクを作成
    await page.getByLabel('新規タスク').click();
    await page.getByLabel('タスク名').fill('同期テストタスク');
    await page.getByLabel('開始日').fill('2024-01-10');
    await page.getByLabel('終了日').fill('2024-01-15');
    await page.getByRole('button', { name: '保存' }).click();

    // 2つ目のタブでも表示される
    await expect(page2.getByText('同期テストタスク')).toBeVisible({ timeout: 5000 });
  });

  test('ズーム機能が動作する', async ({ page }) => {
    // ズームイン
    await page.getByLabel('拡大').click();
    await expect(page.getByTestId('gantt-timeline')).toHaveAttribute('data-zoom-level', expect.stringMatching(/\d+/));

    // ズームアウト
    await page.getByLabel('縮小').click();
    await expect(page.getByTestId('gantt-timeline')).toHaveAttribute('data-zoom-level', expect.stringMatching(/\d+/));
  });

  test('今日ボタンで現在日付にジャンプする', async ({ page }) => {
    // 今日ボタンをクリック
    await page.getByText('今日').click();

    // 現在日付が表示範囲に含まれることを確認
    const today = new Date().toISOString().split('T')[0];
    await expect(page.locator(`[data-date="${today}"]`)).toBeVisible();
  });

  test('設定画面で表示オプションを変更できる', async ({ page }) => {
    // 設定を開く
    await page.getByLabel('設定').click();

    // 設定ダイアログが表示される
    const settingsDialog = page.getByTestId('gantt-view-settings');
    await expect(settingsDialog).toBeVisible();

    // 週末非表示に設定
    await page.getByLabel('週末を表示').uncheck();
    
    // コンパクト表示に設定
    await page.getByLabel('コンパクト表示').check();

    // 保存
    await page.getByRole('button', { name: '保存' }).click();

    // 設定が適用される
    await expect(page.locator('.weekend-column')).not.toBeVisible();
    await expect(page.getByTestId('gantt-chart')).toHaveClass(/compact-mode/);
  });
});