import React from "react";
import { NavigationItem } from "./navigation-item";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: "/todo", label: "ToDo管理" },
  { href: "/wbs", label: "WBS" },
  { href: "/kanban", label: "カンバン" },
  { href: "/gantt", label: "ガントチャート" },
];

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <nav className="w-full md:w-64 border-r bg-card p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">生産性ツール</h1>
        </div>
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <NavigationItem key={item.href} href={item.href}>
              {item.label}
            </NavigationItem>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}