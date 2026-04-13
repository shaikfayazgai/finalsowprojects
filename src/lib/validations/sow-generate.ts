import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Array must contain at least `min` non-empty (trimmed) strings. */
const nonEmptyList = (min: number, msg: string) =>
  z.array(z.string()).refine(
    (arr) => arr.filter((s) => s.trim().length > 0).length >= min,
    { message: msg },
  );

/** String that is non-empty after trimming. */
const nonEmptyString = (msg: string) =>
  z.string().refine((s) => s.trim().length > 0, { message: msg });

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type StepErrors = Record<string, string>;

// ---------------------------------------------------------------------------
// Step 0 - Context Discovery
// ---------------------------------------------------------------------------

const step0Schema = z.object({
  projectVision: z
    .string()
    .min(50, "Project vision must be at least 50 characters"),
  businessObjectives: z
    .array(z.object({ objective: z.string(), measurableTarget: z.string(), timeline: z.string() }))
    .refine(
      (arr) => arr.some((o) => o.objective.trim().length > 0),
      { message: "Add at least one business objective" },
    ),
  painPoints: z
    .array(z.object({ problemDescription: z.string(), whoExperiences: z.string() }))
    .refine(
      (arr) => arr.some((p) => p.problemDescription.trim().length > 0 && p.whoExperiences.trim().length > 0),
      { message: "Add at least one pain point with both fields filled" },
    ),
  businessCriticality: nonEmptyString("Select a business criticality level"),
  desiredFutureState: z
    .string()
    .min(30, "Desired future state must be at least 30 characters"),
  endUserProfiles: z
    .array(z.object({ roleName: z.string(), count: z.string(), ageRange: z.string(), techLiteracy: z.string(), primaryDevice: z.string(), geography: z.string(), accessibilityNeeds: z.string() }))
    .refine(
      (arr) => arr.some((p) => p.roleName.trim().length > 0),
      { message: "Add at least one end user profile" },
    ),
  currentState: z
    .string()
    .min(1, "Current state is required"),
  definitionOfSuccess: z
    .string()
    .min(30, "Definition of success must be at least 30 characters"),
});

// ---------------------------------------------------------------------------
// Step 1 - Project Scope
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  title: z.string().min(3, "Project title must be at least 3 characters"),
  client: z.string().min(2, "Client name must be at least 2 characters"),
  industry: nonEmptyString("Select an industry"),
  projectCategory: nonEmptyString("Select a project category"),
  platformType: nonEmptyString("Select a platform type"),
  featureModules: z
    .array(z.object({ moduleName: z.string(), description: z.string(), priority: z.string() }))
    .refine(
      (arr) => arr.filter((m) => m.moduleName.trim().length > 0).length >= 2,
      { message: "Add at least 2 feature modules" },
    ),
  userRoles: z
    .array(z.object({ roleName: z.string(), primaryActions: z.string() }))
    .refine(
      (arr) => arr.some((r) => r.roleName.trim().length > 0),
      { message: "Add at least one user role" },
    ),
  businessWorkflows: z
    .array(z.object({ name: z.string(), steps: z.string(), outcome: z.string() }))
    .refine(
      (arr) => arr.some((w) => w.name.trim().length > 0),
      { message: "Add at least one business workflow" },
    ),
  outOfScope: nonEmptyList(1, "Add at least one out-of-scope item"),
});

// ---------------------------------------------------------------------------
// Step 2 - Technical
// ---------------------------------------------------------------------------

const step2Schema = z.object({
  developmentScope: nonEmptyList(
    1,
    "Select at least one development scope",
  ),
  uiuxDesignScope: nonEmptyString("Select UI/UX design scope"),
  deploymentScope: nonEmptyString("Select deployment scope"),
  goLiveScope: nonEmptyString("Select go-live scope"),
  techStack: z
    .string()
    .min(10, "Tech stack must be at least 10 characters"),
});

// ---------------------------------------------------------------------------
// Step 3 - Integrations (skippable)
// ---------------------------------------------------------------------------

