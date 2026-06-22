import { redirect } from "next/navigation";

/**
 * Rate Cards are NOT available to the enterprise — contributor pay rates are
 * private to Glimmora; the enterprise only ever sees its own budget (client
 * price). The nav item is removed and direct URL access redirects to Billing.
 */
export default function RateCardsListPage() {
  redirect("/enterprise/billing");
}
