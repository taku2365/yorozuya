"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TodoSearchProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

export function TodoSearch({ onSearch, placeholder = "ToDoを検索..." }: TodoSearchProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(value);
    }, 300); // Debounce search

    return () => clearTimeout(timeout);
  }, [value, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}