"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Bell, Globe, Clock, Shield, Key,
  AlertTriangle, ChevronRight, Languages, X, CheckCircle2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchContributorSettings,
  patchContributorAccount,
  patchContributorNotifications,
  patchContributorLocale,
  changeContributorPassword,
  setup2FA,
  verify2FA,
  disable2FA,
  deactivateAccount,
  type ContributorSettingsResponse,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";
import { toast } from "@/lib/stores/toast-store";

// ── Badge ────────────────────────────────────────────────────────────────────

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500"   },
  gold:   { bg: "bg-gold-50",   text: "text-gold-700",   dot: "bg-gold-500"   },
  brown:  { bg: "bg-brown-50",  text: "text-brown-700",  dot: "bg-brown-500"  },
  beige:  { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400"   },
  danger: { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

// ── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        enabled ? "bg-gradient-to-r from-brown-400 to-brown-600" : "bg-gray-200",
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
        enabled ? "translate-x-6" : "translate-x-1",
      )} />
    </button>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>
      {[3, 5, 2, 1].map((rows, i) => (
        <div key={i} className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="py-2">
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex items-center justify-between px-5 py-3.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Notification key map ──────────────────────────────────────────────────────

type NotifKey = keyof ContributorSettingsResponse["notification_preferences"];

const NOTIF_ROWS: { key: NotifKey; label: string; description: string }[] = [
  { key: "task_assignments", label: "Task Assignments",     description: "Notified when new tasks are assigned to you"     },
  { key: "review_decisions", label: "Review Decisions",     description: "Updates on your submission reviews"              },
  { key: "sla_reminders",    label: "SLA Reminders",        description: "Deadline approaching warnings"                   },
  { key: "payout_updates",   label: "Payout Updates",       description: "Payment processing and completion alerts"        },
  { key: "learning",         label: "Learning Suggestions", description: "AI-powered skill development recommendations"    },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [settings, setSettings] = React.useState<ContributorSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Local notification preferences (kept in sync with API)
  const [notifPrefs, setNotifPrefs] = React.useState<ContributorSettingsResponse["notification_preferences"] | null>(null);

  const [editField, setEditField] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [show2FADialog, setShow2FADialog] = React.useState(false);
  const [twoFaQrUri, setTwoFaQrUri] = React.useState<string>("");
  const [twoFaSecret, setTwoFaSecret] = React.useState<string>("");
  const [twoFaCode, setTwoFaCode] = React.useState<string>("");
  const [isSettingUp2FA, setIsSettingUp2FA] = React.useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = React.useState(false);
  const [twoFaSetupDone, setTwoFaSetupDone] = React.useState(false);
  const [disablePassword, setDisablePassword] = React.useState("");
  const [disableOtp, setDisableOtp] = React.useState("");
  const [isDisabling2FA, setIsDisabling2FA] = React.useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = React.useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = React.useState("");
  const [deactivateReason, setDeactivateReason] = React.useState("");
  const [deactivatePassword, setDeactivatePassword] = React.useState("");
  const [isDeactivating, setIsDeactivating] = React.useState(false);
  const [showQuietHoursDialog, setShowQuietHoursDialog] = React.useState(false);
  const [quietStart, setQuietStart] = React.useState("");
  const [quietEnd, setQuietEnd] = React.useState("");
  const [isSavingLocale, setIsSavingLocale] = React.useState(false);
  const [localeError, setLocaleError] = React.useState<string | null>(null);

  // ── Fetch settings ──────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || "sso-contributor-fallback-token";

    setIsLoading(true);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:settings:${sk}`, () => fetchContributorSettings(token))
      .then((res) => {
        if (!live) return;
        setSettings(res);
        setNotifPrefs({ ...res.notification_preferences });
        setError(null);
      })
      .catch((err: Error) => {
        if (!live) return;
        setError(err.message ?? "Failed to load settings");
      })
      .finally(() => {
        if (live) setIsLoading(false);
      });
    return () => {
      live = false;
    };
  }, [session, sessionStatus]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const [savingNotif, setSavingNotif] = React.useState<NotifKey | null>(null);

  const toggleNotif = async (key: NotifKey) => {
    if (!notifPrefs || savingNotif) return;

    const token = getContributorAccessToken(session);

    // Optimistic update
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    setSavingNotif(key);

    try {
      const updated = await patchContributorNotifications(token, next);
      setSettings(updated);
      setNotifPrefs({ ...updated.notification_preferences });
      toast.success("Preferences saved", "Notification settings updated successfully.");
    } catch (err: unknown) {
      // Revert on failure
      setNotifPrefs(notifPrefs);
      toast.error("Failed to save", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSavingNotif(null);
    }
  };

  const getToken = () => getContributorAccessToken(session);

  const applySettingsResponse = (updated: ContributorSettingsResponse) => {
    setSettings(updated);
    setNotifPrefs({ ...updated.notification_preferences });
  };

  // Account fields (Display Name / Email / Phone)
  const ACCOUNT_FIELD_MAP: Record<string, keyof ContributorSettingsResponse["account_summary"]> = {
    "Display Name": "display_name",
    "Email":        "email",
    "Phone":        "phone",
  };

  // Locale fields (Language / Timezone)
  const LOCALE_FIELD_MAP: Record<string, "language" | "timezone"> = {
    "Language": "language",
    "Timezone": "timezone",
  };

  const saveField = async () => {
    const token = getToken();
    if (!token || !editField) return;

    setSaveError(null);
    setIsSaving(true);
    try {
      let updated: ContributorSettingsResponse;
      if (ACCOUNT_FIELD_MAP[editField]) {
        updated = await patchContributorAccount(token, {
          [ACCOUNT_FIELD_MAP[editField]]: editValue,
        });
      } else if (LOCALE_FIELD_MAP[editField]) {
        updated = await patchContributorLocale(token, {
          [LOCALE_FIELD_MAP[editField]]: editValue,
        });
      } else {
        setEditField(null);
        return;
      }
      applySettingsResponse(updated);
      setEditField(null);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const saveQuietHours = async () => {
    const token = getToken();
    if (!token) return;

    setLocaleError(null);
    setIsSavingLocale(true);
    try {
      const updated = await patchContributorLocale(token, {
        quiet_hours_start: quietStart,
        quiet_hours_end:   quietEnd,
      });
      applySettingsResponse(updated);
      setShowQuietHoursDialog(false);
    } catch (err: unknown) {
      setLocaleError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSavingLocale(false);
    }
  };

  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const savePassword = async () => {
    setPasswordError(null);

    // Trim to remove any accidental whitespace from autofill / copy-paste
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew     = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    // Client-side validation
    if (!trimmedCurrent) { setPasswordError("Current password is required."); return; }
    if (trimmedNew.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    if (trimmedNew !== trimmedConfirm) { setPasswordError("New passwords do not match."); return; }

    const token = getToken();
    if (!token) { setPasswordError("Session expired — please re-login."); return; }

    // Debug: log the exact payload being sent (remove after confirming it works)
    console.debug("[changePassword] payload →", {
      current_password: trimmedCurrent,
      new_password:     trimmedNew,
      confirm_password: trimmedConfirm,
    });

    setIsSavingPassword(true);
    try {
      await changeContributorPassword(token, {
        current_password: trimmedCurrent,
        new_password:     trimmedNew,
        confirm_password: trimmedConfirm,
      });
      toast.success("Password changed", "Your password has been updated successfully.");
      closePasswordDialog();
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const twoFaEnabled = settings?.two_factor_enabled ?? false;

  // ── 2FA helpers ─────────────────────────────────────────────────────────────

  const open2FADialog = async () => {
    setTwoFaQrUri("");
    setTwoFaSecret("");
    setTwoFaCode("");
    setTwoFaSetupDone(false);
    setShow2FADialog(true);

    if (twoFaEnabled) return; // already enabled — just show status

    const token = getContributorAccessToken(session);

    setIsSettingUp2FA(true);
    try {
      const result = await setup2FA(token);
      setTwoFaQrUri(result.qr_uri);
      setTwoFaSecret(result.secret);
    } catch (err: unknown) {
      toast.error(
        "2FA setup failed",
        err instanceof Error ? err.message : "Could not initiate 2FA setup.",
      );
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const close2FADialog = () => {
    setShow2FADialog(false);
    setTwoFaQrUri("");
    setTwoFaSecret("");
    setTwoFaCode("");
    setTwoFaSetupDone(false);
    setDisablePassword("");
    setDisableOtp("");
  };

  if (isLoading) return <SettingsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-[15px] font-semibold text-gray-700">Could not load settings</p>
        <p className="text-[13px] text-gray-400 max-w-sm">{error}</p>
      </div>
    );
  }

  const account = settings?.account_summary;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Settings</h1>
        <p className="text-[13px] text-gray-400 mt-1">Manage your account, notifications, and preferences</p>
      </motion.div>

      {/* ═══ ACCOUNT SECTION ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Account</span>
          </div>
        </div>
        <div className="py-2">
          {[
            { label: "Display Name", value: account?.display_name || session?.user?.name || "—", icon: User       },
            { label: "Email",        value: account?.email        || session?.user?.email || "—", icon: Mail       },
            { label: "Phone",        value: account?.phone        || "Not set",                   icon: Phone      },
          ].map((item, i, arr) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                onClick={() => { setEditField(item.label); setEditValue(item.value); setSaveError(null); }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                    <ItemIcon className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">{item.label}</span>
                    <span className="text-[13px] font-medium text-gray-800">{item.value}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ NOTIFICATION PREFERENCES ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Notification Preferences</span>
          </div>
        </div>
        <div className="py-2">
          {NOTIF_ROWS.map((item, i, arr) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}
            >
              <div>
                <span className="text-[13px] font-medium text-gray-800">{item.label}</span>
                <span className="text-[11px] text-gray-400 block mt-0.5">{item.description}</span>
              </div>
              <Toggle
                enabled={notifPrefs ? notifPrefs[item.key] : false}
                onToggle={() => toggleNotif(item.key)}
                disabled={!notifPrefs || !!savingNotif}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ LANGUAGE & LOCALE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Language & Locale</span>
          </div>
        </div>
        <div className="py-2">
          <div
            className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
            style={{ borderBottom: "1px solid var(--border-hair)" }}
            onClick={() => { setEditField("Language"); setEditValue(settings?.language ?? "en"); setSaveError(null); }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Language</span>
                <span className="text-[13px] font-medium text-gray-800">{settings?.language ?? "—"}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
          <div
            className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
            onClick={() => { setEditField("Timezone"); setEditValue(settings?.timezone ?? ""); setSaveError(null); }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Timezone</span>
                <span className="text-[13px] font-medium text-gray-800">{settings?.timezone ?? "—"}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        </div>
      </motion.div>

      {/* ═══ QUIET HOURS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Quiet Hours</span>
          </div>
          <button
            onClick={() => {
              setQuietStart(settings?.quiet_hours_start ?? "");
              setQuietEnd(settings?.quiet_hours_end ?? "");
              setLocaleError(null);
              setShowQuietHoursDialog(true);
            }}
            className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4">
          <span className="text-[12px] text-gray-400 block mb-2">No notifications between</span>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-mono font-semibold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg">
              {settings?.quiet_hours_start || "—"}
            </span>
            <span className="text-[12px] text-gray-400">to</span>
            <span className="text-[14px] font-mono font-semibold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg">
              {settings?.quiet_hours_end || "—"}
            </span>
            {settings?.timezone && <Badge variant="teal">{settings.timezone}</Badge>}
          </div>
        </div>
      </motion.div>

      {/* ═══ ACCOUNT ACTIONS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Account Actions</span>
          </div>
        </div>
        <div className="px-5 py-5 flex flex-wrap gap-3">
          <button
            onClick={() => setShowPasswordDialog(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <Key className="w-3.5 h-3.5" /> Change Password
          </button>
          <button
            onClick={open2FADialog}
            className={cn(
              "flex items-center gap-1.5 text-[12px] font-medium px-4 py-2.5 rounded-xl border transition-all",
              twoFaEnabled
                ? "text-forest-700 border-forest-200 hover:bg-forest-50"
                : "text-gray-600 border-gray-200 hover:bg-gray-50",
            )}
          >
            {twoFaEnabled
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> 2FA Enabled</>
              : <><Shield className="w-3.5 h-3.5" /> Enable 2FA</>}
          </button>
          <button
            onClick={() => setShowDeactivateDialog(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-red-500 px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Deactivate Account
          </button>
        </div>
      </motion.div>

      {/* ═══ EDIT FIELD MODAL ═══ */}
      {editField && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => { if (!isSaving) { setEditField(null); setSaveError(null); } }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">Edit {editField}</h3>
              <button
                onClick={() => { setEditField(null); setSaveError(null); }}
                disabled={isSaving}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="mb-5">
              <label className="text-[11px] font-medium text-gray-500 block mb-1.5">{editField}</label>
              <input
                type={editField === "Email" ? "email" : "text"}
                value={editValue}
                onChange={(e) => { setEditValue(e.target.value); setSaveError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !isSaving) saveField(); }}
                disabled={isSaving}
                className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors disabled:opacity-60"
              />
              {saveError && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {saveError}
                </p>
              )}
            </div>
            {localeError && (
              <p className="text-[11px] text-red-500 mb-4 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {localeError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setEditField(null); setSaveError(null); }}
                disabled={isSaving}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={saveField}
                disabled={isSaving || !editValue.trim()}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[64px]"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUIET HOURS DIALOG ═══ */}
      {showQuietHoursDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => { if (!isSavingLocale) { setShowQuietHoursDialog(false); setLocaleError(null); } }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">Edit Quiet Hours</h3>
              <button
                onClick={() => { setShowQuietHoursDialog(false); setLocaleError(null); }}
                disabled={isSavingLocale}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-[12px] text-gray-400 mb-5">
              Notifications will be silenced during this window. Use 24-hour format (e.g. <span className="font-mono">22:00</span>).
            </p>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Start</label>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => { setQuietStart(e.target.value); setLocaleError(null); }}
                  disabled={isSavingLocale}
                  className="w-full text-[13px] font-mono text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors disabled:opacity-60"
                />
              </div>
              <span className="text-[12px] text-gray-400 mt-5">to</span>
              <div className="flex-1">
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">End</label>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => { setQuietEnd(e.target.value); setLocaleError(null); }}
                  disabled={isSavingLocale}
                  className="w-full text-[13px] font-mono text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors disabled:opacity-60"
                />
              </div>
            </div>
            {localeError && (
              <p className="text-[11px] text-red-500 mb-4 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {localeError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowQuietHoursDialog(false); setLocaleError(null); }}
                disabled={isSavingLocale}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={saveQuietHours}
                disabled={isSavingLocale || !quietStart || !quietEnd}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[64px]"
              >
                {isSavingLocale ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHANGE PASSWORD DIALOG ═══ */}
      {showPasswordDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => { if (!isSavingPassword) closePasswordDialog(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">Change Password</h3>
              <button
                onClick={closePasswordDialog}
                disabled={isSavingPassword}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }}
                  disabled={isSavingPassword}
                  className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                  disabled={isSavingPassword}
                  className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !isSavingPassword) savePassword(); }}
                  disabled={isSavingPassword}
                  className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors disabled:opacity-60"
                />
              </div>
            </div>
            {passwordError && (
              <p className="text-[11px] text-red-500 mb-4 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {passwordError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closePasswordDialog}
                disabled={isSavingPassword}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={savePassword}
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {isSavingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2FA DIALOG ═══ */}
      {show2FADialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={close2FADialog}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">
                {twoFaEnabled ? "Two-Factor Authentication" : "Enable Two-Factor Authentication"}
              </h3>
              <button onClick={close2FADialog} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {twoFaEnabled ? (
              /* ── disable flow ── */
              <div className="space-y-4 mb-5">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-forest-50">
                  <CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-forest-700">
                    Two-factor authentication is currently <strong>enabled</strong>. To disable it, enter your account password and the current code from your authenticator app.
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Account Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-red-300 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Authenticator Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={disableOtp}
                    onChange={(e) => setDisableOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-red-300 transition-colors text-center tracking-[0.5em] font-mono"
                  />
                </div>
              </div>
            ) : twoFaSetupDone ? (
              /* ── verify success ── */
              <div className="space-y-4 mb-5">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-forest-50">
                  <CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-forest-700">
                    Two-factor authentication has been <strong>enabled</strong> successfully on your account.
                  </p>
                </div>
              </div>
            ) : (
              /* ── setup flow ── */
              <div className="space-y-4 mb-5">
                {/* QR code area */}
                <div className="flex items-center justify-center py-4">
                  {isSettingUp2FA ? (
                    <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 border-brown-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-[11px] text-gray-400">Loading QR…</span>
                      </div>
                    </div>
                  ) : twoFaQrUri ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={twoFaQrUri}
                      alt="2FA QR Code"
                      className="w-40 h-40 rounded-2xl border border-gray-200 object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
                      <div className="text-center">
                        <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span className="text-[11px] text-gray-400">QR Code</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual secret */}
                {twoFaSecret && (
                  <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-medium text-gray-400 mb-1">Manual entry key</p>
                    <p className="text-[12px] font-mono text-gray-700 tracking-widest break-all select-all">{twoFaSecret}</p>
                  </div>
                )}

                <p className="text-[12px] text-gray-500 text-center">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below.
                </p>

                <div>
                  <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors text-center tracking-[0.5em] font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={close2FADialog} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                {twoFaSetupDone ? "Close" : "Cancel"}
              </button>

              {/* ── Disable button (shown when 2FA is currently ON) ── */}
              {twoFaEnabled && !twoFaSetupDone && (
                <button
                  disabled={isDisabling2FA || !disablePassword || disableOtp.length < 6}
                  onClick={async () => {
                    const token = getContributorAccessToken(session);
                    setIsDisabling2FA(true);
                    try {
                      const updated = await disable2FA(token, {
                        password: disablePassword.trim(),
                        verification_code: disableOtp,
                      });
                      setSettings(updated);
                      toast.success("2FA disabled", "Two-factor authentication has been turned off.");
                      close2FADialog();
                    } catch (err: unknown) {
                      toast.error(
                        "Failed to disable 2FA",
                        err instanceof Error ? err.message : "Incorrect password or code — please try again.",
                      );
                    } finally {
                      setIsDisabling2FA(false);
                    }
                  }}
                  className="text-[12px] font-semibold text-white bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {isDisabling2FA ? "Disabling…" : "Disable 2FA"}
                </button>
              )}

              {/* ── Enable button (shown when 2FA is currently OFF) ── */}
              {!twoFaEnabled && !twoFaSetupDone && (
                <button
                  disabled={isSettingUp2FA || isVerifying2FA || twoFaCode.length < 6}
                  onClick={async () => {
                    const token = getContributorAccessToken(session);
                    setIsVerifying2FA(true);
                    try {
                      const updated = await verify2FA(token, twoFaCode);
                      setSettings(updated);
                      setTwoFaSetupDone(true);
                      toast.success("2FA enabled", "Two-factor authentication is now active on your account.");
                    } catch (err: unknown) {
                      toast.error(
                        "Verification failed",
                        err instanceof Error ? err.message : "Invalid code — please try again.",
                      );
                    } finally {
                      setIsVerifying2FA(false);
                    }
                  }}
                  className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {isVerifying2FA ? "Verifying…" : isSettingUp2FA ? "Loading…" : "Enable 2FA"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DEACTIVATE DIALOG ═══ */}
      {showDeactivateDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => { if (!isDeactivating) { setShowDeactivateDialog(false); setDeactivateConfirmText(""); setDeactivateReason(""); setDeactivatePassword(""); } }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-red-600">Deactivate Account</h3>
              <button
                disabled={isDeactivating}
                onClick={() => { setShowDeactivateDialog(false); setDeactivateConfirmText(""); setDeactivateReason(""); setDeactivatePassword(""); }}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              {/* Warning banner */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-medium text-red-700 mb-1">This action cannot be easily undone</p>
                  <p className="text-[11px] text-red-600 leading-relaxed">
                    Deactivating your account will remove you from all active tasks and suspend your earnings. Contact support to reactivate.
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Reason for deactivation</label>
                <textarea
                  rows={2}
                  placeholder="Tell us why you're leaving…"
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  disabled={isDeactivating}
                  className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-red-300 transition-colors resize-none disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Account Password</label>
                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={deactivatePassword}
                  onChange={(e) => setDeactivatePassword(e.target.value)}
                  disabled={isDeactivating}
                  className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-red-300 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Confirmation text */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">
                  Type <span className="font-mono font-bold text-red-500">DEACTIVATE</span> to confirm
                </label>
                <input
                  type="text"
                  placeholder="DEACTIVATE"
                  value={deactivateConfirmText}
                  onChange={(e) => setDeactivateConfirmText(e.target.value)}
                  disabled={isDeactivating}
                  className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-red-200 outline-none focus:border-red-400 transition-colors font-mono disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={isDeactivating}
                onClick={() => { setShowDeactivateDialog(false); setDeactivateConfirmText(""); setDeactivateReason(""); setDeactivatePassword(""); }}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={
                  isDeactivating ||
                  deactivateConfirmText !== "DEACTIVATE" ||
                  !deactivatePassword ||
                  !deactivateReason.trim()
                }
                onClick={async () => {
                  const token = getContributorAccessToken(session);
                  setIsDeactivating(true);
                  try {
                    await deactivateAccount(token, {
                      confirmation_text: deactivateConfirmText,
                      reason: deactivateReason.trim(),
                      password: deactivatePassword,
                    });
                    toast.success("Account deactivated", "Your account has been deactivated. Contact support to reactivate.");
                    setShowDeactivateDialog(false);
                  } catch (err: unknown) {
                    toast.error(
                      "Deactivation failed",
                      err instanceof Error ? err.message : "Could not deactivate account — please try again.",
                    );
                  } finally {
                    setIsDeactivating(false);
                  }
                }}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {isDeactivating ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
