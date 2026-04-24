"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Search, KeyRound, Shield, Building2,
  ChevronDown, MoreHorizontal, CheckCircle2, Clock, Ban,
  X, Send, Pencil, Trash2, Eye, RefreshCw, ShieldCheck,
  UserCog, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";

/* ════════════════════════ Types ════════════════════════ */

type Role   = "admin" | "enterprise" | "contributor" | "reviewer";
type Status = "active" | "invited" | "suspended";

interface PlatformUser {
  id:         string;
  name:       string;
  email:      string;
  role:       Role;
  status:     Status;
  org?:       string;
  joinedAt:   string;
  lastActive: string;
  avatar?:    string;
}

/* ════════════════════════ Mock data ════════════════════════ */

const MOCK_USERS: PlatformUser[] = [];

/* ════════════════════════ Config ════════════════════════ */

const ROLE_CONFIG: Record<Role, {
  label: string; bg: string; text: string; dot: string; icon: React.ElementType; description: string;
}> = {
  admin:       { label: "Admin",       bg: "bg-brown-100",  text: "text-brown-700",  dot: "bg-brown-500",  icon: ShieldCheck, description: "Full platform access & configuration" },
  enterprise:  { label: "Enterprise",  bg: "bg-gold-50",    text: "text-gold-700",   dot: "bg-gold-500",   icon: Building2,   description: "SOW management, team formation & delivery" },
  contributor: { label: "Contributor", bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-400",   icon: Users,       description: "Task work, credentials & earnings" },
  reviewer:    { label: "Reviewer",    bg: "bg-forest-50",  text: "text-forest-700", dot: "bg-forest-400", icon: Shield,      description: "Evidence review & quality assurance" },
};

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  active:    { label: "Active",    bg: "bg-forest-50", text: "text-forest-700", icon: CheckCircle2 },
  invited:   { label: "Invited",   bg: "bg-gold-50",   text: "text-gold-700",   icon: Clock },
  suspended: { label: "Suspended", bg: "bg-red-50",    text: "text-red-600",    icon: Ban },
};

type TabId     = "all" | Role;
type SortField = "name" | "role" | "status" | "joined" | "active";
type SortDir   = "asc" | "desc";

const TABS: { id: TabId; label: string }[] = [
  { id: "all",         label: "All Users" },
  { id: "admin",       label: "Admins" },
  { id: "enterprise",  label: "Enterprise" },
  { id: "contributor", label: "Contributors" },
  { id: "reviewer",    label: "Reviewers" },
];

/* ════════════════════════ Helpers ════════════════════════ */

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarBg(role: Role): string {
  return role === "admin"       ? "bg-brown-200 text-brown-800" :
         role === "enterprise"  ? "bg-gold-100 text-gold-800" :
         role === "contributor" ? "bg-teal-100 text-teal-800" :
                                  "bg-forest-100 text-forest-800";
}

function fmtDate(iso: string) {
  if (iso === "—") return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ════════════════════════ Skeleton ════════════════════════ */

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-beige-100 rounded" />
        <div className="h-8 w-52 bg-beige-100 rounded" />
        <div className="h-3 w-64 bg-beige-50 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="rounded-2xl bg-white border border-beige-100 p-5 space-y-2">
            <div className="w-8 h-8 bg-beige-100 rounded-xl" />
            <div className="h-6 w-8 bg-beige-100 rounded" />
            <div className="h-2.5 w-20 bg-beige-50 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white border border-beige-100 overflow-hidden">
        <div className="h-[52px] bg-beige-50/50 border-b border-beige-100" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-beige-50 last:border-0">
            <div className="w-9 h-9 bg-beige-100 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-36 bg-beige-100 rounded" />
              <div className="h-2.5 w-48 bg-beige-50 rounded" />
            </div>
            <div className="h-5 w-20 bg-beige-100 rounded-full" />
            <div className="h-5 w-16 bg-beige-50 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════ Sort header ════════════════════════ */

function SortTh({ field, label, current, dir, onSort }: {
  field: SortField; label: string; current: SortField; dir: SortDir; onSort: (f: SortField) => void;
}) {
  const active = current === field;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "group flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors",
        active ? "text-brown-800" : "text-beige-400 hover:text-brown-600",
      )}
    >
      {label}
      <Icon className={cn("w-2.5 h-2.5 transition-opacity", active ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
    </button>
  );
}

/* ════════════════════════ Row action menu ════════════════════════ */

