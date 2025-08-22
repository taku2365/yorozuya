import { test, expect } from "@playwright/test";

test.describe("WBS挿入ロジック", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wbs");
    await page.waitForLoadState("networkidle");
  });

  test("整数番号の後に挿入すると小数番号になる", async ({ page }) => {
    // タスク2を作成
    await page.getByRole("button", { name: "新規タスク作成" }).click();
    await page.getByLabel("階層番号").fill("2");
    await page.getByLabel("タスク名").fill("タスク2");
    await page.getByRole("button", { name: "作成" }).click();
    
    // タスク3を作成
    await page.getByRole("button", { name: "新規タスク作成" }).click();
    await page.getByLabel("階層番号").fill("3");
    await page.getByLabel("タスク名").fill("タスク3");
    await page.getByRole("button", { name: "作成" }).click();
    
    // タスク2の後に挿入
    const task2Row = page.locator("tr").filter({ hasText: "タスク2" });
    await task2Row.hover();
    await task2Row.getByRole("button", { name: "タスクを挿入" }).click();
    
    await page.getByLabel("タスク名").fill("挿入タスク");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 挿入されたタスクが2.1になることを確認
    await expect(page.locator("text=2.1")).toBeVisible();
    await expect(page.locator("tr").filter({ hasText: "挿入タスク" })).toContainText("2.1");
    
    // 順序を確認: 2 -> 2.1 -> 3
    const rows = page.locator("tbody tr");
    await expect(rows.nth(0)).toContainText("2");
    await expect(rows.nth(1)).toContainText("2.1");
    await expect(rows.nth(2)).toContainText("3");
  });

  test("小数番号の後に挿入すると同じレベルの番号になる", async ({ page }) => {
    // タスク2を作成
    await page.getByRole("button", { name: "新規タスク作成" }).click();
    await page.getByLabel("階層番号").fill("2");
    await page.getByLabel("タスク名").fill("タスク2");
    await page.getByRole("button", { name: "作成" }).click();
    
    // タスク2の後に挿入（2.1を作成）
    const task2Row = page.locator("tr").filter({ hasText: "タスク2" });
    await task2Row.hover();
    await task2Row.getByRole("button", { name: "タスクを挿入" }).click();
    await page.getByLabel("タスク名").fill("タスク2.1");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 2.1の後に挿入（2.2を作成）
    const task21Row = page.locator("tr").filter({ hasText: "タスク2.1" });
    await task21Row.hover();
    await task21Row.getByRole("button", { name: "タスクを挿入" }).click();
    await page.getByLabel("タスク名").fill("タスク2.2");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 2.2の後に挿入
    const task22Row = page.locator("tr").filter({ hasText: "タスク2.2" });
    await task22Row.hover();
    await task22Row.getByRole("button", { name: "タスクを挿入" }).click();
    await page.getByLabel("タスク名").fill("挿入タスク");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 挿入されたタスクが2.3になることを確認
    await expect(page.locator("text=2.3")).toBeVisible();
    await expect(page.locator("tr").filter({ hasText: "挿入タスク" })).toContainText("2.3");
    
    // 順序を確認
    const rows = page.locator("tbody tr");
    await expect(rows.nth(0)).toContainText("2");
    await expect(rows.nth(1)).toContainText("2.1");
    await expect(rows.nth(2)).toContainText("2.2");
    await expect(rows.nth(3)).toContainText("2.3");
  });

  test("複数レベルの階層での挿入", async ({ page }) => {
    // タスク1を作成
    await page.getByRole("button", { name: "新規タスク作成" }).click();
    await page.getByLabel("階層番号").fill("1");
    await page.getByLabel("タスク名").fill("タスク1");
    await page.getByRole("button", { name: "作成" }).click();
    
    // タスク2を作成
    await page.getByRole("button", { name: "新規タスク作成" }).click();
    await page.getByLabel("階層番号").fill("2");
    await page.getByLabel("タスク名").fill("タスク2");
    await page.getByRole("button", { name: "作成" }).click();
    
    // タスク2の後に挿入（2.1）
    let task2Row = page.locator("tr").filter({ hasText: "タスク2" }).first();
    await task2Row.hover();
    await task2Row.getByRole("button", { name: "タスクを挿入" }).click();
    await page.getByLabel("タスク名").fill("タスク2.1");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 2.1の後に挿入（2.2）
    const task21Row = page.locator("tr").filter({ hasText: "タスク2.1" });
    await task21Row.hover();
    await task21Row.getByRole("button", { name: "タスクを挿入" }).click();
    await page.getByLabel("タスク名").fill("タスク2.2");
    await page.getByRole("button", { name: "作成" }).click();
    
    // タスク3を作成
    await page.getByRole("button", { name: "新規タスク作成" }).click();
    await page.getByLabel("階層番号").fill("3");
    await page.getByLabel("タスク名").fill("タスク3");
    await page.getByRole("button", { name: "作成" }).click();
    
    // 確認: 1, 2, 2.1, 2.2, 3の順序
    const rows = page.locator("tbody tr");
    await expect(rows.nth(0)).toContainText("1");
    await expect(rows.nth(1)).toContainText("2");
    await expect(rows.nth(2)).toContainText("2.1");
    await expect(rows.nth(3)).toContainText("2.2");
    await expect(rows.nth(4)).toContainText("3");
  });
});