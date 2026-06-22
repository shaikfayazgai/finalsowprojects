"use client";

import { useState, useRef } from "react";
import {
  ArrowRight, Play, Pause, Volume2, VolumeX,
  CheckCircle, User, Shield, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { SSOProvider } from "@/app/auth/register/types";

const STEPS_PREVIEW = [
  { n: 1, title: "Identity",     desc: "Role & location" },
  { n: 2, title: "Profile",      desc: "Skills & availability" },
  { n: 3, title: "Verification", desc: "NDA & contact OTP" },
  { n: 4, title: "Consent",      desc: "Resume & agreements" },
];

/* ─── Video Player ───────────────────────────────────────────── */
function VideoPlayer({ src }: { src?: string }) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying]  = useState(false);
  const [muted, setMuted]      = useState(false);
  const [started, setStarted]  = useState(false);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
      setStarted(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(v => !v);
  };

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-brown-950 cursor-pointer group"
      onClick={toggle}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
          playsInline
        />
      ) : (
        /* Placeholder gradient when no video src provided */
        <div className="absolute inset-0 bg-gradient-to-br from-brown-800 via-brown-900 to-brown-950 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white/60" />
          </div>
          <p className="text-white/50 text-sm">Intro video coming soon</p>
        </div>
      )}

      {/* Overlay: play/pause button */}
      {src && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}>
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110">
            {playing
              ? <Pause className="w-6 h-6 text-white fill-white" />
              : <Play  className="w-6 h-6 text-white fill-white ml-0.5" />
            }
          </div>
        </div>
      )}

      {/* Intro label (shown before first play) */}
      {src && !started && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-xs text-white/70 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full font-medium">
            How GlimmoraTeam works for contributors · 60s
          </span>
          {/* Mute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Playing: show mute toggle */}
      {src && started && playing && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

/* ─── SSO Profile Card ───────────────────────────────────────── */
function SSOProfileCard({
  firstName, lastName, email, image, provider,
}: {
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  provider?: SSOProvider | null;
}) {
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const providerLabel = provider === "google" ? "Google" : provider === "microsoft" ? "Microsoft" : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
      {/* Avatar */}
      <div className="relative shrink-0">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center ring-2 ring-white shadow-sm">
            <User className="w-5 h-5 text-teal-600" />
          </div>
        )}
        {providerLabel && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center">
            {provider === "google" ? (
              <svg viewBox="0 0 24 24" className="w-3 h-3" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            ) : (
              <svg viewBox="0 0 23 23" className="w-3 h-3" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name || "—"}</p>
        <p className="text-xs text-gray-500 truncate">{email}</p>
      </div>

      {/* Verified */}
      <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />
        {providerLabel ? `${providerLabel} SSO` : "Verified"}
      </div>
    </div>
  );
}

/* ─── WelcomeScreen ──────────────────────────────────────────── */
interface WelcomeScreenProps {
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  provider?: SSOProvider | null;
  onBegin: () => void;
  videoSrc?: string;
}

export function WelcomeScreen({
  firstName, lastName, email, image, provider,
  onBegin, videoSrc,
}: WelcomeScreenProps) {
  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-gray-900">GlimmoraTeam</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">
          Welcome{firstName ? `, ${firstName}` : ""}!
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          You&apos;re one step away from joining our contributor network.
          Complete your profile in about 5 minutes to start earning on global projects.
        </p>
      </div>

      {/* SSO profile card */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Signed in as</p>
        <SSOProfileCard
          firstName={firstName}
          lastName={lastName}
          email={email}
          image={image}
          provider={provider}
        />
      </div>

      {/* Video */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick intro</p>
        <VideoPlayer src={videoSrc} />
      </div>

      {/* Steps overview */}
      <div className="mb-7">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">What we&apos;ll set up</p>
        <div className="grid grid-cols-2 gap-2">
          {STEPS_PREVIEW.map(({ n, title, desc }) => (
            <div key={n} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-brown-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-brown-700">{n}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">{title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust row */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 256-bit encryption</div>
        <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Secure profile</div>
      </div>

      {/* CTA */}
      <Button type="button" variant="primary" size="lg" className="w-full" onClick={onBegin}>
        Begin Setup <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
