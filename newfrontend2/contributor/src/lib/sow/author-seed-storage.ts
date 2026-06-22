const KEY = "glimmora.sow-intake.author-seed.v1";

export interface AuthorSeed {
  title: string;
  body: string;
  confidentiality: "internal" | "confidential" | "restricted";
  sourceFileName?: string;
}

export function readAuthorSeed(): AuthorSeed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthorSeed;
  } catch {
    return null;
  }
}

export function writeAuthorSeed(seed: AuthorSeed): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(seed));
}

export function clearAuthorSeed(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
