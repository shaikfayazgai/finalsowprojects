/**
 * Labels every E2E test with data/backend honesty.
 * - ui-mock: page loads; assertions on mock/in-memory data only
 * - ui-real: page loads; backed by Prisma/session APIs
 * - e2e-real: full journey with persisted side effects verified
 * - blocked: known missing wiring — test documents failure explicitly
 */

export type FlowTier = "ui-mock" | "ui-real" | "e2e-real" | "blocked";

export interface FlowCase {
  id: string;
  portal: string;
  name: string;
  tier: FlowTier;
  routes: string[];
  note?: string;
}
