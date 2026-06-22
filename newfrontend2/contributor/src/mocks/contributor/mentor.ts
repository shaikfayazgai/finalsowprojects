/**
 * Mock mentor directory — used by the workroom Reviewer rail (§5.E.1)
 * and the submission detail Reviewer field (§5.J.2). When backend wires
 * up, this is replaced by a join on the assigned mentor record.
 */

export interface MockMentor {
  id: string;
  name: string;
  initials: string;
  role: string;
  email?: string;
  responseSlaHours: number;
}

export const MOCK_MENTORS: MockMentor[] = [
  { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems", email: "priya.iyer@helios.example", responseSlaHours: 24 },
  { id: "mentor-karthik", name: "Karthik Iyer", initials: "KI", role: "Staff · Data", email: "karthik@helios.example", responseSlaHours: 36 },
  { id: "mentor-anjali", name: "Anjali Reddy", initials: "AR", role: "Senior · Accessibility", email: "anjali@helios.example", responseSlaHours: 24 },
];

export function getMockMentor(id: string): MockMentor | undefined {
  return MOCK_MENTORS.find((m) => m.id === id);
}
