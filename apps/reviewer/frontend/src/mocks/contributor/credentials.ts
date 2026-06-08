/**
 * Mock credentials — spec §5.M.
 *
 * Credentials are issued for accepted tasks. Each has a shareable
 * public URL via /public/credentials/[shareId].
 */

export interface MockCredential {
  id: string;
  shareId: string;
  taskId: string;
  taskTitle: string;
  skill: string;
  level: "L1" | "L2" | "L3" | "L4";
  project: string;
  issuedAt: string;
  verifierName: string;
  verifierOrg: string;
  evidenceUrl?: string;
  description: string;
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_CREDENTIALS: MockCredential[] = [];

export function getMockCredential(id: string): MockCredential | undefined {
  return MOCK_CREDENTIALS.find((c) => c.id === id);
}
