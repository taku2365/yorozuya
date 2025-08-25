"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  Tag,
  Users,
  CalendarDays,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface TagInfo {
  name: string;
  count: number;
  color: string;
}

interface Member {
  id: string;
  name: string;
  avatar?: string;
  taskCount: number;
}

interface IntegratedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  
  // プロジェクト
  projects?: Project[];
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
  
  // タグ
  tags?: TagInfo[];
  selectedTags?: string[];
  onTagSelect?: (tag: string) => void;
  
  // メンバー
  members?: Member[];
  selectedMemberIds?: string[];
  onMemberSelect?: (memberId: string) => void;
  
  // カレンダー
  selectedDate?: Date;
  onDateSelect?: (date: Date | undefined) => void;
}

export function IntegratedSidebar({
  isOpen,
  onClose,
  isMobile = false,
  projects = [],
  selectedProjectId,
  onProjectSelect,
  tags = [],
  selectedTags = [],
  onTagSelect,
  members = [],
  selectedMemberIds = [],
  onMemberSelect,
  selectedDate,
  onDateSelect,
}: IntegratedSidebarProps) {
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  const sidebarContent = (
    <div
      data-testid="integrated-sidebar"
      className={cn(
        "flex h-full flex-col bg-background border-r",
        isMobile ? "fixed inset-y-0 left-0 z-50 w-80" : "relative w-80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">フィルター</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="サイドバーを閉じる"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Projects Section */}
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <h3 className="font-medium">プロジェクト</h3>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  data-testid="toggle-projects"
                >
                  {projectsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-3 space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  data-testid={`project-${project.id}`}
                  onClick={() => onProjectSelect?.(project.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors",
                    selectedProjectId === project.id && "bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      `bg-${project.color}-500`
                    )}
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-left">{project.name}</span>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Tags Section */}
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <h3 className="font-medium">タグ</h3>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {tagsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.name}
                  data-testid={`tag-${tag.name}`}
                  variant="secondary"
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag.name) && "ring-2 ring-primary"
                  )}
                  onClick={() => onTagSelect?.(tag.name)}
                  style={{ borderColor: tag.color }}
                >
                  {tag.name}
                  <span className="ml-1 text-xs opacity-70">{tag.count}</span>
                </Badge>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Members Section */}
          <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h3 className="font-medium">メンバー</h3>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {membersOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-3 space-y-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  data-testid={`member-${member.id}`}
                  onClick={() => onMemberSelect?.(member.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-1.5 rounded-md",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors",
                    selectedMemberIds.includes(member.id) && "bg-accent"
                  )}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.taskCount} タスク
                    </div>
                  </div>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Calendar Section */}
          <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <h3 className="font-medium">カレンダー</h3>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {calendarOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-3">
              <div data-testid="sidebar-calendar">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateSelect}
                  className="rounded-md border"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        {sidebarContent}
      </>
    );
  }

  return sidebarContent;
}