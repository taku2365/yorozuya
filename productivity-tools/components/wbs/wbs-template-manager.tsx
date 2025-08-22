"use client";

import { useState } from "react";
import { Save, FileInput, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WBSTask } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export interface WBSTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: WBSTask[];
  createdAt: string;
  updatedAt: string;
}

interface WBSTemplateManagerProps {
  currentTasks: WBSTask[];
  templates: WBSTemplate[];
  onSaveTemplate: (template: Omit<WBSTemplate, "id" | "createdAt" | "updatedAt">) => void;
  onLoadTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onExportTemplate: (templateId: string) => void;
  onImportTemplate: (file: File) => void;
  className?: string;
}

export function WBSTemplateManager({
  currentTasks,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onExportTemplate,
  onImportTemplate,
  className,
}: WBSTemplateManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim() && currentTasks.length > 0) {
      onSaveTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        tasks: currentTasks,
      });
      setTemplateName("");
      setTemplateDescription("");
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (templateId: string) => {
    setTemplateToDelete(templateId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      onDeleteTemplate(templateToDelete);
      if (selectedTemplateId === templateToDelete) {
        setSelectedTemplateId("");
      }
    }
    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportTemplate(file);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div
      className={cn(
        "bg-gray-50 rounded-lg p-4 space-y-4",
        className
      )}
      data-testid="wbs-template-manager"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">テンプレート管理</h3>
        <div className="flex gap-2">
          {!isCreating && (
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              disabled={currentTasks.length === 0}
            >
              <Save className="h-4 w-4 mr-1" />
              現在のWBSを保存
            </Button>
          )}
          <label htmlFor="import-template">
            <Button size="sm" variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                インポート
              </span>
            </Button>
          </label>
          <input
            id="import-template"
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            aria-label="テンプレートをインポート"
          />
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleSaveTemplate} className="space-y-3">
          <div>
            <Label htmlFor="template-name">テンプレート名</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例: Webサイト制作プロジェクト"
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="template-description">説明（任意）</Label>
            <Input
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="テンプレートの説明を入力"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!templateName.trim()}>
              保存
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setTemplateName("");
                setTemplateDescription("");
              }}
            >
              キャンセル
            </Button>
          </div>
        </form>
      )}

      {templates.length > 0 && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="template-select">テンプレートを選択</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger id="template-select">
                <SelectValue placeholder="テンプレートを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplateId && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onLoadTemplate(selectedTemplateId)}
              >
                <FileInput className="h-4 w-4 mr-1" />
                読み込む
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExportTemplate(selectedTemplateId)}
              >
                <Download className="h-4 w-4 mr-1" />
                エクスポート
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteClick(selectedTemplateId)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            </div>
          )}
        </div>
      )}

      {templates.length === 0 && !isCreating && (
        <p className="text-sm text-gray-500 text-center py-4">
          まだテンプレートが保存されていません
        </p>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>テンプレートを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このテンプレートを削除すると、元に戻すことはできません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}