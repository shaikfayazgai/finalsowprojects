import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchInternal } from "@/lib/api/client";

export async function POST(request: NextRequest) {
  const session = await auth();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const data = await fetchInternal("/api/contributor/support/safety-reports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const status =
      err instanceof Error && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to create safety report" },
      { status },
    );
  }
}
