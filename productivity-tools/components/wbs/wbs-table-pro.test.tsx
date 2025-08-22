import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WBSTablePro } from "./wbs-table-pro";
import type { WBSTask } from "@/lib/db/types";

describe("WBSTablePro", () => {
  const mockTasks: WBSTask[] = [
    {
      id: "1",
      title: "プロジェクト全体",
      hierarchy_number: "1",
      position: 0,
      progress: 31,
      assignee: "プロジェクトマネージャー",
      start_date: "2024-07-01",
      end_date: "2024-12-31",
      work_days: 120,
      remarks: "全体の概要",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      children: [
        {
          id: "2",
          title: "企画立案",
          parent_id: "1",
          hierarchy_number: "1.1",
          position: 0,
          progress: 100,
          assignee: "チームA",
          start_date: "2024-07-01",
          end_date: "2024-07-15",
          work_days: 10,
          remarks: "初期計画の作成",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
    },
  ];

  const mockOnTaskClick = vi.fn();
  const mockOnInsertTask = vi.fn();
  const mockOnUpdateTask = vi.fn();

  it("should render table headers correctly", () => {
    render(
      <WBSTablePro
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        onInsertTask={mockOnInsertTask}
        onUpdateTask={mockOnUpdateTask}
      />
    );

    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getByText("タスク名")).toBeInTheDocument();
    expect(screen.getByText("担当者")).toBeInTheDocument();
    expect(screen.getByText("開始日")).toBeInTheDocument();
    expect(screen.getByText("終了日")).toBeInTheDocument();
    expect(screen.getByText("工数")).toBeInTheDocument();
    expect(screen.getByText("進捗率")).toBeInTheDocument();
    expect(screen.getByText("備考")).toBeInTheDocument();
  });

  it("should render task data correctly", () => {
    render(
      <WBSTablePro
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        onInsertTask={mockOnInsertTask}
        onUpdateTask={mockOnUpdateTask}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("プロジェクト全体")).toBeInTheDocument();
    expect(screen.getByText("プロジェクトマネージャー")).toBeInTheDocument();
    expect(screen.getAllByText("2024-07-01")[0]).toBeInTheDocument();
    expect(screen.getByText("2024-12-31")).toBeInTheDocument();
    expect(screen.getByText("120日")).toBeInTheDocument();
    expect(screen.getByText("31%")).toBeInTheDocument();
    expect(screen.getByText("全体の概要")).toBeInTheDocument();
  });

  it("should render child tasks with proper indentation", () => {
    render(
      <WBSTablePro
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        onInsertTask={mockOnInsertTask}
        onUpdateTask={mockOnUpdateTask}
      />
    );

    expect(screen.getByText("1.1")).toBeInTheDocument();
    expect(screen.getByText("企画立案")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should call onTaskClick when task row is clicked", () => {
    render(
      <WBSTablePro
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        onInsertTask={mockOnInsertTask}
        onUpdateTask={mockOnUpdateTask}
      />
    );

    const taskRow = screen.getByText("プロジェクト全体").closest("tr");
    fireEvent.click(taskRow!);

    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("should show insert button on hover", () => {
    render(
      <WBSTablePro
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        onInsertTask={mockOnInsertTask}
        onUpdateTask={mockOnUpdateTask}
      />
    );

    const taskRow = screen.getByText("プロジェクト全体").closest("tr");
    fireEvent.mouseEnter(taskRow!);

    expect(screen.getByTitle("タスクを挿入")).toBeInTheDocument();
  });

  it("should call onInsertTask when insert button is clicked", () => {
    render(
      <WBSTablePro
        tasks={mockTasks}
        onTaskClick={mockOnTaskClick}
        onInsertTask={mockOnInsertTask}
        onUpdateTask={mockOnUpdateTask}
      />
    );

    const taskRow = screen.getByText("プロジェクト全体").closest("tr");
    fireEvent.mouseEnter(taskRow!);

    const insertButton = screen.getByTitle("タスクを挿入");
    fireEvent.click(insertButton);

    expect(mockOnInsertTask).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("should display progress with color coding", () => {
    const tasksWithVariousProgress: WBSTask[] = [
      {
        id: "1",
        title: "未着手",
        hierarchy_number: "1",
        position: 0,
        progress: 0,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        title: "進行中",
        hierarchy_number: "2",
        position: 1,
        progress: 50,
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        title: "完了",
        hierarchy_number: "3",
        position: 2,
        progress: 100,
        created_at: "",
        updated_at: "",
      },
    ];

    render(
      <WBSTablePro
        tasks={tasksWithVariousProgress}
        onTaskClick={mockOnTaskClick}
        onInsertTask={mockOnInsertTask}
        onUpdateTask={mockOnUpdateTask}
      />
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});