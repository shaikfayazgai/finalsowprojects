"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { contributorRegistrationSchema, enterpriseRegistrationSchema } from "@/lib/validations/registration";
import { sendEmail, buildEmailHtml } from "@/lib/email";
import { DEFAULT_TEMPLATES } from "@/lib/stores/email-template-store";
import { getBaseUrl } from "@/lib/utils/base-url";
import {
  completeContributorOnboarding,
  finalizeLightweightOnboarding,
  OnboardingError,
  persistLocalContributorRegistration,
} from "@/lib/contributor/onboarding";
import {
  registrationTrackToContribType,
  type ContribType,
} from "@/lib/contributor/track";
import type { Session } from "next-auth";
import type { MockKycCase } from "@/mocks/admin/kyc";

export type ActionResult =
  | { success: true; emailWarning?: string }
  | { success: false; error: string };

export type FinalizeOnboardingResult =
  | { success: true; adminKycCase?: MockKycCase }
  | { success: false; error: string };

// ── Contributor Registration ──────────────────────────────────────────────

export async function registerContributor(data: unknown): Promise<ActionResult> {
  const parsed = contributorRegistrationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  try {
    await authApi.registerContributor({
      firstName:               v.firstName,
      lastName:                v.lastName,
      email:                   v.email.toLowerCase(),
      password:                v.password,
      confirmPassword:         v.password,
      contributorType:         v.contribType,
      countryOfResidence:      v.country,
      dateOfBirth:             v.dob,
      timeZone:                v.timezone,
      weeklyAvailabilityHours: String(parseInt(v.availability, 10)),
      departmentCategory:      v.departmentCategory,
      primarySkills:           v.primarySkills,
      secondarySkills:         v.secondarySkills,
      otherSkills:             v.otherSkills,
      phone:                   v.phone ?? "",
      degree:                  v.degree,
      branch:                  v.branch,
      linkedin:                v.linkedin,
      careerStage:             v.careerStage,
      yearsExperience:         v.yearsExperience,
      workStart:               v.workStart,
      workEnd:                 v.workEnd,
      // Use full name as signatory if no explicit signature provided
      ndaSignatoryLegalName:   v.ndaSignature || `${v.firstName} ${v.lastName}`,
      mentorGuideAcknowledged: true,
      acceptTermsOfUse:        v.acceptTos,
      acceptCodeOfConduct:     v.acceptCoc,
      acceptPrivacyPolicy:     v.acceptPrivacy,
      acceptHarassmentPolicy:  v.acceptAhp,
      acknowledgmentsAccepted: true,
      notifyNewTasksOptIn:     false,
      marketingOptIn:          v.marketingOptIn,
    });

    try {
      await persistLocalContributorRegistration({
        email: v.email.toLowerCase(),
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
        contribType: v.contribType as ContribType,
        country: v.country,
        dob: v.dob,
        timezone: v.timezone,
        departmentCategory: v.departmentCategory,
        departmentOther: v.departmentOther,
        primarySkills: v.primarySkills,
        secondarySkills: v.secondarySkills,
        otherSkills: v.otherSkills,
        availability: v.availability,
        degree: v.degree,
        branch: v.branch,
        linkedin: v.linkedin,
        careerStage: v.careerStage,
        yearsExperience: v.yearsExperience,
        workStart: v.workStart,
        workEnd: v.workEnd,
        phone: v.phone,
        ndaSignature: v.ndaSignature,
        acceptTos: v.acceptTos,
        acceptCoc: v.acceptCoc,
        acceptPrivacy: v.acceptPrivacy,
        acceptFee: v.acceptFee,
        acceptAhp: v.acceptAhp,
        marketingOptIn: v.marketingOptIn,
      });
    } catch (localErr) {
      console.error("[registerContributor] local profile sync failed", localErr);
    }

    const baseUrl = getBaseUrl();
    const contributorTpl = DEFAULT_TEMPLATES.welcome_contributor;
    const emailResult = await sendEmail({
      to: v.email.toLowerCase(),
      subject: contributorTpl.subject.replace("{{firstName}}", v.firstName),
      html: buildEmailHtml({
        bodyHtml: contributorTpl.bodyHtml,
        headerColor: contributorTpl.headerColor,
        footerText: contributorTpl.footerText,
        payload: {
          firstName: v.firstName,
          loginUrl: `${baseUrl}/auth/login`,
          onboardingUrl: `${baseUrl}/contributor/onboarding`,
        },
      }),
    });

    return emailResult.success
      ? { success: true }
      : { success: true, emailWarning: emailResult.error ?? "Welcome email failed to send." };
  } catch (err) {
    if (err instanceof ApiError) {
      console.error("[registerContributor] API error", err.status, err.message);
      if (err.status === 409) {
        // Backend returns { detail: { code: "EMAIL_ROLE_CONFLICT", message: "This email is already
        // registered as a <role> account." } } for both same-role and cross-role conflicts. Surface
        // the role-specific message rather than a generic "already exists" so the user knows which
        // role to sign in as.
        return { success: false, error: extractRoleConflictMessage(err, "An account with this email already exists") };
      }
      return { success: false, error: err.message };
    }
    console.error("[registerContributor] unexpected error", err);
    return { success: false, error: "Registration failed. Please try again." };
  }
}

