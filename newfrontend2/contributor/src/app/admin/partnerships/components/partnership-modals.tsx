"use client";

/**
 * Women workforce partnership modals — Aurora Glass (meridian Modal shell +
 * glass surface, AuroraInput/AuroraTextarea fields).
 *
 * Logic untouched: same partnership services, same invite/mailto flow, same
 * validation thresholds and onSuccess(newId) contract.
 */

import * as React from "react";
import { Mail, Pencil, Plus, UserPlus } from "lucide-react";
import { Modal } from "@/components/meridian";
import {
  addWWContributor,
  createAdminWWPartner,
  markWWContributorInviteSent,
  updateAdminWWPartner,
} from "@/lib/admin/mocks/partnerships-service";
import {
  buildWWContributorInviteMailto,
  buildWWContributorInviteUrl,
} from "@/lib/admin/ww-contributor-invite";
import type { MockWWPartner } from "@/mocks/admin/partnerships";
import { cn } from "@/lib/utils/cn";
import {
  AuroraInput,
  AuroraTextarea,
  Field,
  GLASS_MODAL_CLASS,
  GLASS_MODAL_OVERLAY,
  TONE,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

type WWModal = "new" | "edit" | "contributor" | null;


export function WWPartnershipModals({
  partner,
  open,
  onClose,
  onSuccess,
}: {
  partner?: MockWWPartner;
  open: WWModal;
  onClose: () => void;
  onSuccess: (msg: string, newId?: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [country, setCountry] = React.useState("India");
  const [description, setDescription] = React.useState("");
  const [programsText, setProgramsText] = React.useState("");
  const [leadName, setLeadName] = React.useState("");
  const [leadEmail, setLeadEmail] = React.useState("");
  const [leadTitle, setLeadTitle] = React.useState("");
  const [contribName, setContribName] = React.useState("");
  const [contribEmail, setContribEmail] = React.useState("");
  const [contribError, setContribError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open === "edit" && partner) {
      setLeadName(partner.leadContact.name);
      setLeadEmail(partner.leadContact.email);
      setLeadTitle(partner.leadContact.title);
      setDescription(partner.description);
      setProgramsText(partner.programs.join(", "));
    }
    if (open === "new") {
      setName("");
      setCountry("India");
      setDescription("");
      setProgramsText("Mentorship pairing");
      setLeadName("");
      setLeadEmail("");
      setLeadTitle("");
    }
    if (open === "contributor") {
      setContribName("");
      setContribEmail("");
      setContribError(null);
    }
  }, [open, partner]);

  function saveNew() {
    if (name.trim().length < 2 || !leadEmail.includes("@")) return;
    const created = createAdminWWPartner({
      name,
      country,
      description: description.trim() || `${name.trim()} women-workforce partner.`,
      programs: programsText.split(",").map((p) => p.trim()).filter(Boolean),
      leadName,
      leadEmail,
      leadTitle: leadTitle || "Partnership lead",
    });
    onSuccess("Women workforce partner added.", created.id);
    onClose();
  }

  function saveEdit() {
    if (!partner) return;
    updateAdminWWPartner(partner.id, {
      leadContact: { name: leadName.trim(), email: leadEmail.trim(), title: leadTitle.trim() },
      description: description.trim(),
      programs: programsText.split(",").map((p) => p.trim()).filter(Boolean),
    });
    onSuccess("Partner updated.");
    onClose();
  }

  function saveContributor(andSendInvite: boolean) {
    if (!partner || contribName.trim().length < 2 || !contribEmail.includes("@")) return;
    setContribError(null);
    const result = addWWContributor(partner.id, {
      name: contribName.trim(),
      email: contribEmail.trim().toLowerCase(),
      status: "invited",
    });
    if (!result.ok) {
      setContribError(result.error);
      return;
    }

    if (andSendInvite && typeof window !== "undefined") {
      markWWContributorInviteSent(partner.id, result.contributor.id);
      const inviteUrl = buildWWContributorInviteUrl(
        window.location.origin,
        partner.id,
        result.contributor.inviteToken,
      );
      const mailto = buildWWContributorInviteMailto({
        contributorName: result.contributor.name,
        contributorEmail: result.contributor.email,
        partnerName: partner.name,
        inviteUrl,
        fromEmail: partner.leadContact.email,
      });
      window.location.href = mailto;
      onSuccess(`Contributor added — invite email opened for ${result.contributor.name}.`);
    } else {
      onSuccess("Contributor added — use Send invite on their row to email their personal link.");
    }
    onClose();
  }

  const newInvalid = name.trim().length < 2 || !leadEmail.includes("@");
  const contribInvalid = contribName.trim().length < 2 || !contribEmail.includes("@");

  return (
    <>
      <Modal
        open={open === "new"}
        onClose={onClose}
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title="New women workforce partner"
        description="Phase 1 directory entry — programs and description can be refined later."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={ghostBtnClass}>
              Cancel
            </button>
            <button
              type="button"
              onClick={saveNew}
              disabled={newInvalid}
              className={primaryBtnClass}
              style={primaryStyle}
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Add partner
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Organisation name" required>
            <AuroraInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Country">
            <AuroraInput value={country} onChange={(e) => setCountry(e.target.value)} />
          </Field>
          <Field label="Lead contact name">
            <AuroraInput value={leadName} onChange={(e) => setLeadName(e.target.value)} />
          </Field>
          <Field label="Lead email" required>
            <AuroraInput type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
          </Field>
          <Field label="Lead title">
            <AuroraInput value={leadTitle} onChange={(e) => setLeadTitle(e.target.value)} />
          </Field>
          <Field label="Programs" hint="Comma-separated">
            <AuroraInput
              value={programsText}
              onChange={(e) => setProgramsText(e.target.value)}
              placeholder="Mentorship pairing, Skills upgrade"
            />
          </Field>
          <Field label="Description">
            <AuroraTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="min-h-[88px] resize-y"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={open === "edit"}
        onClose={onClose}
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title={`Edit ${partner?.name ?? "partner"}`}
        description="Update lead contact, programs, and partner description."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={ghostBtnClass}>
              Cancel
            </button>
            <button type="button" onClick={saveEdit} className={primaryBtnClass} style={primaryStyle}>
              <Pencil className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Save changes
            </button>
          </>
        }
      >
        {partner && (
          <ContextStrip label="Partner" value={`${partner.country} · ${partner.contributors} in flight`} />
        )}
        <div className="mt-4 space-y-4">
          <Field label="Lead contact name">
            <AuroraInput value={leadName} onChange={(e) => setLeadName(e.target.value)} />
          </Field>
          <Field label="Lead email">
            <AuroraInput type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
          </Field>
          <Field label="Lead title">
            <AuroraInput value={leadTitle} onChange={(e) => setLeadTitle(e.target.value)} />
          </Field>
          <Field label="Programs" hint="Comma-separated">
            <AuroraInput value={programsText} onChange={(e) => setProgramsText(e.target.value)} />
          </Field>
          <Field label="Description">
            <AuroraTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="min-h-[88px] resize-y"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={open === "contributor"}
        onClose={onClose}
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title="Add contributor"
        description="Creates a cohort row with a unique personal invite link. Use Send invite on their row after saving."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={ghostBtnClass}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveContributor(false)}
              disabled={contribInvalid}
              className={ghostBtnClass}
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Add contributor
            </button>
            <button
              type="button"
              onClick={() => saveContributor(true)}
              disabled={contribInvalid}
              className={primaryBtnClass}
              style={primaryStyle}
            >
              <Mail className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Add &amp; send invite
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {contribError && (
            <p
              role="alert"
              className="rounded-xl border px-3.5 py-2.5 font-body text-[12px]"
              style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
            >
              {contribError}
            </p>
          )}
          <Field label="Full name" required>
            <AuroraInput value={contribName} onChange={(e) => setContribName(e.target.value)} />
          </Field>
          <Field label="Email" required>
            <AuroraInput type="email" value={contribEmail} onChange={(e) => setContribEmail(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

function ContextStrip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/55 backdrop-blur px-3.5 py-2.5">
      <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-body text-[13px] font-semibold text-foreground leading-snug",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export type { WWModal };
