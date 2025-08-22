import React from "react";
import { cn } from "@/lib/utils";

interface NavigationItemProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

export function NavigationItem({ href, children, isActive }: NavigationItemProps) {
  return (
    <li>
      <a
        href={href}
        className={cn(
          "block px-4 py-2 rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground font-medium"
        )}
      >
        {children}
      </a>
    </li>
  );
}