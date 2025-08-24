"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { LoadingSpinner, LoadingOverlay, LoadingButton } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { PrioritySelect, PriorityBadge } from "@/components/ui/priority-select"
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker"
import { MemberSelect, MultiMemberSelect } from "@/components/ui/member-select"
import { LabelManager, LabelBadge } from "@/components/ui/label-manager"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Priority } from "@/components/ui/priority-select"
import type { Member, Label } from "@/components/ui/member-select"

// Mock data
const mockMembers: Member[] = [
  { id: "1", name: "田中太郎", email: "tanaka@example.com", initials: "田" },
  { id: "2", name: "佐藤花子", email: "sato@example.com", initials: "佐" },
  { id: "3", name: "山田次郎", email: "yamada@example.com", initials: "山" },
]

const mockLabels: Label[] = [
  { id: "1", name: "緊急", color: "#ef4444" },
  { id: "2", name: "重要", color: "#f97316" },
  { id: "3", name: "レビュー", color: "#3b82f6" },
  { id: "4", name: "完了", color: "#22c55e" },
]

export default function TestComponentsPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showError, setShowError] = useState(false)
  const [priority, setPriority] = useState<Priority | undefined>()
  const [date, setDate] = useState<Date>()
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [selectedMember, setSelectedMember] = useState<string>()
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [labels, setLabels] = useState<Label[]>(mockLabels)
  
  const { toast } = useToast()

  const handleShowOverlay = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  const handleCreateLabel = (name: string, color: string) => {
    const newLabel: Label = {
      id: Date.now().toString(),
      name,
      color,
    }
    setLabels([...labels, newLabel])
    toast({
      title: "ラベル作成",
      description: `ラベル「${name}」を作成しました`,
      variant: "success",
    })
  }

  const handleDeleteLabel = (labelId: string) => {
    setLabels(labels.filter(l => l.id !== labelId))
    setSelectedLabels(selectedLabels.filter(id => id !== labelId))
    toast({
      title: "ラベル削除",
      description: "ラベルを削除しました",
      variant: "destructive",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">共通UIコンポーネントテスト</h1>
      
      {/* Toast System */}
      <Card>
        <CardHeader>
          <CardTitle>通知システム（Toast）</CardTitle>
          <CardDescription>様々な種類の通知をテストできます</CardDescription>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button onClick={() => toast({ title: "成功", description: "操作が完了しました", variant: "success" })}>
            成功通知
          </Button>
          <Button onClick={() => toast({ title: "エラー", description: "問題が発生しました", variant: "destructive" })}>
            エラー通知
          </Button>
          <Button onClick={() => toast({ title: "情報", description: "情報をお知らせします", variant: "info" })}>
            情報通知
          </Button>
          <Button onClick={() => toast({ title: "警告", description: "注意が必要です", variant: "warning" })}>
            警告通知
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>確認ダイアログ</CardTitle>
          <CardDescription>削除確認などに使用する確認ダイアログです</CardDescription>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            削除確認ダイアログ
          </Button>
          <ConfirmationDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="データ削除の確認"
            description="このデータを削除してもよろしいですか？この操作は元に戻せません。"
            confirmText="削除"
            cancelText="キャンセル"
            variant="destructive"
            onConfirm={async () => {
              await new Promise(resolve => setTimeout(resolve, 1000))
              toast({
                title: "削除完了",
                description: "データを削除しました",
                variant: "destructive",
              })
            }}
          />
        </CardContent>
      </Card>

      {/* Loading Components */}
      <Card>
        <CardHeader>
          <CardTitle>ローディング表示</CardTitle>
          <CardDescription>様々なローディング表示をテストできます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-x-2">
            <LoadingSpinner size="sm" text="小サイズ" />
            <LoadingSpinner size="md" text="中サイズ" />
            <LoadingSpinner size="lg" text="大サイズ" />
          </div>
          <div className="space-x-2">
            <LoadingButton loading={false} onClick={() => {}}>
              通常ボタン
            </LoadingButton>
            <LoadingButton loading={true} onClick={() => {}}>
              ローディング中
            </LoadingButton>
            <Button onClick={handleShowOverlay}>
              オーバーレイ表示（3秒）
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      <Card>
        <CardHeader>
          <CardTitle>エラー表示</CardTitle>
          <CardDescription>エラー状態の表示をテストできます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-x-2">
            <Button onClick={() => setShowError(!showError)}>
              エラー表示切替
            </Button>
          </div>
          {showError && (
            <ErrorDisplay
              title="接続エラー"
              message="サーバーへの接続に失敗しました。ネットワーク接続を確認してください。"
              onRetry={() => {
                toast({ title: "再試行", description: "接続を再試行しています...", variant: "info" })
                setTimeout(() => setShowError(false), 2000)
              }}
              onDismiss={() => setShowError(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Priority Select */}
      <Card>
        <CardHeader>
          <CardTitle>優先度選択</CardTitle>
          <CardDescription>タスクの優先度を選択できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <PrioritySelect
              value={priority}
              onValueChange={setPriority}
              placeholder="優先度を選択してください"
            />
            <div className="flex items-center space-x-2">
              <span>選択中:</span>
              {priority ? <PriorityBadge priority={priority} /> : <span className="text-muted-foreground">未選択</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Pickers */}
      <Card>
        <CardHeader>
          <CardTitle>日付選択</CardTitle>
          <CardDescription>日付や期間を選択できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">単一日付</label>
              <DatePicker
                date={date}
                onSelect={setDate}
                placeholder="日付を選択してください"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">期間選択</label>
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={(from, to) => setDateRange({ from, to })}
                placeholder="期間を選択してください"
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>選択された日付: {date ? date.toLocaleDateString('ja-JP') : '未選択'}</div>
            <div>選択された期間: {
              dateRange.from && dateRange.to 
                ? `${dateRange.from.toLocaleDateString('ja-JP')} - ${dateRange.to.toLocaleDateString('ja-JP')}`
                : '未選択'
            }</div>
          </div>
        </CardContent>
      </Card>

      {/* Member Select */}
      <Card>
        <CardHeader>
          <CardTitle>メンバー選択</CardTitle>
          <CardDescription>担当者や関係者を選択できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">単一メンバー</label>
              <MemberSelect
                members={mockMembers}
                value={selectedMember}
                onValueChange={setSelectedMember}
                placeholder="メンバーを選択してください"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">複数メンバー</label>
              <MultiMemberSelect
                members={mockMembers}
                values={selectedMembers}
                onValuesChange={setSelectedMembers}
                placeholder="メンバーを選択してください"
                maxSelection={3}
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>選択されたメンバー: {
              selectedMember 
                ? mockMembers.find(m => m.id === selectedMember)?.name || '不明'
                : '未選択'
            }</div>
            <div>選択された複数メンバー: {
              selectedMembers.length > 0
                ? selectedMembers.map(id => mockMembers.find(m => m.id === id)?.name).join(', ')
                : '未選択'
            }</div>
          </div>
        </CardContent>
      </Card>

      {/* Label Manager */}
      <Card>
        <CardHeader>
          <CardTitle>ラベル管理</CardTitle>
          <CardDescription>タスクにラベルを付けて分類できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabelManager
            labels={labels}
            selectedLabels={selectedLabels}
            onLabelsChange={setSelectedLabels}
            onCreateLabel={handleCreateLabel}
            onDeleteLabel={handleDeleteLabel}
            placeholder="ラベルを選択してください"
            maxLabels={5}
          />
          <div>
            <h4 className="text-sm font-medium mb-2">選択されたラベル:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedLabels.length > 0 ? (
                selectedLabels.map(labelId => {
                  const label = labels.find(l => l.id === labelId)
                  return label ? <LabelBadge key={label.id} label={label} /> : null
                })
              ) : (
                <span className="text-muted-foreground">未選択</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <LoadingOverlay text="処理中..." />}
      <Toaster />
    </div>
  )
}