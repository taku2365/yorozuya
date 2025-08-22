import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { WBSTimeTracker } from "./wbs-time-tracker";

describe("WBSTimeTracker", () => {
  const mockOnUpdateTime = vi.fn();
  
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnUpdateTime.mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders with task information", () => {
    render(
      <WBSTimeTracker
        taskId="1"
        taskTitle="タスク1"
        actualHours={2.5}
        onUpdateTime={mockOnUpdateTime}
      />
    );
    
    expect(screen.getByText("時間記録")).toBeInTheDocument();
    expect(screen.getByText("- タスク1")).toBeInTheDocument();
    expect(screen.getByText("現在の実績時間: 2.50時間")).toBeInTheDocument();
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
  });

  it("starts and stops timer", async () => {
    render(
      <WBSTimeTracker
        taskId="1"
        taskTitle="タスク1"
        actualHours={0}
        onUpdateTime={mockOnUpdateTime}
      />
    );
    
    const startButton = screen.getByRole("button", { name: "開始" });
    
    // Start timer
    await act(async () => {
      fireEvent.click(startButton);
    });
    
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();
    
    // Advance time by 5 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    
    expect(screen.getByText("00:00:05")).toBeInTheDocument();
    
    // Stop timer
    const stopButton = screen.getByRole("button", { name: "停止" });
    await act(async () => {
      fireEvent.click(stopButton);
    });
    
    expect(mockOnUpdateTime).toHaveBeenCalledWith(5 / 3600); // 5 seconds in hours
  });

  it("resets timer", async () => {
    render(
      <WBSTimeTracker
        taskId="1"
        taskTitle="タスク1"
        actualHours={0}
        onUpdateTime={mockOnUpdateTime}
      />
    );
    
    // Start timer
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "開始" }));
    });
    
    // Advance timer
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    
    expect(screen.getByText("00:00:10")).toBeInTheDocument();
    
    // Stop timer
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "停止" }));
    });
    
    // Reset timer
    const resetButton = screen.getByRole("button", { name: "リセット" });
    await act(async () => {
      fireEvent.click(resetButton);
    });
    
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
  });

  it("disables reset button when timer is running", async () => {
    render(
      <WBSTimeTracker
        taskId="1"
        taskTitle="タスク1"
        actualHours={0}
        onUpdateTime={mockOnUpdateTime}
      />
    );
    
    const resetButton = screen.getByRole("button", { name: "リセット" });
    expect(resetButton).toBeDisabled();
    
    // Start timer
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "開始" }));
    });
    
    // Advance time a bit
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    
    // Reset should still be disabled while running
    expect(resetButton).toBeDisabled();
    
    // Stop timer
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "停止" }));
    });
    
    // After stopping, elapsedSeconds is reset to 0, so reset button is disabled
    expect(resetButton).toBeDisabled();
  });

  it("adds manual time entry", async () => {
    render(
      <WBSTimeTracker
        taskId="1"
        taskTitle="タスク1"
        actualHours={1.5}
        onUpdateTime={mockOnUpdateTime}
      />
    );
    
    const input = screen.getByPlaceholderText("例: 1.5");
    const addButton = screen.getByRole("button", { name: "追加" });
    
    expect(addButton).toBeDisabled();
    
    await act(async () => {
      fireEvent.change(input, { target: { value: "2.25" } });
    });
    expect(addButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      expect(mockOnUpdateTime).toHaveBeenCalledWith(3.75); // 1.5 + 2.25
      expect(input).toHaveValue(null); // Input cleared
    });
  });

  it("validates manual time input", async () => {
    render(
      <WBSTimeTracker
        taskId="1"
        taskTitle="タスク1"
        actualHours={0}
        onUpdateTime={mockOnUpdateTime}
      />
    );
    
    const input = screen.getByPlaceholderText("例: 1.5");
    const addButton = screen.getByRole("button", { name: "追加" });
    
    // Invalid input
    await act(async () => {
      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.click(addButton);
    });
    
    expect(mockOnUpdateTime).not.toHaveBeenCalled();
    
    // Negative input
    await act(async () => {
      fireEvent.change(input, { target: { value: "-5" } });
      fireEvent.click(addButton);
    });
    
    expect(mockOnUpdateTime).not.toHaveBeenCalled();
  });

  it("formats time correctly", async () => {
    render(
      <WBSTimeTracker
        taskId="1"
        taskTitle="タスク1"
        actualHours={0}
        onUpdateTime={mockOnUpdateTime}
      />
    );
    
    // Start timer
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "開始" }));
    });
    
    // Test various time formats
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3661000); // 1 hour, 1 minute, 1 second
    });
    
    await waitFor(() => {
      expect(screen.getByText("01:01:01")).toBeInTheDocument();
    });
  });
});