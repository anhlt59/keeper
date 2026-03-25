"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, Trash2Icon, Settings2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DefinitionForm } from "@/components/attributes/definition-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AttributeFieldType } from "@prisma/client";

const FIELD_TYPE_COLORS: Record<AttributeFieldType, string> = {
  TEXT: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  NUMBER: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  BOOLEAN: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  DATE: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  SELECT: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
};

const COL_COUNT = 6;

interface Definition {
  id: string;
  name: string;
  description: string | null;
  fieldType: AttributeFieldType;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  required: boolean;
  options: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  definitions: Definition[];
}

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [editDef, setEditDef] = useState<Definition | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Definition | null>(null);

  const { data: definitions = [], isLoading } = useQuery<Definition[]>({
    queryKey: ["attribute-definitions"],
    queryFn: async () => {
      const r = await fetch("/api/attributes/definitions", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load attribute definitions");
      return r.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await fetch("/api/categories", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load categories");
      return r.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/attributes/definitions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Definition deleted");
      queryClient.invalidateQueries({ queryKey: ["attribute-definitions"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete definition"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attribute Definitions</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Define custom fields per asset category.
          </p>
        </div>
        <Button
          onClick={() => { setEditDef(null); setShowForm(true); }}
          size="sm"
        >
          <PlusIcon className="h-4 w-4" />
          New Attribute
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: COL_COUNT }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : definitions.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">
                    <Settings2Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No attribute definitions yet</p>
                    <p className="text-sm mt-1">
                      Create custom fields like RAM, Storage, or Color per category.
                    </p>
                    <Button className="mt-4" size="sm" onClick={() => { setEditDef(null); setShowForm(true); }}>
                      <PlusIcon className="h-4 w-4" />
                      Create First Attribute
                    </Button>
                  </TableCell>
                </TableRow>
              )
              : definitions.map((def) => (
                <TableRow key={def.id}>
                  <TableCell className="font-medium">{def.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex text-xs px-1.5 py-0.5 rounded font-medium ${FIELD_TYPE_COLORS[def.fieldType] ?? ""}`}>
                      {def.fieldType}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {def.category?.name ?? "Global"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {def.required
                      ? <span className="text-destructive font-medium">Yes</span>
                      : <span className="text-muted-foreground">No</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {def.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditDef(def); setShowForm(true); }}>
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(def)} className="text-destructive hover:text-destructive">
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Form */}
      <DefinitionForm
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setEditDef(null); }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["attribute-definitions"] })}
        initialData={editDef ?? undefined}
        definitionId={editDef?.id}
        categories={categories}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Delete Attribute Definition"
        description={`Delete "${deleteTarget?.name}"? Existing asset values for this field will be preserved but the schema definition will be removed.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
