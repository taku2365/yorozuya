"use client";

import * as React from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (toastId?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback(
    ({ title, description, variant = "default", action }: Omit<Toast, "id">) => {
      const id = Date.now().toString();
      const newToast: Toast = { id, title, description, variant, action };
      
      setToasts((prevToasts) => [...prevToasts, newToast]);

      // 5秒後に自動的に削除
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prevToasts) =>
      toastId === undefined
        ? []
        : prevToasts.filter((t) => t.id !== toastId)
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 m-4 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border p-4 shadow-lg transition-all ${
              toast.variant === "destructive"
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border-border bg-background"
            }`}
          >
            {toast.title && (
              <div className="mb-1 font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
            {toast.action}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  
  if (context === undefined) {
    // テスト環境やプロバイダーがない場合のフォールバック
    return {
      toast: () => {},
      toasts: [],
      dismiss: () => {},
    };
  }
  
  return context;
}