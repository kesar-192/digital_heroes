import { z } from "zod";

export const scoreSchema = z.object({
  scoreDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date.")
    .refine((v) => new Date(v) <= new Date(), "Date can't be in the future."),
  value: z.coerce
    .number()
    .int("Score must be a whole number.")
    .min(1, "Minimum Stableford score is 1.")
    .max(45, "Maximum Stableford score is 45."),
});

export type ScoreInput = z.infer<typeof scoreSchema>;
