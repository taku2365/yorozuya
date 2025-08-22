import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WBSTreeEnhanced } from "./wbs-tree-enhanced";
import type { WBSTask } from "@/lib/db/types";

describe("WBSTreeEnhanced", () => {
  const mockOnTaskClick = vi.fn();

  const mockTasks: WBSTask[] = [
    {
      id: "1",
      title: "プロジェクト計画",
      parent_id: undefined,
      position: 0,
      estimated_hours: 40,
      actual_hours: 20,
      progress: 50,
      assignee: "田中",
      reviewer: "山田",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      children: [
        {
          id: "2",
          title: "要件定義",
          parent_id: "1",
          position: 0,
          estimated_hours: 16,
          actual_hours: 16,
          progress: 100,
          assignee: "佐藤",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          title: "設計",
          parent_id: "1",
          position: 1,
          estimated_hours: 24,
          actual_hours: 4,
          progress: 20,
          assignee: "田中",
          reviewer: "山田",
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 期限切れ
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
  ];

  it("タスクツリーが正しく表示される", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        showTaskNumbers={true}
        colorByStatus={true}
      />
    );

    expect(screen.getByText("プロジェクト計画")).toBeInTheDocument();
    expect(screen.getByText("要件定義")).toBeInTheDocument();
    expect(screen.getByText("設計")).toBeInTheDocument();
  });

  it("タスク番号が表示される", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        showTaskNumbers={true}
        colorByStatus={false}
      />
    );

    // タスク番号を含むspan要素を検索
    const taskNumbers = screen.getAllByText(/^\d+(\.\d+)?$/);
    const taskNumberTexts = taskNumbers.map(el => el.textContent);
    
    expect(taskNumberTexts).toContain("1");
    expect(taskNumberTexts).toContain("1.1");
    expect(taskNumberTexts).toContain("1.2");
  });

  it("担当者とレビュー者が表示される", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    // 複数の同じ担当者がいる場合は、getAllByTextを使用
    const tanakaTasks = screen.getAllByText("担当: 田中");
    expect(tanakaTasks).toHaveLength(2); // 田中さんは2つのタスクを担当
    
    // レビュー者も複数ある場合はgetAllByTextを使用
    const yamadaReviewers = screen.getAllByText("レビュー: 山田");
    expect(yamadaReviewers).toHaveLength(2); // 山田さんは2つのタスクをレビュー
    
    expect(screen.getByText("担当: 佐藤")).toBeInTheDocument();
  });

  it("進捗状況に応じたステータスアイコンが表示される", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        colorByStatus={true}
      />
    );

    // タスクカードを取得（階層構造を考慮）
    const projectCard = screen.getByText("プロジェクト計画").closest(".group");
    const requirementCard = screen.getByText("要件定義").closest(".group");
    
    // 進捗50%のタスクは「進行中」（青色）
    expect(projectCard).toHaveClass("bg-yellow-50");

    // 進捗100%のタスクは「完了」（緑色）  
    expect(requirementCard).toHaveClass("bg-green-50");
  });

  it("期限切れタスクが適切にハイライトされる", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    // 期限切れタスクの確認（日数は動的なので部分一致）
    expect(screen.getByText(/日超過/)).toBeInTheDocument();
  });

  it("作業日数が表示される", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    // 40時間 = 5日
    expect(screen.getByText("5日")).toBeInTheDocument();
    // 16時間 = 2日
    expect(screen.getByText("2日")).toBeInTheDocument();
    // 24時間 = 3日
    expect(screen.getByText("3日")).toBeInTheDocument();
  });

  it("タスクの展開/折りたたみが動作する", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    // 初期状態では子タスクが表示されている
    expect(screen.getByText("要件定義")).toBeVisible();

    // 展開/折りたたみボタンをクリック
    const expandButton = screen.getByLabelText("折りたたむ プロジェクト計画");
    fireEvent.click(expandButton);

    // 子タスクが非表示になる
    expect(screen.queryByText("要件定義")).not.toBeInTheDocument();

    // 再度クリックして展開
    const collapseButton = screen.getByLabelText("展開する プロジェクト計画");
    fireEvent.click(collapseButton);

    // 子タスクが再表示される
    expect(screen.getByText("要件定義")).toBeVisible();
  });

  it("タスクをクリックするとコールバックが呼ばれる", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    fireEvent.click(screen.getByText("プロジェクト計画"));
    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("統計情報が正しく表示される", () => {
    render(
      <WBSTreeEnhanced
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
      />
    );

    // 統計情報のテキストが存在することを確認
    expect(screen.getByText("総タスク数:")).toBeInTheDocument();
    expect(screen.getByText("完了:")).toBeInTheDocument();
    expect(screen.getByText("進行中:")).toBeInTheDocument();
    
    // 統計情報の数値を確認（親要素内のテキストとして）
    const statsContainer = screen.getByText("総タスク数:").closest(".flex");
    expect(statsContainer?.textContent).toContain("3"); // 総タスク数
  });

  it("空のタスクリストの場合、適切なメッセージが表示される", () => {
    render(
      <WBSTreeEnhanced
        tasks={[]}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    expect(screen.getByText("新しいタスクを作成してください")).toBeInTheDocument();
  });
});