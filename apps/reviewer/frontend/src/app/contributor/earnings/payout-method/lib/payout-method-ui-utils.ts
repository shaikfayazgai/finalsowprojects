import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";
import type { PayoutMethodDetail, PayoutMethodKind } from "@/lib/payouts/types";

type StatusChipVariant = NonNullable<StatusChipProps["status"]>;

export function fmtVerifiedDate(iso: string | null): string {
  if (!iso) return "Not verified";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function methodKindLabel(kind: PayoutMethodKind): string {
  switch (kind) {
    case "bank_in":
      return "Bank account";
    case "upi":
      return "UPI";
    case "paypal":
      return "PayPal";
    case "razorpay_x":
      return "Razorpay";
    default:
      return String(kind).replace(/_/g, " ");
  }
}

export function methodIfsc(method: PayoutMethodDetail): string | null {
  const ifsc = method.payload.ifsc;
  return typeof ifsc === "string" && ifsc.length > 0 ? ifsc : null;
}

export function methodDisplayName(method: PayoutMethodDetail): string {
  return method.nickname ?? methodKindLabel(method.kind);
}

export function methodMetaLine(method: PayoutMethodDetail): string {
  const parts: string[] = [methodKindLabel(method.kind)];
  const ifsc = methodIfsc(method);
  if (ifsc) parts.push(`IFSC ${ifsc}`);

  if (method.verifiedAt) {
    parts.push(`Verified ${fmtVerifiedDate(method.verifiedAt)}`);
  } else if (method.verificationError) {
    parts.push(method.verificationError);
  } else {
    parts.push("Verification pending");
  }

  return parts.join(" · ");
}

export function methodVerificationChip(method: PayoutMethodDetail): StatusChipVariant {
  if (method.verifiedAt) return "success";
  if (method.verificationError) return "error";
  return "pending";
}

export function methodVerificationLabel(method: PayoutMethodDetail): string {
  if (method.verifiedAt) return "Verified";
  if (method.verificationError) return "Failed";
  return "Pending";
}
