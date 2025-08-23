import { test, expect } from "@playwright/test";

test.describe("カンバンボード", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kanban");
    await page.waitForLoadState("networkidle");
    
    // レーンが存在しない場合は作成
    const hasLanes = await page.locator(".flex-shrink-0").count() > 0;
    if (!hasLanes) {
      const addLaneButton = page.getByRole("button", { name: "レーンを追加" });
      
      // ToDoレーンを作成
      await addLaneButton.click();
      await page.getByLabel("レーン名").fill("ToDo");
      await page.getByRole("button", { name: "作成" }).click();
      
      // 進行中レーンを作成
      await addLaneButton.click();
      await page.getByLabel("レーン名").fill("進行中");
      await page.getByLabel("WIP制限").fill("3");
      await page.getByRole("button", { name: "作成" }).click();
      
      // 完了レーンを作成
      await addLaneButton.click();
      await page.getByLabel("レーン名").fill("完了");
      await page.getByRole("button", { name: "作成" }).click();
    }
  });

  test("デフォルトレーンが作成される", async ({ page }) => {
    // 初回アクセス時にレーンを作成
    const addLaneButton = page.getByRole("button", { name: "レーンを追加" });
    
    // ToDoレーンを作成
    await addLaneButton.click();
    await page.getByLabel("レーン名").fill("ToDo");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 進行中レーンを作成
    await addLaneButton.click();
    await page.getByLabel("レーン名").fill("進行中");
    await page.getByLabel("WIP制限").fill("3");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 完了レーンを作成
    await addLaneButton.click();
    await page.getByLabel("レーン名").fill("完了");
    await page.getByRole("button", { name: "作成" }).click();
    
    // レーンが表示されることを確認（レーンタイトル内でのみ検索）
    await expect(page.locator(".text-base").filter({ hasText: "ToDo" })).toBeVisible();
    await expect(page.locator(".text-base").filter({ hasText: "進行中" })).toBeVisible();
    await expect(page.locator(".text-base").filter({ hasText: "完了" })).toBeVisible();
  });

  test("カードの作成", async ({ page }) => {
    // ToDoレーンにカードを追加
    const todoLane = page.locator(".flex-shrink-0").filter({ hasText: "ToDo" });
    await todoLane.getByRole("button", { name: "+" }).click();
    
    await page.getByLabel("タイトル").fill("新しいタスク");
    await page.getByLabel("説明").fill("タスクの説明");
    await page.getByLabel("ラベル").fill("バグ, 優先度高");
    await page.getByRole("button", { name: "作成" }).click();
    
    // カードが表示されることを確認
    await expect(page.getByText("新しいタスク")).toBeVisible();
    await expect(page.getByText("タスクの説明")).toBeVisible();
    await expect(page.getByText("バグ")).toBeVisible();
    await expect(page.getByText("優先度高")).toBeVisible();
  });

  test("カードの編集", async ({ page }) => {
    // まずカードを作成
    const todoLane = page.locator(".flex-shrink-0").filter({ hasText: "ToDo" });
    await todoLane.locator('svg.lucide-plus').locator('..').click();
    await page.getByLabel("タイトル").fill("編集テスト用カード");
    await page.getByRole("button", { name: "作成" }).click();
    
    // カードを編集
    const card = page.locator(".cursor-move").filter({ hasText: "編集テスト用カード" });
    await card.hover();
    await card.locator('svg.lucide-ellipsis-vertical').locator('..').click();
    await page.getByText("編集").click();
    
    await page.getByLabel("タイトル").fill("更新されたタスク");
    await page.getByRole("button", { name: "更新" }).click();
    
    // 更新が反映されることを確認
    await expect(page.getByText("更新されたタスク")).toBeVisible();
    await expect(page.getByText("編集テスト用カード")).not.toBeVisible();
  });

  test("WIP制限の動作", async ({ page }) => {
    // 進行中レーンに3つのカードを作成
    const inProgressLane = page.locator(".flex-shrink-0").filter({ hasText: "進行中" });
    
    for (let i = 1; i <= 3; i++) {
      await inProgressLane.getByRole("button", { name: "+" }).click();
      await page.getByLabel("タイトル").fill(`タスク${i}`);
      await page.getByRole("button", { name: "作成" }).click();
    }
    
    // WIP制限に達したことを確認
    await expect(page.getByText("WIP制限に達しています")).toBeVisible();
    
    // 追加ボタンが無効になることを確認
    const addButton = inProgressLane.getByRole("button", { name: "+" });
    await expect(addButton).toBeDisabled();
  });

  test("レーンの編集", async ({ page }) => {
    const todoLane = page.locator(".flex-shrink-0").filter({ hasText: "ToDo" });
    await todoLane.locator('svg.lucide-ellipsis-vertical').locator('..').click();
    await page.getByText("レーンを編集").click();
    
    await page.getByLabel("レーン名").fill("バックログ");
    await page.getByLabel("WIP制限").fill("5");
    await page.getByRole("button", { name: "更新" }).click();
    
    // 更新が反映されることを確認
    await expect(page.locator(".text-base").filter({ hasText: "バックログ" })).toBeVisible();
    // ToDoという文字がナビゲーション以外に表示されないことを確認
    const todoCount = await page.locator(".text-base").filter({ hasText: "ToDo" }).count();
    expect(todoCount).toBe(0);
  });

  test("カードの削除", async ({ page }) => {
    const card = page.locator(".cursor-move").first();
    await card.hover();
    await card.getByRole("button").click();
    await page.getByText("削除").click();
    
    // 確認ダイアログをOK
    page.on("dialog", dialog => dialog.accept());
    
    // カードが削除されることを確認
    await expect(card).not.toBeVisible();
  });

  test("レーンの削除", async ({ page }) => {
    const lane = page.locator(".flex-shrink-0").filter({ hasText: "完了" });
    await lane.getByRole("button", { name: "More" }).click();
    await page.getByText("レーンを削除").click();
    
    // 確認ダイアログをOK
    page.on("dialog", dialog => dialog.accept());
    
    // レーンが削除されることを確認
    await expect(page.getByText("完了")).not.toBeVisible();
  });

  test.skip("カードのドラッグ&ドロップ", async ({ page }) => {
    // Note: Playwright doesn't fully support drag & drop testing
    // This is a placeholder for manual testing
    
    // Create cards in different lanes
    // Drag a card from ToDo to 進行中
    // Verify the card moves to the new lane
  });
});