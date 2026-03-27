import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Same demo users as auth.ts — keep in sync until DB is wired up
const DEMO_USERS = [
  {
    id: "1",
    email: "john@gmail.com",
    password: bcrypt.hashSync("Test@1234", 10),
  },
  {
    id: "2",
    email: "jane@outlook.com",
    password: bcrypt.hashSync("Test@1234", 10),
  },
  {
    id: "3",
    email: "admin@glimmora.com",
    password: bcrypt.hashSync("Admin@1234", 10),
  },
];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return NextResponse.json(
      { error: "NO_ACCOUNT", message: "We couldn't find an account associated with this email. Please check your email or create a new account to get started." },
      { status: 401 }
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "WRONG_PASSWORD", message: "The password you entered is incorrect. Please try again or reset your password." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
