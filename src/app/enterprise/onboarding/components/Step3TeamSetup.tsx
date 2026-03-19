"use client";

import {
  AlertCircle, ArrowRight, ArrowLeft, Users, Plus, X, UserPlus, BadgeCheck,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
} from "@/components/ui";

interface TeamInvite {
  email: string;
  firstName: string;
  lastName: string;
}

interface Props {
  teamInvites: TeamInvite[];
  addInviteRow: () => void;
  removeInviteRow: (index: number) => void;
  updateInvite: (index: number, field: keyof TeamInvite, value: string) => void;
  error: string;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function Step3TeamSetup({
  teamInvites, addInviteRow, removeInviteRow, updateInvite,
  error, onContinue, onSkip, onBack,
}: Props) {
  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 3 of 4</p>
            <span className="text-[9px] font-medium text-beige-400 bg-beige-100 px-1.5 py-0.5 rounded">Optional</span>
          </div>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Team Setup</p>
          <p className="text-xs text-beige-500 mt-0.5">Invite Reviewers from your team to validate contributor deliverables</p>
        </div>

        <div className="space-y-5">

          {/* Info card */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
            <UserPlus className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-800">Reviewers validate deliverables</p>
              <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                Each Reviewer receives login credentials via email and reviews submitted evidence packs
                against acceptance criteria. You can always add Reviewers later from Settings.
              </p>
            </div>
          </div>

          {/* Invite rows */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-brown-100 flex items-center justify-center shrink-0">
                <Users className="w-3 h-3 text-brown-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">
                Invite Reviewers ({teamInvites.length}/10)
              </p>
            </div>

            {teamInvites.map((inv, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-beige-50 border border-beige-100">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Email <span className="text-red-400">*</span></Label>
                    <Input
                      type="email"
                      placeholder="reviewer@company.com"
                      value={inv.email}
                      onChange={e => updateInvite(i, "email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">First Name</Label>
                    <Input
                      placeholder="First name"
                      value={inv.firstName}
                      onChange={e => updateInvite(i, "firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Last Name</Label>
                    <Input
                      placeholder="Last name"
                      value={inv.lastName}
                      onChange={e => updateInvite(i, "lastName", e.target.value)}
                    />
                  </div>
                </div>

                {/* Role badge + remove */}
                <div className="flex flex-col items-center gap-1 pt-5 shrink-0">
                  <span className="text-[9px] font-semibold text-brown-600 bg-brown-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-2.5 h-2.5" /> Reviewer
                  </span>
                  {teamInvites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInviteRow(i)}
                      className="p-1 rounded-lg hover:bg-red-50 text-beige-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {teamInvites.length < 10 && (
              <button
                type="button"
                onClick={addInviteRow}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-beige-300 hover:border-brown-400 text-sm text-beige-500 hover:text-brown-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add another Reviewer
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onContinue}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <button type="button" onClick={onSkip}
            className="w-full text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1">
            Skip this step — I&apos;ll add Reviewers later
          </button>

          <button type="button" onClick={onBack}
            className="w-full text-sm text-beige-600 hover:text-beige-800 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
