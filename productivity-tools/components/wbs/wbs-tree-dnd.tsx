"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { WBSTask } from "@/lib/db/types";
import { SortableTaskItem } from "./sortable-task-item";

interface WBSTreeDnDProps {
  tasks: WBSTask[];
  onTaskClick: (task: WBSTask) => void;
  onTaskMove: (taskId: string, newParentId: string | null, newPosition: number) => void;
}

export function WBSTreeDnD({ tasks, onTaskClick, onTaskMove }: WBSTreeDnDProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Simple implementation - just log for now
      console.log(`Moving ${active.id} to position of ${over.id}`);
      // In a real implementation, you would calculate the new parent and position
      // and call onTaskMove
    }

    setActiveId(null);
  };

  const flattenTasks = (tasks: WBSTask[]): WBSTask[] => {
    const result: WBSTask[] = [];
    
    const addTask = (task: WBSTask) => {
      result.push(task);
      if (task.children) {
        task.children.forEach(addTask);
      }
    };
    
    tasks.forEach(addTask);
    return result;
  };

  const allTasks = flattenTasks(tasks);
  const taskIds = allTasks.map(task => task.id);

  const renderTasks = (tasks: WBSTask[], level = 0) => {
    return tasks.map((task) => (
      <div key={task.id}>
        <SortableTaskItem
          task={task}
          level={level}
          onTaskClick={onTaskClick}
        />
        {task.children && task.children.length > 0 && (
          <div>
            {renderTasks(task.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {renderTasks(tasks)}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeId ? (
          <div className="bg-white shadow-lg rounded p-2 opacity-80">
            {allTasks.find(t => t.id === activeId)?.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}