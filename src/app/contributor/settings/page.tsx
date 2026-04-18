"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Bell, Globe, Clock, Shield, Key,
  AlertTriangle, ChevronRight, Languages, X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockContributorProfile } from "@/mocks/data/contributor";

/* ═══ Toggle ═══ */

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
        enabled ? "bg-gradient-to-r from-brown-400 to-brown-600" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

/* ═══ PAGE ═══ */

export default function SettingsPage() {
  const { data: session } = useSession();
  const profile = {
    ...mockContributorProfile,
    displayName: session?.user?.name || mockContributorProfile.displayName,
    email: session?.user?.email || mockContributorProfile.email,
  };

  const [editField, setEditField] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [show2FADialog, setShow2FADialog] = React.useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = React.useState(false);

  const [notifications, setNotifications] = React.useState({
    taskAssignments: true,
    reviewDecisions: true,
    slaReminders: true,
    payoutUpdates: true,
    learning: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
            { label: "Display Name", value: profile.displayName, icon: User },
            { label: "Email", value: profile.email, icon: Mail },
            { label: "Phone", value: profile.phone || "Not set", icon: Phone },
          ].map((item, i, arr) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                onClick={() => { setEditField(item.label); setEditValue(item.value); }}
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
          {([
            { key: "taskAssignments" as const, label: "Task Assignments", description: "Notified when new tasks are assigned to you" },
            { key: "reviewDecisions" as const, label: "Review Decisions", description: "Updates on your submission reviews" },
            { key: "slaReminders" as const, label: "SLA Reminders", description: "Deadline approaching warnings" },
            { key: "payoutUpdates" as const, label: "Payout Updates", description: "Payment processing and completion alerts" },
            { key: "learning" as const, label: "Learning Suggestions", description: "AI-powered skill development recommendations" },
          ]).map((item, i, arr) => (
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
                enabled={notifications[item.key]}
                onToggle={() => toggleNotification(item.key)}
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
            onClick={() => { setEditField("Language"); setEditValue(profile.language || ""); }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Language</span>
                <span className="text-[13px] font-medium text-gray-800">{profile.language || "Not set"}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
          <div
            className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
            onClick={() => { setEditField("Timezone"); setEditValue(profile.timezone); }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Timezone</span>
                <span className="text-[13px] font-medium text-gray-800">{profile.timezone || "Not set"}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        </div>
      </motion.div>

      {/* ═══ QUIET HOURS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Quiet Hours</span>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-[12px] text-gray-400 block mb-1">No notifications between</span>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-mono font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">--:--</span>
                <span className="text-[12px] text-gray-400">to</span>
                <span className="text-[14px] font-mono font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">--:--</span>
              </div>
              <span className="text-[11px] text-gray-400 mt-2 block">Quiet hours not configured</span>
            </div>
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
          <button onClick={() => setShowPasswordDialog(true)} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            <Key className="w-3.5 h-3.5" /> Change Password
          </button>
          <button onClick={() => setShow2FADialog(true)} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            <Shield className="w-3.5 h-3.5" /> Enable 2FA
          </button>
          <button onClick={() => setShowDeactivateDialog(true)} className="flex items-center gap-1.5 text-[12px] font-medium text-red-500 px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-all">
            <AlertTriangle className="w-3.5 h-3.5" /> Deactivate Account
          </button>
        </div>
      </motion.div>

      {/* ═══ EDIT FIELD MODAL ═══ */}
      {editField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditField(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">Edit {editField}</h3>
              <button onClick={() => setEditField(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="mb-5">
              <label className="text-[11px] font-medium text-gray-500 block mb-1.5">{editField}</label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setEditField(null)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => setEditField(null)} className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHANGE PASSWORD DIALOG ═══ */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowPasswordDialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordDialog(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Current Password</label>
                <input type="password" placeholder="Enter current password" className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">New Password</label>
                <input type="password" placeholder="Enter new password" className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowPasswordDialog(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => setShowPasswordDialog(false)} className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2FA DIALOG ═══ */}
      {show2FADialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShow2FADialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">Enable Two-Factor Authentication</h3>
              <button onClick={() => setShow2FADialog(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 mb-5">
              <div className="flex items-center justify-center py-6">
                <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span className="text-[11px] text-gray-400">QR Code Placeholder</span>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-gray-500 text-center">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Verification Code</label>
                <input type="text" placeholder="Enter 6-digit code" maxLength={6} className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 transition-colors text-center tracking-[0.5em] font-mono" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShow2FADialog(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => setShow2FADialog(false)} className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DEACTIVATE DIALOG ═══ */}
      {showDeactivateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDeactivateDialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-red-600">Deactivate Account</h3>
              <button onClick={() => setShowDeactivateDialog(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="mb-5">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-medium text-red-700 mb-1">This action cannot be easily undone</p>
                  <p className="text-[11px] text-red-600 leading-relaxed">Deactivating your account will remove you from all active tasks and suspend your earnings. You will need to contact support to reactivate.</p>
                </div>
              </div>
              <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Type &quot;DEACTIVATE&quot; to confirm</label>
              <input type="text" placeholder="DEACTIVATE" className="w-full text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-red-200 outline-none focus:border-red-400 transition-colors" />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowDeactivateDialog(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => setShowDeactivateDialog(false)} className="text-[12px] font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-5 py-2 rounded-xl transition-all">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
