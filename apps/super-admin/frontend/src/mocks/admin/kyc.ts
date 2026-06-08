/**
 * Admin · KYC review queue — spec doc 04 §5.I.
 */

export type KycStatus = "pending" | "approved" | "rejected" | "awaiting_info" | "reuploaded";
export type KycTrack = "Women WF" | "Student" | "Freelancer" | "Internal";

export interface MockKycCase {
  id: string;
  contributorName: string;
  contributorEmail: string;
  dob: string;
  country: string;
  track: KycTrack;
  submittedAt: string;
  slaHours: number;
  status: KycStatus;
  idType: "Aadhaar" | "Passport" | "Driving Licence" | "National ID";
  idNumberLast4: string;
  autoChecks: { label: string; state: "pass" | "warn" | "fail" }[];
  decision?: {
    outcome: "approved" | "rejected" | "more_info";
    reason?: string;
    note?: string;
    at: string;
    by: string;
  };
}

export const MOCK_KYC_CASES: MockKycCase[] = [];

export const MOCK_KYC_SUMMARY = {
  pending: 0,
  approved30d: 0,
  rejected30d: 0,
  reuploaded: 0,
};