// No required validation.

// ---------------------------------------------------------------------------
// Step 4 - Timeline (skippable)
// ---------------------------------------------------------------------------

// No required validation.

// ---------------------------------------------------------------------------
// Step 5 - Budget & Risk
// ---------------------------------------------------------------------------

const step5Schema = z
  .object({
    budgetMin: z.coerce
      .number()
      .refine((n) => n > 0, {
        message: "Budget minimum must be greater than 0",
      }),
    budgetMax: z.coerce
      .number()
      .refine((n) => n > 0, {
        message: "Maximum budget must be greater than 0",
      }),
    pricingModel: nonEmptyString("Select a pricing model"),
    knownRisks: nonEmptyList(1, "Add at least one known risk"),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: "Maximum budget must be greater than or equal to minimum",
    path: ["budgetMax"],
  });

// ---------------------------------------------------------------------------
// Step 6 - Quality (skippable)
// ---------------------------------------------------------------------------

// No required validation.

// ---------------------------------------------------------------------------
// Step 7 - Governance
// ---------------------------------------------------------------------------

const step7Schema = z.object({
  complianceStandards: z.array(z.string()).min(1, "Select at least one compliance standard"),
  reportingFrequency: nonEmptyString("Select reporting frequency"),
  communicationChannels: nonEmptyString("Select communication channels"),
});

// ---------------------------------------------------------------------------
// Step 8 - Commercial
// ---------------------------------------------------------------------------

const step8Schema = z.object({
  paymentTerms: nonEmptyString("Select payment terms"),
  ipOwnership: nonEmptyString("Select IP ownership"),
  terminationNoticePeriod: nonEmptyString("Select termination notice period"),
});

// ---------------------------------------------------------------------------
// Step 9 - Review
// ---------------------------------------------------------------------------

const step9Schema = z.object({
  businessOwnerApprover: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Business owner approver is required")),
});

// ---------------------------------------------------------------------------
// Schema lookup
// ---------------------------------------------------------------------------

const schemas: Record<number, z.ZodTypeAny | null> = {
  0: step0Schema,
  1: step1Schema,
  2: step2Schema,
  3: null, // skippable
  4: null, // skippable
  5: step5Schema,
  6: null, // skippable
  7: step7Schema,
  8: step8Schema,
  9: step9Schema,
};

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/**
 * Validate a single step of the SOW Generator form.
 *
 * @param step  - Zero-based step index (0-9).
 * @param formData - The current form data (only the fields relevant to the
 *                   step need to be present).
 * @returns An object mapping field names to their first error message.
 *          An empty object means the step is valid.
 */
export function validateStep(step: number, formData: any): StepErrors {
  const schema = schemas[step];

  // Steps without a schema are always valid (skippable).
  if (!schema) {
    return {};
  }

  const result = schema.safeParse(formData);

  if (result.success) {
    return {};
  }

  const errors: StepErrors = {};

  // Friendly fallback messages for fields with structured types
  const friendlyMessages: Record<string, string> = {
    businessObjectives: "Add at least one business objective",
    painPoints: "Add at least one pain point with both fields filled",
    endUserProfiles: "Add at least one end user profile",
    featureModules: "Add at least 2 feature modules",
    userRoles: "Add at least one user role",
    businessWorkflows: "Add at least one business workflow",
  };

  for (const issue of result.error.issues) {
    // Use the top-level field name as the key (first path segment).
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_root";

    // Keep only the first error per field.
    if (!errors[key]) {
      // Use friendly message for type-mismatch errors on structured fields
      const isFriendly = friendlyMessages[key] && (
        issue.code === "invalid_type" || issue.message.startsWith("Invalid input")
      );
      errors[key] = isFriendly ? friendlyMessages[key] : issue.message;
    }
  }

  return errors;
}

/**
 * Validate a single field within a step.
 * Returns the error message for that field, or undefined if valid.
 */
export function validateField(step: number, field: string, formData: any): string | undefined {
  const errors = validateStep(step, formData);
  return errors[field];
}
