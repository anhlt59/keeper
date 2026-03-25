import { z } from "zod";
import { MaintenanceType, MaintenanceStatus } from "@prisma/client";

export const createMaintenanceSchema = z.object({
  assetId: z.string().cuid("Invalid asset ID"),
  type: z.nativeEnum(MaintenanceType),
  description: z.string().min(1, "Description is required").max(1000),
  cost: z.number().positive().optional().nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  endDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date format" }).optional(),
  performedBy: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial().extend({
  status: z.nativeEnum(MaintenanceStatus).optional(),
});

export const completeMaintenanceSchema = z.object({
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  cost: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;
