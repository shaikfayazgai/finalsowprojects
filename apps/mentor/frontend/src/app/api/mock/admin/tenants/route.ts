import { NextResponse } from "next/server";
import { MOCK_TENANTS } from "@/mocks/admin/tenants";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    items: MOCK_TENANTS,
    counts: {
      all: MOCK_TENANTS.length,
      active:       MOCK_TENANTS.filter((t) => t.status === "active").length,
      provisioning: MOCK_TENANTS.filter((t) => t.status === "provisioning").length,
      paused:       MOCK_TENANTS.filter((t) => t.status === "paused").length,
    },
  });
}
