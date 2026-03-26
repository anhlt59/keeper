"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { UploadCloudIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

interface InvoiceUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMb?: number;
}

export function InvoiceUpload({
  onFileSelected,
  accept = "image/jpeg,image/png,image/jpg",
  maxSizeMb = 10,
}: InvoiceUploadProps) {
  const { t } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMb}MB.`);
      return;
    }
    const allowed = accept.split(",").map((type) => type.trim());
    if (!allowed.includes(f.type)) {
      toast.error("Unsupported file type. Please upload a JPG or PNG image.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
    onFileSelected(f);
  }, [accept, maxSizeMb, onFileSelected]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative rounded-lg border overflow-hidden max-w-sm mx-auto">
          <img src={preview} alt="Invoice preview" className="max-h-64 mx-auto object-contain" />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-1 right-1 bg-background/80"
            onClick={() => { setFile(null); setPreview(null); }}
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="invoice-upload"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer py-10 px-6 transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
          }`}
        >
          <UploadCloudIcon className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("invoiceUpload.dragDrop")}
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG · Max {maxSizeMb}MB
          </span>
          <input
            id="invoice-upload"
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleChange}
          />
        </label>
      )}
    </div>
  );
}
