"use client";

import { useSession } from "next-auth/react";
import { User, Mail, Shield, KeyRound } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  const name = session?.user?.name ?? "—";
  const email = session?.user?.email ?? "—";
  const role = (session?.user as { role?: string })?.role ?? "—";
  const provider = (session?.user as { provider?: string })?.provider ?? "credentials";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brown-950">Settings</h1>
        <p className="text-sm text-beige-600 mt-1">Account details and preferences</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-beige-100">
          <h2 className="font-heading font-semibold text-brown-950">Profile</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #A67763, #D0B060)" }}
            >
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-brown-950">{name}</p>
              <p className="text-sm text-beige-500">{email}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow icon={User} label="Full Name" value={name} />
            <DetailRow icon={Mail} label="Email" value={email} />
            <DetailRow icon={Shield} label="Role" value={role.charAt(0).toUpperCase() + role.slice(1)} />
            <DetailRow icon={KeyRound} label="Auth Provider" value={provider === "credentials" ? "Email / Password" : provider.charAt(0).toUpperCase() + provider.slice(1)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-beige-50/50">
      <Icon className="w-4 h-4 text-beige-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-beige-500 font-medium">{label}</p>
        <p className="text-sm text-brown-950 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}
