import { z } from "zod";

export const sowUploadSchema = z.object({
  projectTitle: z
    .string()
    .min(1, "Project title is required")
    .min(3, "Project title must be at least 3 characters")
    .max(100, "Project title must be under 100 characters"),

  clientOrg: z
    .string()
    .min(1, "Client / Organisation is required")
    .min(2, "Client / Organisation must be at least 2 characters")
    .max(100, "Client / Organisation must be under 100 characters"),

  linkedSowId: z.string(),
});

export type SOWUploadFields = z.infer<typeof sowUploadSchema>;
export type SOWUploadFieldErrors = Partial<Record<keyof SOWUploadFields, string>>;

export function validateSOWUploadFields(data: SOWUploadFields): SOWUploadFieldErrors {
  const result = sowUploadSchema.safeParse(data);
  if (result.success) return {};

  const errors: SOWUploadFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof SOWUploadFields;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
