import { NextResponse } from "next/server";
import { MOCK_PAYMENT_RAILS } from "@/mocks/admin/rails";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_PAYMENT_RAILS });
}
