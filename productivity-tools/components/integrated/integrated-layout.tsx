"use client"

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ListTodo, 
  GitBranch, 
  Columns3,
  Calendar,
  Settings,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewType } from '@/lib/types/unified';
import { cn } from '@/lib/utils';

interface IntegratedLayoutProps {
  children?: React.ReactNode;
  defaultView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  className?: string;
  headerContent?: React.ReactNode;
  showTaskCount?: boolean;
  taskCounts?: Record<ViewType, number>;
}

/**
 * 統合レイアウトコンポーネント
 * すべてのビューを統一的に表示・切り替えできる
 */
export function IntegratedLayout({
  children,
  defaultView = 'todo',
  onViewChange,
  className,
  headerContent,
  showTaskCount = false,
  taskCounts = { todo: 0, wbs: 0, kanban: 0, gantt: 0 }
}: IntegratedLayoutProps) {
  const [currentView, setCurrentView] = React.useState<ViewType>(defaultView);

  const handleViewChange = (view: string) => {
    const newView = view as ViewType;
    setCurrentView(newView);
    onViewChange?.(newView);
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* ヘッダー部分 */}
      <div className="border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-2xl font-bold">統合タスク管理</h1>
          
          {/* カスタムヘッダーコンテンツまたはデフォルトのボタン */}
          {headerContent || (
            <div className="flex items-center gap-2">
              {/* 検索ボタン */}
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              
              {/* フィルタボタン */}
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              {/* 設定ボタン */}
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <Tabs 
          value={currentView} 
          onValueChange={handleViewChange}
          className="h-full flex flex-col"
        >
          {/* タブリスト */}
          <div className="border-b px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger 
                value="todo" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ListTodo className="mr-2 h-4 w-4" />
                ToDo
                {showTaskCount && taskCounts.todo > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {taskCounts.todo}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="wbs"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <GitBranch className="mr-2 h-4 w-4" />
                WBS
                {showTaskCount && taskCounts.wbs > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {taskCounts.wbs}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="kanban"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Columns3 className="mr-2 h-4 w-4" />
                カンバン
                {showTaskCount && taskCounts.kanban > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {taskCounts.kanban}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="gantt"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Calendar className="mr-2 h-4 w-4" />
                ガント
                {showTaskCount && taskCounts.gantt > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {taskCounts.gantt}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* タブコンテンツ */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  );
}