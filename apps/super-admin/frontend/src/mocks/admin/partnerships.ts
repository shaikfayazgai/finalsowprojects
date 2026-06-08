/**
 * Admin · partnerships — spec doc 04 §5.N.
 */

export type UniversityStudentStatus = "invited" | "registered" | "onboarding" | "active";

export interface MockUniversityStudent {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  programme?: string;
  supervisorEmail?: string;
  status: UniversityStudentStatus;
  enrolledAt: string;
  /** Unique token for this student's personal registration link. */
  inviteToken: string;
  inviteSentAt?: string;
  registeredAt?: string;
}

export interface MockUniversity {
  id: string;
  name: string;
  country: string;
  agreementRef: string;
  agreementSignedAt: string;
  studentsInFlight: number;
  studentsAlumni: number;
  leadContact: { name: string; email: string; title: string };
  supervisors: { name: string; email: string; department: string }[];
  academicRecognitionRules: string;
  /** Roster of students linked to this MOU — source of truth when present. */
  cohort?: MockUniversityStudent[];
}

export const MOCK_UNIVERSITIES: MockUniversity[] = [
  { id: "u-anna",     name: "Anna University",         country: "India",  agreementRef: "MOU-2026-014", agreementSignedAt: "2026-01-22T00:00:00Z", studentsInFlight: 42, studentsAlumni: 18, leadContact: { name: "Dr. Sundar Krishnan", email: "sundar@annauniv.edu", title: "Dean, External Programs" }, supervisors: [ { name: "Prof. Lakshmi N.", email: "lakshmi@annauniv.edu", department: "Computer Science" }, { name: "Prof. Raghav K.",  email: "raghav@annauniv.edu",  department: "Design" } ], academicRecognitionRules: "Up to 2 credits per semester for completed GlimmoraTeam tasks. Faculty supervisor signs off each completion.", cohort: [
    { id: "stu-1", name: "Ramesh Kumar", email: "ramesh.k@example.in", rollNumber: "CS2025-041", programme: "B.Tech CS, Year 3", supervisorEmail: "lakshmi@annauniv.edu", status: "active", enrolledAt: "2026-04-10T08:00:00Z", inviteToken: "inv-anna-ramesh01", inviteSentAt: "2026-04-08T10:00:00Z", registeredAt: "2026-04-10T08:00:00Z" },
    { id: "stu-2", name: "Priya Venkat", email: "priya.v@annauniv.edu", rollNumber: "CS2026-112", programme: "B.Tech CS, Year 2", supervisorEmail: "lakshmi@annauniv.edu", status: "onboarding", enrolledAt: "2026-05-26T14:00:00Z", inviteToken: "inv-anna-priya02", inviteSentAt: "2026-05-25T09:00:00Z", registeredAt: "2026-05-26T14:00:00Z" },
    { id: "stu-3", name: "Karthik M.", email: "karthik.m@annauniv.edu", status: "invited", enrolledAt: "2026-05-28T09:00:00Z", inviteToken: "inv-anna-karthik03" },
  ] },
  { id: "u-iitm",     name: "IIT Madras",              country: "India",  agreementRef: "MOU-2026-019", agreementSignedAt: "2026-02-18T00:00:00Z", studentsInFlight: 18, studentsAlumni: 4,  leadContact: { name: "Dr. Aravind P.",      email: "aravind@iitm.ac.in",    title: "Faculty Coordinator" },     supervisors: [ { name: "Prof. Suresh M.",  email: "suresh@iitm.ac.in",  department: "Computer Science" } ], academicRecognitionRules: "Pilot — credit not yet recognized; participation noted on transcript." },
  { id: "u-nid",      name: "National Institute of Design", country: "India", agreementRef: "MOU-2026-026", agreementSignedAt: "2026-03-04T00:00:00Z", studentsInFlight: 8,  studentsAlumni: 2,  leadContact: { name: "Prof. Mridula B.",    email: "mridula@nid.edu",       title: "Dean, Communications Design" }, supervisors: [ { name: "Prof. Karthik S.", email: "karthik@nid.edu",    department: "Industrial Design" } ], academicRecognitionRules: "1 elective credit on completion of cohort + portfolio review." },
];

