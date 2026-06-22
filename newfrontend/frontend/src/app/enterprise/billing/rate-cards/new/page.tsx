import { redirect } from "next/navigation";

/** Rate Cards are not available to the enterprise (contributor pay is private to
 * Glimmora). Direct URL access redirects to Billing. */
export default function NewRateCardPage() {
  redirect("/enterprise/billing");
}
