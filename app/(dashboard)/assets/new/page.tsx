"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/language-context";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-fetch";
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
import { DynamicFieldRenderer } from "@/components/attributes/dynamic-field-renderer";
import { AttributeFieldType } from "@prisma/client";

interface Category {
  id: string;
  name: string;
}

function generatePreviewCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASSET-${date}-${rand}`;
}

export default function NewAssetPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [codePreview] = useState(generatePreviewCode);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    purchaseDate: "",
    purchasePrice: "",
    vendor: "",
    warrantyMonths: "",
  });
  const [attrValues, setAttrValues] = useState<Record<string, unknown>>({});

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await apiFetch("/api/categories");
      if (!r.ok) throw new Error("Failed to load categories");
      return r.json();
    },
  });

  const { data: attrDefinitions = [] } = useQuery<Array<{
    id: string; name: string; fieldType: AttributeFieldType; required: boolean; options: string | null
  }>>({
    queryKey: ["attribute-definitions", form.categoryId],
    queryFn: async () => {
      const r = await apiFetch(`/api/attributes/definitions${form.categoryId ? `?categoryId=${form.categoryId}` : ""}`);
      if (!r.ok) throw new Error("Failed to load attribute definitions");
      return r.json();
    },
    enabled: true,
  });

  function handleAttrChange(name: string, value: unknown) {
    setAttrValues((v) => ({ ...v, [name]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(t("assetForm.nameRequired")); return; }
    if (!form.categoryId) { toast.error(t("assetForm.categoryRequired")); return; }

    setLoading(true);
    try {
      const res = await apiFetch("/api/assets", {
        method: "POST",
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
        throw new Error(data.error ?? "Failed to create asset");
      }
      const asset = await res.json();
      toast.success(t("assetForm.createSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      router.refresh();
      router.push(`/assets/${asset.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("assetForm.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/assets" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeftIcon className="h-4 w-4" />
          {t("assets.title")}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{t("assetForm.createTitle")}</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("assetForm.createTitle")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("assetForm.createSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("assetForm.basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")} *</Label>
                <Input
                  id="name"
                  placeholder={t("assetForm.namePlaceholder")}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">{t("common.category")} *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {form.categoryId ? categories.find((c) => c.id === form.categoryId)?.name : t("assetForm.selectCategory")}
                    </SelectValue>
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
              <Label htmlFor="code-preview">{t("assetForm.codeLabel")}</Label>
              <Input
                id="code-preview"
                value={codePreview}
                readOnly
                className="font-mono text-sm bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                {t("assetForm.codeHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("assetForm.purchaseInfo")}</CardTitle>
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
                  placeholder="e.g. Apple Store VN"
                  value={form.vendor}
                  onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">Warranty (months)</Label>
                <Input
                  id="warrantyMonths"
                  type="number"
                  placeholder="12"
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
              <CardTitle className="text-base">{t("assets.customAttributes")}</CardTitle>
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
          <Link href="/assets">
            <Button type="button" variant="outline">{t("common.cancel")}</Button>
          </Link>
          <Button type="submit" disabled={loading || !form.name.trim() || !form.categoryId}>
            {loading ? t("common.creating") : t("assetForm.createBtn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
