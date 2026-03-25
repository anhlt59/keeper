"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, Trash2Icon, Settings2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

  // Group definitions by category
  const globalDefs = definitions.filter((d) => !d.categoryId);
  const byCategory = categories.reduce<Record<string, Definition[]>>((acc, c) => {
    acc[c.id] = definitions.filter((d) => d.categoryId === c.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
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

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : definitions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings2Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">No attribute definitions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create custom fields like RAM, Storage, or Color per category.
            </p>
            <Button className="mt-4" size="sm" onClick={() => { setEditDef(null); setShowForm(true); }}>
              <PlusIcon className="h-4 w-4" />
              Create First Attribute
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Global definitions */}
          {globalDefs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Global (All Categories)
              </h3>
              <div className="grid gap-3">
                {globalDefs.map((def) => (
                  <DefinitionCard
                    key={def.id}
                    definition={def}
                    onEdit={() => { setEditDef(def); setShowForm(true); }}
                    onDelete={() => setDeleteTarget(def)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* By category */}
          {categories.map((cat) => {
            const catDefs = byCategory[cat.id] ?? [];
            if (catDefs.length === 0) return null;
            return (
              <div key={cat.id}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {cat.name}
                </h3>
                <div className="grid gap-3">
                  {catDefs.map((def) => (
                    <DefinitionCard
                      key={def.id}
                      definition={def}
                      onEdit={() => { setEditDef(def); setShowForm(true); }}
                      onDelete={() => setDeleteTarget(def)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

function DefinitionCard({
  definition: def,
  onEdit,
  onDelete,
}: {
  definition: Definition;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colorClass = FIELD_TYPE_COLORS[def.fieldType] ?? "";
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{def.name}</span>
          <span className={`inline-flex text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`}>
            {def.fieldType}
          </span>
          {def.required && (
            <span className="text-xs text-destructive font-medium">Required</span>
          )}
          {def.category && (
            <Badge variant="outline" className="text-xs">{def.category.name}</Badge>
          )}
        </div>
        {def.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{def.description}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={onEdit}>
          <PencilIcon className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
