import { z } from "zod";

// Accepts both date-only ("2023-11-10") and full ISO datetime strings
const flexibleDateSchema = z
  .string()
  .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date format" })
  .optional();

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().max(100).optional(),
  vendor: z.string().max(200).optional(),
  invoiceDate: flexibleDateSchema,
  totalAmount: z.number().positive().optional(),
  filePath: z.string().optional(),
  attributeValues: z.record(z.string(), z.unknown()).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const confirmInvoiceSchema = z.object({
  invoiceNumber: z.string().max(100).optional(),
  vendor: z.string().max(200).optional(),
  invoiceDate: flexibleDateSchema,
  totalAmount: z.number().positive().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type ConfirmInvoiceInput = z.infer<typeof confirmInvoiceSchema>;
