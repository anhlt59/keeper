"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

interface Employee {
  id: string;
  name: string;
}

interface AssignDialogProps {
  assetId: string;
  assetName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AssignDialog({ assetId, assetName, trigger, onSuccess }: AssignDialogProps) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch employees when dialog opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/employees")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load employees");
        return res.json();
      })
      .then((data) => setEmployees(data))
      .catch(() => toast.error("Failed to load employees"));
  }, [open]);

  const handleAssign = async () => {
    if (!employeeId) {
      toast.error("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to assign");
      }
      const selected = employees.find((e) => e.id === employeeId);
      toast.success(`Asset assigned to ${selected?.name ?? "employee"}`);
      setOpen(false);
      setEmployeeId(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Asset</DialogTitle>
          <DialogDescription>
            Assign <strong>{assetName}</strong> to an employee.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Employee</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No employees found
                </div>
              ) : (
                employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || !employeeId}>
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
