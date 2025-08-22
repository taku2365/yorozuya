"use client";

import { useState, useMemo } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  Calendar, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  CircleDot
} from "lucide-react";
import type { WBSTask } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";

interface WBSTreeEnhancedProps {
  tasks: WBSTask[];
  onTaskClick: (task: WBSTask) => void;
  showTaskNumbers?: boolean;
  colorByStatus?: boolean;
}

interface WBSTreeItemProps {
  task: WBSTask;
  level: number;
  taskNumber: string;
  onTaskClick: (task: WBSTask) => void;
  showTaskNumbers: boolean;
  colorByStatus: boolean;
}

// タスクステータスの定義
type TaskStatus = "not_started" | "in_progress" | "working" | "completed";

function getTaskStatus(task: WBSTask): TaskStatus {
  if (task.progress === 0) return "not_started";
  if (task.progress === 100) return "completed";
  if (task.progress >= 50) return "working";
  return "in_progress";
}

// ステータスに応じた色とアイコンの定義
const statusConfig = {
  not_started: {
    icon: Circle,
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    label: "未着手",
    badge: "default"
  },
  in_progress: {
    icon: CircleDot,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "進行中",
    badge: "secondary"
  },
  working: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    label: "作業中",
    badge: "outline"
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "完了",
    badge: "default"
  }
} as const;

// レベルに応じたインデント幅
const getIndentWidth = (level: number) => {
  return `${level * 24}px`;
};

// タスクの期限状態を取得
function getDeadlineStatus(task: WBSTask) {
  if (!task.due_date) return null;
  
  const today = new Date();
  const dueDate = new Date(task.due_date);
  const daysUntilDue = differenceInDays(dueDate, today);
  
  if (daysUntilDue < 0 && task.progress < 100) {
    return { type: "overdue", days: Math.abs(daysUntilDue) };
  }
  if (daysUntilDue <= 3 && task.progress < 100) {
    return { type: "urgent", days: daysUntilDue };
  }
  return { type: "normal", days: daysUntilDue };
}

function WBSTreeItem({ 
  task, 
  level, 
  taskNumber,
  onTaskClick,
  showTaskNumbers,
  colorByStatus
}: WBSTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = task.children && task.children.length > 0;
  const status = getTaskStatus(task);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const deadlineStatus = getDeadlineStatus(task);
  
  // 作業日数の計算（見積もり時間から）
  const workDays = task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : null;

  return (
    <div>
      <div
        className={cn(
          "group relative flex items-center gap-2 p-3 rounded-lg transition-all duration-200",
          "hover:shadow-md",
          colorByStatus && config.bgColor,
          colorByStatus && config.borderColor,
          "border",
          !colorByStatus && "hover:bg-gray-50 border-gray-200"
        )}
        style={{ marginLeft: getIndentWidth(level) }}
      >
        {/* 展開/折りたたみボタン */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={`${isExpanded ? "折りたたむ" : "展開する"} ${task.title}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-6 shrink-0" />}

        {/* ステータスアイコン */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <StatusIcon className={cn("h-5 w-5 shrink-0", config.color)} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{config.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* メインコンテンツ */}
        <div
          className="flex-1 flex items-center gap-4 cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {showTaskNumbers && (
                <span className="font-mono text-sm text-gray-500">
                  {taskNumber}
                </span>
              )}
              <h3 className="font-medium truncate">{task.title}</h3>
              {workDays && (
                <Badge variant="outline" className="text-xs">
                  {workDays}日
                </Badge>
              )}
            </div>
            
            {/* 担当者とレビュー者 */}
            <div className="flex items-center gap-4 mt-1">
              {task.assignee && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span>担当: {task.assignee}</span>
                </div>
              )}
              {task.reviewer && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span>レビュー: {task.reviewer}</span>
                </div>
              )}
            </div>
          </div>

          {/* 期限表示 */}
          {task.due_date && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              deadlineStatus?.type === "overdue" && "text-red-600 font-medium",
              deadlineStatus?.type === "urgent" && "text-orange-600 font-medium",
              deadlineStatus?.type === "normal" && "text-gray-600"
            )}>
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(task.due_date), "MM/dd", { locale: ja })}
                {deadlineStatus?.type === "overdue" && ` (${deadlineStatus.days}日超過)`}
                {deadlineStatus?.type === "urgent" && ` (残${deadlineStatus.days}日)`}
              </span>
            </div>
          )}

          {/* 実績/見積もり時間 */}
          {(task.estimated_hours || task.actual_hours) && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              <span>
                {task.actual_hours && `${task.actual_hours}h`}
                {task.estimated_hours && task.actual_hours && " / "}
                {task.estimated_hours && `${task.estimated_hours}h`}
              </span>
            </div>
          )}

          {/* 進捗表示 */}
          <div className="flex items-center gap-2 w-40">
            <Progress 
              value={task.progress} 
              className={cn(
                "h-2",
                task.progress === 100 && "bg-green-100"
              )}
            />
            <span className="text-sm font-medium w-12 text-right">
              {task.progress}%
            </span>
          </div>
        </div>

        {/* 依存関係インジケーター */}
        {task.dependencies && task.dependencies.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs">
                  依存: {task.dependencies.length}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>このタスクは{task.dependencies.length}個のタスクに依存しています</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 子タスク */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {task.children!.map((child, index) => (
            <WBSTreeItem
              key={child.id}
              task={child}
              level={level + 1}
              taskNumber={`${taskNumber}.${index + 1}`}
              onTaskClick={onTaskClick}
              showTaskNumbers={showTaskNumbers}
              colorByStatus={colorByStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WBSTreeEnhanced({ 
  tasks, 
  onTaskClick,
  showTaskNumbers = true,
  colorByStatus = true
}: WBSTreeEnhancedProps) {
  // 統計情報の計算
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    
    const countTasks = (taskList: WBSTask[]) => {
      taskList.forEach(task => {
        total++;
        const status = getTaskStatus(task);
        if (status === "completed") completed++;
        else if (status === "in_progress" || status === "working") inProgress++;
        else notStarted++;
        
        if (task.children) {
          countTasks(task.children);
        }
      });
    };
    
    countTasks(tasks);
    
    return { total, completed, inProgress, notStarted };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>タスクがありません</p>
        <p className="text-sm mt-2">新しいタスクを作成してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 統計情報 */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm">
          <span className="text-gray-600">総タスク数:</span>
          <span className="font-medium ml-1">{stats.total}</span>
        </div>
        <div className="text-sm">
          <span className="text-green-600">完了:</span>
          <span className="font-medium ml-1">{stats.completed}</span>
        </div>
        <div className="text-sm">
          <span className="text-blue-600">進行中:</span>
          <span className="font-medium ml-1">{stats.inProgress}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-600">未着手:</span>
          <span className="font-medium ml-1">{stats.notStarted}</span>
        </div>
      </div>

      {/* タスクツリー */}
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <WBSTreeItem
            key={task.id}
            task={task}
            level={0}
            taskNumber={`${index + 1}`}
            onTaskClick={onTaskClick}
            showTaskNumbers={showTaskNumbers}
            colorByStatus={colorByStatus}
          />
        ))}
      </div>
    </div>
  );
}