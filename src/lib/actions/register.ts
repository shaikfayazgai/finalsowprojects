"use server";

import { prisma } from "@/lib/db";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  contributorRegistrationSchema,
  enterpriseRegistrationSchema,
} from "@/lib/validations/registration";
import { sendEmail } from "@/lib/email";

export type ActionResult = { success: true } | { success: false; error: string };

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://app.glimmora.com";
    sendEmail({
      to: v.email.toLowerCase(),
      subject: `Welcome to Glimmora, ${v.firstName}!`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#7C5C3E,#5C3D1E);border-radius:12px;padding:12px 20px;">
              <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.5px;">GlimmoraTeam</span>
            </div>
          </div>
          <h2 style="color:#0D1B2A;font-size:22px;font-weight:700;margin:0 0 12px;">Welcome, ${v.firstName}!</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Your contributor account has been created. You can now log in and complete your onboarding to start working on projects.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${baseUrl}/contributor/onboarding" style="display:inline-block;background:#007A8A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Complete Onboarding</a>
          </div>
          <p style="color:#888;font-size:13px;line-height:1.5;margin:0;">
            Or <a href="${baseUrl}/auth/login" style="color:#007A8A;">log in here</a> to access your dashboard.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;margin:0;">GlimmoraTeam &mdash; AI-Governed Global Workforce Platform</p>
        </div>
      `,
    }).catch(() => {/* fire-and-forget */});

    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      console.error("[registerContributor] API error", err.status, err.message);
      if (err.status === 409) {
        return { success: false, error: "An account with this email already exists" };
      }
      return { success: false, error: err.message };
    }
    console.error("[registerContributor] unexpected error", err);
    return { success: false, error: "Registration failed. Please try again." };
  }
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
  try {
    const profileData = {
      contribType:        data.contribType,
      country:            data.country,
      dob:                new Date(data.dob),
      timezone:           data.timezone,
      departmentCategory: data.departmentCategory,
      departmentOther:    data.departmentOther ?? null,
      primarySkills:      data.primarySkills,
      secondarySkills:    data.secondarySkills,
      otherSkills:        data.otherSkills,
      availability:       data.availability,
      degree:             data.degree ?? null,
      branch:             data.branch ?? null,
      linkedin:           data.linkedin ?? null,
      careerStage:        data.careerStage ?? null,
      yearsExperience:    data.yearsExperience ?? null,
      workStart:          data.workStart ?? null,
      workEnd:            data.workEnd ?? null,
      ndaAccepted:        data.ndaAccepted,
      ndaSignature:       data.ndaSignature ?? "",
      acceptTos:          true,
      acceptCoc:          true,
      acceptPrivacy:      true,
      acceptFee:          true,
      acceptAhp:          true,
      marketingOptIn:     data.marketingOptIn,
    };

    await prisma.user.upsert({
      where: { email: data.email.toLowerCase() },
      create: {
        email:         data.email.toLowerCase(),
        passwordHash:  null,
        provider:      data.provider || undefined,
        firstName:     data.firstName,
        lastName:      data.lastName ?? "",
        role:          "contributor",
        phone:         data.phone ?? null,
        emailVerified: true,
        phoneVerified: !!data.phone,
        contributorProfile: { create: profileData },
      },
      update: {
        firstName: data.firstName,
        lastName:  data.lastName ?? "",
        role:      "contributor",
        phone:     data.phone ?? null,
        contributorProfile: {
          upsert: {
            create: profileData,
            update: profileData,
          },
        },
      },
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[onboardContributor]", msg);
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://app.glimmora.com";
    sendEmail({
      to: v.adminEmail.toLowerCase(),
      subject: `Welcome to Glimmora — ${v.orgName} is ready`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#7C5C3E,#5C3D1E);border-radius:12px;padding:12px 20px;">
              <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.5px;">GlimmoraTeam</span>
            </div>
          </div>
          <h2 style="color:#0D1B2A;font-size:22px;font-weight:700;margin:0 0 12px;">Welcome, ${v.adminFirstName}!</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
            <strong>${v.orgName}</strong> is now set up on GlimmoraTeam. You can access your enterprise dashboard to manage SOWs, team formation, and project delivery.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${baseUrl}/enterprise/dashboard" style="display:inline-block;background:#007A8A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Go to Dashboard</a>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;margin:0;">GlimmoraTeam &mdash; AI-Governed Global Workforce Platform</p>
        </div>
      `,
    }).catch(() => {/* fire-and-forget */});

    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        return { success: false, error: "An account with this email already exists" };
      }
      return { success: false, error: err.message };
    }
    return { success: false, error: "Registration failed. Please try again." };
  }
}
