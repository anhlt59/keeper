import { z } from "zod";
import { AttributeFieldType } from "@prisma/client";

export const createAttributeDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  fieldType: z.nativeEnum(AttributeFieldType),
  categoryId: z.string().cuid("Invalid category ID").optional().nullable(),
  required: z.boolean().default(false),
  options: z.string().max(1000).optional(), // JSON array for SELECT
  validation: z.record(z.string(), z.unknown()).optional(),
  order: z.number().int().min(0).default(0),
});

export const updateAttributeDefinitionSchema = createAttributeDefinitionSchema.partial().extend({
  name: z.string().min(1).max(100).optional(),
});

export type CreateAttributeDefinitionInput = z.infer<typeof createAttributeDefinitionSchema>;
export type UpdateAttributeDefinitionInput = z.infer<typeof updateAttributeDefinitionSchema>;

export type AttributeFieldTypeEnum = AttributeFieldType;

// Convert field type to Zod schema for runtime validation
export function fieldTypeToZod(
  type: AttributeFieldType,
  options?: string | null
): z.ZodTypeAny {
  switch (type) {
    case AttributeFieldType.TEXT:
      return z.string();
    case AttributeFieldType.NUMBER:
      return z.number();
    case AttributeFieldType.BOOLEAN:
      return z.boolean();
    case AttributeFieldType.DATE:
      return z.string(); // ISO date string
    case AttributeFieldType.SELECT: {
      if (!options) return z.string();
      let parsed: string[];
      try { parsed = JSON.parse(options); } catch { return z.string(); }
      if (!Array.isArray(parsed) || parsed.length === 0) return z.string();
      return z.enum(parsed as [string, ...string[]]);
    }
    default:
      return z.unknown();
  }
}

// Build a Zod object schema from attribute definitions
export function buildDynamicAttrsSchema(
  definitions: Array<{ name: string; fieldType: AttributeFieldType; required: boolean; options?: string | null }>
) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const def of definitions) {
    let field = fieldTypeToZod(def.fieldType, def.options);
    if (!def.required) field = field.optional();
    else field = field;
    shape[def.name] = field;
  }
  return z.object(shape);
}

// Parse options JSON safely
export function parseOptions(options: string | null | undefined): string[] {
  if (!options) return [];
  try { const p = JSON.parse(options); return Array.isArray(p) ? p : []; }
  catch { return []; }
}
