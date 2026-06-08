/**
 * Team load — spec doc 03 §5.B.2.
 * Lead-mentor-only module on the dashboard.
 */

export interface MockTeamMember {
  id: string;
  displayName: string;
  isYou?: boolean;
  loadPct: number;
  pendingReviews: number;
  atLimit?: boolean;
}

export const MOCK_TEAM_LOAD = {
  poolName: "",
  members: [] satisfies MockTeamMember[],
};
