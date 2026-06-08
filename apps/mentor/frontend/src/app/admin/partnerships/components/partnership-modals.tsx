"use client";

import * as React from "react";
import { Modal } from "@/components/meridian";
import {
  addUniversityStudent,
  addUniversitySupervisor,
  addWWContributor,
  createAdminUniversity,
  createAdminWWPartner,
  markUniversityStudentInviteSent,
  markWWContributorInviteSent,
  updateAdminUniversity,
  updateAdminWWPartner,
} from "@/lib/admin/mocks/partnerships-service";
import {
  buildStudentInviteMailto,
  buildUniversityStudentInviteUrl,
} from "@/lib/admin/university-student-invite";
import {
  buildWWContributorInviteMailto,
  buildWWContributorInviteUrl,
} from "@/lib/admin/ww-contributor-invite";
import type { MockUniversity, MockWWPartner } from "@/mocks/admin/partnerships";
import { cn } from "@/lib/utils/cn";

type UniModal = "new" | "edit" | "supervisor" | "student" | null;
type WWModal = "new" | "edit" | "contributor" | null;

export function UniversityPartnershipModals({
  university,
  open,
  onClose,
  onSuccess,
}: {
  university?: MockUniversity;
  open: UniModal;
  onClose: () => void;
  onSuccess: (msg: string, newId?: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [country, setCountry] = React.useState("India");
  const [agreementRef, setAgreementRef] = React.useState("");
  const [leadName, setLeadName] = React.useState("");
  const [leadEmail, setLeadEmail] = React.useState("");
  const [leadTitle, setLeadTitle] = React.useState("");
  const [recognition, setRecognition] = React.useState("");
  const [supName, setSupName] = React.useState("");
  const [supEmail, setSupEmail] = React.useState("");
  const [supDept, setSupDept] = React.useState("");
  const [stuName, setStuName] = React.useState("");
  const [stuEmail, setStuEmail] = React.useState("");
  const [stuRoll, setStuRoll] = React.useState("");
  const [stuProgramme, setStuProgramme] = React.useState("");
  const [stuError, setStuError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open === "edit" && university) {
      setLeadName(university.leadContact.name);
      setLeadEmail(university.leadContact.email);
      setLeadTitle(university.leadContact.title);
      setRecognition(university.academicRecognitionRules);
    }
    if (open === "new") {
      setName("");
      setCountry("India");
      setAgreementRef("");
      setLeadName("");
      setLeadEmail("");
      setLeadTitle("");
    }
    if (open === "supervisor") {
      setSupName("");
      setSupEmail("");
      setSupDept("");
    }
    if (open === "student") {
      setStuName("");
      setStuEmail("");
      setStuRoll("");
      setStuProgramme("");
      setStuError(null);
    }
  }, [open, university]);

  function saveNew() {
    if (name.trim().length < 3 || leadName.trim().length < 2 || !leadEmail.includes("@")) return;
    const created = createAdminUniversity({
      name,
      country,
      agreementRef: agreementRef.trim() || `MOU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      leadName,
      leadEmail,
      leadTitle: leadTitle || "Partnership lead",
    });
    onSuccess("University partner added.", created.id);
    onClose();
  }

  function saveEdit() {
    if (!university) return;
    updateAdminUniversity(university.id, {
      leadContact: { name: leadName.trim(), email: leadEmail.trim(), title: leadTitle.trim() },
      academicRecognitionRules: recognition.trim(),
    });
    onSuccess("University updated.");
    onClose();
  }

  function saveSupervisor() {
    if (!university || supName.trim().length < 2 || !supEmail.includes("@")) return;
    addUniversitySupervisor(university.id, {
      name: supName.trim(),
      email: supEmail.trim().toLowerCase(),
      department: supDept.trim() || "General",
    });
    onSuccess("Supervisor added.");
    onClose();
  }

  function saveStudent(andSendInvite: boolean) {
    if (!university || stuName.trim().length < 2 || !stuEmail.includes("@")) return;
    setStuError(null);
    const result = addUniversityStudent(university.id, {
      name: stuName.trim(),
      email: stuEmail.trim().toLowerCase(),
      rollNumber: stuRoll.trim() || undefined,
      programme: stuProgramme.trim() || undefined,
      status: "invited",
    });
    if (!result.ok) {
      setStuError(result.error);
      return;
    }

    if (andSendInvite && typeof window !== "undefined") {
      markUniversityStudentInviteSent(university.id, result.student.id);
      const inviteUrl = buildUniversityStudentInviteUrl(
        window.location.origin,
        university.id,
        result.student.inviteToken,
      );
      const mailto = buildStudentInviteMailto({
        studentName: result.student.name,
        studentEmail: result.student.email,
        universityName: university.name,
        inviteUrl,
        fromEmail: university.leadContact.email,
      });
      window.location.href = mailto;
      onSuccess(`Student added — invite email opened for ${result.student.name}.`);
    } else {
      onSuccess("Student added — use Send invite on their row to email their personal link.");
    }
    onClose();
  }

  return (
    <>
      <Modal
        open={open === "new"}
        onClose={onClose}
        title="New university partner"
        description="Phase 1 directory entry — agreement details can be refined later."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button
              type="button"
              onClick={saveNew}
              disabled={name.trim().length < 3 || leadName.trim().length < 2 || !leadEmail.includes("@")}
              className={cn(
                primaryBtnCls,
                (name.trim().length < 3 || leadName.trim().length < 2 || !leadEmail.includes("@")) &&
                  "opacity-50 cursor-not-allowed hover:bg-brand",
              )}
            >
              Add partner
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <ModalField label="University name" value={name} onChange={setName} />
          <ModalField label="Country" value={country} onChange={setCountry} />
          <ModalField
            label="Agreement ref (optional)"
            value={agreementRef}
            onChange={setAgreementRef}
            placeholder="MOU-2026-0XX"
          />
          <ModalField label="Lead contact name" value={leadName} onChange={setLeadName} />
          <ModalField label="Lead email" value={leadEmail} onChange={setLeadEmail} type="email" />
          <ModalField label="Lead title" value={leadTitle} onChange={setLeadTitle} />
        </div>
      </Modal>

      <Modal
        open={open === "edit"}
        onClose={onClose}
        title={`Edit ${university?.name ?? "partner"}`}
        description="Update lead contact and academic recognition rules for this MOU."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={saveEdit} className={primaryBtnCls}>
              Save changes
            </button>
          </>
        }
      >
        {university && (
          <ContextStrip
            label="Agreement"
            value={`${university.agreementRef} · ${university.country}`}
            mono
          />
        )}
        <div className="mt-4 space-y-4">
          <ModalField label="Lead contact name" value={leadName} onChange={setLeadName} />
          <ModalField label="Lead email" value={leadEmail} onChange={setLeadEmail} type="email" />
          <ModalField label="Lead title" value={leadTitle} onChange={setLeadTitle} />
          <ModalTextarea
            label="Academic recognition rules"
            hint="Shown to students and faculty during onboarding."
            value={recognition}
            onChange={setRecognition}
            rows={4}
          />
        </div>
      </Modal>

      <Modal
        open={open === "supervisor"}
        onClose={onClose}
        title="Add supervisor"
        description={university ? `Faculty coordinator for ${university.name}` : undefined}
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button
              type="button"
              onClick={saveSupervisor}
              disabled={supName.trim().length < 2 || !supEmail.includes("@")}
              className={cn(
                primaryBtnCls,
                (supName.trim().length < 2 || !supEmail.includes("@")) &&
                  "opacity-50 cursor-not-allowed hover:bg-brand",
              )}
            >
              Add supervisor
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <ModalField label="Name" value={supName} onChange={setSupName} placeholder="Prof. Lakshmi N." />
          <ModalField label="Email" value={supEmail} onChange={setSupEmail} type="email" />
          <ModalField label="Department" value={supDept} onChange={setSupDept} placeholder="Computer Science" />
        </div>
      </Modal>

      <Modal
        open={open === "student"}
        onClose={onClose}
        title="Add student"
        description="Creates a cohort row with a unique personal invite link. Use Send invite on their row after saving."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveStudent(false)}
              disabled={stuName.trim().length < 2 || !stuEmail.includes("@")}
              className={cn(
                secondaryBtnCls,
                (stuName.trim().length < 2 || !stuEmail.includes("@")) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              Add student
            </button>
            <button
              type="button"
              onClick={() => saveStudent(true)}
              disabled={stuName.trim().length < 2 || !stuEmail.includes("@")}
              className={cn(
                primaryBtnCls,
                (stuName.trim().length < 2 || !stuEmail.includes("@")) &&
                  "opacity-50 cursor-not-allowed hover:bg-brand",
              )}
            >
              Add &amp; send invite
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {stuError && (
            <p
              role="alert"
              className="rounded-xl border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text"
            >
              {stuError}
            </p>
          )}
          <ModalField label="Full name" value={stuName} onChange={setStuName} />
          <ModalField label="University email" value={stuEmail} onChange={setStuEmail} type="email" />
          <ModalField
            label="Roll number (optional)"
            value={stuRoll}
            onChange={setStuRoll}
            placeholder="CS2026-148"
          />
          <ModalField
            label="Programme (optional)"
            value={stuProgramme}
            onChange={setStuProgramme}
            placeholder="B.Tech CS, Year 2"
          />
          {university && university.supervisors.length === 0 && (
            <p className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-3 py-2 font-body text-[12px] text-warning-text leading-relaxed">
              Add at least one supervisor before the student reaches the university onboarding step.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

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

  return (
    <>
      <Modal
        open={open === "new"}
        onClose={onClose}
        title="New women workforce partner"
        description="Phase 1 directory entry — programs and description can be refined later."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button
              type="button"
              onClick={saveNew}
              disabled={name.trim().length < 2 || !leadEmail.includes("@")}
              className={cn(
                primaryBtnCls,
                (name.trim().length < 2 || !leadEmail.includes("@")) &&
                  "opacity-50 cursor-not-allowed hover:bg-brand",
              )}
            >
              Add partner
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <ModalField label="Organisation name" value={name} onChange={setName} />
          <ModalField label="Country" value={country} onChange={setCountry} />
          <ModalField label="Lead contact name" value={leadName} onChange={setLeadName} />
          <ModalField label="Lead email" value={leadEmail} onChange={setLeadEmail} type="email" />
          <ModalField label="Lead title" value={leadTitle} onChange={setLeadTitle} />
          <ModalField
            label="Programs (comma-separated)"
            value={programsText}
            onChange={setProgramsText}
            placeholder="Mentorship pairing, Skills upgrade"
          />
          <ModalTextarea
            label="Description"
            value={description}
            onChange={setDescription}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={open === "edit"}
        onClose={onClose}
        title={`Edit ${partner?.name ?? "partner"}`}
        description="Update lead contact, programs, and partner description."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={saveEdit} className={primaryBtnCls}>
              Save changes
            </button>
          </>
        }
      >
        {partner && (
          <ContextStrip label="Partner" value={`${partner.country} · ${partner.contributors} in flight`} />
        )}
        <div className="mt-4 space-y-4">
          <ModalField label="Lead contact name" value={leadName} onChange={setLeadName} />
          <ModalField label="Lead email" value={leadEmail} onChange={setLeadEmail} type="email" />
          <ModalField label="Lead title" value={leadTitle} onChange={setLeadTitle} />
          <ModalField
            label="Programs (comma-separated)"
            value={programsText}
            onChange={setProgramsText}
          />
          <ModalTextarea
            label="Description"
            value={description}
            onChange={setDescription}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={open === "contributor"}
        onClose={onClose}
        title="Add contributor"
        description="Creates a cohort row with a unique personal invite link. Use Send invite on their row after saving."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveContributor(false)}
              disabled={contribName.trim().length < 2 || !contribEmail.includes("@")}
              className={cn(
                secondaryBtnCls,
                (contribName.trim().length < 2 || !contribEmail.includes("@")) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              Add contributor
            </button>
            <button
              type="button"
              onClick={() => saveContributor(true)}
              disabled={contribName.trim().length < 2 || !contribEmail.includes("@")}
              className={cn(
                primaryBtnCls,
                (contribName.trim().length < 2 || !contribEmail.includes("@")) &&
                  "opacity-50 cursor-not-allowed hover:bg-brand",
              )}
            >
              Add &amp; send invite
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {contribError && (
            <p
              role="alert"
              className="rounded-xl border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text"
            >
              {contribError}
            </p>
          )}
          <ModalField label="Full name" value={contribName} onChange={setContribName} />
          <ModalField label="Email" value={contribEmail} onChange={setContribEmail} type="email" />
        </div>
      </Modal>
    </>
  );
}

function ModalField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

function ModalTextarea({
  label,
  hint,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={cn(inputCls, "h-auto py-2.5 leading-relaxed resize-y min-h-[88px]")}
      />
      {hint && (
        <span className="block mt-1.5 font-body text-[11px] text-text-tertiary">{hint}</span>
      )}
    </label>
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
    <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-body text-[13px] font-medium text-foreground",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke-subtle bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand",
);

const cancelBtnCls = cn(
  "inline-flex items-center h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke-subtle",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const secondaryBtnCls = cn(
  "inline-flex items-center h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);

export type { UniModal, WWModal };
