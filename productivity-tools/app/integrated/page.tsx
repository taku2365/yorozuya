"use client"

import React from 'react';
import { IntegratedLayout } from '@/components/integrated/integrated-layout';
import { UnifiedFilter } from '@/components/integrated/unified-filter';
import { GlobalSearch } from '@/components/integrated/global-search';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { 
  UnifiedTask, 
  UnifiedTaskFilter, 
  ViewType,
  TaskStatus,
  TaskPriority
} from '@/lib/types/unified';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TodoPage } from '@/components/todo/todo-page';
import { WBSIntegrated } from '@/components/wbs/wbs-integrated';
import { KanbanIntegrated } from '@/components/kanban/kanban-integrated';
import { GanttIntegrated } from '@/components/gantt/gantt-integrated';
import { useTodoStore } from '@/lib/stores/todo-store';
import { useWBSStore } from '@/lib/stores/wbs-store';
import { useKanbanStore } from '@/lib/stores/kanban-store';
import { useGanttStore } from '@/lib/stores/gantt-store';

export default function IntegratedPage() {
  const [currentView, setCurrentView] = React.useState<ViewType>('todo');
  const [filter, setFilter] = React.useState<UnifiedTaskFilter>({});
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const { toast } = useToast();

  // 各ストアからタスク数を取得
  const { todos = [] } = useTodoStore();
  const { tasks: wbsTasks = [] } = useWBSStore();
  const { lanes = [] } = useKanbanStore();
  const { tasks: ganttTasks = [] } = useGanttStore();

  // タスクカウントの計算
  const taskCounts = React.useMemo(() => {
    // カンバンのタスク数を計算
    const kanbanTaskCount = lanes?.reduce((total, lane) => total + (lane.cards?.length || 0), 0) || 0;
    
    return {
      todo: todos.length,
      wbs: wbsTasks.length,
      kanban: kanbanTaskCount,
      gantt: ganttTasks.length
    };
  }, [todos, wbsTasks, lanes, ganttTasks]);

  // 検索用の統合タスクリストを作成
  const getAllTasks = React.useCallback((): UnifiedTask[] => {
    const allTasks: UnifiedTask[] = [];
    
    // TodoタスクをUnifiedTaskに変換
    todos?.forEach(todo => {
      allTasks.push({
        id: todo.id,
        title: todo.title,
        description: todo.description || undefined,
        status: todo.completed ? 'completed' : 'in_progress',
        priority: todo.priority as TaskPriority,
        progress: todo.completed ? 100 : 0,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt),
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
        sourceType: 'todo',
        sourceId: todo.id,
        order: 0,
        hierarchyLevel: 0,
        tags: todo.tags || [],
        labels: [],
        metadata: { originalTodo: todo }
      });
    });
    
    // WBSタスクをUnifiedTaskに変換
    wbsTasks?.forEach(task => {
      allTasks.push({
        id: task.id,
        title: task.name,
        description: task.description || undefined,
        status: task.progress === 100 ? 'completed' : task.progress > 0 ? 'in_progress' : 'not_started',
        priority: 'medium' as TaskPriority,
        progress: task.progress,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        startDate: task.startDate ? new Date(task.startDate) : undefined,
        endDate: task.endDate ? new Date(task.endDate) : undefined,
        parentId: task.parentId || undefined,
        assigneeId: task.assignee || undefined,
        sourceType: 'wbs',
        sourceId: task.id,
        order: task.order,
        hierarchyLevel: task.level,
        tags: [],
        labels: [],
        metadata: { originalWBS: task }
      });
    });
    
    // カンバンカードをUnifiedTaskに変換
    lanes?.forEach(lane => {
      lane.cards?.forEach(card => {
        allTasks.push({
          id: card.id,
          title: card.title,
          description: card.description || undefined,
          status: lane.id === 'done' ? 'completed' : lane.id === 'in-progress' ? 'in_progress' : 'not_started',
          priority: card.priority as TaskPriority || 'medium',
          progress: lane.id === 'done' ? 100 : lane.id === 'in-progress' ? 50 : 0,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
          dueDate: card.dueDate ? new Date(card.dueDate) : undefined,
          assigneeId: card.assignee || undefined,
          sourceType: 'kanban',
          sourceId: card.id,
          order: card.order,
          hierarchyLevel: 0,
          tags: card.tags || [],
          labels: card.labels || [],
          metadata: { originalCard: card, laneId: lane.id }
        });
      });
    });
    
    // ガントタスクをUnifiedTaskに変換
    ganttTasks?.forEach(task => {
      allTasks.push({
        id: task.id,
        title: task.name,
        description: undefined,
        status: task.progress === 100 ? 'completed' : task.progress > 0 ? 'in_progress' : 'not_started',
        priority: 'medium' as TaskPriority,
        progress: task.progress,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        assigneeId: task.assignee || undefined,
        sourceType: 'gantt',
        sourceId: task.id,
        order: 0,
        hierarchyLevel: 0,
        tags: [],
        labels: [],
        metadata: { originalGantt: task }
      });
    });
    
    return allTasks;
  }, [todos, wbsTasks, lanes, ganttTasks]);

  // 検索ハンドラー
  const handleSearch = async (query: string): Promise<UnifiedTask[]> => {
    const allTasks = getAllTasks();
    const lowerQuery = query.toLowerCase();
    
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  // タスク選択ハンドラー
  const handleTaskSelect = (task: UnifiedTask) => {
    setCurrentView(task.sourceType);
    toast({
      title: 'タスクを選択しました',
      description: `${task.title} (${task.sourceType.toUpperCase()})`,
    });
  };

  // 各ビューのコンポーネントを動的に表示
  const renderViewContent = () => {
    switch (currentView) {
      case 'todo':
        return <TodoPage />;
      case 'wbs':
        return <WBSIntegrated />;
      case 'kanban':
        return <KanbanIntegrated />;
      case 'gantt':
        return <GanttIntegrated />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 統合レイアウト */}
      <IntegratedLayout
        defaultView={currentView}
        onViewChange={setCurrentView}
        showTaskCount
        taskCounts={taskCounts}
        headerContent={
          <div className="flex items-center gap-4">
            {/* グローバル検索 */}
            <div className="w-96">
              <GlobalSearch
                isOpen={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                onSearch={handleSearch}
                onTaskSelect={handleTaskSelect}
              />
            </div>
            
            {/* フィルターボタン */}
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="gap-2"
            >
              フィルター
              {Object.keys(filter).length > 0 && (
                <span className="h-2 w-2 bg-primary rounded-full" />
              )}
            </Button>
          </div>
        }
      >

        {/* ビューコンテンツ */}
        <div className={`flex-1 ${currentView === 'gantt' ? 'overflow-visible' : 'overflow-hidden'}`}>
          {renderViewContent()}
        </div>
      </IntegratedLayout>

      {/* フィルターサイドバー */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>フィルター設定</SheetTitle>
          </SheetHeader>
          <UnifiedFilter
            filter={filter}
            onFilterChange={setFilter}
            onReset={() => setFilter({})}
          />
        </SheetContent>
      </Sheet>

      <Toaster />
    </div>
  );
}