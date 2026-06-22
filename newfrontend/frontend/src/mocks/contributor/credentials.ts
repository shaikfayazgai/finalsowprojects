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

export const MOCK_CREDENTIALS: MockCredential[] = [
  {
    id: "cred-001",
    shareId: "AB12CDE",
    taskId: "task-008",
    taskTitle: "Decomposition unit tests",
    skill: "TypeScript",
    level: "L3",
    project: "Reporting V2",
    issuedAt: daysAgo(14),
    verifierName: "Karthik Iyer",
    verifierOrg: "Helios",
    description: "Wrote unit tests covering all branches of the dependency resolver, including cycles and orphans.",
  },
  {
    id: "cred-002",
    shareId: "FG34HIJ",
    taskId: "task-009",
    taskTitle: "Tenancy bootstrap docs",
    skill: "Technical writing",
    level: "L2",
    project: "Reporting V2",
    issuedAt: daysAgo(22),
    verifierName: "Priya Iyer",
    verifierOrg: "Helios",
    description: "Authored step-by-step docs for the tenant scaffold CLI, with screenshots and rollback notes.",
  },
  {
    id: "cred-003",
    shareId: "KL56MNO",
    taskId: "task-008-prev",
    taskTitle: "Audit log timestamp fix",
    skill: "Postgres",
    level: "L2",
    project: "Reporting V2",
    issuedAt: daysAgo(38),
    verifierName: "Karthik Iyer",
    verifierOrg: "Helios",
    description: "Diagnosed + fixed a timezone-conversion bug in audit-event timestamps.",
  },
];

export function getMockCredential(id: string): MockCredential | undefined {
  return MOCK_CREDENTIALS.find((c) => c.id === id);
}
