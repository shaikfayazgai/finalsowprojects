"use client";

/**
 * Credential issued celebration — §5.I.3 (Meridian modal).
 */

import Link from "next/link";
import { Award } from "lucide-react";
import { Modal } from "@/components/meridian/overlays/Modal";
import type { MockCredential } from "@/mocks/contributor/credentials";
import { fmtAcceptedDate } from "../lib/completed-ui-utils";

interface CompletedCredentialModalProps {
  open: boolean;
  onClose: () => void;
  credential: MockCredential;
  taskTitle: string;
}

export function CompletedCredentialModal({
  open,
  onClose,
  credential,
  taskTitle,
}: CompletedCredentialModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="You earned a credential"
      description={taskTitle}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center px-3.5 rounded-md font-body text-[13px] font-semibold text-text-link hover:bg-surface-hover transition-colors duration-fast"
          >
            Later
          </button>
          <Link
            href={`/contributor/credentials/${credential.id}`}
            className="inline-flex h-9 items-center px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            View credential
          </Link>
          <Link
            href={`/contributor/credentials/${credential.id}?share=1`}
            className="inline-flex h-9 items-center px-3.5 rounded-md shadow-xs bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
          >
            Share now
          </Link>
        </div>
      }
    >
      <div className="text-center py-2">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <Award className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <p className="font-body text-[13px] font-semibold text-foreground">
          {credential.skill} · {credential.level}
        </p>
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
          Issued {fmtAcceptedDate(credential.issuedAt)} · Verified by {credential.verifierOrg}
        </p>
      </div>
    </Modal>
  );
}
