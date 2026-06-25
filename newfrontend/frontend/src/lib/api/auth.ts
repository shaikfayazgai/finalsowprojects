import { apiCall, ApiError } from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface GlimmoraUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaEnrollmentRequired?: boolean;
  authPending?: boolean;
  // Returned by OAuth callback — used to drive post-login routing
  provider?: string;
  requiresPasswordChange?: boolean;
  isFirstLogin?: boolean;
  mobileVerified?: boolean;
  mobile2faEnabled?: boolean;
  // Profile fields
  phone?: string;
  adminTitle?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginSuccessResponse extends AuthTokens {
  user: GlimmoraUser;
}

export interface MicrosoftOAuthDiagnostic {
  microsoft_oauth_configured: boolean;
  redirect_uri_register_this_exactly_in_azure: string;
  microsoft_tenant_id: string;
  request_base_url: string;
  oauth_public_base_url: string;
  pkce: string;
  tips: string[];
}

export type GoogleOAuthDiagnostic = Record<string, unknown>;

export interface MfaPendingResponse {
  /** Backend returns mfa_setup_required | mfa_required */
  status: "mfa_pending" | "mfa_setup_required" | "mfa_required";
  mfa_pending_token: string;
  expires_in: number;
  user: Pick<GlimmoraUser, "id" | "email" | "firstName" | "lastName" | "role">;
  methods?: string[];
}

export type LoginResponse = LoginSuccessResponse | MfaPendingResponse;

export interface UserSessionRecord {
  id: string;
  device?: string;
  device_name?: string;
  browser?: string;
  browser_name?: string;
  os?: string;
  ip_address?: string;
  location?: string;
  city?: string;
  country?: string;
  created_at?: string;
  last_active_at?: string;
  last_activity?: string;
  is_current?: boolean;
  user_agent?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extracts the authorization URL from the contributor workspace OAuth authorize
 * endpoint response. The API may return a plain string or a JSON object with
 * a url / authorize_url / authorization_url / redirect_url field.
 */
export function parseContributorWorkspaceAuthorizeResponse(raw: unknown): string | null {
  if (typeof raw === "string" && raw.startsWith("http")) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const url =
      obj.url ?? obj.authorize_url ?? obj.authorization_url ?? obj.redirect_url ?? obj.authorizeUrl;
    if (typeof url === "string") return url;
  }
  return null;
}

// ── Type guard ─────────────────────────────────────────────────────────────

export function isMfaPending(response: LoginResponse): response is MfaPendingResponse {
  const s = (response as MfaPendingResponse).status;
  return s === "mfa_pending" || s === "mfa_setup_required" || s === "mfa_required";
}

export function isMfaVerifyPending(response: LoginResponse): boolean {
  return isMfaPending(response) && (response as MfaPendingResponse).status === "mfa_required";
}

// ── Auth API ───────────────────────────────────────────────────────────────

/**
 * Client-side existence check for a login email.
 *
 * Calls the public `/api/auth/email-available` proxy (→ backend
 * `/api/v1/auth/email-available`) which is the ONLY endpoint that cleanly
 * distinguishes "no such account" from anything else — `/login` and `/validate`
 * both return an identical generic 401 for no-account AND wrong-password
 * (deliberate anti-enumeration), so they can't be keyed off.
 *
 * Returns:
 *   true   → an account with this email exists
 *   false  → no account exists (caller may route to sign-up)
 *   null   → inconclusive (network error / unexpected shape) — caller must NOT
 *            redirect, since we can't prove the account is absent.
 */
