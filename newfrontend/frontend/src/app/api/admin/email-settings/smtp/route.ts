import { NextResponse } from "next/server";
import { getAdminSmtpConfig, setAdminSmtpConfig } from "@/lib/admin/mocks/smtp-config-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ config: getAdminSmtpConfig() });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const config = setAdminSmtpConfig(body);
    return NextResponse.json({ success: true, config });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }
}
