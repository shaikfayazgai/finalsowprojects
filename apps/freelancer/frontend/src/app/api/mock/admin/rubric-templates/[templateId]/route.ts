import { NextResponse } from "next/server";
import { findRubricById } from "@/mocks/admin/rubrics";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const template = findRubricById(templateId);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json({ template });
}
