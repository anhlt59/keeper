"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "PREVENTIVE",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    cost: "",
    performedBy: "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      toast.success("Maintenance record created");
      setOpen(false);
      setForm({ type: "PREVENTIVE", description: "", startDate: new Date().toISOString().split("T")[0], cost: "", performedBy: "" });
      onSuccess?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create maintenance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Maintenance Record</DialogTitle>
          <DialogDescription>
            Record maintenance for <strong>{assetName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as "PREVENTIVE" | "CORRECTIVE" | "UPGRADE" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                <SelectItem value="UPGRADE">Upgrade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the maintenance work..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (VND)</Label>
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
            <Label htmlFor="performedBy">Performed By</Label>
            <Input
              id="performedBy"
              placeholder="e.g. IT Support"
              value={form.performedBy}
              onChange={(e) => setForm((f) => ({ ...f, performedBy: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.description.trim()}>
              {loading ? "Creating..." : "Create Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
