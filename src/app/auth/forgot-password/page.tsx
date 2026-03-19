"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Mail, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import {
  GlassCard,
  GlassCardContent,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

type Role = "" | "admin" | "enterprise" | "reviewer" | "contributor";

export default function ForgotPasswordPage() {
  const [role, setRole]           = useState<Role>("");
  const [email, setEmail]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role)  { setError("Please select your role"); return; }
    if (!email) { setError("Enter a valid email address"); return; }

    setError("");
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brown-500 to-brown-700 shadow-xl shadow-brown-500/20 mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">Reset Password</h1>
        <p className="text-sm text-beige-600 mt-1">We&apos;ll send a reset link to your email</p>
      </div>

      <GlassCard variant="heavy" padding="lg">
        <GlassCardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>I am a…</Label>
                <Select value={role} onValueChange={v => { setRole(v as Role); setError(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Sending link…</>
                ) : (
                  <><Mail className="w-4 h-4" /> Send Reset Link</>
                )}
              </Button>

              <Link href="/auth/login">
                <Button type="button" variant="ghost" size="sm" className="w-full">
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Button>
              </Link>
            </form>
          ) : (
            <div className="text-center space-y-5 py-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-brown-950 mb-1">Check your inbox</p>
                <p className="text-sm text-beige-600">
                  If <span className="font-medium text-brown-800">{email}</span> is registered,
                  you&apos;ll receive a reset link within 2 minutes.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-beige-50 border border-beige-200 text-xs text-beige-600 text-left space-y-1">
                <p>• The link expires after <strong>1 hour</strong></p>
                <p>• The link is single-use</p>
                <p>• Check your spam folder if you don&apos;t see it</p>
              </div>
              <Link href="/auth/login">
                <Button variant="outline" size="md" className="w-full">
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Button>
              </Link>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
