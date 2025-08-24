import React from "react";
import { NavigationItem } from "./navigation-item";
import { Layers } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: "/integrated", label: "統合ビュー", icon: Layers },
  // Individual tool pages are now accessed through the integrated view
  // { href: "/todo", label: "ToDo管理" },
  // { href: "/wbs", label: "WBS" },
  // { href: "/kanban", label: "カンバン" },
  // { href: "/gantt", label: "ガントチャート" },
];

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">{children}</main>
    </div>
  );
}