"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
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
  const { t } = useLanguage();
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
      .catch(() => toast.error(t("assign.loadFailed")));
  }, [open]);

  const handleAssign = async () => {
    if (!employeeId) {
      toast.error(t("assign.selectEmployee"));
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
      toast.success(t("assign.success").replace("{name}", selected?.name ?? t("assign.employee")));
      setOpen(false);
      setEmployeeId(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("assign.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assign.title")}</DialogTitle>
          <DialogDescription>
            {t("assign.description").replace("{name}", assetName)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t("assign.employee")}</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {employeeId ? employees.find((e) => e.id === employeeId)?.name : t("assign.selectEmployee")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {employees.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t("assign.noEmployees")}
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
            {t("common.cancel")}
          </Button>
          <Button onClick={handleAssign} disabled={loading || !employeeId}>
            {loading ? t("assign.assigning") : t("assign.assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
