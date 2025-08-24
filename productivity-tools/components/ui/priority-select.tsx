"use client"

import { ChevronDown, Flag } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type Priority = "low" | "medium" | "high"

export interface PrioritySelectProps {
  value?: Priority
  onValueChange: (value: Priority) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const priorityConfig = {
  high: {
    label: "高",
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-800",
    icon: "🔴",
  },
  medium: {
    label: "中",
    color: "text-yellow-600", 
    bgColor: "bg-yellow-100 text-yellow-800",
    icon: "🟡",
  },
  low: {
    label: "低",
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-800",
    icon: "🟢",
  },
}

export function PrioritySelect({
  value,
  onValueChange,
  placeholder = "優先度を選択",
  className,
  disabled,
}: PrioritySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {value && (
            <div className="flex items-center gap-2">
              <span>{priorityConfig[value].icon}</span>
              <span>{priorityConfig[value].label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="high">
          <div className="flex items-center gap-2">
            <span>{priorityConfig.high.icon}</span>
            <span>高優先度</span>
          </div>
        </SelectItem>
        <SelectItem value="medium">
          <div className="flex items-center gap-2">
            <span>{priorityConfig.medium.icon}</span>
            <span>中優先度</span>
          </div>
        </SelectItem>
        <SelectItem value="low">
          <div className="flex items-center gap-2">
            <span>{priorityConfig.low.icon}</span>
            <span>低優先度</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const config = priorityConfig[priority]
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(config.bgColor, "font-medium", className)}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}