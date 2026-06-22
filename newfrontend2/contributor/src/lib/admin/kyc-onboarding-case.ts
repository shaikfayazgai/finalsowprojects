import type { MockKycCase } from "@/mocks/admin/kyc";
import type { ContribType } from "@/lib/contributor/track";

function mapIdType(
  idType?: string,
): MockKycCase["idType"] {
  const t = (idType ?? "").toLowerCase();
  if (t.includes("passport")) return "Passport";
  if (t.includes("drive") || t.includes("licen")) return "Driving Licence";
  if (t.includes("aadhaar") || t.includes("aadhar")) return "Aadhaar";
  return "National ID";
}

/** Builds an admin-queue case for the mock KYC overlay after onboarding finalize. */
export function buildAdminKycCaseFromOnboarding(input: {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  contribType: ContribType;
  country?: string;
  dob?: string;
  idType?: string;
  idNumber?: string;
}): MockKycCase {
  const track: MockKycCase["track"] =
    input.contribType === "women_workforce" ? "Women WF" : "Freelancer";
  const digits = (input.idNumber ?? "").replace(/\D/g, "");
  const last4 = digits.slice(-4).padStart(4, "0");

  return {
    id: `KYC-${input.userId.slice(-8).toUpperCase()}`,
    contributorName: `${input.firstName} ${input.lastName ?? ""}`.trim(),
    contributorEmail: input.email.toLowerCase(),
    dob: input.dob ?? "2000-01-01",
    country: input.country ?? "India",
    track,
    submittedAt: new Date().toISOString(),
    slaHours: 8,
    status: "pending",
    idType: mapIdType(input.idType),
    idNumberLast4: last4,
    autoChecks: [
      { label: "ID format valid", state: "pass" },
      { label: "Name match (pending manual review)", state: "warn" },
      { label: "Photo clarity: pending review", state: "warn" },
      { label: "No watchlist match", state: "pass" },
    ],
  };
}
