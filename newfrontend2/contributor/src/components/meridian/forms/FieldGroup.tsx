/**
 * Meridian — FieldGroup + FormError
 *
 * Label + input + hint + error wrapper. Generates an id for the input
 * so screen readers can associate label/error via `aria-describedby`.
 *
 *   <FieldGroup label="Email" hint="We never share this." error={error}>
 *     <Input value={email} onChange={setEmail} />
 *   </FieldGroup>
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle } from "lucide-react";

interface FieldGroupProps {
  label: React.ReactNode;
  /** Static helper text under the input. */
  hint?: React.ReactNode;
  /** Validation error message. When present, sets the field to invalid. */
  error?: React.ReactNode;
  /** When true, marks the label with a red asterisk for required fields. */
  required?: boolean;
  /** Optional context label rendered to the right of the field label. */
  trailingLabel?: React.ReactNode;
  className?: string;
  children: React.ReactElement;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  label,
  hint,
  error,
  required,
  trailingLabel,
  className,
  children,
}) => {
  const id = React.useId();
  const fieldId = `${id}-field`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const child = React.cloneElement(children, {
    id: fieldId,
    "aria-describedby": describedBy,
    invalid: !!error,
    // Pass through whatever the consumer also wanted to set
    ...((children.props as React.HTMLAttributes<HTMLElement>) ?? {}),
  } as Partial<React.HTMLAttributes<HTMLElement>>);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={fieldId}
          className="font-body text-body-sm font-semibold text-text-secondary"
        >
          {label}
          {required && <span className="text-error ml-1" aria-hidden>*</span>}
        </label>
        {trailingLabel}
      </div>
      {child}
      {hint && !error && (
        <p id={hintId} className="font-body text-[11px] text-text-tertiary">
          {hint}
        </p>
      )}
      {error && <FormError id={errorId}>{error}</FormError>}
    </div>
  );
};

export const FormError: React.FC<{ id?: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <p
    id={id}
    role="alert"
    className="inline-flex items-center gap-1.5 font-body text-[11px] text-error-text"
  >
    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
    {children}
  </p>
);
