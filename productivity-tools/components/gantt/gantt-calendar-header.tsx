"use client";

import React from 'react';
import { GanttViewMode } from '@/lib/types/gantt';
import { cn } from '@/lib/utils';

interface GanttCalendarHeaderProps {
  startDate: Date;
  endDate: Date;
  viewMode: GanttViewMode;
}

export function GanttCalendarHeader({
  startDate,
  endDate,
  viewMode,
}: GanttCalendarHeaderProps) {
  const getDaysInRange = () => {
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getWeeksInRange = () => {
    const weeks: Array<{ start: Date; end: Date; weekNumber: number }> = [];
    const current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay()); // 週の始まりに調整

    while (current <= endDate) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeks.push({
        start: weekStart,
        end: weekEnd,
        weekNumber: getWeekNumber(weekStart),
      });
      
      current.setDate(current.getDate() + 7);
    }
    
    return weeks;
  };

  const getMonthsInRange = () => {
    const months: Array<{ year: number; month: number; name: string }> = [];
    const current = new Date(startDate);
    current.setDate(1);

    while (current <= endDate) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        name: current.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  const getQuartersInRange = () => {
    const quarters: Array<{ year: number; quarter: number }> = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const quarter = Math.floor(current.getMonth() / 3) + 1;
      const existing = quarters.find(q => q.year === current.getFullYear() && q.quarter === quarter);
      
      if (!existing) {
        quarters.push({
          year: current.getFullYear(),
          quarter,
        });
      }
      
      current.setMonth(current.getMonth() + 3);
    }
    
    return quarters;
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil((dayOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getDayOfWeekName = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  const renderDayView = () => {
    const days = getDaysInRange();
    const months = getMonthsInRange();

    return (
      <>
        {/* 月行 */}
        <div className="flex h-8 border-b border-gray-200">
          {months.map((month, index) => {
            const monthDays = days.filter(d => 
              d.getFullYear() === month.year && d.getMonth() === month.month
            );
            
            return (
              <div
                key={`${month.year}-${month.month}`}
                className="flex-shrink-0 border-r border-gray-200 flex items-center justify-center bg-gray-50"
                style={{ width: `${monthDays.length * 40}px` }}
              >
                <span className="text-sm font-medium">{month.name}</span>
              </div>
            );
          })}
        </div>
        
        {/* 日付行 */}
        <div className="flex h-8 border-b border-gray-200">
          {days.map((day, index) => (
            <div
              key={index}
              className={cn(
                "flex-shrink-0 w-10 border-r border-gray-100 flex flex-col items-center justify-center text-xs",
                day.getDay() === 0 && "bg-red-50",
                day.getDay() === 6 && "bg-blue-50"
              )}
            >
              <span>{day.getDate()}</span>
              <span className="text-gray-500">{getDayOfWeekName(day)}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderWeekView = () => {
    const weeks = getWeeksInRange();

    return (
      <div className="flex h-8 border-b border-gray-200">
        {weeks.map((week, index) => (
          <div
            key={index}
            className="flex-shrink-0 border-r border-gray-200 flex items-center justify-center bg-gray-50"
            style={{ width: '120px' }}
          >
            <span className="text-sm">第{week.weekNumber}週</span>
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const months = getMonthsInRange();

    return (
      <div className="flex h-8 border-b border-gray-200">
        {months.map((month, index) => (
          <div
            key={`${month.year}-${month.month}`}
            className="flex-shrink-0 border-r border-gray-200 flex items-center justify-center bg-gray-50"
            style={{ width: '200px' }}
          >
            <span className="text-sm font-medium">{month.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderQuarterView = () => {
    const quarters = getQuartersInRange();

    return (
      <div className="flex h-8 border-b border-gray-200">
        {quarters.map((quarter, index) => (
          <div
            key={`${quarter.year}-${quarter.quarter}`}
            className="flex-shrink-0 border-r border-gray-200 flex items-center justify-center bg-gray-50"
            style={{ width: '300px' }}
          >
            <span className="text-sm font-medium">Q{quarter.quarter} {quarter.year}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div data-testid="gantt-calendar-header" className="bg-white sticky top-0 z-10">
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'quarter' && renderQuarterView()}
    </div>
  );
}