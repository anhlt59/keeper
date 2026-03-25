"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AttributeFieldType } from "@prisma/client";

interface Category {
  id: string | null;
  name: string;
}

interface DefinitionFormData {
  name: string;
  description: string | null;
  fieldType: AttributeFieldType;
  categoryId: string | null;
  required: boolean;
  options: string | null;
  order: number;
}

interface DefinitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Partial<DefinitionFormData>;
  definitionId?: string;
  categories: Category[];
}

const FIELD_TYPE_LABELS: Record<AttributeFieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  BOOLEAN: "Boolean (Yes/No)",
  DATE: "Date",
  SELECT: "Select (Options)",
};

export function DefinitionForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  definitionId,
  categories,
}: DefinitionFormProps) {
  const [form, setForm] = useState<DefinitionFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? null,
    fieldType: initialData?.fieldType ?? AttributeFieldType.TEXT,
    categoryId: initialData?.categoryId ?? null,
    required: initialData?.required ?? false,
    options: initialData?.options ?? null,
    order: initialData?.order ?? 0,
  });
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name ?? "",
        description: initialData?.description ?? null,
        fieldType: initialData?.fieldType ?? AttributeFieldType.TEXT,
        categoryId: initialData?.categoryId ?? null,
        required: initialData?.required ?? false,
        options: initialData?.options ?? null,
        order: initialData?.order ?? 0,
      });
    }
  }, [open]);

  const isEdit = !!definitionId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        fieldType: form.fieldType,
        categoryId: form.categoryId || null,
        required: form.required,
        options: form.fieldType === AttributeFieldType.SELECT ? (form.options?.trim() ?? "") : undefined,
        order: form.order,
      };

      const url = isEdit ? `/api/attributes/definitions/${definitionId}` : "/api/attributes/definitions";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      toast.success(isEdit ? "Definition updated" : "Definition created");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Attribute Definition" : "New Attribute Definition"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="def-name">Name *</Label>
            <Input
              id="def-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. RAM Size"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="def-field-type">Field Type *</Label>
            <Select
              value={form.fieldType}
              onValueChange={(v) => setForm((f) => ({ ...f, fieldType: v as AttributeFieldType }))}
            >
              <SelectTrigger id="def-field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="def-category">Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v || null }))}
            >
              <SelectTrigger id="def-category">
                <SelectValue>
                  {form.categoryId ? categories.find((c) => c.id === form.categoryId)?.name : "Global (all categories)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Global (all categories)</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id!} value={c.id!}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.fieldType === AttributeFieldType.SELECT && (
            <div className="space-y-2">
              <Label htmlFor="def-options">Options (JSON array) *</Label>
              <Textarea
                id="def-options"
                value={form.options ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                placeholder='["8GB","16GB","32GB"]'
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">Enter a JSON array of string options.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="def-description">Description</Label>
            <Textarea
              id="def-description"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional help text..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="def-required"
              checked={form.required}
              onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="def-required" className="font-normal">Required field</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
