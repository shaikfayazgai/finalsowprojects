"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { COUNTRIES_DATA } from "../data";

export function CountryDialPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = COUNTRIES_DATA.find((c) => c.name === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = search.trim()
    ? COUNTRIES_DATA.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : COUNTRIES_DATA;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          setSearch("");
        }}
        className={`flex items-center gap-1.5 h-11 px-3 border-r border-beige-200 bg-transparent transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed rounded-l-xl ${
          open ? "bg-beige-50" : "hover:bg-beige-50"
        }`}
      >
        <span className={`fi fi-${selected?.iso} text-lg`} />
        <span className="text-sm font-semibold text-brown-800">{selected?.code}</span>
        <ChevronDown
          className={`w-3 h-3 text-beige-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-beige-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-beige-100 bg-beige-50">
            <Search className="w-3.5 h-3.5 text-beige-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm text-brown-950 bg-transparent outline-none placeholder:text-beige-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-beige-400 hover:text-beige-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-beige-400 text-center">No results</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  onChange(c.name);
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                  c.name === value
                    ? "bg-brown-50 text-brown-900 font-medium"
                    : "text-brown-800 hover:bg-beige-50"
                }`}
              >
                <span className={`fi fi-${c.iso} text-base shrink-0`} />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-beige-500 font-medium shrink-0">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
