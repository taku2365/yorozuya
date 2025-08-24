"use client"

import { AlertTriangle, RefreshCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: "default" | "destructive"
}

export function ErrorDisplay({
  title = "エラーが発生しました",
  message,
  onRetry,
  onDismiss,
  className,
  variant = "destructive",
}: ErrorDisplayProps) {
  return (
    <Alert variant={variant} className={cn("relative", className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="pr-8">{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7"
            >
              <RefreshCcw className="mr-1 h-3 w-3" />
              再試行
            </Button>
          )}
        </div>
      </AlertDescription>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">閉じる</span>
        </button>
      )}
    </Alert>
  )
}

export interface ErrorBoundaryFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorBoundaryFallback({
  error,
  resetError,
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">
          予期しないエラーが発生しました
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {process.env.NODE_ENV === "development" ? (
            <code className="text-xs">{error.message}</code>
          ) : (
            "アプリケーションでエラーが発生しました。ページを再読み込みしてください。"
          )}
        </p>
        <Button onClick={resetError} className="mt-4">
          <RefreshCcw className="mr-2 h-4 w-4" />
          再試行
        </Button>
      </div>
    </div>
  )
}