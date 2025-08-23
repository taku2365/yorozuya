"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GanttTask, GanttDependency } from '@/lib/types/gantt';

interface UseGanttSyncOptions {
  projectId: string;
  onTaskUpdate: (task: GanttTask) => void;
  onDependencyUpdate: (dependency: GanttDependency) => void;
  onUserActivity?: (activity: UserActivity) => void;
  onConflict?: (conflict: Conflict) => void;
  reconnectDelay?: number;
  batchDelay?: number;
  enableOptimisticUpdates?: boolean;
}

interface UserActivity {
  userId: string;
  userName: string;
  action: 'editing' | 'viewing' | 'left';
  taskId?: string;
}

interface Conflict {
  type: 'task' | 'dependency';
  localVersion: any;
  serverVersion: any;
}

interface SyncMessage {
  type: string;
  data: any;
  messageId?: string;
}

export function useGanttSync({
  projectId,
  onTaskUpdate,
  onDependencyUpdate,
  onUserActivity,
  onConflict,
  reconnectDelay = 3000,
  batchDelay = 50,
  enableOptimisticUpdates = false,
}: UseGanttSyncOptions) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<SyncMessage[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      wsRef.current = new WebSocket(`${wsUrl}/gantt/${projectId}`);

      wsRef.current.onopen = () => {
        setConnected(true);
        setError(null);
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: SyncMessage = JSON.parse(event.data);
          
          // Check for duplicate messages
          if (message.messageId && processedMessagesRef.current.has(message.messageId)) {
            return;
          }
          if (message.messageId) {
            processedMessagesRef.current.add(message.messageId);
          }

          handleMessage(message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        setError('接続エラーが発生しました');
        console.error('WebSocket error:', event);
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, reconnectDelay);
        }
      };
    } catch (err) {
      setError('接続の確立に失敗しました');
      console.error('Failed to create WebSocket:', err);
    }
  }, [projectId, reconnectDelay]);

  // Handle incoming messages
  const handleMessage = useCallback((message: SyncMessage) => {
    switch (message.type) {
      case 'task:update':
        onTaskUpdate(message.data);
        break;
      
      case 'task:update:confirmed':
        // Handle optimistic update confirmation
        onTaskUpdate(message.data);
        break;
      
      case 'dependency:update':
        onDependencyUpdate(message.data);
        break;
      
      case 'user:activity':
        if (onUserActivity) {
          onUserActivity(message.data);
        }
        setActiveUsers(prev => {
          const filtered = prev.filter(u => u.userId !== message.data.userId);
          if (message.data.action === 'left') {
            return filtered;
          }
          return [...filtered, message.data];
        });
        break;
      
      case 'conflict':
        if (onConflict) {
          onConflict(message.data);
        }
        break;
      
      case 'batch':
        // Handle batched messages
        if (Array.isArray(message.data)) {
          message.data.forEach((m: SyncMessage) => handleMessage(m));
        }
        break;
    }
  }, [onTaskUpdate, onDependencyUpdate, onUserActivity, onConflict]);

  // Send message with batching
  const sendMessage = useCallback((message: SyncMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    if (batchDelay > 0) {
      messageQueueRef.current.push(message);
      
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      batchTimeoutRef.current = setTimeout(() => {
        if (messageQueueRef.current.length === 1) {
          wsRef.current?.send(JSON.stringify(messageQueueRef.current[0]));
        } else {
          wsRef.current?.send(JSON.stringify({
            type: 'batch',
            data: messageQueueRef.current,
          }));
        }
        messageQueueRef.current = [];
        batchTimeoutRef.current = null;
      }, batchDelay);
    } else {
      wsRef.current.send(JSON.stringify(message));
    }
  }, [batchDelay]);

  // Public methods
  const sendTaskUpdate = useCallback((task: GanttTask) => {
    if (enableOptimisticUpdates) {
      // Apply optimistic update immediately
      onTaskUpdate(task);
    }
    
    sendMessage({
      type: 'task:update',
      data: task,
      messageId: `task-${task.id}-${Date.now()}`,
    });
  }, [sendMessage, enableOptimisticUpdates, onTaskUpdate]);

  const sendDependencyUpdate = useCallback((dependency: GanttDependency) => {
    sendMessage({
      type: 'dependency:update',
      data: dependency,
      messageId: `dep-${dependency.id}-${Date.now()}`,
    });
  }, [sendMessage]);

  // Lifecycle
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    error,
    activeUsers,
    sendTaskUpdate,
    sendDependencyUpdate,
  };
}