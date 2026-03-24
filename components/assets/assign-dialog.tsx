"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AssignDialogProps {
  assetId: string;
  assetName: string;
  trigger?: React.ReactNode;
}

export function AssignDialog({ assetId, assetName, trigger }: AssignDialogProps) {
  const [open, setOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAssign = async () => {
    if (!assignedTo.trim()) {
      toast.error("Please enter the assignee name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: assignedTo.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to assign");
      }
      toast.success(`Asset assigned to ${assignedTo}`);
      setOpen(false);
      setAssignedTo("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Asset</DialogTitle>
          <DialogDescription>
            Assign <strong>{assetName}</strong> to an employee or department.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Input
            id="assignedTo"
            placeholder="e.g. Nguyen Van A"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAssign()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || !assignedTo.trim()}>
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
