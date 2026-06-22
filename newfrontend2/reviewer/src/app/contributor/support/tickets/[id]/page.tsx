"use client";

import { useParams } from "next/navigation";
import { TicketDetailView } from "./components/ticket-detail-view";

export default function ContributorTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params?.id ?? "";
  return <TicketDetailView ticketId={ticketId} />;
}
