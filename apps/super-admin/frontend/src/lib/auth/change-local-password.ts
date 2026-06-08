/**
 * Change password for users whose credentials live in local Prisma
 * (local-credentials sign-in, reviewer self-registration, etc.).
 */

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { revokeAllSessionsForUser } from "@/lib/session/revoke";

export class LocalPasswordChangeError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "no_password" | "invalid_current" | "validation",
  ) {
    super(message);
    this.name = "LocalPasswordChangeError";
  }
}

export async function changeLocalPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  /** Keep this session alive after revoking others. */
  exceptSessionId?: string | null;
}): Promise<void> {
  const currentPassword = input.currentPassword.trim();
  const newPassword = input.newPassword.trim();
  const confirmPassword = input.confirmPassword.trim();

  if (!currentPassword) {
    throw new LocalPasswordChangeError("Enter your current password.", "validation");
  }
  if (newPassword.length < 8) {
    throw new LocalPasswordChangeError("New password must be at least 8 characters.", "validation");
  }
  if (newPassword !== confirmPassword) {
    throw new LocalPasswordChangeError("New passwords do not match.", "validation");
  }
  if (currentPassword === newPassword) {
    throw new LocalPasswordChangeError("Choose a password different from your current one.", "validation");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new LocalPasswordChangeError("User not found.", "not_found");
  }
  if (!user.passwordHash) {
    throw new LocalPasswordChangeError(
      "This account does not use a local password. Sign in with your connected provider instead.",
      "no_password",
    );
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new LocalPasswordChangeError("Current password is incorrect.", "invalid_current");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await revokeAllSessionsForUser(user.id, "password_change", {
    exceptSessionId: input.exceptSessionId ?? undefined,
    revokedBy: user.id,
  });
}
