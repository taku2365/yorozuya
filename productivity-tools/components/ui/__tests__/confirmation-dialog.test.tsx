import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

describe("ConfirmationDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "削除の確認",
    description: "このタスクを削除してもよろしいですか？",
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render dialog with title and description", () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByText("削除の確認")).toBeInTheDocument()
    expect(screen.getByText("このタスクを削除してもよろしいですか？")).toBeInTheDocument()
  })

  it("should render default buttons when no custom text provided", () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByText("確認")).toBeInTheDocument()
    expect(screen.getByText("キャンセル")).toBeInTheDocument()
  })

  it("should render custom button text", () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        confirmText="削除"
        cancelText="やめる"
      />
    )

    expect(screen.getByText("削除")).toBeInTheDocument()
    expect(screen.getByText("やめる")).toBeInTheDocument()
  })

  it("should call onConfirm and close dialog when confirm button clicked", async () => {
    const user = userEvent.setup()
    render(<ConfirmationDialog {...defaultProps} />)

    const confirmButton = screen.getByText("確認")
    await user.click(confirmButton)

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("should call onCancel and close dialog when cancel button clicked", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />)

    const cancelButton = screen.getByText("キャンセル")
    await user.click(cancelButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("should handle async onConfirm", async () => {
    const user = userEvent.setup()
    const asyncOnConfirm = vi.fn().mockResolvedValue(undefined)
    
    render(
      <ConfirmationDialog {...defaultProps} onConfirm={asyncOnConfirm} />
    )

    const confirmButton = screen.getByText("確認")
    await user.click(confirmButton)

    await waitFor(() => {
      expect(asyncOnConfirm).toHaveBeenCalledTimes(1)
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("should apply destructive variant styling", () => {
    render(
      <ConfirmationDialog {...defaultProps} variant="destructive" />
    )

    const confirmButton = screen.getByText("確認")
    expect(confirmButton).toHaveClass("bg-destructive")
  })

  it("should not render when open is false", () => {
    render(<ConfirmationDialog {...defaultProps} open={false} />)

    expect(screen.queryByText("削除の確認")).not.toBeInTheDocument()
  })

  it("should call onOpenChange when dialog state changes", async () => {
    const user = userEvent.setup()
    render(<ConfirmationDialog {...defaultProps} />)

    // Simulate escape key or clicking outside
    const dialog = screen.getByRole("alertdialog")
    fireEvent.keyDown(dialog, { key: "Escape" })

    expect(defaultProps.onOpenChange).toHaveBeenCalled()
  })
})