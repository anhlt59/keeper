"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import {
  PlusIcon,
  EditIcon,
  Trash2Icon,
  TagsIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CategoryForm } from "@/components/categories/category-form";
import { useLanguage } from "@/context/language-context";

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { assets: number };
}

export default function CategoriesPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await apiFetch("/api/categories");
      if (!r.ok) throw new Error("Failed to load categories");
      return r.json();
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      toast.success(t("categories.deleted"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("categories.deleteFailed"));
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("nav.categories")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("categories.subtitle")}
          </p>
        </div>
        <CategoryForm
          categories={categories}
          trigger={
            <Button>
              <PlusIcon className="h-4 w-4" />
              {t("categories.addCategory")}
            </Button>
          }
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.description")}</TableHead>
              <TableHead>{t("categories.parent")}</TableHead>
              <TableHead>{t("categories.assetsCount")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : categories.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <TagsIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("categories.noCategories")}</p>
                    <p className="text-sm mt-1">{t("categories.noCategoriesHint")}</p>
                  </TableCell>
                </TableRow>
              )
              : categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {cat.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {cat.parent?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">
                    {cat._count?.assets ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <CategoryForm
                        categories={categories}
                        mode="edit"
                        initialData={cat}
                        trigger={
                          <Button variant="ghost" size="icon-sm" title={t("common.edit")}>
                            <EditIcon className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={t("common.delete")}
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t("categories.deleteTitle")}
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
        onConfirm={handleDelete}
        loading={deleteLoading}
        confirmLabel={t("common.delete")}
        variant="destructive"
      />
    </div>
  );
}