function RowMenu({ user, onEdit, onToggleSuspend, onRemove }: {
  user: PlatformUser;
  onEdit: () => void;
  onToggleSuspend: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-beige-400 hover:text-brown-700 hover:bg-beige-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-50 w-48 rounded-xl bg-white border border-beige-100 shadow-lg py-1 overflow-hidden"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
          >
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] text-brown-700 hover:bg-beige-50 transition-colors text-left"
            >
              <Pencil className="w-3.5 h-3.5 text-beige-400" /> Edit Role
            </button>
            <button
              onClick={() => { setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] text-brown-700 hover:bg-beige-50 transition-colors text-left"
            >
              <Eye className="w-3.5 h-3.5 text-beige-400" /> View Profile
            </button>
            {user.status === "invited" && (
              <button
                onClick={() => { setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] text-teal-700 hover:bg-teal-50 transition-colors text-left"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resend Invite
              </button>
            )}
            <div className="h-px bg-beige-100 my-1" />
            <button
              onClick={() => { onToggleSuspend(); setOpen(false); }}
              className={cn(
                "flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] hover:bg-amber-50 transition-colors text-left",
                user.status === "suspended" ? "text-forest-700" : "text-amber-700",
              )}
            >
              <Ban className="w-3.5 h-3.5" />
              {user.status === "suspended" ? "Reactivate" : "Suspend"}
            </button>
            <button
              onClick={() => { onRemove(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove User
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════ Add User Modal ════════════════════════ */

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (user: PlatformUser) => void;
}

function AddUserModal({ open, onClose, onAdd }: AddUserModalProps) {
  const [name,  setName]  = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role,  setRole]  = React.useState<Role>("contributor");
  const [org,   setOrg]   = React.useState("");
  const [step,  setStep]  = React.useState<"form" | "success">("form");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});

  function reset() {
    setName(""); setEmail(""); setRole("contributor"); setOrg("");
    setStep("form"); setErrors({});
  }

  function handleClose() { reset(); onClose(); }

  function validate() {
    const e: typeof errors = {};
    if (!name.trim())  e.name  = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const newUser: PlatformUser = {
      id:         `u-${Date.now()}`,
      name:       name.trim(),
      email:      email.trim(),
      role,
      status:     "invited",
      org:        org.trim() || undefined,
      joinedAt:   new Date().toISOString().slice(0, 10),
      lastActive: "—",
    };
    onAdd(newUser);
    setStep("success");
  }

  const rc = ROLE_CONFIG[role];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-brown-950/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white border border-beige-100 overflow-hidden pointer-events-auto"
              style={{ boxShadow: "0 24px 60px rgba(33,23,19,0.14)" }}
            >
              {step === "form" ? (
                <>
                  {/* Modal header */}
                  <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-beige-50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-brown-50 flex items-center justify-center">
                          <UserPlus className="w-3.5 h-3.5 text-brown-600" />
                        </div>
                        <h2 className="font-heading text-[17px] font-bold text-brown-950">Add User</h2>
                      </div>
                      <p className="text-[12px] text-beige-500">
                        An invitation email will be sent to the provided address.
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-beige-400 hover:text-brown-700 hover:bg-beige-100 transition-colors mt-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                    {/* Role picker */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-beige-500 mb-2">
                        Role
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["admin", "enterprise", "contributor", "reviewer"] as Role[]).map(r => {
                          const c = ROLE_CONFIG[r];
                          const RIcon = c.icon;
                          const selected = role === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRole(r)}
                              className={cn(
                                "flex items-start gap-2.5 rounded-xl p-3 border transition-all text-left",
                                selected
                                  ? "border-brown-300 bg-brown-50 ring-1 ring-brown-200"
                                  : "border-beige-100 hover:border-beige-200 hover:bg-beige-50",
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                selected ? c.bg : "bg-beige-100",
                              )}>
                                <RIcon className={cn("w-3 h-3", selected ? c.text : "text-beige-400")} />
                              </div>
                              <div>
                                <p className={cn(
                                  "text-[12px] font-semibold leading-tight",
                                  selected ? "text-brown-950" : "text-brown-700",
                                )}>
                                  {c.label}
                                </p>
                                <p className="text-[10px] text-beige-400 mt-0.5 leading-snug">
                                  {c.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-beige-500 mb-1.5">
                        Full Name
                      </label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Sarah Mitchell"
                        className={cn(
                          "w-full h-10 px-3.5 text-[13px] rounded-xl border bg-beige-50 text-brown-950 placeholder:text-beige-300 focus:bg-white focus:outline-none transition-all",
                          errors.name ? "border-red-300 focus:border-red-400" : "border-beige-100 focus:border-brown-300",
                        )}
                      />
                      {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-beige-500 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. sarah@company.com"
                        className={cn(
                          "w-full h-10 px-3.5 text-[13px] rounded-xl border bg-beige-50 text-brown-950 placeholder:text-beige-300 focus:bg-white focus:outline-none transition-all",
                          errors.email ? "border-red-300 focus:border-red-400" : "border-beige-100 focus:border-brown-300",
                        )}
                      />
                      {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Organization (enterprise / reviewer) */}
                    {(role === "enterprise" || role === "reviewer") && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-beige-500 mb-1.5">
                          Organisation {role === "enterprise" ? "" : "(optional)"}
                        </label>
                        <input
                          value={org}
                          onChange={e => setOrg(e.target.value)}
                          placeholder={role === "enterprise" ? "e.g. Acme Corp" : "e.g. GlimmoraTeam"}
                          className="w-full h-10 px-3.5 text-[13px] rounded-xl border border-beige-100 bg-beige-50 text-brown-950 placeholder:text-beige-300 focus:bg-white focus:border-brown-300 focus:outline-none transition-all"
                        />
                      </div>
                    )}

                    {/* Permission note */}
                    <div className={cn(
                      "flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[11px] leading-snug",
                      rc.bg,
                    )}>
                      {React.createElement(rc.icon, { className: cn("w-3.5 h-3.5 shrink-0 mt-0.5", rc.text) })}
                      <span className={rc.text}>
                        <span className="font-semibold">{rc.label}s</span> — {rc.description}.
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 h-10 rounded-xl border border-beige-200 text-[13px] font-semibold text-brown-600 hover:bg-beige-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-10 rounded-xl bg-brown-950 hover:bg-brown-800 text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Invite
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* Success state */
                <div className="px-6 py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-forest-500" />
                  </div>
                  <h3 className="font-heading text-[18px] font-bold text-brown-950 mb-1">Invite Sent!</h3>
                  <p className="text-[12px] text-beige-500 mb-1">
                    An invitation has been sent to
                  </p>
                  <p className="text-[13px] font-semibold text-brown-800 mb-6">{email}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { reset(); }}
                      className="flex-1 h-10 rounded-xl border border-beige-200 text-[13px] font-semibold text-brown-600 hover:bg-beige-50 transition-colors"
                    >
                      Add Another
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 h-10 rounded-xl bg-brown-950 text-white text-[13px] font-semibold hover:bg-brown-800 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════ Edit Role Modal ════════════════════════ */

function EditRoleModal({ user, open, onClose, onSave }: {
  user: PlatformUser | null; open: boolean;
  onClose: () => void; onSave: (id: string, role: Role) => void;
}) {
  const [selected, setSelected] = React.useState<Role>(user?.role ?? "contributor");

  React.useEffect(() => { if (user) setSelected(user.role); }, [user]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-brown-950/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white border border-beige-100 overflow-hidden pointer-events-auto"
              style={{ boxShadow: "0 24px 60px rgba(33,23,19,0.14)" }}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-beige-50">
                <div>
                  <h2 className="font-heading text-[16px] font-bold text-brown-950">Change Role</h2>
                  <p className="text-[11px] text-beige-500 mt-0.5">{user.name} · {user.email}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-beige-400 hover:text-brown-700 hover:bg-beige-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                {(["admin", "enterprise", "contributor", "reviewer"] as Role[]).map(r => {
                  const c = ROLE_CONFIG[r];
                  const RIcon = c.icon;
                  const sel = selected === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setSelected(r)}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-xl px-4 py-3 border transition-all text-left",
                        sel
                          ? "border-brown-300 bg-brown-50 ring-1 ring-brown-200"
                          : "border-beige-100 hover:bg-beige-50",
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", sel ? c.bg : "bg-beige-100")}>
                        <RIcon className={cn("w-3.5 h-3.5", sel ? c.text : "text-beige-400")} />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-[12px] font-semibold", sel ? "text-brown-950" : "text-brown-700")}>
                          {c.label}
                        </p>
                        <p className="text-[10px] text-beige-400">{c.description}</p>
                      </div>
                      {sel && <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />}
                    </button>
                  );
                })}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 h-10 rounded-xl border border-beige-200 text-[13px] font-semibold text-brown-600 hover:bg-beige-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { onSave(user.id, selected); onClose(); }}
                    className="flex-1 h-10 rounded-xl bg-brown-950 text-white text-[13px] font-semibold hover:bg-brown-800 transition-colors"
                  >
                    Save Role
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════ Page ════════════════════════ */

export default function AdminRolesPage() {
  const [mounted, setMounted]       = React.useState(false);
  const [users, setUsers]           = React.useState<PlatformUser[]>(MOCK_USERS);
  const [tab, setTab]               = React.useState<TabId>("all");
  const [search, setSearch]         = React.useState("");
  const [sortField, setSortField]   = React.useState<SortField>("name");
  const [sortDir, setSortDir]       = React.useState<SortDir>("asc");
  const [addOpen, setAddOpen]       = React.useState(false);
  const [editUser, setEditUser]     = React.useState<PlatformUser | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  }

  function handleAddUser(u: PlatformUser) { setUsers(prev => [u, ...prev]); }
  function handleSaveRole(id: string, role: Role) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  }
  function handleToggleSuspend(id: string) {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u
    ));
  }
  function handleRemove(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  /* ── Derived ── */
  const base = React.useMemo(() => {
    if (tab === "all") return users;
    return users.filter(u => u.role === tab);
  }, [users, tab]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return base;
    return base.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.org ?? "").toLowerCase().includes(q),
    );
  }, [base, search]);

  const sorted = React.useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "name")   cmp = a.name.localeCompare(b.name);
    if (sortField === "role")   cmp = a.role.localeCompare(b.role);
    if (sortField === "status") cmp = a.status.localeCompare(b.status);
    if (sortField === "joined") cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    if (sortField === "active") cmp = (a.lastActive === "—" ? 0 : new Date(a.lastActive).getTime())
                                    - (b.lastActive === "—" ? 0 : new Date(b.lastActive).getTime());
    return sortDir === "asc" ? cmp : -cmp;
  }), [filtered, sortField, sortDir]);

  const counts = React.useMemo(() => ({
    all:         users.length,
    admin:       users.filter(u => u.role === "admin").length,
    enterprise:  users.filter(u => u.role === "enterprise").length,
    contributor: users.filter(u => u.role === "contributor").length,
    reviewer:    users.filter(u => u.role === "reviewer").length,
  }), [users]);

  if (!mounted) return <PageSkeleton />;

  return (
    <>
      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddUser} />
      <EditRoleModal
        user={editUser}
        open={!!editUser}
        onClose={() => setEditUser(null)}
        onSave={handleSaveRole}
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-1.5">
              Platform Admin
            </p>
            <h1 className="font-heading text-[28px] font-bold text-brown-950 leading-tight">
              Roles & Access
            </h1>
            <p className="text-sm text-beige-500 mt-1">
              Manage user roles, invite new members, and control platform access
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-brown-950 hover:bg-brown-800 text-white text-[13px] font-semibold transition-colors shadow-sm shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Users",   value: counts.all,         icon: Users,      iconBg: "bg-brown-50",  iconColor: "text-brown-500" },
            { label: "Admins",        value: counts.admin,       icon: ShieldCheck, iconBg: "bg-brown-50",  iconColor: "text-brown-600" },
            { label: "Enterprise",    value: counts.enterprise,  icon: Building2,  iconBg: "bg-gold-50",   iconColor: "text-gold-600" },
            { label: "Contributors",  value: counts.contributor, icon: UserCog,    iconBg: "bg-teal-50",   iconColor: "text-teal-600" },
            { label: "Reviewers",     value: counts.reviewer,    icon: Shield,     iconBg: "bg-forest-50", iconColor: "text-forest-600" },
          ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
            <div key={label} className="rounded-2xl bg-white border border-beige-100 shadow-sm p-4">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", iconBg)}>
                <Icon className={cn("w-4 h-4", iconColor)} />
              </div>
              <p className="font-heading text-[22px] font-bold text-brown-950 leading-none">{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-beige-400 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Table ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-beige-50">

            {/* Tabs */}
            <div className="flex items-center gap-0.5 p-1 bg-beige-50 rounded-xl flex-wrap">
              {TABS.map(({ id, label }) => {
                const active = tab === id;
                const count  = counts[id as keyof typeof counts];
                return (
                  <button
                    key={id}
                    onClick={() => { setTab(id); setSearch(""); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                      active
                        ? "bg-white text-brown-950 shadow-sm"
                        : "text-beige-500 hover:text-brown-700 hover:bg-white/50",
                    )}
                  >
                    {label}
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-px rounded-full",
                      active ? "bg-brown-100 text-brown-700" : "bg-beige-200 text-beige-500",
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users…"
                className="h-9 pl-9 pr-10 w-52 text-[12px] rounded-xl border border-beige-100 bg-beige-50 placeholder:text-beige-400 text-brown-800 focus:bg-white focus:border-brown-300 focus:outline-none transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-beige-300 font-mono pointer-events-none hidden sm:block">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Table */}
          {sorted.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-beige-50 bg-beige-50/40">
                    <th className="text-left px-5 py-3 w-[30%]">
                      <SortTh field="name"   label="User"        current={sortField} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="text-left px-4 py-3 w-[14%]">
                      <SortTh field="role"   label="Role"        current={sortField} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="text-left px-4 py-3 w-[12%]">
                      <SortTh field="status" label="Status"      current={sortField} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="text-left px-4 py-3 w-[18%]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Organisation</span>
                    </th>
                    <th className="text-left px-4 py-3 w-[12%]">
                      <SortTh field="joined" label="Joined"      current={sortField} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="text-left px-4 py-3 w-[12%]">
                      <SortTh field="active" label="Last Active" current={sortField} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="px-4 py-3 w-[5%]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-50">
                  {sorted.map(user => {
                    const rc = ROLE_CONFIG[user.role];
                    const sc = STATUS_CONFIG[user.status];
                    const SIcon = sc.icon;
                    return (
                      <tr
                        key={user.id}
                        className={cn(
                          "group transition-colors hover:bg-beige-50/60",
                          user.status === "suspended" && "opacity-60",
                        )}
                      >
                        {/* User */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                              avatarBg(user.role),
                            )}>
                              {initials(user.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-brown-950 truncate max-w-[180px]">
                                {user.name}
                              </p>
                              <p className="text-[11px] text-beige-400 truncate max-w-[180px]">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
                            rc.bg, rc.text,
                          )}>
                            <span className={cn("w-[5px] h-[5px] rounded-full shrink-0", rc.dot)} />
                            {rc.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full",
                            sc.bg, sc.text,
                          )}>
                            <SIcon className="w-3 h-3 shrink-0" />
                            {sc.label}
                          </span>
                        </td>

                        {/* Org */}
                        <td className="px-4 py-3.5">
                          {user.org ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-beige-300 shrink-0" />
                              <span className="text-[12px] text-brown-700 truncate max-w-[120px]">{user.org}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-beige-300">—</span>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3.5">
                          <p className="text-[12px] text-brown-700">{fmtDate(user.joinedAt)}</p>
                        </td>

                        {/* Last active */}
                        <td className="px-4 py-3.5">
                          <p className={cn(
                            "text-[12px]",
                            user.lastActive === "—" ? "text-beige-300" : "text-brown-700",
                          )}>
                            {user.lastActive === "—" ? "Not yet" : fmtDate(user.lastActive)}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <RowMenu
                            user={user}
                            onEdit={() => setEditUser(user)}
                            onToggleSuspend={() => handleToggleSuspend(user.id)}
                            onRemove={() => handleRemove(user.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {search.trim().length >= 2 ? (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-beige-50 border border-beige-100 flex items-center justify-center mb-4">
                    <Search className="w-5 h-5 text-beige-300" />
                  </div>
                  <p className="text-[14px] font-semibold text-brown-950 mb-1">No users found</p>
                  <p className="text-[12px] text-beige-400">
                    Nothing matched <span className="font-medium text-brown-700">&ldquo;{search}&rdquo;</span>
                  </p>
                </>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-brown-50 border border-brown-100 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-brown-400" />
                  </div>
                  <p className="text-[14px] font-semibold text-brown-950 mb-1">No users in this role</p>
                  <button
                    onClick={() => setAddOpen(true)}
                    className="mt-3 text-[12px] font-semibold text-brown-600 hover:underline underline-offset-2"
                  >
                    + Add a user
                  </button>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          {sorted.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-beige-50">
              <span className="text-[11px] text-beige-400">
                {sorted.length} user{sorted.length !== 1 ? "s" : ""}
                {search.trim().length >= 2 ? ` matching "${search}"` : ""}
              </span>
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-brown-600 hover:underline underline-offset-2"
              >
                <UserPlus className="w-3 h-3" /> Add user
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