export async function accountExistsForEmail(email: string): Promise<boolean | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;
  try {
    const res = await fetch(`/api/auth/email-available?email=${encodeURIComponent(normalized)}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as
      | { available?: boolean; exists?: boolean }
      | null;
    if (!data) return null;
    if (typeof data.exists === "boolean") return data.exists;
    if (typeof data.available === "boolean") return !data.available;
    return null;
  } catch {
    return null;
  }
}

export const authApi = {
  /**
   * Microsoft OAuth diagnostic — returns the exact redirect URI the backend
   * expects to be registered in Azure App Registration, plus tenant config
   * and tips for fixing AADSTS50011 redirect-uri-mismatch errors.
   */
  async getMicrosoftOAuthDiagnostic(): Promise<MicrosoftOAuthDiagnostic> {
    return apiCall<MicrosoftOAuthDiagnostic>("/api/v1/auth/oauth/microsoft/diagnostic", {
      method: "GET",
    });
  },

  /**
   * Google OAuth diagnostic — returns redirect URI + config hints for fixing
   * Google Console redirect-uri mismatch errors.
   */
  async getGoogleOAuthDiagnostic(): Promise<GoogleOAuthDiagnostic> {
    return apiCall<GoogleOAuthDiagnostic>("/api/v1/auth/oauth/google/diagnostic", {
      method: "GET",
    });
  },

  /** Email + password login. Returns full tokens or MFA-pending payload. */
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiCall<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /** Register a new contributor account. */
  async registerContributor(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    contributorType: string;
    countryOfResidence: string;
    dateOfBirth: string;
    timeZone: string;
    weeklyAvailabilityHours: string;
    departmentCategory: string;
    primarySkills: string[];
    secondarySkills?: string[];
    otherSkills?: string[];
    phone: string;
    degree?: string;
    branch?: string;
    linkedin?: string;
    careerStage?: string;
    yearsExperience?: string;
    workStart?: string;
    workEnd?: string;
    ndaSignatoryLegalName?: string;
    mentorGuideAcknowledged?: boolean;
    acceptTermsOfUse?: boolean;
    acceptCodeOfConduct?: boolean;
    acceptPrivacyPolicy?: boolean;
    acceptHarassmentPolicy?: boolean;
    acknowledgmentsAccepted?: boolean;
    notifyNewTasksOptIn?: boolean;
    marketingOptIn?: boolean;
  }): Promise<{ user: GlimmoraUser }> {
    return apiCall<{ user: GlimmoraUser }>("/api/v1/auth/register/contributor", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Credential-only check — validates email/password without issuing tokens. */
  async validateCredentials(email: string, password: string): Promise<unknown> {
    return apiCall("/api/v1/auth/validate", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /** Email-only validation used during registration to check availability. */
  async validateEmail(email: string): Promise<unknown> {
    return apiCall("/api/v1/auth/validate", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /** Exchange a refresh token for a new access token. */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return apiCall<TokenPair>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  /** Revoke the session tied to the given refresh token. */
  async logout(refreshToken: string): Promise<void> {
    await apiCall("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  /** Revoke all active sessions for the current user. */
  async logoutAllSessions(accessToken: string): Promise<void> {
    await apiCall("/api/v1/auth/logout-all", {
      method: "POST",
      token: accessToken,
    });
  },

  /** Get the currently authenticated user's profile. */
  async getCurrentUser(accessToken: string): Promise<GlimmoraUser> {
    return apiCall<GlimmoraUser>("/api/v1/auth/me", {
      method: "GET",
      token: accessToken,
    });
  },

  /** Complete MFA login using a TOTP code from the authenticator app. */
  async verifyMfaCode(code: string, mfaPendingToken: string): Promise<LoginSuccessResponse> {
    return apiCall<LoginSuccessResponse>("/api/v1/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
      token: mfaPendingToken,
    });
  },

  /** Complete MFA login using a one-time recovery code. */
  async redeemRecoveryCode(recoveryCode: string, mfaPendingToken: string): Promise<LoginSuccessResponse> {
    return apiCall<LoginSuccessResponse>("/api/v1/auth/mfa/recovery", {
      method: "POST",
      body: JSON.stringify({ recovery_code: recoveryCode }),
      token: mfaPendingToken,
    });
  },

  /** Initiate the forgot-password flow — triggers email via Next.js route. */
  async requestPasswordReset(email: string, _role?: string): Promise<unknown> {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const base = data?.message ?? "Failed to send reset email";
      throw new ApiError(res.status, data?.detail ? `${base} — ${data.detail}` : base);
    }
    return data;
  },

  /** Start TOTP enrollment — returns the QR URI and manual secret. */
  async initMfaSetup(accessToken: string): Promise<{ qr_uri: string; secret: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await apiCall<Record<string, any>>("/api/v1/auth/mfa/setup/init", {
      method: "POST",
      token: accessToken,
    });
    // Normalize field names — the API uses various naming conventions
    const qrPng = raw.qr_code_png_base64 || raw.qrCodePngBase64 || "";
    const otpauthUri = raw.otpauth_uri || raw.otpAuthUri || "";
    // Prefer base64 PNG for <img src>, fall back to otpauth URI
    const qr_uri = raw.qr_uri || (qrPng ? `data:image/png;base64,${qrPng}` : otpauthUri);
    return {
      qr_uri,
      secret: raw.secret || raw.secret_base32 || raw.secretBase32 || raw.totp_secret || "",
    };
  },

  /** Confirm TOTP setup with the first code — returns recovery codes + new tokens. */
  async confirmMfaSetup(
    code: string,
    accessToken: string,
  ): Promise<{ recovery_codes: string[]; access_token: string; refresh_token: string; token_type: string }> {
    return apiCall<{ recovery_codes: string[]; access_token: string; refresh_token: string; token_type: string }>(
      "/api/v1/auth/mfa/setup/confirm",
      {
        method: "POST",
        body: JSON.stringify({ code }),
        token: accessToken,
      },
    );
  },

  /**
   * Build the Glimmora OAuth authorize URL for the given provider.
   * The `state` blob encodes where to redirect after the OAuth callback lands
   * back on our app (e.g. /enterprise/dashboard).
   *
   * Call from client-side code using NEXT_PUBLIC_GLIMMORA_API_URL.
   */
  getOAuthAuthorizeUrl(
    provider: "google" | "microsoft",
    redirectAfter: string,
    role: "enterprise" | "contributor" = "enterprise",
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;
    const state = btoa(JSON.stringify({ redirectAfter, role }));
    const providerSlug = provider === "microsoft" ? "microsoft" : "google";
    const params = new URLSearchParams({ state });
    return `${baseUrl}/api/v1/auth/oauth/${providerSlug}/authorize?${params.toString()}`;
  },

  /**
   * Exchange a Glimmora OAuth callback code for login tokens (server-side).
   * Called from our Next.js API route after Glimmora redirects back to our app.
   */
  async exchangeOAuthCode(
    provider: "google" | "microsoft",
    code: string,
    state?: string,
  ): Promise<LoginResponse> {
    const providerSlug = provider === "microsoft" ? "microsoft" : "google";
    const params = new URLSearchParams({ code });
    if (state) params.set("state", state);
    return apiCall<LoginResponse>(
      `/api/v1/auth/oauth/${providerSlug}/callback?${params.toString()}`,
      { method: "GET" },
    );
  },

  /**
   * Find-or-create a contributor account from a provider-verified OAuth identity
   * (Google/Microsoft) and return a token pair. Used by the NextAuth sign-in
   * callback for the contributor SSO sign-up path: the provider already verified
   * the email (NextAuth validates the id_token signature), so the backend creates
   * the account email-verified and NO OTP step is required.
   */
  async provisionOAuthAccount(input: {
    email: string;
    firstName?: string;
    lastName?: string;
    provider: "google" | "microsoft";
  }): Promise<LoginResponse & { isNewSsoUser?: boolean }> {
    return apiCall<LoginResponse & { isNewSsoUser?: boolean }>(
      `/api/v1/auth/oauth/provision`,
      {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          firstName: input.firstName ?? "",
          lastName: input.lastName ?? "",
          provider: input.provider,
        }),
      },
    );
  },

  /** Create a reviewer user via our server-side route (handles token + permissions). */
  async createReviewer(data: {
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
    department: string;
    username: string;
    language: string;
    timeZone: string;
    invitedByName: string;
    /** INVITED | ACTIVE | EXPIRED — defaults to INVITED when omitted */
    status?: "INVITED" | "ACTIVE" | "EXPIRED";
    accessToken?: string;
  }): Promise<{ user_id: string; email: string; temp_password: string }> {
    const res = await fetch("/api/reviewers/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(data.accessToken ? { Authorization: `Bearer ${data.accessToken}` } : {}),
      },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        // job_title — backend aliases "role" but must be the human job title, not system role
        jobTitle: data.designation,
        designation: data.designation,
        department: data.department,
        username: data.username,
        language: data.language,
        timeZone: data.timeZone,
        status: data.status ?? "INVITED",
        ...(data.accessToken ? { accessToken: data.accessToken } : {}),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = json?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : detail?.message ?? json?.message ?? json?.error ?? "Failed to create reviewer";
      throw new Error(msg);
    }
    const inner = json?.data ?? json;
    const user_id = inner?.id ?? inner?.user_id ?? "";
    const temp_password = inner?.temporaryPassword ?? inner?.temp_password ?? "";
    const emailOut = inner?.email ?? data.email;
    if (!user_id || !temp_password) {
      throw new Error("Create reviewer succeeded but response did not include credentials.");
    }
    return { user_id, email: emailOut, temp_password };
  },

  async resendReviewerInvite(email: string, accessToken?: string): Promise<{ user_id: string; email: string; temp_password: string }> {
    const res = await fetch("/api/reviewers/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        resendExisting: true,
        ...(accessToken ? { accessToken } : {}),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = json?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : detail?.message ?? json?.message ?? json?.error ?? "Failed to resend reviewer invite";
      throw new Error(msg);
    }
    const inner = json?.data ?? json;
    const user_id = inner?.id ?? inner?.user_id ?? "";
    const temp_password = inner?.temporaryPassword ?? inner?.temp_password ?? "";
    if (!user_id) {
      throw new Error("Resend invite succeeded but response was incomplete.");
    }
    return { user_id, email: inner?.email ?? email, temp_password };
  },

  /** Change password while authenticated (e.g. reviewer first login after temporary password). */
  async changePassword(currentPassword: string, newPassword: string, accessToken: string): Promise<void> {
    await apiCall<{ success?: boolean }>("/api/v1/auth/password/change", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      token: accessToken,
    });
  },

  /** Get the current active session details. */
  async getCurrentSession(accessToken: string): Promise<UserSessionRecord> {
    return apiCall<UserSessionRecord>("/api/v1/auth/session", {
      method: "GET",
      token: accessToken,
    });
  },

  /** List all active sessions for the current user. */
  async getSessions(accessToken: string): Promise<UserSessionRecord[]> {
    return apiCall<UserSessionRecord[]>("/api/v1/auth/sessions", {
      method: "GET",
      token: accessToken,
    });
  },

  /** Revoke a specific session by ID. */
  async revokeSession(sessionId: string, accessToken: string): Promise<void> {
    await apiCall(`/api/v1/auth/sessions/${sessionId}`, {
      method: "DELETE",
      token: accessToken,
    });
  },

  /** Register a new enterprise organisation + admin user. */
  async registerEnterprise(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    orgName: string;
    orgType: string;
    industry: string;
    companySize: string;
    adminTitle: string;
    // Optional
    website?: string;
    hqCountry?: string;
    hqCity?: string;
    phone?: string;
    orgTypeOther?: string;
    industryOther?: string;
    adminDept?: string;
    incorporationCountry?: string;
    acceptTos?: boolean;
    acceptPp?: boolean;
    acceptEsa?: boolean;
    acceptAhp?: boolean;
    marketingOptIn?: boolean;
  }): Promise<{ user: GlimmoraUser; enterprise_profile_id: string }> {
    return apiCall<{ user: GlimmoraUser; enterprise_profile_id: string }>(
      "/api/v1/auth/register/enterprise",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },
};
