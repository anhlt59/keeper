"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttributeFieldType } from "@prisma/client";
import { parseOptions } from "@/lib/validators/dynamic-attrs";
import { useLanguage } from "@/context/language-context";

interface DynamicFieldProps {
  name: string;
  label: string;
  fieldType: AttributeFieldType;
  required?: boolean;
  value?: unknown;
  options?: string | null;
  error?: string;
  onChange: (name: string, value: unknown) => void;
}

export function DynamicField({
  name,
  label,
  fieldType,
  required,
  value,
  options,
  error,
  onChange,
}: DynamicFieldProps) {
  const { t } = useLanguage();
  const opts = parseOptions(options);

  function handleChange(raw: unknown) {
    if (fieldType === AttributeFieldType.NUMBER) {
      onChange(name, raw === "" ? undefined : Number(raw));
    } else {
      onChange(name, raw);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {fieldType === AttributeFieldType.TEXT && (
        <Input
          id={name}
          value={(value as string) ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={!!error}
        />
      )}

      {fieldType === AttributeFieldType.NUMBER && (
        <Input
          id={name}
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={!!error}
        />
      )}

      {fieldType === AttributeFieldType.BOOLEAN && (
        <div className="flex items-center gap-2 h-8">
          <button
            type="button"
            onClick={() => handleChange(!(value as boolean))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              (value as boolean) ? "bg-primary" : "bg-muted"
            }`}
            aria-pressed={!!value}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                (value as boolean) ? "translate-x-[18px]" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-muted-foreground">
            {(value as boolean) ? t("common.yes") : t("common.no")}
          </span>
        </div>
      )}

      {fieldType === AttributeFieldType.DATE && (
        <Input
          id={name}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={!!error}
        />
      )}

      {fieldType === AttributeFieldType.SELECT && (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => handleChange(v)}
        >
          <SelectTrigger id={name} aria-invalid={!!error}>
            <SelectValue placeholder={t("attrForm.selectOption")} />
          </SelectTrigger>
          <SelectContent>
            {opts.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface DynamicFieldRendererProps {
  definitions: Array<{
    id: string;
    name: string;
    label?: string;
    fieldType: AttributeFieldType;
    required: boolean;
    options?: string | null;
    description?: string | null;
  }>;
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
}

export function DynamicFieldRenderer({
  definitions,
  values,
  errors = {},
  onChange,
}: DynamicFieldRendererProps) {
  if (definitions.length === 0) return null;

  return (
    <div className="space-y-4">
      {definitions.map((def) => (
        <DynamicField
          key={def.id}
          name={def.name}
          label={def.label ?? def.name}
          fieldType={def.fieldType}
          required={def.required}
          value={values[def.name]}
          options={def.options}
          error={errors[def.name]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
