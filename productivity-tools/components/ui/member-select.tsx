"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface Member {
  id: string
  name: string
  email?: string
  avatar?: string
  initials?: string
}

export interface MemberSelectProps {
  members: Member[]
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export interface MultiMemberSelectProps {
  members: Member[]
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSelection?: number
}

export function MemberSelect({
  members,
  value,
  onValueChange,
  placeholder = "メンバーを選択",
  className,
  disabled,
}: MemberSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedMember = members.find((member) => member.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedMember ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedMember.avatar} />
                <AvatarFallback className="text-xs">
                  {selectedMember.initials || selectedMember.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedMember.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="メンバーを検索..." />
          <CommandEmpty>メンバーが見つかりません。</CommandEmpty>
          <CommandGroup>
            <CommandItem
              value=""
              onSelect={() => {
                onValueChange(undefined)
                setOpen(false)
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>未設定</span>
              </div>
            </CommandItem>
            {members.map((member) => (
              <CommandItem
                key={member.id}
                value={member.name}
                onSelect={() => {
                  onValueChange(member.id === value ? undefined : member.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === member.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs">
                      {member.initials || member.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{member.name}</span>
                    {member.email && (
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function MultiMemberSelect({
  members,
  values,
  onValuesChange,
  placeholder = "メンバーを選択",
  className,
  disabled,
  maxSelection,
}: MultiMemberSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedMembers = members.filter((member) => values.includes(member.id))

  const handleSelect = (memberId: string) => {
    if (values.includes(memberId)) {
      onValuesChange(values.filter((id) => id !== memberId))
    } else {
      if (maxSelection && values.length >= maxSelection) {
        return
      }
      onValuesChange([...values, memberId])
    }
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {selectedMembers.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap min-w-0">
                {selectedMembers.slice(0, 2).map((member) => (
                  <Badge key={member.id} variant="secondary" className="text-xs">
                    {member.name}
                  </Badge>
                ))}
                {selectedMembers.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedMembers.length - 2}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{placeholder}</span>
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="メンバーを検索..." />
            <CommandEmpty>メンバーが見つかりません。</CommandEmpty>
            <CommandGroup>
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.name}
                  onSelect={() => handleSelect(member.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      values.includes(member.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.initials || member.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">{member.name}</span>
                      {member.email && (
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}