function extractRoleConflictMessage(err: ApiError, fallback: string): string {
  const body = err.body as { detail?: { code?: string; message?: string } } | undefined;
  const detailMsg = body?.detail?.message;
  return typeof detailMsg === "string" && detailMsg.length > 0 ? detailMsg : fallback;
}

// ── SSO Contributor Onboarding (existing SSO user, no password) ──────────
// SSO onboarding still writes to the local Prisma DB so NextAuth can look up
// the contributor profile during the signIn callback.

export async function onboardContributor(data: {
  firstName: string;
  lastName?: string;
  email: string;
  provider?: string;
  contribType: string;
  country: string;
  dob: string;
  timezone: string;
  departmentCategory: string;
  departmentOther?: string;
  primarySkills: string[];
  secondarySkills: string[];
  otherSkills: string[];
  availability: string;
  degree?: string;
  branch?: string;
  linkedin?: string;
  careerStage?: string;
  yearsExperience?: string;
  workStart?: string;
  workEnd?: string;
  phone?: string;
  ndaAccepted: boolean;
  ndaSignature?: string;
  acceptTos: boolean;
  acceptCoc: boolean;
  acceptPrivacy: boolean;
  acceptFee: boolean;
  acceptAhp: boolean;
  marketingOptIn: boolean;
}): Promise<ActionResult> {
  // Session-derived identity: the client's `email` field is informational
  // only; the actual userId comes from the signed-in session.
  const session = (await auth()) as Session | null;
  const sessionUser = session?.user as
    | { id?: string; email?: string; role?: string; sessionId?: string; provider?: string }
    | undefined;
  if (!sessionUser?.id || !sessionUser.email) {
    return { success: false, error: "You must be signed in to complete onboarding." };
  }

  // Capture audit context (ip / ua / session) here in the server action
  // since the onboarding service is a plain function.
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    reqHeaders.get("x-real-ip") ??
    null;
  const userAgent = reqHeaders.get("user-agent") ?? null;

  try {
    const result = await completeContributorOnboarding(
      {
        userId: sessionUser.id,
        email: sessionUser.email,
        firstName: data.firstName,
        lastName: data.lastName,
        contribType: data.contribType as
          | "internal" | "student" | "women_workforce" | "general_workforce" | "",
        country: data.country,
        dob: data.dob,
        timezone: data.timezone,
        departmentCategory: data.departmentCategory,
        departmentOther: data.departmentOther,
        availability: data.availability,
        degree: data.degree,
        branch: data.branch,
        linkedin: data.linkedin,
        careerStage: data.careerStage,
        yearsExperience: data.yearsExperience,
        workStart: data.workStart,
        workEnd: data.workEnd,
        primarySkills: data.primarySkills,
        secondarySkills: data.secondarySkills,
        otherSkills: data.otherSkills,
        phone: data.phone,
        ndaAccepted: data.ndaAccepted,
        ndaSignature: data.ndaSignature,
        acceptTos: data.acceptTos,
        acceptCoc: data.acceptCoc,
        acceptPrivacy: data.acceptPrivacy,
        acceptFee: data.acceptFee,
        acceptAhp: data.acceptAhp,
        marketingOptIn: data.marketingOptIn,
      },
      {
        userId: sessionUser.id,
        portalRole: sessionUser.role as "contributor" | undefined ?? "contributor",
        sessionId: sessionUser.sessionId ?? null,
        ipAddress,
        userAgent,
      },
    );
    // The result.skillsSynced.unmatched array is intentionally not
    // surfaced to the UI yet — those strings remain on the profile so
    // the contributor can refine them later via a taxonomy picker.
    void result;
    return { success: true };
  } catch (err) {
    if (err instanceof OnboardingError) {
      return { success: false, error: err.message };
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[onboardContributor]", msg);
    return { success: false, error: msg };
  }
}

/** Marks unified `/onboarding/*` wizard complete for the signed-in contributor. */
export async function finalizeReferralOnboarding(data: {
  track?: string;
  country?: string;
  dob?: string;
  timezone?: string;
  availability?: string;
  workStyle?: string;
  primarySkills?: string[];
  secondarySkills?: string[];
  otherSkills?: string[];
  degree?: string;
  branch?: string;
  studentId?: string;
  programme?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  legalName?: string;
  idType?: string;
  idUploaded?: boolean;
  referredBy?: string;
  wantsPeerMentor?: boolean;
  acceptTos?: boolean;
  acceptCoc?: boolean;
  acceptPrivacy?: boolean;
  acceptFee?: boolean;
  acceptAhp?: boolean;
  marketingOptIn?: boolean;
  kycSubmitted?: boolean;
  kycIdType?: string;
  kycIdNumber?: string;
  payoutSkipped?: boolean;
}): Promise<FinalizeOnboardingResult> {
  const session = (await auth()) as Session | null;
  const sessionUser = session?.user as
    | { id?: string; email?: string; name?: string; role?: string; sessionId?: string }
    | undefined;
  if (!sessionUser?.id || !sessionUser.email) {
    return { success: false, error: "You must be signed in to complete onboarding." };
  }

  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    reqHeaders.get("x-real-ip") ??
    null;
  const userAgent = reqHeaders.get("user-agent") ?? null;

  const nameParts = (sessionUser.name ?? sessionUser.email.split("@")[0]).split(/\s+/);
  const firstName = nameParts[0] ?? "Contributor";
  const lastName = nameParts.slice(1).join(" ");

  const contribType = registrationTrackToContribType(data.track);

  try {
    const { adminKycCase } = await finalizeLightweightOnboarding(
      {
        userId: sessionUser.id,
        email: sessionUser.email,
        firstName,
        lastName,
        contribType,
        track: data.track,
        country: data.country,
        dob: data.dob,
        timezone: data.timezone,
        availability: data.availability,
        workStyle: data.workStyle,
        primarySkills: data.primarySkills,
        secondarySkills: data.secondarySkills,
        otherSkills: data.otherSkills,
        degree: data.degree,
        branch: data.branch,
        studentId: data.studentId,
        programme: data.programme,
        supervisorEmail: data.supervisorEmail,
        supervisorName: data.supervisorName,
        legalName: data.legalName,
        idType: data.idType,
        idUploaded: data.idUploaded,
        referredBy: data.referredBy,
        wantsPeerMentor: data.wantsPeerMentor,
        acceptTos: data.acceptTos,
        acceptCoc: data.acceptCoc,
        acceptPrivacy: data.acceptPrivacy,
        acceptFee: data.acceptFee,
        acceptAhp: data.acceptAhp,
        marketingOptIn: data.marketingOptIn,
        kycSubmitted: data.kycSubmitted,
        kycIdType: data.kycIdType,
        kycIdNumber: data.kycIdNumber,
        payoutSkipped: data.payoutSkipped,
      },
      {
        userId: sessionUser.id,
        portalRole: sessionUser.role ?? "contributor",
        ipAddress,
        userAgent,
        sessionId: sessionUser.sessionId ?? null,
      },
    );
    return { success: true, adminKycCase };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[finalizeReferralOnboarding]", msg);
    return { success: false, error: msg };
  }
}

// ── Enterprise Registration ───────────────────────────────────────────────

export async function registerEnterprise(data: unknown): Promise<ActionResult> {
  const parsed = enterpriseRegistrationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  try {
    await authApi.registerEnterprise({
      firstName:            v.adminFirstName,
      lastName:             v.adminLastName,
      email:                v.adminEmail.toLowerCase(),
      password:             v.password,
      orgName:              v.orgName,
      orgType:              v.orgType,
      orgTypeOther:         v.orgTypeOther,
      industry:             v.industry,
      industryOther:        v.industryOther,
      companySize:          v.companySize,
      adminTitle:           v.adminTitle,
      adminDept:            v.adminDept,
      website:              v.website,
      hqCountry:            v.hqCountry,
      hqCity:               v.hqCity,
      phone:                v.phone,
      incorporationCountry: v.incorporationCountry,
      acceptTos:            v.acceptTos,
      acceptPp:             v.acceptPp,
      acceptEsa:            v.acceptEsa,
      acceptAhp:            v.acceptAhp,
      marketingOptIn:       v.marketingOptIn,
    });

    const baseUrl = getBaseUrl();
    const enterpriseTpl = DEFAULT_TEMPLATES.welcome_enterprise;
    const emailResult = await sendEmail({
      to: v.adminEmail.toLowerCase(),
      subject: enterpriseTpl.subject.replace("{{orgName}}", v.orgName),
      html: buildEmailHtml({
        bodyHtml: enterpriseTpl.bodyHtml,
        headerColor: enterpriseTpl.headerColor,
        footerText: enterpriseTpl.footerText,
        payload: {
          firstName: v.adminFirstName,
          orgName: v.orgName,
          dashboardUrl: `${baseUrl}/enterprise/dashboard`,
        },
      }),
    });

    return emailResult.success
      ? { success: true }
      : { success: true, emailWarning: emailResult.error ?? "Welcome email failed to send." };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        return { success: false, error: extractRoleConflictMessage(err, "An account with this email already exists") };
      }
      return { success: false, error: err.message };
    }
    return { success: false, error: "Registration failed. Please try again." };
  }
}
