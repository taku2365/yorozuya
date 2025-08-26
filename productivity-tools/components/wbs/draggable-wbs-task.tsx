"use client";

import React from 'react';
import { DraggableTask } from '@/components/shared/draggable-task';
import { WBSTaskItem } from './wbs-task-item';
import type { WBSTask } from '@/lib/types';

interface DraggableWBSTaskProps {
  task: WBSTask;
  level: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (task: WBSTask) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

export function DraggableWBSTask({
  task,
  level,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: DraggableWBSTaskProps) {
  return (
    <DraggableTask
      id={task.id}
      sourceView="wbs"
      className="cursor-move"
    >
      <WBSTaskItem
        task={task}
        level={level}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddChild={onAddChild}
      />
    </DraggableTask>
  );
}