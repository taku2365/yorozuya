import { describe, it, expect } from "vitest";
import type { WBSTask } from "./types";

describe("WBSTask Type", () => {
  it("should have hierarchy number field", () => {
    const task: WBSTask = {
      id: "1",
      title: "プロジェクト全体",
      position: 0,
      progress: 0,
      hierarchy_number: "1",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };
    
    expect(task.hierarchy_number).toBe("1");
  });

  it("should have start and end date fields", () => {
    const task: WBSTask = {
      id: "1",
      title: "タスク",
      position: 0,
      progress: 0,
      start_date: "2024-01-01",
      end_date: "2024-01-05",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };
    
    expect(task.start_date).toBe("2024-01-01");
    expect(task.end_date).toBe("2024-01-05");
  });

  it("should have work days field", () => {
    const task: WBSTask = {
      id: "1",
      title: "タスク",
      position: 0,
      progress: 0,
      work_days: 5,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };
    
    expect(task.work_days).toBe(5);
  });

  it("should have remarks field", () => {
    const task: WBSTask = {
      id: "1",
      title: "タスク",
      position: 0,
      progress: 0,
      remarks: "初期計画の作成",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };
    
    expect(task.remarks).toBe("初期計画の作成");
  });
});