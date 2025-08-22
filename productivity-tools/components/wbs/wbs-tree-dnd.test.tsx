import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WBSTreeDnD } from "./wbs-tree-dnd";
import type { WBSTask } from "@/lib/db/types";

const mockTasks: WBSTask[] = [
  {
    id: "1",
    title: "タスク1",
    position: 0,
    progress: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    children: [],
  },
  {
    id: "2",
    title: "タスク2",
    position: 1,
    progress: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    children: [
      {
        id: "3",
        title: "タスク2-1",
        parent_id: "2",
        position: 0,
        progress: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        children: [],
      },
    ],
  },
];

// Mock @dnd-kit dependencies
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => "",
    },
  },
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  closestCenter: {},
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(),
  DragOverlay: ({ children }: { children: React.ReactNode }) => children,
}));

describe("WBSTreeDnD", () => {
  it("renders tasks with drag and drop wrapper", () => {
    render(
      <WBSTreeDnD 
        tasks={mockTasks} 
        onTaskClick={vi.fn()}
        onTaskMove={vi.fn()}
      />
    );
    
    expect(screen.getByText("タスク1")).toBeInTheDocument();
    expect(screen.getByText("タスク2")).toBeInTheDocument();
    expect(screen.getByText("タスク2-1")).toBeInTheDocument();
  });

  it("calls onTaskClick when task is clicked", () => {
    const handleTaskClick = vi.fn();
    render(
      <WBSTreeDnD 
        tasks={mockTasks} 
        onTaskClick={handleTaskClick}
        onTaskMove={vi.fn()}
      />
    );
    
    screen.getByText("タスク1").click();
    
    expect(handleTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });
});