"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MaintenanceFormProps {
  assetId: string;
  assetName: string;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

export function MaintenanceForm({
  assetId,
  assetName,
  trigger,
  onSuccess,
}: MaintenanceFormProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "PREVENTIVE",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    cost: "",
    performedBy: "",
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error(t("maintForm.descRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          type: form.type,
          description: form.description.trim(),
          startDate: form.startDate,
          cost: form.cost ? parseFloat(form.cost) : null,
          performedBy: form.performedBy.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create maintenance record");
      }
      toast.success(t("maintForm.createSuccess"));
      setOpen(false);
      setForm({ type: "PREVENTIVE", description: "", startDate: new Date().toISOString().split("T")[0], cost: "", performedBy: "" });
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("maintForm.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("maintForm.title")}</DialogTitle>
          <DialogDescription>
            {t("maintForm.description").replace("{name}", assetName)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("common.type")}</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as "PREVENTIVE" | "CORRECTIVE" | "UPGRADE" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PREVENTIVE">{t("maint.type.PREVENTIVE")}</SelectItem>
                <SelectItem value="CORRECTIVE">{t("maint.type.CORRECTIVE")}</SelectItem>
                <SelectItem value="UPGRADE">{t("maint.type.UPGRADE")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("common.description")} *</Label>
            <Textarea
              id="description"
              placeholder={t("maintForm.descPlaceholder")}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t("assetDetail.startDate")}</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">{t("maintForm.costLabel")}</Label>
              <Input
                id="cost"
                type="number"
                placeholder="0"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="performedBy">{t("assetDetail.performedBy")}</Label>
            <Input
              id="performedBy"
              placeholder={t("maintForm.performedByPlaceholder")}
              value={form.performedBy}
              onChange={(e) => setForm((f) => ({ ...f, performedBy: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !form.description.trim()}>
              {loading ? t("common.creating") : t("maintForm.createRecord")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
