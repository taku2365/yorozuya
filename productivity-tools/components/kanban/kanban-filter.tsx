"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanFilterProps {
  labels: string[];
  selectedLabels: string[];
  onLabelToggle: (label: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function KanbanFilter({
  labels,
  selectedLabels,
  onLabelToggle,
  searchQuery,
  onSearchChange,
}: KanbanFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const clearFilters = () => {
    selectedLabels.forEach((label) => onLabelToggle(label));
    onSearchChange("");
  };

  const hasActiveFilters = selectedLabels.length > 0 || searchQuery !== "";

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="カードを検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            フィルタをクリア
          </Button>
        )}
      </div>

      {labels.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ラベルでフィルタ {isExpanded ? "▼" : "▶"}
          </button>
          {isExpanded && (
            <div className="mt-2 flex flex-wrap gap-2">
              {labels.map((label) => (
                <Badge
                  key={label}
                  variant={selectedLabels.includes(label) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => onLabelToggle(label)}
                >
                  {label}
                  {selectedLabels.includes(label) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}