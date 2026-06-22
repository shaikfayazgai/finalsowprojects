"use client";

/**
 * Tenant & roles workspace — compact org context + member directory hero.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Building2,
  ChevronDown,
  MoreHorizontal,
  Search,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  computeTenantSummary,
  getTenantInfoMock,
  getTenantMembersMock,
  type TenantMemberMock,
} from "@/lib/settings/settings-mock";
import { toast } from "@/lib/stores/toast-store";
import { InviteMemberDrawer } from "./invite-member-drawer";
import { MemberRolesDrawer } from "./member-roles-drawer";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import {
  ROLE_META,
  memberHasSod,
  roleLabel,
  rolePillCls,
} from "../tenant-roles";
import { cn } from "@/lib/utils/cn";
import {
  ACCENT_TEXT,
  AURORA_ACCENT,
  Chip,
  GLASS_CARD,
  GLASS_SHADOW,
  primaryStyle,
  type Tone,
} from "@/app/admin/_shell/aurora-ui";

type StatusFilter = "all" | "active" | "invited" | "suspended";

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "invited", label: "Invited" },
  { key: "suspended", label: "Suspended" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days}d ago`;
  return fmtDate(iso);
}

function memberActivityLabel(member: TenantMemberMock): string {
  if (member.status === "invited" && member.invitedAt) {
    return `Invited ${fmtDate(member.invitedAt)}`;
  }
  if (member.status === "suspended" && member.suspendedAt) {
    return `Suspended ${fmtDate(member.suspendedAt)}`;
  }
  if (member.lastActiveAt) {
    return `Active ${fmtRelative(member.lastActiveAt)}`;
  }
  return "—";
}

function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): T {
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs],
  ) as T;
}

export function TenantWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = (searchParams.get("status") as StatusFilter | null) ?? "all";
  const roleFilter = searchParams.get("role") ?? "";
  const search = searchParams.get("q") ?? "";

  const [searchDraft, setSearchDraft] = React.useState(search);
  const [roleGuideOpen, setRoleGuideOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [manageMember, setManageMember] = React.useState<TenantMemberMock | null>(null);
  const [menuMemberId, setMenuMemberId] = React.useState<string | null>(null);

  React.useEffect(() => setSearchDraft(search), [search]);

  const { licensedRoles } = useEnterpriseAccess();
  const tenant = React.useMemo(() => getTenantInfoMock(), []);
  const members = React.useMemo(() => getTenantMembersMock(), []);
  const summary = React.useMemo(() => computeTenantSummary(members), [members]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(
        qs ? `/enterprise/settings/tenant?${qs}` : "/enterprise/settings/tenant",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setParam({ q: value.trim() || null });
  }, 300);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (roleFilter && !m.roles.includes(roleFilter)) return false;
      if (needle) {
        const hay = `${m.name} ${m.email} ${m.roles.map(roleLabel).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [members, statusFilter, roleFilter, search]);

  const hasActiveFilters = statusFilter !== "all" || !!roleFilter || !!search.trim();

  const statusCount = (key: StatusFilter) => {
    if (key === "all") return summary.total;
    if (key === "active") return summary.active;
    if (key === "invited") return summary.invited;
    return summary.suspended;
  };

  const handleResendInvite = (member: TenantMemberMock) => {
    setMenuMemberId(null);
    toast.success("Invite resent", `A new invitation email was sent to ${member.email}.`);
  };

  const handleMemberAction = (action: string, member: TenantMemberMock) => {
    setMenuMemberId(null);
    if (action === "suspend") {
      toast.info("Member suspended", `${member.name} can no longer sign in until reactivated.`);
      return;
    }
    if (action === "reactivate") {
      toast.success("Member reactivated", `${member.name} can sign in again.`);
      return;
    }
    if (action === "cancel-invite") {
      toast.warning("Invite cancelled", `The invitation for ${member.email} was revoked.`);
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Settings · Tenant & roles
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Tenant & roles
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Manage who can access this workspace and what they can do. Role changes and invites are recorded in the audit log.
        </p>
        <RecordLinks />
      </header>

      <TenantOverviewCard tenant={tenant} summary={summary} />

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 pt-4 pb-0 border-b border-white/55">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1 basis-[180px]">
              <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Members
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {filtered.length === 0
                  ? "No members match your filters"
                  : `${filtered.length} of ${summary.total} members`}
              </p>
            </div>

            <div className="relative w-full sm:w-52 order-last sm:order-none sm:ml-auto">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => {
                  setSearchDraft(e.target.value);
                  debouncedSetSearch(e.target.value);
                }}
                placeholder="Search name, email, role…"
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-xl border border-white/55 bg-white/55 backdrop-blur",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.22)]",
                )}
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    setParam({ q: null });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              style={primaryStyle}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-xl shrink-0",
                "text-white font-body text-[12px] font-semibold",
                "transition-transform duration-fast hover:scale-[1.02] active:scale-100",
              )}
            >
              <UserPlus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Invite member
            </button>
          </div>

          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.key;
              const count = statusCount(tab.key);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ status: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-text-secondary hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active ? "bg-white/70 text-foreground" : "text-text-tertiary",
                      tab.key === "invited" && count > 0 && !active && "text-warning-text font-semibold",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                      style={{ backgroundImage: AURORA_ACCENT }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 pb-4 border-t border-white/55">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={!roleFilter} onClick={() => setParam({ role: null })} label="All roles" />
              {licensedRoles.map((role) => (
                <FilterChip
                  key={role}
                  active={roleFilter === role}
                  onClick={() => setParam({ role: roleFilter === role ? null : role })}
                  label={ROLE_META[role].label}
                />
              ))}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="px-5 py-2.5 flex flex-wrap items-center gap-2 border-b border-white/55 bg-white/30">
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
              Active filters
            </span>
            {statusFilter !== "all" && (
              <ActiveChip
                label={STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? statusFilter}
                onRemove={() => setParam({ status: null })}
              />
            )}
            {roleFilter && (
              <ActiveChip
                label={ROLE_META[roleFilter as keyof typeof ROLE_META]?.label ?? roleFilter}
                onRemove={() => setParam({ role: null })}
              />
            )}
            {search.trim() && (
              <ActiveChip
                label={`"${search.trim()}"`}
                onRemove={() => {
                  setSearchDraft("");
                  setParam({ q: null });
                }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                setParam({ q: null, status: null, role: null });
              }}
              className="font-body text-[11.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
            >
              Clear all
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyPanel onClear={() => setParam({ q: null, status: null, role: null })} />
        ) : (
          <>
            <div
              aria-hidden
              className="hidden lg:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_88px_40px] gap-3 px-5 py-2 border-b border-white/55 bg-white/40"
            >
              {["Member", "Roles", "Activity", "Status", ""].map((col) => (
                <span
                  key={col || "actions"}
                  className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary"
                >
                  {col}
                </span>
              ))}
            </div>
            <ul className="divide-y divide-white/60">
              {filtered.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  menuOpen={menuMemberId === m.id}
                  onToggleMenu={() => setMenuMemberId((id) => (id === m.id ? null : m.id))}
                  onCloseMenu={() => setMenuMemberId(null)}
                  onOpen={() => setManageMember(m)}
                  onManage={() => setManageMember(m)}
                  onResend={() => handleResendInvite(m)}
                  onAction={(action) => handleMemberAction(action, m)}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <button
          type="button"
          onClick={() => setRoleGuideOpen((o) => !o)}
          aria-expanded={roleGuideOpen}
          className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-white/40 transition-colors duration-fast"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/55 bg-white/55 text-text-secondary shrink-0">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-body text-[13.5px] font-semibold text-foreground">Role guide</p>
              <p className="font-body text-[12px] text-text-secondary truncate">
                {licensedRoles.length} licensed role{licensedRoles.length === 1 ? "" : "s"} for
                this tenant (set at provisioning) · expand for descriptions
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-text-tertiary shrink-0 transition-transform duration-fast",
              roleGuideOpen && "rotate-180",
            )}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        {roleGuideOpen && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-5 pb-5 border-t border-white/55 pt-4">
            {licensedRoles.map((role) => (
              <li
                key={role}
                className="rounded-lg border border-white/55 bg-white/40 px-3 py-2.5"
              >
                <p className="font-body text-[13px] font-semibold text-foreground">
                  {ROLE_META[role].label}
                </p>
                <p className="mt-0.5 font-body text-[11.5px] text-text-secondary leading-snug">
                  {ROLE_META[role].description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <InviteMemberDrawer open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <MemberRolesDrawer
        member={manageMember}
        members={members}
        open={!!manageMember}
        onClose={() => setManageMember(null)}
      />
    </div>
  );
}

function TenantOverviewCard({
  tenant,
  summary,
}: {
  tenant: ReturnType<typeof getTenantInfoMock>;
  summary: ReturnType<typeof computeTenantSummary>;
}) {
  return (
    <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
      <div className="flex flex-col lg:flex-row lg:items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/60">
        <div className="flex flex-1 items-start gap-3 px-5 py-4 min-w-0">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/55 bg-white/55 text-text-secondary shrink-0">
            <Building2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-body text-[15px] font-semibold text-foreground">{tenant.name}</p>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/55 bg-white/55 text-text-tertiary">
                {tenant.tenantId}
              </span>
            </div>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              <span className="font-mono">{tenant.domain}</span>
              {tenant.domainVerified && (
                <span className="ml-2 inline-flex px-1.5 py-0.5 rounded-full bg-success-subtle text-success-text font-body text-[10px] font-semibold uppercase">
                  Verified
                </span>
              )}
              <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
              {tenant.subscription} · renews {fmtDate(tenant.renewsAt)}
            </p>
            <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
              Organization details are set at workspace provisioning. Contact Glimmora to change domain or subscription.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-4 lg:w-[340px] shrink-0 divide-x divide-white/60">
          {[
            { label: "Total", value: summary.total },
            { label: "Active", value: summary.active, tone: "brand" as const },
            { label: "Invited", value: summary.invited, tone: summary.invited > 0 ? ("warn" as const) : undefined },
            { label: "Suspended", value: summary.suspended, tone: summary.suspended > 0 ? ("muted" as const) : undefined },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-3 text-center">
              <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                {stat.label}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-display text-[18px] font-semibold tabular-nums",
                  stat.tone === "warn" && "text-warning-text",
                  !stat.tone && "text-foreground",
                  stat.tone === "muted" && "text-text-secondary",
                )}
                style={stat.tone === "brand" ? ACCENT_TEXT : undefined}
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onManage,
  onResend,
  onAction,
}: {
  member: TenantMemberMock;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpen: () => void;
  onManage: () => void;
  onResend: () => void;
  onAction: (action: "suspend" | "reactivate" | "cancel-invite") => void;
}) {
  const sod = memberHasSod(member.roles);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onCloseMenu();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, onCloseMenu]);

  const statusTone: Tone =
    member.status === "active"
      ? "success"
      : member.status === "invited"
        ? "warning"
        : "neutral";

  return (
    <li
      className={cn(
        "relative px-5 py-3 min-h-[56px] bg-white/40 hover:bg-white/50 transition-colors duration-fast",
        "lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_88px_40px] lg:gap-3 lg:items-center",
        sod && "bg-warning-subtle/20",
        member.status === "invited" && !sod && "bg-white/55",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "w-full text-left rounded-md -mx-1 px-1 py-0.5",
          "hover:bg-white/40 transition-colors duration-fast",
          "lg:contents lg:hover:bg-transparent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.25)]",
        )}
      >
        <div className="min-w-0 lg:block">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-[13px] font-medium text-foreground">{member.name}</span>
            {sod && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-warning-subtle text-warning-text font-body text-[10px] font-semibold">
                <Shield className="h-3 w-3" strokeWidth={2} aria-hidden />
                SoD
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-text-tertiary block mt-0.5 truncate">{member.email}</span>
        </div>

        <div className="mt-2 lg:mt-0 flex flex-wrap gap-1">
          {member.roles.map((r) => (
            <span
              key={r}
              className={cn(
                "inline-flex px-2 py-0.5 rounded-md border border-white/55 font-body text-[11px] font-medium",
                rolePillCls(r),
              )}
            >
              {roleLabel(r)}
            </span>
          ))}
        </div>

        <p className="mt-2 lg:mt-0 font-body text-[11.5px] text-text-tertiary">
          {memberActivityLabel(member)}
        </p>

        <span className="mt-2 lg:mt-0 inline-flex w-fit">
          <Chip tone={statusTone} dot={false}>
            {member.status}
          </Chip>
        </span>
      </button>

      <div ref={menuRef} className="absolute top-3 right-4 lg:relative lg:top-auto lg:right-auto lg:flex lg:justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Actions for ${member.name}`}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md",
            "text-text-secondary hover:bg-white/55 hover:text-foreground transition-colors duration-fast",
            menuOpen && "bg-white/55 text-foreground",
          )}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 z-20 min-w-[168px] rounded-xl border border-white/65 bg-white/70 backdrop-blur-lg backdrop-saturate-150 shadow-[0_18px_40px_-24px_rgba(76,56,173,0.30)] py-1"
          >
            {member.status === "invited" ? (
              <>
                <MenuItem onClick={onManage}>Edit invitation</MenuItem>
                <MenuItem onClick={onResend}>Resend invite</MenuItem>
                <MenuItem onClick={() => onAction("cancel-invite")} tone="danger">
                  Cancel invite
                </MenuItem>
              </>
            ) : member.status === "suspended" ? (
              <>
                <MenuItem onClick={onManage}>Manage roles</MenuItem>
                <MenuItem onClick={() => onAction("reactivate")}>Reactivate</MenuItem>
              </>
            ) : (
              <>
                <MenuItem onClick={onManage}>Manage roles</MenuItem>
                <MenuItem onClick={() => onAction("suspend")} tone="danger">
                  Suspend member
                </MenuItem>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function MenuItem({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left font-body text-[12.5px] font-medium transition-colors duration-fast",
        tone === "danger"
          ? "text-error-text hover:bg-error-subtle/40"
          : "text-foreground hover:bg-white/55",
      )}
    >
      {children}
    </button>
  );
}

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 min-h-8 pl-3 pr-2 py-1.5 rounded-full bg-white/65 text-foreground border border-white/70 backdrop-blur font-body text-[12px] font-medium leading-none">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-white/60"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </span>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? { backgroundImage: AURORA_ACCENT } : undefined}
      className={cn(
        "inline-flex items-center justify-center",
        "min-h-8 px-3.5 py-1.5 rounded-full",
        "font-body text-[12px] font-medium leading-none",
        "transition-colors duration-fast whitespace-nowrap",
        active
          ? "text-white"
          : "bg-white/55 border border-white/55 text-text-secondary hover:bg-white/70 backdrop-blur",
      )}
    >
      {label}
    </button>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/settings/security"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Security
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/settings/integrations"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Integrations & SSO
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/audit?actionPrefix=user.invite"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Member audit events
      </Link>
    </p>
  );
}

function EmptyPanel({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <Users className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">No members match</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        Try clearing filters or invite a new teammate to this workspace.
      </p>
      <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast">
        Clear filters
      </button>
    </div>
  );
}
