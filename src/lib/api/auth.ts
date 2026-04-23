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
  mfaEnrollmentRequired: boolean;
  authPending?: boolean;
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

export interface MfaPendingResponse {
  status: "mfa_pending";
  mfa_pending_token: string;
  expires_in: number;
  user: Pick<GlimmoraUser, "id" | "email" | "firstName" | "lastName">;
  methods: string[];
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

// ── Type guard ─────────────────────────────────────────────────────────────

export function isMfaPending(response: LoginResponse): response is MfaPendingResponse {
  return (response as MfaPendingResponse).status === "mfa_pending";
}

// ── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  /** Email + password login. Returns full tokens or MFA-pending payload. */
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiCall<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /** Credential-only check — validates email/password without issuing tokens. */
  async validateCredentials(email: string, password: string): Promise<unknown> {
    return apiCall("/api/v1/auth/validate", {
      method: "POST",
      body: JSON.stringify({ email, password }),
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
    accessToken?: string;
  }): Promise<{ user_id: string; email: string; temp_password: string }> {
    const res = await fetch("/api/reviewer/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: "reviewer",
        designation: data.designation,
        department: data.department,
        username: data.username,
        language: data.language,
        timeZone: data.timeZone,
        invitedByName: data.invitedByName,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.detail || json?.message || json?.error || "Failed to create reviewer");
    }
    return json;
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
