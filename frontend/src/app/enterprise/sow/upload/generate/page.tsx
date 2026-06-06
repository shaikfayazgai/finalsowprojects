"use client";

export type { SOWReviewData } from "@/components/enterprise/sow/GeneratePreviewContent";
import { GeneratePreviewContent } from "@/components/enterprise/sow/GeneratePreviewContent";

export default function GeneratePreviewPage() {
  return <GeneratePreviewContent flow="manual" />;
}
