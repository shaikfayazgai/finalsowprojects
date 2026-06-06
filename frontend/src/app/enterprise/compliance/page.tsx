import { redirect } from "next/navigation";

/**
 * The "Compliance" nav item points at /enterprise/compliance, but the real
 * content lives in sub-pages (documents / evidence / esg / podl). Without an
 * index page here, clicking the nav hit Next.js's not-found boundary, which
 * compiles slowly in dev and feels broken. Redirect straight to the first
 * sub-section so the nav resolves instantly.
 */
export default function ComplianceIndexPage() {
  redirect("/enterprise/compliance/documents");
}
