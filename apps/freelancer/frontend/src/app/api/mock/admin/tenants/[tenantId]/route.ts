import { NextResponse } from "next/server";
import { MOCK_TENANTS, MOCK_TENANT_USERS, MOCK_PROVISIONING_STEPS } from "@/mocks/admin/tenants";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = MOCK_TENANTS.find((t) => t.id === tenantId);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  return NextResponse.json({
    tenant,
    users: MOCK_TENANT_USERS[tenantId] ?? [],
    provisioning: MOCK_PROVISIONING_STEPS[tenantId] ?? [],
  });
}
