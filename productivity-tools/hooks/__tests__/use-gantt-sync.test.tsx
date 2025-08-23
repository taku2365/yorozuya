import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGanttSync } from '../use-gantt-sync';
import type { GanttTask } from '@/lib/types/gantt';

// WebSocket モック
class MockWebSocket {
  url: string;
  readyState: number = 0; // CONNECTING
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('useGanttSync', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    global.WebSocket = vi.fn((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    });
  });

  describe('WebSocket接続', () => {
    it('コンポーネントマウント時にWebSocket接続を確立する', async () => {
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://localhost:3001/gantt/project1')
      );
    });

    it('アンマウント時にWebSocket接続を切断する', async () => {
      const { result, unmount } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const closeSpy = vi.spyOn(mockWebSocket, 'close');
      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('接続エラー時に再接続を試みる', async () => {
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
        reconnectDelay: 100,
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      // エラーをシミュレート
      act(() => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror(new Event('error'));
        }
      });

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toBe('接続エラーが発生しました');

      // 再接続を待つ
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('メッセージ受信', () => {
    it('タスク更新メッセージを処理する', async () => {
      const onTaskUpdate = vi.fn();
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate,
        onDependencyUpdate: vi.fn(),
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const updatedTask: GanttTask = {
        id: 'task1',
        title: '更新されたタスク',
        startDate: new Date(),
        endDate: new Date(),
        progress: 50,
        dependencies: [],
        isCriticalPath: false,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'task:update',
              data: updatedTask,
            }),
          }));
        }
      });

      expect(onTaskUpdate).toHaveBeenCalledWith(updatedTask);
    });

    it('依存関係更新メッセージを処理する', async () => {
      const onDependencyUpdate = vi.fn();
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate,
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const updatedDependency = {
        id: 'dep1',
        fromTaskId: 'task1',
        toTaskId: 'task2',
        type: 'finish-to-start',
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'dependency:update',
              data: updatedDependency,
            }),
          }));
        }
      });

      expect(onDependencyUpdate).toHaveBeenCalledWith(updatedDependency);
    });

    it('複数ユーザーの同時編集を通知する', async () => {
      const onUserActivity = vi.fn();
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
        onUserActivity,
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const userActivity = {
        userId: 'user2',
        userName: 'テストユーザー',
        action: 'editing',
        taskId: 'task1',
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'user:activity',
              data: userActivity,
            }),
          }));
        }
      });

      expect(onUserActivity).toHaveBeenCalledWith(userActivity);
      expect(result.current.activeUsers).toContainEqual(
        expect.objectContaining({ userId: 'user2' })
      );
    });
  });

  describe('メッセージ送信', () => {
    it('タスク更新を送信できる', async () => {
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const sendSpy = vi.spyOn(mockWebSocket, 'send');
      const task: GanttTask = {
        id: 'task1',
        title: 'テストタスク',
        startDate: new Date(),
        endDate: new Date(),
        progress: 0,
        dependencies: [],
        isCriticalPath: false,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.sendTaskUpdate(task);
      });

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'task:update',
          data: task,
        })
      );
    });

    it('依存関係更新を送信できる', async () => {
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const sendSpy = vi.spyOn(mockWebSocket, 'send');
      const dependency = {
        id: 'dep1',
        fromTaskId: 'task1',
        toTaskId: 'task2',
        type: 'finish-to-start' as const,
      };

      act(() => {
        result.current.sendDependencyUpdate(dependency);
      });

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'dependency:update',
          data: dependency,
        })
      );
    });

    it('接続が切断されている場合はメッセージを送信しない', async () => {
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
      }));

      // 接続を切断
      act(() => {
        mockWebSocket.close();
      });

      await waitFor(() => {
        expect(result.current.connected).toBe(false);
      });

      const sendSpy = vi.spyOn(mockWebSocket, 'send');
      
      act(() => {
        result.current.sendTaskUpdate({} as GanttTask);
      });

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('楽観的更新とコンフリクト解決', () => {
    it('楽観的更新を適用し、サーバー確認を待つ', async () => {
      const onTaskUpdate = vi.fn();
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate,
        onDependencyUpdate: vi.fn(),
        enableOptimisticUpdates: true,
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const task: GanttTask = {
        id: 'task1',
        title: '楽観的更新タスク',
        startDate: new Date(),
        endDate: new Date(),
        progress: 50,
        dependencies: [],
        isCriticalPath: false,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.sendTaskUpdate(task);
      });

      // 楽観的更新が即座に適用される
      expect(onTaskUpdate).toHaveBeenCalledWith(task);

      // サーバーからの確認メッセージ
      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'task:update:confirmed',
              data: { ...task, version: 2 },
            }),
          }));
        }
      });

      // 確認後の更新
      expect(onTaskUpdate).toHaveBeenCalledTimes(2);
    });

    it('コンフリクトが発生した場合に解決戦略を適用する', async () => {
      const onConflict = vi.fn();
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate: vi.fn(),
        onDependencyUpdate: vi.fn(),
        onConflict,
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const conflict = {
        type: 'task',
        localVersion: { id: 'task1', title: 'ローカル版' },
        serverVersion: { id: 'task1', title: 'サーバー版' },
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'conflict',
              data: conflict,
            }),
          }));
        }
      });

      expect(onConflict).toHaveBeenCalledWith(conflict);
    });
  });

  describe('パフォーマンス最適化', () => {
    it('メッセージをバッチ処理する', async () => {
      const onTaskUpdate = vi.fn();
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate,
        onDependencyUpdate: vi.fn(),
        batchDelay: 50,
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const sendSpy = vi.spyOn(mockWebSocket, 'send');

      // 複数のタスク更新を短時間で送信
      act(() => {
        result.current.sendTaskUpdate({ id: 'task1' } as GanttTask);
        result.current.sendTaskUpdate({ id: 'task2' } as GanttTask);
        result.current.sendTaskUpdate({ id: 'task3' } as GanttTask);
      });

      // バッチ処理を待つ
      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"batch"')
        );
      });
    });

    it('重複メッセージをフィルタリングする', async () => {
      const onTaskUpdate = vi.fn();
      const { result } = renderHook(() => useGanttSync({
        projectId: 'project1',
        onTaskUpdate,
        onDependencyUpdate: vi.fn(),
      }));

      await waitFor(() => {
        expect(result.current.connected).toBe(true);
      });

      const task = {
        id: 'task1',
        title: '重複タスク',
        messageId: 'msg-123',
      };

      // 同じメッセージIDで2回送信
      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'task:update',
              data: task,
              messageId: 'msg-123',
            }),
          }));
          mockWebSocket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'task:update',
              data: task,
              messageId: 'msg-123',
            }),
          }));
        }
      });

      // 1回だけ処理される
      expect(onTaskUpdate).toHaveBeenCalledTimes(1);
    });
  });
});