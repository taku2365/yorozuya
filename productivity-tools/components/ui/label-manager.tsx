"use client"

import * as React from "react"
import { X, Plus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface Label {
  id: string
  name: string
  color: string
}

export interface LabelManagerProps {
  labels: Label[]
  selectedLabels: string[]
  onLabelsChange: (labelIds: string[]) => void
  onCreateLabel?: (name: string, color: string) => void
  onDeleteLabel?: (labelId: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  maxLabels?: number
}

const DEFAULT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
]

export function LabelManager({
  labels,
  selectedLabels,
  onLabelsChange,
  onCreateLabel,
  onDeleteLabel,
  className,
  placeholder = "ラベルを選択",
  disabled,
  maxLabels,
}: LabelManagerProps) {
  const [open, setOpen] = React.useState(false)
  const [newLabelName, setNewLabelName] = React.useState("")
  const [newLabelColor, setNewLabelColor] = React.useState(DEFAULT_COLORS[0])

  const selectedLabelObjects = labels.filter((label) =>
    selectedLabels.includes(label.id)
  )

  const handleLabelToggle = (labelId: string) => {
    if (selectedLabels.includes(labelId)) {
      onLabelsChange(selectedLabels.filter((id) => id !== labelId))
    } else {
      if (maxLabels && selectedLabels.length >= maxLabels) {
        return
      }
      onLabelsChange([...selectedLabels, labelId])
    }
  }

  const handleCreateLabel = () => {
    if (newLabelName.trim() && onCreateLabel) {
      onCreateLabel(newLabelName.trim(), newLabelColor)
      setNewLabelName("")
      setNewLabelColor(DEFAULT_COLORS[0])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateLabel()
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start min-h-10 h-auto py-2"
            disabled={disabled}
          >
            {selectedLabelObjects.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedLabelObjects.map((label) => (
                  <LabelBadge
                    key={label.id}
                    label={label}
                    removable
                    onRemove={(e) => {
                      e.stopPropagation()
                      handleLabelToggle(label.id)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>{placeholder}</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-3">
            <div className="text-sm font-medium">ラベルを選択</div>
            
            <div className="space-y-2">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleLabelToggle(label.id)}
                >
                  <LabelBadge label={label} />
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedLabels.includes(label.id)}
                      onChange={() => handleLabelToggle(label.id)}
                      className="rounded"
                    />
                    {onDeleteLabel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteLabel(label.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {onCreateLabel && (
              <>
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2">新しいラベルを作成</div>
                  <div className="space-y-2">
                    <Input
                      placeholder="ラベル名"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">色:</span>
                      <div className="flex gap-1">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            className={cn(
                              "w-6 h-6 rounded-full border-2",
                              newLabelColor === color
                                ? "border-foreground"
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewLabelColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCreateLabel}
                      disabled={!newLabelName.trim()}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      作成
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export interface LabelBadgeProps {
  label: Label
  removable?: boolean
  onRemove?: (e: React.MouseEvent) => void
  className?: string
}

export function LabelBadge({
  label,
  removable,
  onRemove,
  className,
}: LabelBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "px-2 py-1 text-xs font-medium border",
        removable && "pr-1",
        className
      )}
      style={{
        backgroundColor: `${label.color}20`,
        borderColor: label.color,
        color: label.color,
      }}
    >
      <span>{label.name}</span>
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}