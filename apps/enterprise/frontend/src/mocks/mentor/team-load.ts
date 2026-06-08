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
  poolName: "Helios review pool",
  members: [
    { id: "mentor-priya",   displayName: "Priya I.", isYou: false, loadPct: 60, pendingReviews: 4 },
    { id: "mentor-rajesh",  displayName: "Rajesh V.", loadPct: 80, pendingReviews: 5 },
    { id: "mentor-amelia",  displayName: "Amelia S.", loadPct: 20, pendingReviews: 1 },
    { id: "mentor-yusuf",   displayName: "Yusuf O. (you)", isYou: true, loadPct: 92, pendingReviews: 6, atLimit: true },
  ] satisfies MockTeamMember[],
};
