import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchInternal } from "@/lib/api/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { grievanceId: string } },
) {
  const session = await getServerSession(authOptions);
  const token = (session?.user as { accessToken?: string })?.accessToken;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { grievanceId } = params;

  try {
    const data = await fetchInternal(
      `/api/contributor/support/grievances/${encodeURIComponent(grievanceId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return NextResponse.json(data);
  } catch (err: unknown) {
    const status =
      err instanceof Error && "status" in err
        ? (err as { status: number }).status
        : 500;
    if (status === 404) {
      return NextResponse.json(
        { error: "Grievance not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch grievance detail" },
      { status },
    );
  }
}
