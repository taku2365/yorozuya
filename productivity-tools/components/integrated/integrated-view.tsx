"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrossViewDndProvider } from '@/components/shared/cross-view-dnd-provider';
import { DroppableView } from '@/components/shared/droppable-view';
import { useViewStore } from '@/stores/view-store';
import { useFilterStore } from '@/stores/filter-store';
import { useUnifiedTaskStore } from '@/stores/unified-task-store';
import { IntegratedSidebar } from './integrated-sidebar';
import { TodoList } from '@/components/todo/todo-list';
import { WBSTree } from '@/components/wbs/wbs-tree';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { Button } from '@/components/ui/button';
import { Filter, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function IntegratedView() {
  const { currentView, setView, isSidebarOpen, toggleSidebar } = useViewStore();
  const { hasActiveFilters } = useFilterStore();
  const { tasks } = useUnifiedTaskStore();
  
  const [filterOpen, setFilterOpen] = useState(false);

  const handleViewChange = (view: string) => {
    setView(view as any);
  };

  return (
    <CrossViewDndProvider>
      <div className="flex h-screen bg-background">
        {/* サイドバー */}
        <IntegratedSidebar
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
          isMobile={false}
        />

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ヘッダー */}
          <header className="border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <h1 className="text-xl font-semibold">統合スケジュール管理</h1>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {tasks.length} タスク
                </span>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="text-xs">
                    フィルタ適用中
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                hasActiveFilters() && 'border-primary text-primary'
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              フィルタ
            </Button>
          </header>

          {/* ビュータブ */}
          <Tabs value={currentView} onValueChange={handleViewChange} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b h-12 px-4">
              <DroppableView id="todo-tab" view="todo">
                <TabsTrigger value="todo" className="data-[state=active]:bg-background">
                  ToDo
                </TabsTrigger>
              </DroppableView>
              
              <DroppableView id="wbs-tab" view="wbs">
                <TabsTrigger value="wbs" className="data-[state=active]:bg-background">
                  WBS
                </TabsTrigger>
              </DroppableView>
              
              <DroppableView id="kanban-tab" view="kanban" data={{ laneId: 'todo' }}>
                <TabsTrigger value="kanban" className="data-[state=active]:bg-background">
                  カンバン
                </TabsTrigger>
              </DroppableView>
              
              <DroppableView id="gantt-tab" view="gantt">
                <TabsTrigger value="gantt" className="data-[state=active]:bg-background">
                  ガント
                </TabsTrigger>
              </DroppableView>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="todo" className="h-full m-0">
                <TodoList />
              </TabsContent>
              
              <TabsContent value="wbs" className="h-full m-0">
                <WBSTree />
              </TabsContent>
              
              <TabsContent value="kanban" className="h-full m-0">
                <KanbanBoard />
              </TabsContent>
              
              <TabsContent value="gantt" className="h-full m-0">
                <GanttChart />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </CrossViewDndProvider>
  );
}