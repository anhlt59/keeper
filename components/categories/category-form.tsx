"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent?: { id: string; name: string } | null;
}

interface CategoryFormProps {
  categories: Category[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  initialData?: Partial<Category>;
  mode?: "create" | "edit";
}

export function CategoryForm({
  categories,
  onSuccess,
  trigger,
  initialData,
  mode = "create",
}: CategoryFormProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    parentId: initialData?.parent?.id ?? "",
  });

  const queryClient = useQueryClient();

  const handleOpenChange = (val: boolean) => {
    if (val) {
      setForm({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        parentId: initialData?.parent?.id ?? "",
      });
    }
    setOpen(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("catForm.nameRequired"));
      return;
    }
    setLoading(true);
    try {
      const url = mode === "edit" && initialData?.id
        ? `/api/categories/${initialData.id}`
        : "/api/categories";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description?.trim() || null,
          parentId: form.parentId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("catForm.saveFailed"));
      }
      toast.success(mode === "edit" ? t("catForm.updated") : t("catForm.created"));
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("catForm.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div onClick={() => handleOpenChange(true)}>{trigger}</div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? t("catForm.editTitle") : t("catForm.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? t("catForm.editDesc") : t("catForm.addDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">{t("common.name")} *</Label>
            <Input
              id="cat-name"
              placeholder={t("catForm.namePlaceholder")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">{t("common.description")}</Label>
            <Textarea
              id="cat-desc"
              placeholder={t("catForm.descPlaceholder")}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-parent">{t("catForm.parentCategory")}</Label>
            <Select
              value={form.parentId}
              onValueChange={(v) => setForm((f) => ({ ...f, parentId: v ?? "" }))}
            >
              <SelectTrigger>
                <SelectValue>
                  {form.parentId ? categories.find((c) => c.id === form.parentId)?.name : t("catForm.noParent")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.id !== initialData?.id)
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()}>
              {loading ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
