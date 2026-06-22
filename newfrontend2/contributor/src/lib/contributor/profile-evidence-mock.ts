import {
  MOCK_PROFILE_EVIDENCE,
  type MockProfileEvidenceItem,
  type ProfileEvidenceType,
} from "@/mocks/contributor/profile-evidence";

export interface EvidenceListParams {
  q?: string;
  type?: string;
  skill?: string;
}

export interface EvidenceWriteBody {
  title: string;
  type: string;
  url?: string;
  file_id?: string;
  description?: string;
  skills?: Array<{ name: string; proficiency: string }>;
}

let store: MockProfileEvidenceItem[] = MOCK_PROFILE_EVIDENCE.map((item) => ({ ...item }));

function cloneStore(): MockProfileEvidenceItem[] {
  return store.map((item) => ({
    ...item,
    skills: item.skills.map((s) => ({ ...s })),
  }));
}

function filterItems(items: MockProfileEvidenceItem[], params: EvidenceListParams) {
  let result = items;
  const needle = params.q?.trim().toLowerCase();
  if (needle) {
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle),
    );
  }
  if (params.type?.trim()) {
    const t = params.type.trim().toLowerCase();
    result = result.filter((item) => item.type === t);
  }
  if (params.skill?.trim()) {
    const sk = params.skill.trim().toLowerCase();
    result = result.filter((item) =>
      item.skills.some((s) => s.name.toLowerCase().includes(sk)),
    );
  }
  return result;
}

export function listMockProfileEvidence(params: EvidenceListParams = {}) {
  const items = filterItems(cloneStore(), params);
  return { items, total: items.length };
}

export function createMockProfileEvidence(body: EvidenceWriteBody): MockProfileEvidenceItem {
  const type = (body.type?.toLowerCase() ?? "link") as ProfileEvidenceType;
  const item: MockProfileEvidenceItem = {
    id: `ev-${Date.now().toString(36)}`,
    title: body.title.trim(),
    type: type === "github" || type === "file" ? type : "link",
    url: body.url?.trim() || undefined,
    file_id: body.file_id?.trim() || undefined,
    description: body.description?.trim() ?? "",
    skills: (body.skills ?? []).map((s) => ({
      name: s.name,
      proficiency: s.proficiency ?? "intermediate",
    })),
    uploadedAt: new Date().toISOString(),
  };
  store = [item, ...store];
  return { ...item, skills: item.skills.map((s) => ({ ...s })) };
}

export function updateMockProfileEvidence(
  id: string,
  body: Partial<EvidenceWriteBody>,
): MockProfileEvidenceItem | null {
  const index = store.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const current = store[index];
  const nextType = body.type?.toLowerCase() as ProfileEvidenceType | undefined;
  const updated: MockProfileEvidenceItem = {
    ...current,
    title: body.title?.trim() ?? current.title,
    type: nextType === "github" || nextType === "file" || nextType === "link" ? nextType : current.type,
    url: body.url !== undefined ? body.url.trim() || undefined : current.url,
    file_id: body.file_id !== undefined ? body.file_id.trim() || undefined : current.file_id,
    description: body.description !== undefined ? body.description.trim() : current.description,
    skills:
      body.skills !== undefined
        ? body.skills.map((s) => ({ name: s.name, proficiency: s.proficiency ?? "intermediate" }))
        : current.skills,
  };
  store[index] = updated;
  return { ...updated, skills: updated.skills.map((s) => ({ ...s })) };
}

export function deleteMockProfileEvidence(id: string): boolean {
  const before = store.length;
  store = store.filter((item) => item.id !== id);
  return store.length < before;
}

export function resetMockProfileEvidenceStore() {
  store = MOCK_PROFILE_EVIDENCE.map((item) => ({ ...item, skills: item.skills.map((s) => ({ ...s })) }));
}
