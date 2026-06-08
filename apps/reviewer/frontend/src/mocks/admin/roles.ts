/**
 * Admin · platform-wide RBAC roles — spec doc 04 §5.O.
 * Phase 1: list of role definitions across all portals.
 */

export type RoleScope = "plat" | "ent" | "mentor" | "contributor";

export interface MockRoleDef {
  code: string;              // e.g. "ent.admin"
  scope: RoleScope;
  description: string;
  permissions: string[];     // human-readable
  builtIn: boolean;
  membersCount: number;
}

export const MOCK_ROLES: MockRoleDef[] = [];
