"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { GanttTask } from '@/lib/types/gantt';

interface GanttTaskDialogProps {
  isOpen: boolean;
  task?: GanttTask;
  onClose: () => void;
  onSubmit: (data: Partial<GanttTask>) => void;
}

export function GanttTaskDialog({ isOpen, task, onClose, onSubmit }: GanttTaskDialogProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [startDate, setStartDate] = useState(
    task?.startDate ? format(task.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(
    task?.endDate ? format(task.endDate, 'yyyy-MM-dd') : format(addDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [progress, setProgress] = useState(task?.progress || 0);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'タスク名は必須です';
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      newErrors.endDate = '終了日は開始日より後である必要があります';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
      progress,
      priority,
      assigneeId: assigneeId || undefined,
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    setProgress(0);
    setPriority('medium');
    setAssigneeId('');
    setErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {task ? 'タスクを編集' : '新規タスク作成'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タスク名 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors({ ...errors, title: '' });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="タスク名を入力"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="タスクの説明を入力"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                終了日
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) {
                    setErrors({ ...errors, endDate: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              優先度
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
              進捗率: {progress}%
            </label>
            <input
              id="progress"
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-1">
              担当者
            </label>
            <input
              id="assigneeId"
              type="text"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="担当者を入力"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              {task ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}