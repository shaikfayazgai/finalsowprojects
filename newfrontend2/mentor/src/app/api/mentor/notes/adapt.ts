/** Backend mentor_notes row shape (snake_case) → frontend NoteDetail (camelCase). */

export type BackendNote = {
  id: string | number;
  mentor_id: string;
  tenant_id: string | null;
  session_id: string | null;
  contributor_id: string | null;
  visibility: string;
  body: string;
  kind?: string;
  created_at: string;
  updated_at?: string;
};

export function adaptNote(n: BackendNote) {
  return {
    id: String(n.id),
    sessionId: n.session_id,
    mentorId: n.mentor_id,
    contributorId: n.contributor_id,
    tenantId: n.tenant_id,
    body: n.body,
    visibility: n.visibility,
    kind: n.kind ?? "coaching",
    createdAt: n.created_at,
    updatedAt: n.updated_at ?? n.created_at,
  };
}
