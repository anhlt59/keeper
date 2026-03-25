import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().max(200).nullish(),
  department: z.string().max(200).nullish(),
  position: z.string().max(200).nullish(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
