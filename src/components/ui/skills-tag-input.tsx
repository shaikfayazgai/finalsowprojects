"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "./badge";

export interface SkillsTagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  placeholder?: string;
  error?: string;
  id?: string;
  className?: string;
}

const SkillsTagInput = React.forwardRef<HTMLDivElement, SkillsTagInputProps>(
  ({ value, onChange, max, placeholder = "Type and press Enter", error, id, className }, ref) => {
    const [input, setInput] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    const addTag = () => {
      const tag = input.trim();
      if (!tag) return;
      if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
        setInput("");
        return;
      }
      if (max && value.length >= max) return;
      onChange([...value, tag]);
      setInput("");
    };

    const removeTag = (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
      if (e.key === "Backspace" && !input && value.length > 0) {
        removeTag(value.length - 1);
      }
    };

    return (
      <div ref={ref} className={cn("space-y-1.5", className)}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 min-h-[40px] w-full rounded-lg border bg-white/80 px-3 py-2 transition-all duration-200 cursor-text",
            error
              ? "border-red-400 focus-within:ring-1 focus-within:ring-red-500/20 focus-within:border-red-500"
              : "focus-within:border-[rgba(166,119,99,0.35)] focus-within:shadow-[0_0_0_2px_rgba(166,119,99,0.08)]"
          )}
          style={{ borderColor: error ? undefined : "var(--border-soft)" }}
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag, i) => (
            <Badge key={`${tag}-${i}`} variant="teal" size="sm" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                className="ml-0.5 rounded-full p-0.5 hover:bg-teal-200/60 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm font-body outline-none placeholder:text-beige-400"
            style={{ color: "var(--ink)" }}
            disabled={max !== undefined && value.length >= max}
          />
        </div>
        {max && (
          <p className="text-[11px] text-beige-500">
            {value.length}/{max}
            {value.length >= max && " — maximum reached"}
          </p>
        )}
        {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);
SkillsTagInput.displayName = "SkillsTagInput";

export { SkillsTagInput };