export type WWContributorStatus = "invited" | "registered" | "onboarding" | "active";

export interface MockWWContributor {
  id: string;
  name: string;
  email: string;
  referredBy?: string;
  supervisorEmail?: string;
  wantsPeerMentor?: boolean;
  status: WWContributorStatus;
  enrolledAt: string;
  inviteToken: string;
  inviteSentAt?: string;
  registeredAt?: string;
}

export interface MockWWPartner {
  id: string;
  name: string;
  country: string;
  contributors: number;
  programs: string[];
  leadContact: { name: string; email: string; title: string };
  description: string;
  peerMentorPairings?: { contributor: string; mentor: string; since: string }[];
  cohort?: MockWWContributor[];
}

export const MOCK_WW_PARTNERS: MockWWPartner[] = [
  { id: "ww-sheroes",     name: "Sheroes.in",           country: "India",  contributors: 18, programs: ["Mentorship pairing", "Skills upgrade"],     leadContact: { name: "Sairee Chahal",    email: "partnerships@sheroes.in",       title: "Founder" },                description: "Largest community for women in India; partner for women-workforce contributor onboarding.", peerMentorPairings: [{ contributor: "Sunita Devi", mentor: "Priya Iyer", since: "2026-05-20" }, { contributor: "Anita Ramesh", mentor: "Fatima Nair", since: "2026-05-18" }], cohort: [
    { id: "wwc-1", name: "Sunita Devi", email: "sunita.d@sheroes.in", referredBy: "Sairee Chahal", wantsPeerMentor: true, status: "onboarding", enrolledAt: "2026-05-20T08:00:00Z", inviteToken: "inv-sheroes-sunita01", inviteSentAt: "2026-05-19T10:00:00Z", registeredAt: "2026-05-20T08:00:00Z" },
    { id: "wwc-2", name: "Anita Ramesh", email: "anita.r@example.in", status: "invited", enrolledAt: "2026-05-27T09:00:00Z", inviteToken: "inv-sheroes-anita02" },
    { id: "wwc-3", name: "Kavitha S.", email: "kavitha.s@sheroes.in", status: "active", enrolledAt: "2026-04-15T08:00:00Z", inviteToken: "inv-sheroes-kavitha03", inviteSentAt: "2026-04-14T09:00:00Z", registeredAt: "2026-04-15T08:00:00Z" },
  ] },
  { id: "ww-wwcode",      name: "Women Who Code",       country: "Global", contributors: 12, programs: ["Outreach", "Conference talks"],            leadContact: { name: "Alaina Percival",  email: "partnerships@womenwhocode.com", title: "Board Director" },         description: "Global non-profit for women technologists; pipeline for engineering tracks." },
  { id: "ww-tieblr",      name: "TiE Bangalore",        country: "India",  contributors: 6,  programs: ["Mentorship pairing"],                       leadContact: { name: "Naveen Asrani",     email: "naveen@tieblr.org",             title: "Programs Director" },       description: "Entrepreneur network; provides senior mentors for women-led ventures." },
  { id: "ww-skillsdev",   name: "Skills Development Council", country: "India", contributors: 2, programs: ["Outreach"],                              leadContact: { name: "Vandana Joshi",     email: "vandana@sdc-india.org",         title: "Outreach Lead" },           description: "Government-affiliated body; outreach into Tier-2 / Tier-3 cities." },
];

export function findUniversityById(id: string) { return MOCK_UNIVERSITIES.find((u) => u.id === id); }
export function findWWPartnerById(id: string)  { return MOCK_WW_PARTNERS.find((w) => w.id === id); }
