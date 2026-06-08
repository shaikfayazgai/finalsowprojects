import type { MockCredential } from "@/mocks/contributor/credentials";

export function fmtIssuedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtIssuedDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function levelLabel(level: MockCredential["level"]): string {
  switch (level) {
    case "L1":
      return "Foundation";
    case "L2":
      return "Proficient";
    case "L3":
      return "Advanced";
    case "L4":
      return "Expert";
    default:
      return level;
  }
}

export function credentialSearchHaystack(c: MockCredential): string {
  return [
    c.taskTitle,
    c.skill,
    c.level,
    levelLabel(c.level),
    c.project,
    c.description,
    c.verifierName,
    c.verifierOrg,
    c.shareId,
  ]
    .join(" ")
    .toLowerCase();
}

export function countUnique(values: string[]): number {
  return new Set(values.filter(Boolean)).size;
}

export function uniqueSkills(list: MockCredential[]): string[] {
  return [...new Set(list.map((c) => c.skill))].sort((a, b) => a.localeCompare(b));
}

export function publicCredentialUrl(shareId: string): string {
  if (typeof window === "undefined") return `/public/credentials/${shareId}`;
  return `${window.location.origin}/public/credentials/${shareId}`;
}
