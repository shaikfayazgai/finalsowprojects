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

export const MOCK_KYC_CASES: MockKycCase[] = [
  {
    id: "KYC-892",
    contributorName: "Anita Ramesh",
    contributorEmail: "anita.r@example.in",
    dob: "1995-03-15",
    country: "India",
    track: "Women WF",
    submittedAt: "2026-05-27T03:00:00Z",
    slaHours: 8,
    status: "pending",
    idType: "Aadhaar",
    idNumberLast4: "1234",
    autoChecks: [
      { label: "ID format valid",                 state: "pass" },
      { label: "Name match (90% confidence)",     state: "pass" },
      { label: "Photo clarity: medium",           state: "warn" },
      { label: "No watchlist match",              state: "pass" },
    ],
  },
  {
    id: "KYC-891",
    contributorName: "Vivek Menon",
    contributorEmail: "vivek.m@example.in",
    dob: "1992-08-21",
    country: "India",
    track: "Freelancer",
    submittedAt: "2026-05-26T07:00:00Z",
    slaHours: 8,
    status: "approved",
    idType: "Passport",
    idNumberLast4: "9821",
    autoChecks: [
      { label: "ID format valid",                 state: "pass" },
      { label: "Name match (98% confidence)",     state: "pass" },
      { label: "Photo clarity: high",             state: "pass" },
      { label: "No watchlist match",              state: "pass" },
    ],
    decision: { outcome: "approved", at: "2026-05-26T09:30:00Z", by: "Sneha Pillai" },
  },
  {
    id: "KYC-890",
    contributorName: "Ramesh Kumar",
    contributorEmail: "ramesh.k@example.in",
    dob: "1988-01-04",
    country: "India",
    track: "Student",
    submittedAt: "2026-05-25T07:00:00Z",
    slaHours: 8,
    status: "rejected",
    idType: "Driving Licence",
    idNumberLast4: "4477",
    autoChecks: [
      { label: "ID format valid",                 state: "pass" },
      { label: "Name match (62% confidence)",     state: "warn" },
      { label: "Photo clarity: low",              state: "warn" },
      { label: "No watchlist match",              state: "pass" },
    ],
    decision: { outcome: "rejected", reason: "Photograph unreadable; ID details did not match the contributor's stated name. Re-upload allowed.", at: "2026-05-25T12:00:00Z", by: "Sneha Pillai" },
  },
  {
    id: "KYC-894",
    contributorName: "Priya Venkat",
    contributorEmail: "priya.v@annauniv.edu",
    dob: "2004-11-12",
    country: "India",
    track: "Student",
    submittedAt: "2026-05-28T08:00:00Z",
    slaHours: 8,
    status: "pending",
    idType: "Aadhaar",
    idNumberLast4: "8821",
    autoChecks: [
      { label: "ID format valid",             state: "pass" },
      { label: "Name match (94% confidence)", state: "pass" },
      { label: "Photo clarity: high",         state: "pass" },
      { label: "No watchlist match",          state: "pass" },
    ],
  },
  {
    id: "KYC-893",
    contributorName: "Sunita Devi",
    contributorEmail: "sunita.d@sheroes.in",
    dob: "1990-07-09",
    country: "India",
    track: "Women WF",
    submittedAt: "2026-05-27T07:00:00Z",
    slaHours: 8,
    status: "reuploaded",
    idType: "Aadhaar",
    idNumberLast4: "5566",
    autoChecks: [
      { label: "ID format valid",                 state: "pass" },
      { label: "Name match (95% confidence)",     state: "pass" },
      { label: "Photo clarity: high",             state: "pass" },
      { label: "No watchlist match",              state: "pass" },
    ],
  },
];

export const MOCK_KYC_SUMMARY = {
  pending: 1,
  approved30d: 12,
  rejected30d: 2,
  reuploaded: 1,
};
