import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "NO_ACCOUNT", message: "We couldn't find an account associated with this email. Please check your email or create a new account to get started." },
      { status: 401 }
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "WRONG_PASSWORD", message: "The password you entered is incorrect. Please try again or reset your password." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
