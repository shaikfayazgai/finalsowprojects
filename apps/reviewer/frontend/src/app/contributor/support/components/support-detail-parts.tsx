"use client";

import { Paperclip } from "lucide-react";
import type { MockCaseUpdate, MockTicketMessage } from "@/mocks/contributor/support";
import { cn } from "@/lib/utils/cn";
import { fmtDateTime } from "../lib/support-ui-utils";

export function RailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="font-body text-[12.5px] text-foreground text-right min-w-0">{children}</dd>
    </div>
  );
}

export function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[12.5px] text-foreground leading-relaxed",
          mono && "font-mono text-[11.5px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

const updateFromLabel: Record<MockCaseUpdate["from"], string> = {
  you: "You",
  team: "Investigation team",
  system: "System",
};

export function CaseTimeline({ updates }: { updates: MockCaseUpdate[] }) {
  return (
    <ol className="divide-y divide-stroke-subtle">
      {updates.map((update, index) => (
        <li key={update.id} className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                index === 0 ? "bg-brand" : "bg-stroke-strong",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-body text-[13px] font-semibold text-foreground">{update.title}</p>
                <time
                  dateTime={update.at}
                  className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0"
                >
                  {fmtDateTime(update.at)}
                </time>
              </div>
              <p className="mt-0.5 font-body text-[11px] font-medium text-text-tertiary">
                {updateFromLabel[update.from]}
              </p>
              <p className="mt-2 font-body text-[12.5px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                {update.body}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TicketMessageThread({ messages }: { messages: MockTicketMessage[] }) {
  return (
    <ul className="divide-y divide-stroke-subtle">
      {messages.map((message) => {
        const mine = message.from === "you";
        return (
          <li key={message.id} className={cn("px-5 py-4", !mine && "bg-bg-subtle/40")}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={cn(
                  "font-body text-[11.5px] font-semibold",
                  mine ? "text-foreground" : "text-brand-subtle-text",
                )}
              >
                {mine ? "You" : "Support"}
              </span>
              <time
                dateTime={message.at}
                className="font-mono text-[10.5px] text-text-tertiary tabular-nums"
              >
                {fmtDateTime(message.at)}
              </time>
            </div>
            <p className="font-body text-[12.5px] text-foreground leading-relaxed whitespace-pre-wrap">
              {message.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function AttachmentList({ files }: { files: string[] }) {
  if (files.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((file) => (
        <li
          key={file}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-subtle border border-stroke-subtle font-body text-[11px] text-foreground"
        >
          <Paperclip className="h-3 w-3 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
          {file}
        </li>
      ))}
    </ul>
  );
}
