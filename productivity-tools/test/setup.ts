import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLElement methods that may not exist in test environment
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn();
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mock Radix UI Portal for dropdown menus
vi.mock("@radix-ui/react-dropdown-menu", async () => {
  const actual = await vi.importActual("@radix-ui/react-dropdown-menu");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock Radix UI Select with proper test compatibility
vi.mock("@radix-ui/react-select", async () => {
  const React = await import("react");
  const actual = await vi.importActual("@radix-ui/react-select") as any;
  
  return {
    ...actual,
    Root: actual.Root,
    Group: actual.Group,
    Value: actual.Value,
    Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => 
      React.createElement('button', { ref, ...props, role: 'combobox', 'aria-label': props['aria-label'] || 'Priority' }, children)
    ),
    Icon: ({ children }: { children: React.ReactNode }) => children,
    Portal: ({ children }: { children: React.ReactNode }) => children,
    Content: React.forwardRef(({ children, ...props }: any, ref: any) => 
      React.createElement('div', { ref, ...props }, children)
    ),
    Viewport: ({ children }: { children: React.ReactNode }) => children,
    ScrollUpButton: () => null,
    ScrollDownButton: () => null,
    Item: React.forwardRef(({ children, ...props }: any, ref: any) => 
      React.createElement('div', { ref, ...props, role: 'option' }, children)
    ),
    ItemText: ({ children }: { children: React.ReactNode }) => children,
    ItemIndicator: ({ children }: { children: React.ReactNode }) => children,
    Label: React.forwardRef(({ children, ...props }: any, ref: any) => 
      React.createElement('div', { ref, ...props }, children)
    ),
    Separator: React.forwardRef((props: any, ref: any) => 
      React.createElement('div', { ref, ...props })
    ),
  };
});

// Mock Radix UI Portal for alert dialog
vi.mock("@radix-ui/react-alert-dialog", async () => {
  const actual = await vi.importActual("@radix-ui/react-alert-dialog");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock Radix UI Portal for dialog
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => children,
  };
});