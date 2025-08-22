import { describe, it, expect, beforeEach, vi } from "vitest";
import { WBSRepository } from "./wbs-repository";
import type { WBSTask } from "../db/types";

// Mock the database
vi.mock("../db/database");

describe("WBSRepository - Delete Functions", () => {
  let repository: WBSRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
    };
    repository = new WBSRepository(mockDb);
  });

  it("整数番号タスクを削除すると子タスクも削除される", async () => {
    // 親タスクを作成
    const parent = await repository.createWithHierarchyNumber({
      title: "親タスク",
      hierarchy_number: "1",
    });

    // 子タスクを作成
    const child1 = await repository.createWithHierarchyNumber({
      title: "子タスク1",
      parent_id: parent.id,
      hierarchy_number: "1.1",
    });

    const child2 = await repository.createWithHierarchyNumber({
      title: "子タスク2",
      parent_id: parent.id,
      hierarchy_number: "1.2",
    });

    // 孫タスクを作成
    const grandchild = await repository.createWithHierarchyNumber({
      title: "孫タスク",
      parent_id: child1.id,
      hierarchy_number: "1.1.1",
    });

    // 削除前にタスクが存在することを確認
    const beforeDelete = await repository.findAll();
    expect(beforeDelete).toHaveLength(4);

    // 親タスクを削除
    await repository.delete(parent.id);

    // すべてのタスクが削除されたことを確認
    const afterDelete = await repository.findAll();
    expect(afterDelete).toHaveLength(0);
  });

  it("小数番号タスクを削除しても親タスクは削除されない", async () => {
    // 親タスクを作成
    const parent = await repository.createWithHierarchyNumber({
      title: "親タスク",
      hierarchy_number: "1",
    });

    // 子タスクを作成
    const child = await repository.createWithHierarchyNumber({
      title: "子タスク",
      parent_id: parent.id,
      hierarchy_number: "1.1",
    });

    // 子タスクを削除
    await repository.delete(child.id);

    // 親タスクは残っていることを確認
    const afterDelete = await repository.findAll();
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].id).toBe(parent.id);
  });

  it("タスク順序変更（reorderTask）が正しく動作する", async () => {
    // 複数のタスクを作成
    const task1 = await repository.createWithHierarchyNumber({
      title: "タスク1",
      hierarchy_number: "1",
      position: 0,
    });

    const task2 = await repository.createWithHierarchyNumber({
      title: "タスク2",
      hierarchy_number: "2",
      position: 1,
    });

    const task3 = await repository.createWithHierarchyNumber({
      title: "タスク3",
      hierarchy_number: "3",
      position: 2,
    });

    // タスク1をタスク2の後に移動
    await repository.reorderTask(task1.id, task2.id, "after");

    // 階層番号が再採番されたことを確認
    const afterReorder = await repository.findAll();
    const reorderedTask1 = afterReorder.find(t => t.title === "タスク1");
    const reorderedTask2 = afterReorder.find(t => t.title === "タスク2");
    const reorderedTask3 = afterReorder.find(t => t.title === "タスク3");

    expect(reorderedTask2?.hierarchy_number).toBe("1");
    expect(reorderedTask1?.hierarchy_number).toBe("2");
    expect(reorderedTask3?.hierarchy_number).toBe("3");
  });

  it("異なる親を持つタスクは移動できない", async () => {
    // 親タスク1を作成
    const parent1 = await repository.createWithHierarchyNumber({
      title: "親タスク1",
      hierarchy_number: "1",
    });

    // 親タスク2を作成
    const parent2 = await repository.createWithHierarchyNumber({
      title: "親タスク2",
      hierarchy_number: "2",
    });

    // それぞれの子タスクを作成
    const child1 = await repository.createWithHierarchyNumber({
      title: "子タスク1",
      parent_id: parent1.id,
      hierarchy_number: "1.1",
    });

    const child2 = await repository.createWithHierarchyNumber({
      title: "子タスク2",
      parent_id: parent2.id,
      hierarchy_number: "2.1",
    });

    // 異なる親を持つタスク間での移動を試みる
    await expect(repository.reorderTask(child1.id, child2.id, "after"))
      .rejects.toThrow("Tasks must have the same parent to reorder");
  });

  it("階層番号の再計算が正しく動作する", async () => {
    // タスクを作成（階層番号なし）
    const task1 = await repository.create({
      title: "タスク1",
      position: 0,
    });

    const task2 = await repository.create({
      title: "タスク2",
      position: 1,
    });

    const child1 = await repository.create({
      title: "子タスク1",
      parent_id: task1.id,
      position: 0,
    });

    // 階層番号を再計算
    await repository.recalculateAllHierarchyNumbers();

    // 階層番号が正しく設定されたことを確認
    const afterRecalculate = await repository.findAll();
    const recalcTask1 = afterRecalculate.find(t => t.title === "タスク1");
    const recalcTask2 = afterRecalculate.find(t => t.title === "タスク2");
    const recalcChild1 = afterRecalculate.find(t => t.title === "子タスク1");

    expect(recalcTask1?.hierarchy_number).toBe("1");
    expect(recalcTask2?.hierarchy_number).toBe("2");
    expect(recalcChild1?.hierarchy_number).toBe("1.1");
  });
});