"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AssetStatus, AttributeFieldType } from "@prisma/client";
import { DynamicFieldRenderer } from "@/components/attributes/dynamic-field-renderer";

interface Category {
  id: string;
  name: string;
}

interface AssetDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string;
  purchaseDate: string | null;
  purchasePrice: string | number | null;
  vendor: string | null;
  warrantyMonths: number | null;
  status: AssetStatus;
  category: { id: string; name: string };
  attributeValue: { values: Record<string, unknown> } | null;
}

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: asset, isLoading, error } = useQuery<AssetDetail>({
    queryKey: ["asset", id],
    queryFn: () => fetch(`/api/assets/${id}`).then((r) => {
      if (!r.ok) throw new Error("Asset not found");
      return r.json();
    }),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await fetch("/api/categories", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load categories");
      return r.json();
    },
  });

  const { data: attrDefinitions = [] } = useQuery<Array<{
    id: string; name: string; fieldType: AttributeFieldType; required: boolean; options: string | null
  }>>({
    queryKey: ["attribute-definitions", asset?.categoryId],
    queryFn: async () => {
      const r = await fetch(`/api/attributes/definitions${asset?.categoryId ? `?categoryId=${asset.categoryId}` : ""}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load attribute definitions");
      return r.json();
    },
    enabled: !!asset,
  });

  const [form, setForm] = useState<{
    name: string;
    categoryId: string;
    description: string;
    purchaseDate: string;
    purchasePrice: string;
    vendor: string;
    warrantyMonths: string;
  }>({
    name: asset?.name ?? "",
    categoryId: asset?.categoryId ?? "",
    description: asset?.description ?? "",
    purchaseDate: asset?.purchaseDate ? String(asset.purchaseDate).split("T")[0] : "",
    purchasePrice: asset?.purchasePrice ? String(asset.purchasePrice) : "",
    vendor: asset?.vendor ?? "",
    warrantyMonths: asset?.warrantyMonths ? String(asset.warrantyMonths) : "",
  });

  const [loading, setLoading] = useState(false);
  const [attrValues, setAttrValues] = useState<Record<string, unknown>>({});

  function handleAttrChange(name: string, value: unknown) {
    setAttrValues((v) => ({ ...v, [name]: value }));
  }

  // Sync form when asset loads
  if (asset && form.name !== asset.name && typeof window !== "undefined") {
    setForm({
      name: asset.name,
      categoryId: asset.categoryId,
      description: asset.description ?? "",
      purchaseDate: asset.purchaseDate ? String(asset.purchaseDate).split("T")[0] : "",
      purchasePrice: asset.purchasePrice ? String(asset.purchasePrice) : "",
      vendor: asset.vendor ?? "",
      warrantyMonths: asset.warrantyMonths ? String(asset.warrantyMonths) : "",
    });
    setAttrValues((asset.attributeValue?.values ?? {}) as Record<string, unknown>);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.categoryId) { toast.error("Category is required"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          categoryId: form.categoryId,
          description: form.description.trim() || null,
          purchaseDate: form.purchaseDate || null,
          purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
          vendor: form.vendor.trim() || null,
          warrantyMonths: form.warrantyMonths ? parseInt(form.warrantyMonths) : null,
          attributeValues: attrValues,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update asset");
      }
      toast.success("Asset updated");
      router.push(`/assets/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update asset");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Asset not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/assets/${id}`} className="hover:text-foreground flex items-center gap-1">
          <ChevronLeftIcon className="h-4 w-4" />
          {asset.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Edit</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Asset</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Update asset <span className="font-mono">{asset.code}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (VND)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="0"
                  value={form.purchasePrice}
                  onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={form.vendor}
                  onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">Warranty (months)</Label>
                <Input
                  id="warrantyMonths"
                  type="number"
                  min={0}
                  max={120}
                  value={form.warrantyMonths}
                  onChange={(e) => setForm((f) => ({ ...f, warrantyMonths: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {attrDefinitions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DynamicFieldRenderer
                definitions={attrDefinitions}
                values={attrValues}
                onChange={handleAttrChange}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Link href={`/assets/${id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading || !form.name.trim() || !form.categoryId}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
