"use client";

/**
 * Meridian — ConfirmationDialog
 *
 * Thin Modal wrapper for accept/cancel decisions. Footer buttons follow
 * the enterprise / admin modal contract (h-9, text-[13px], bordered cancel).
 */

import * as React from "react";
import { Modal } from "./Modal";
import {
  ModalCancelButton,
  ModalDangerButton,
  ModalPrimaryButton,
} from "./modal-actions";

interface ConfirmationDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Confirm-button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel-button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Tone of the confirm button (primary | danger). */
  confirmTone?: "primary" | "danger";
  /** Spinner on the confirm button. */
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "primary",
  loading,
}) => {
  const ConfirmBtn = confirmTone === "danger" ? ModalDangerButton : ModalPrimaryButton;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <ModalCancelButton onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </ModalCancelButton>
          <ConfirmBtn onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </ConfirmBtn>
        </>
      }
    />
  );
};
