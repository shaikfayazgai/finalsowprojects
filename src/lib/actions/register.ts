"use server";

import { prisma } from "@/lib/db";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { contributorRegistrationSchema, enterpriseRegistrationSchema } from "@/lib/validations/registration";
import { sendEmail, buildEmailHtml } from "@/lib/email";
import { DEFAULT_TEMPLATES } from "@/lib/stores/email-template-store";
import { getBaseUrl } from "@/lib/utils/base-url";

export type ActionResult =
  | { success: true; emailWarning?: string }
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
        return { success: false, error: "An account with this email already exists" };
      }
      return { success: false, error: err.message };
    }
    return { success: false, error: "Registration failed. Please try again." };
  }
}
