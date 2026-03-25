"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface Category {
  id: string;
  name: string;
  description: string | null;
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    parentId: "",
  });
  const router = useRouter();

  const handleOpenChange = (val: boolean) => {
    if (val) {
      setForm({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        parentId: "",
      });
    }
    setOpen(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
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
        throw new Error(data.error ?? "Failed to save category");
      }
      toast.success(mode === "edit" ? "Category updated" : "Category created");
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
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
            {mode === "edit" ? "Edit Category" : "Add Category"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the category details."
              : "Create a new asset category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Laptop"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              placeholder="Optional description..."
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-parent">Parent Category</Label>
            <Select
              value={form.parentId}
              onValueChange={(v) => setForm((f) => ({ ...f, parentId: v ?? "" }))}
            >
              <SelectTrigger>
                <SelectValue>
                  {(value) => categories.find((c) => c.id === value)?.name ?? "None (top-level)"}
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
