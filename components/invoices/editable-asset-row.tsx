"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrashIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";

function ConfidenceBadge({ confidence }: { confidence: number | null | undefined }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  const cls =
    pct >= 90 ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-300"
    : pct >= 70 ? "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
    : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${cls}`}>
      {pct >= 70 ? <CheckCircleIcon className="h-3 w-3" /> : <AlertCircleIcon className="h-3 w-3" />}
      {pct}%
    </span>
  );
}

export interface EditableAsset {
  name: string;
  category: string;
  quantity: string;
  unitPrice: string;
  warrantyMonths: string;
}

/** Minimal fallback categories used only when API returns an empty list. */
const FALLBACK_CATEGORIES = [
  "Electronics",
  "Furniture",
  "IT Equipment",
  "Vehicles",
  "Tools",
  "Software",
  "Other",
];

interface EditableAssetRowProps {
  asset: EditableAsset;
  index: number;
  onChange: (index: number, field: keyof EditableAsset, value: string) => void;
  onRemove: (index: number) => void;
  confidence?: {
    name?: number | null;
    quantity?: number | null;
    unitPrice?: number | null;
  };
  categories: string[];
}

/** Single editable asset row used in the invoice confirm step */
export function EditableAssetRow({ asset, index, onChange, onRemove, confidence, categories }: EditableAssetRowProps) {
  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Asset #{index + 1}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onRemove(index)}>
          <TrashIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Row 1: Name + Category */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Name *</Label>
            <ConfidenceBadge confidence={confidence?.name} />
          </div>
          <Input
            value={asset.name}
            onChange={(e) => onChange(index, "name", e.target.value)}
            placeholder="Asset name"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={asset.category} onValueChange={(v) => onChange(index, "category", v ?? "")}>
            <SelectTrigger className="h-8 text-sm w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(categories.length > 0 ? categories : FALLBACK_CATEGORIES).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Quantity + Unit Price + Warranty */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <ConfidenceBadge confidence={confidence?.quantity} />
          </div>
          <Input
            type="number"
            min={1}
            value={asset.quantity}
            onChange={(e) => onChange(index, "quantity", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Unit Price</Label>
            <ConfidenceBadge confidence={confidence?.unitPrice} />
          </div>
          <Input
            type="number"
            value={asset.unitPrice}
            onChange={(e) => onChange(index, "unitPrice", e.target.value)}
            placeholder="0"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Warranty (months)</Label>
          <Input
            type="number"
            min={0}
            max={120}
            value={asset.warrantyMonths}
            onChange={(e) => onChange(index, "warrantyMonths", e.target.value)}
            placeholder="0"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
