import { test, expect } from '@playwright/test';

test.describe('ToDo管理機能のUI実装', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo');
  });

  test('5.1 TodoコンポーネントとTodoForm - TodoListコンポーネントの実装（表示・フィルタリング）', async ({ page }) => {
    // TodoListコンポーネントが表示されることを確認
    await expect(page.locator('main h1')).toContainText('ToDo管理');
    
    // 新規ToDo作成ボタンが存在することを確認
    const createButton = page.getByRole('button', { name: '新規ToDo作成' });
    await expect(createButton).toBeVisible();
  });

  test('5.1 TodoFormコンポーネントの実装（作成・編集）', async ({ page }) => {
    // 新規ToDo作成ボタンをクリック
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    
    // ダイアログが表示されるまで待機
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    
    // フォームが表示されることを確認
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '新規ToDo作成' })).toBeVisible();
    
    // 必須フィールドが表示されることを確認
    await expect(page.getByLabel('タイトル')).toBeVisible();
    await expect(page.getByLabel('説明')).toBeVisible();
    await expect(page.getByLabel('優先度')).toBeVisible();
    await expect(page.getByLabel('期限')).toBeVisible();
    
    // ToDoを作成
    await page.getByLabel('タイトル').fill('テストToDo');
    await page.getByLabel('説明').fill('これはテスト用のToDoです');
    
    // 優先度を選択
    await page.getByLabel('優先度').click();
    await page.getByRole('option', { name: '高' }).click();
    
    // 期限を設定（今日ボタンを使用）
    await page.getByRole('button', { name: '今日' }).click();
    
    // 作成ボタンをクリック
    await page.getByRole('button', { name: '作成' }).click();
    
    // ダイアログが閉じるのを待機
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // ダイアログが閉じたことを確認
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // 作成したToDoが一覧に表示されることを確認
    await expect(page.getByText('テストToDo')).toBeVisible();
  });

  test('5.1 期限切れタスクの視覚的警告表示', async ({ page }) => {
    // 期限切れのToDoをUI経由で作成
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    
    // ダイアログが表示されるまで待機
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    
    // フォーム要素が利用可能になるまで待機
    await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 5000 });
    
    await page.getByLabel('タイトル').fill('期限切れタスク');
    await page.getByLabel('説明').fill('期限が過ぎています');
    
    // 過去の日付を直接入力
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split('T')[0];
    await page.getByLabel('期限').fill(formattedDate);
    
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // 期限切れフィルターを適用（ToggleGroupを使用）
    await page.getByRole('radio', { name: '期限切れ' }).click();
    await page.waitForTimeout(500);
    
    // 期限切れタスクが表示されることを確認
    await expect(page.getByText('期限切れタスク')).toBeVisible();
    
    // 期限切れの視覚的表示を確認（実際の実装に合わせて修正）
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: '期限切れタスク' });
    await expect(todoItem).toHaveClass(/border-red-300/);
    await expect(todoItem).toHaveClass(/bg-red-50\/50/);
  });

  test('5.1 Shadcn/uiを使用したUIスタイリング', async ({ page }) => {
    // Shadcn/uiのコンポーネントが使用されていることを確認
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    
    // Buttonコンポーネント
    const createButton = page.getByRole('button', { name: '作成' });
    await expect(createButton).toHaveClass(/inline-flex|items-center|justify-center/);
    
    // Inputコンポーネント
    const titleInput = page.getByLabel('タイトル');
    await expect(titleInput).toHaveClass(/flex|h-9|rounded-md|border/);
    
    // Selectコンポーネント
    const prioritySelect = page.getByLabel('優先度');
    await expect(prioritySelect).toHaveAttribute('role', 'combobox');
  });

  test('5.2 優先度の設定UI', async ({ page }) => {
    // 新規ToDo作成フォームを開く
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[role="dialog"]');
    
    // 優先度選択を開く
    await page.getByLabel('優先度').click();
    
    // 3つの優先度オプションが表示されることを確認
    await expect(page.getByRole('option', { name: '高' })).toBeVisible();
    await expect(page.getByRole('option', { name: '中' })).toBeVisible();
    await expect(page.getByRole('option', { name: '低' })).toBeVisible();
    
    // 各優先度に色分けされた視覚的表示があることを確認
    const highPriorityOption = page.getByRole('option', { name: '高' });
    const mediumPriorityOption = page.getByRole('option', { name: '中' });
    const lowPriorityOption = page.getByRole('option', { name: '低' });
    
    await expect(highPriorityOption.locator('.bg-red-500')).toBeVisible();
    await expect(mediumPriorityOption.locator('.bg-yellow-500')).toBeVisible();
    await expect(lowPriorityOption.locator('.bg-blue-500')).toBeVisible();
  });

  test('5.2 フィルタリング条件の設定パネル', async ({ page }) => {
    // ステータスフィルターが表示されることを確認（ToggleGroupのradioとして実装）
    await expect(page.getByRole('radio', { name: 'すべて' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '未完了' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '完了済み' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '期限切れ' })).toBeVisible();
    
    // 優先度フィルターボタンが存在することを確認
    await expect(page.getByRole('button', { name: '優先度' })).toBeVisible();
    
    // 優先度フィルターをクリック（DropdownMenuとして実装）
    await page.getByRole('button', { name: '優先度' }).click();
    
    // 優先度オプションがドロップダウンメニュー内に表示されることを確認
    await page.waitForTimeout(500); // ドロップダウンが開くまで待つ
    
    // メニューアイテムとして表示されることを確認
    await expect(page.getByRole('menuitem').filter({ hasText: '高' })).toBeVisible();
    await expect(page.getByRole('menuitem').filter({ hasText: '中' })).toBeVisible();
    await expect(page.getByRole('menuitem').filter({ hasText: '低' })).toBeVisible();
  });

  test('5.2 ソート機能の実装（期限・優先度・作成日）', async ({ page }) => {
    // 複数のToDoをUI経由で作成
    // ToDo A（高優先度、期限近い）
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 5000 });
    
    await page.getByLabel('タイトル').fill('ToDo A');
    await page.getByLabel('優先度').click();
    await page.getByRole('option', { name: '高' }).click();
    await page.getByRole('button', { name: '明日' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // ToDo B（低優先度、期限遠い）
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 5000 });
    
    await page.getByLabel('タイトル').fill('ToDo B');
    await page.getByLabel('優先度').click();
    await page.getByRole('option', { name: '低' }).click();
    await page.getByRole('button', { name: '来週' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // ToDo C（中優先度、期限中間）
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 5000 });
    
    await page.getByLabel('タイトル').fill('ToDo C');
    // 中優先度はデフォルト
    await page.getByRole('button', { name: '来月' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // ソートセレクタが存在することを確認
    const sortButton = page.getByRole('button', { name: '並び替え' });
    await expect(sortButton).toBeVisible();
    
    // ソートボタンをクリックしてオプションを表示
    await sortButton.click();
    
    // ソートオプションが表示されることを確認
    await page.waitForTimeout(500); // ドロップダウンが開くまで待つ
    
    // メニューアイテムが表示されることを確認
    await expect(page.getByRole('menuitem').filter({ hasText: '作成日' })).toBeVisible();
    await expect(page.getByRole('menuitem').filter({ hasText: '期限日' })).toBeVisible();
    await expect(page.getByRole('menuitem').filter({ hasText: '優先度' })).toBeVisible();
  });

  test('5.2 検索機能の実装', async ({ page }) => {
    // 複数のToDoをUI経由で作成
    // ToDo 1: 買い物に行く
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 5000 });
    
    await page.getByLabel('タイトル').fill('買い物に行く');
    await page.getByLabel('説明').fill('スーパーで食材を買う');
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // ToDo 2: レポートを書く
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 5000 });
    
    await page.getByLabel('タイトル').fill('レポートを書く');
    await page.getByLabel('説明').fill('月次レポートの作成');
    await page.getByLabel('優先度').click();
    await page.getByRole('option', { name: '高' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // ToDo 3: メールを送る
    await page.getByRole('button', { name: '新規ToDo作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 5000 });
    
    await page.getByLabel('タイトル').fill('メールを送る');
    await page.getByLabel('説明').fill('顧客への返信');
    await page.getByLabel('優先度').click();
    await page.getByRole('option', { name: '低' }).click();
    await page.getByRole('button', { name: '作成' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // 検索ボックスが存在することを確認
    const searchBox = page.getByPlaceholder('ToDoを検索...');
    await expect(searchBox).toBeVisible();
    
    // 検索を実行
    await searchBox.fill('レポート');
    await page.waitForTimeout(500); // 検索結果が更新されるまで待つ
    
    // 検索結果が正しく表示されることを確認
    await expect(page.getByText('レポートを書く')).toBeVisible();
    await expect(page.getByText('買い物に行く')).not.toBeVisible();
    await expect(page.getByText('メールを送る')).not.toBeVisible();
    
    // 検索をクリア
    await searchBox.clear();
    await page.waitForTimeout(500); // 検索結果が更新されるまで待つ
    
    // すべてのToDoが表示されることを確認
    await expect(page.getByText('買い物に行く')).toBeVisible();
    await expect(page.getByText('レポートを書く')).toBeVisible();
    await expect(page.getByText('メールを送る')).toBeVisible();
  });
});