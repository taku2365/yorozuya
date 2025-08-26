"use client";

import React from 'react';
import { DroppableView } from '@/components/shared/droppable-view';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DroppableGanttTimelineProps {
  date: Date;
  isWeekend: boolean;
  isToday: boolean;
  className?: string;
}

export function DroppableGanttTimeline({
  date,
  isWeekend,
  isToday,
  className,
}: DroppableGanttTimelineProps) {
  return (
    <DroppableView
      id={format(date, 'yyyy-MM-dd')}
      view="gantt"
      data={{
        startDate: date,
        endDate: date,
      }}
      className={cn(
        'h-full border-r',
        isWeekend && 'bg-muted/50',
        isToday && 'bg-primary/10',
        className
      )}
    >
      <div className="h-full w-8" />
    </DroppableView>
  );
}