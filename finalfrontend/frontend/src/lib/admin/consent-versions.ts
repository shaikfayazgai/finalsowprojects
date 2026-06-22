export interface ConsentVersion {
  id: string;
  label: string;
  effectiveDate: string;
}

export const PLATFORM_CONSENT_VERSIONS: ConsentVersion[] = [
  { id: "platform-tc-v2.4", label: "Platform Terms & Conditions v2.4", effectiveDate: "2026-05-01" },
  { id: "platform-tc-v2.3", label: "Platform Terms & Conditions v2.3", effectiveDate: "2026-01-15" },
  { id: "gdpr-addendum-v1.1", label: "GDPR Data Processing Addendum v1.1", effectiveDate: "2025-11-01" },
];

export function consentLabel(id: string): string {
  return PLATFORM_CONSENT_VERSIONS.find((v) => v.id === id)?.label ?? id;
}
