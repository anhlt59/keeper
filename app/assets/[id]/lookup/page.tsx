import Link from "next/link";
import { PackageIcon, ArrowRightIcon, ArrowLeftIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

type Params = { params: Promise<{ id: string }> };

export default async function AssetLookupPage({ params }: Params) {
  const { id } = await params;

  const asset = await prisma.asset.findFirst({
    where: { code: id, isDeleted: false },
    select: {
      id: true, name: true, code: true, status: true,
      assignedTo: true, description: true,
      category: { select: { name: true } },
    },
  });

  if (!asset) notFound();

  const STATUS_LABELS: Record<string, string> = {
    AVAILABLE: "Available",
    ASSIGNED: "Assigned",
    MAINTENANCE: "In Maintenance",
    RETIRED: "Retired",
    DISPOSED: "Disposed",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Back + Logo row */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/scan" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition text-sm">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 mx-auto">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold font-mono">Z</span>
            </div>
            <span className="font-semibold text-foreground text-lg">Keeper</span>
          </div>
          <div className="w-14" /> {/* giữ cân đối layout */}
        </div>

        {/* Asset Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg ring-1 ring-black/5 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <PackageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg leading-tight truncate">{asset.name}</h1>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">{asset.code}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{asset.category.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{STATUS_LABELS[asset.status] ?? asset.status}</span>
              </div>
              {asset.assignedTo && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="font-medium">{asset.assignedTo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t bg-muted/30 p-4 flex gap-2">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                View Full
              </Button>
            </Link>
            <Link href={`/assets/${asset.id}/edit`} className="flex-1">
              <Button className="w-full">
                Edit
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Asset managed with Keeper
        </p>
      </div>
    </div>
  );
}
