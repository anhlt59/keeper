import { z } from "zod";
import { AssetStatus } from "@prisma/client";

// Asset FSM status enum
const assetStatusSchema = z.nativeEnum(AssetStatus);

// Create asset
export const createAssetSchema = z.object({
  code: z.string().min(1, "Asset code is required").max(50).optional(),
  name: z.string().min(1, "Asset name is required").max(200),
  description: z.string().max(1000).nullish(),
  categoryId: z.string().cuid("Invalid category ID"),
  status: assetStatusSchema.optional().default(AssetStatus.AVAILABLE),
  assignedTo: z.string().max(200).nullish(),
  assignedDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date format" }).nullish(),
  purchaseDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date format" }).nullish(),
  purchasePrice: z.number().positive().nullish(),
  vendor: z.string().max(200).nullish(),
  warrantyMonths: z.number().int().min(0).max(120).nullish(),
  nextMaintenanceDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date format" }).nullish(),
  attributeValues: z.record(z.string(), z.unknown()).optional(),
});

// Update asset — status has no default so it won't trigger FSM validation when omitted
export const updateAssetSchema = createAssetSchema
  .omit({ code: true, status: true })
  .partial()
  .extend({
    code: z.string().min(1).max(50).optional(),
    status: assetStatusSchema.optional(),
  });

// Status change
export const changeStatusSchema = z.object({
  toStatus: assetStatusSchema,
  description: z.string().max(500).optional(),
});

// Assign
export const assignAssetSchema = z.object({
  employeeId: z.string().cuid("Invalid employee ID"),
  description: z.string().max(500).optional(),
});

// Recall
export const recallAssetSchema = z.object({
  description: z.string().max(500).optional(),
});

// Query params
export const listAssetsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: assetStatusSchema.optional(),
  sortBy: z.enum(["name", "code", "createdAt", "purchaseDate"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type RecallAssetInput = z.infer<typeof recallAssetSchema>;
export type ListAssetsInput = z.infer<typeof listAssetsSchema>;
