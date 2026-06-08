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

export const MOCK_MENTORS: MockMentor[] = [];

export function getMockMentor(id: string): MockMentor | undefined {
  return MOCK_MENTORS.find((m) => m.id === id);
}
