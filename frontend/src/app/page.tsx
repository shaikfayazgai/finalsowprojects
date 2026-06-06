"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sparkles, ArrowRight, Globe, Shield, Zap, BarChart3, Users,
  Star, CheckCircle, ChevronRight, Lock,
  Cpu, CreditCard, ChevronDown, Quote, LogOut, Building2,
  GraduationCap, Briefcase, BookOpen, UserCheck
} from "lucide-react";
import { Button, Badge, MeshBackground } from "@/components/ui";

const STATS = [
  { value: "100+", label: "Countries" },
  { value: "50K+", label: "Contributors" },
  { value: "2,400+", label: "Enterprises" },
  { value: "99.9%", label: "Uptime SLA" },
];

const PORTALS = [
  {
    name: "Enterprise",
    label: "Company Portal",
    href: "/enterprise/login", // real portal
    icon: <Building2 className="w-5 h-5" />,
    desc: "SOW management, AI decomposition, smart team formation and real-time project delivery.",
    accent: "#92400e",
  },
  {
    name: "Freelancer",
    label: "Contributor Portal",
    href: "/contributor/login",
    icon: <Briefcase className="w-5 h-5" />,
    desc: "AI-matched tasks, verified work portfolio, earnings tracking and global opportunities.",
    accent: "#0d9488",
  },
  {
    name: "Student",
    label: "Student Portal",
    href: "/contributor/login", // students are a contributor persona (plan 01)
    icon: <GraduationCap className="w-5 h-5" />,
    desc: "Educational tasks, skill development, credential verification and career placement.",
    accent: "#16a34a",
  },
  {
    name: "Mentor",
    label: "Mentor Portal",
    href: "/mentor/login",
    icon: <UserCheck className="w-5 h-5" />,
    desc: "Review queue, mentorship sessions, escalation management and quality assurance.",
    accent: "#7c3aed",
  },
  {
    name: "Universities",
    label: "University Portal",
    href: "/admin/login", // university admins are platform-admin scope
    icon: <BookOpen className="w-5 h-5" />,
    desc: "Bulk student onboarding, academic oversight and enterprise talent pipeline.",
    accent: "#0891b2",
  },
  {
    name: "Superadmin",
    label: "Admin Portal",
    href: "/admin/login",
    icon: <Shield className="w-5 h-5" />,
    desc: "User management, pricing configuration, audit logs and full platform governance.",
    accent: "#9333ea",
  },
];

const TRUST = [
  { icon: <Shield className="w-5 h-5 text-brown-600" />, label: "SOC 2 Type II Certified" },
  { icon: <Lock className="w-5 h-5 text-brown-600" />, label: "256-bit Encryption" },
  { icon: <Globe className="w-5 h-5 text-brown-600" />, label: "GDPR Compliant" },
  { icon: <Zap className="w-5 h-5 text-brown-600" />, label: "99.9% Uptime SLA" },
];

const FEATURES_EXTRA = [
  { icon: <Cpu className="w-6 h-6 text-brown-700" />, title: "AI-Powered Matching", desc: "Our engine analyzes SOW requirements and intelligently matches them with the top 1% of vetted global talent." },
  { icon: <Shield className="w-6 h-6 text-brown-700" />, title: "Automated Governance", desc: "Built-in compliance checks, milestone tracking, and automated IP protection protocols." },
  { icon: <CreditCard className="w-6 h-6 text-brown-700" />, title: "Seamless Global Payments", desc: "Integrated payment gateways supporting 100+ currencies with automated taxation and invoicing." },
  { icon: <BarChart3 className="w-6 h-6 text-brown-700" />, title: "Real-time Dashboards", desc: "Gain complete visibility into project spend, delivery velocity, and team performance metrics." },
];

const TESTIMONIALS = [
  {
    quote: "GlimmoraTeam completely transformed how we scale our engineering teams. We went from a 3-month hiring cycle to deploying top-tier talent in 48 hours.",
    author: "Sarah Jenkins",
    role: "VP of Engineering, TechFlow",
  },
  {
    quote: "The built-in governance and compliance gave our procurement team the confidence to embrace a distributed workforce at scale.",
    author: "Michael Chang",
    role: "Director of Procurement, GlobalSys",
  },
  {
    quote: "As a contributor, the AI matching connects me with projects that perfectly align with my expertise. I can focus on coding instead of bidding.",
    author: "Elena Rodriguez",
    role: "Senior Cloud Architect",
  }
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;

  const [portalOpen, setPortalOpen] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (portalRef.current && !portalRef.current.contains(e.target as Node)) {
        setPortalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Authenticated users — send them straight to their portal
  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role;
    const dest =
      role === "admin"          ? "/admin/dashboard" :
      role === "superadmin"     ? "/admin/dashboard" :
      role === "super_admin"    ? "/admin/dashboard" :
      role === "reviewer"       ? "/mentor/dashboard" :
      role === "mentor"         ? "/mentor/dashboard" :
      role === "contributor"    ? "/contributor/dashboard" :
      role === "student"        ? "/contributor/dashboard" :
      role === "enterprise"     ? "/enterprise/dashboard" :
      role === "university_admin" ? "/admin/dashboard" :
      null;
    if (dest) router.replace(dest);
  }, [status, session, router]);

  return (
    <MeshBackground variant="warm" className="min-h-screen">

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-beige-200/60 bg-white/80 backdrop-blur-xl shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="block group">
            <div className="relative h-28 w-72 -my-8 -ml-6">
              <Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain object-left" priority />
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-beige-600">
            <a href="#features" className="hover:text-brown-900 transition-colors flex items-center gap-1 group">
              Features <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
            </a>
            <a href="#roles" className="hover:text-brown-900 transition-colors">Solutions</a>
            <a href="#how-it-works" className="hover:text-brown-900 transition-colors">How it Works</a>
            <a href="#trust" className="hover:text-brown-900 transition-colors">Enterprise Security</a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href={
                    session?.user?.role === "admin"            ? "/admin/dashboard" :
                    session?.user?.role === "superadmin"       ? "/admin/dashboard" :
                    session?.user?.role === "super_admin"      ? "/admin/dashboard" :
                    session?.user?.role === "reviewer"         ? "/mentor/dashboard" :
                    session?.user?.role === "mentor"           ? "/mentor/dashboard" :
                    session?.user?.role === "contributor"      ? "/contributor/dashboard" :
                    session?.user?.role === "student"          ? "/contributor/dashboard" :
                    session?.user?.role === "enterprise"       ? "/enterprise/dashboard" :
                    session?.user?.role === "university_admin" ? "/admin/dashboard" :
                                                                 "/auth/redirect"
                  }
                  className="hidden sm:block text-sm font-medium text-beige-600 hover:text-brown-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Button
                  variant="gradient-cta"
                  size="md"
                  className="shadow-lg shadow-brown-500/20 hover:shadow-brown-500/40 rounded-full px-6"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                {/* Portal dropdown */}
                <div className="relative hidden sm:block" ref={portalRef}>
                  <button
                    onClick={() => setPortalOpen(o => !o)}
                    className="flex items-center gap-1.5 text-sm font-medium text-beige-600 hover:text-brown-900 transition-colors"
                  >
                    Sign in to Portal
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${portalOpen ? "rotate-180" : ""}`} />
                  </button>
                  {portalOpen && (
                    <div className="absolute right-0 top-8 w-64 bg-white rounded-2xl shadow-2xl border border-beige-100 py-2 z-50">
                      <p className="text-[10px] font-semibold text-beige-400 uppercase tracking-widest px-4 py-2">Select your portal</p>
                      {PORTALS.map(p => (
                        <Link
                          key={p.href}
                          href={p.href}
                          onClick={() => setPortalOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-beige-50 transition-colors group"
                        >
                          <span className="w-8 h-8 rounded-lg bg-brown-50 border border-beige-100 flex items-center justify-center text-brown-600 group-hover:bg-brown-100 transition-colors">
                            {p.icon}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-brown-900">{p.label}</p>
                            <p className="text-xs text-beige-500">{p.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <Button asChild variant="gradient-cta" size="md" className="shadow-lg shadow-brown-500/20 hover:shadow-brown-500/40 rounded-full px-6">
                  <Link href="/auth/register">
                    Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge variant="brown" className="mb-6 text-xs px-3 py-1">
          Global Workforce Intelligence Platform
        </Badge>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-brown-950 leading-tight mb-6 max-w-4xl mx-auto">
          AI-Governed Outcome Delivery{" "}
          <span className="bg-gradient-to-r from-brown-600 to-teal-600 bg-clip-text text-transparent">
            at Scale
          </span>
        </h1>
        <p className="text-lg text-beige-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect enterprises with a global network of contributors and reviewers.
          From SOW to delivery — intelligent, transparent, and outcome-based.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="gradient-cta" size="lg" className="min-w-44">
            <Link href="/auth/register">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-44">
            <Link href="#portals">
              Sign in to Portal <ChevronDown className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-white/60 backdrop-blur border border-beige-100 rounded-2xl py-5 px-4">
              <p className="font-heading text-3xl font-bold text-brown-950">{value}</p>
              <p className="text-sm text-beige-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Edge ───────────────────────────────── */}
      <section id="features" className="scroll-mt-24 max-w-6xl mx-auto px-6 py-20 border-t border-beige-200/50">
        <div className="text-center mb-16">
          <Badge variant="teal" className="mb-4">Why GlimmoraTeam</Badge>
          <h2 className="font-heading text-3xl font-bold text-brown-950 mb-4">
            Everything you need to scale delivery
          </h2>
          <p className="text-beige-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Replace fragmented agencies, freelancers, and BPOs with a single, unified platform powered by AI.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES_EXTRA.map((feature) => (
            <div key={feature.title} className="bg-white/60 backdrop-blur border border-beige-200/60 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6 group-hover:bg-brown-100 transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-heading text-lg font-bold text-brown-950 mb-3">{feature.title}</h3>
              <p className="text-sm text-beige-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portal Cards ──────────────────────────────────── */}
      <section id="portals" className="scroll-mt-24 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <Badge variant="brown" className="mb-4">Portals</Badge>
          <h2 className="font-heading text-3xl font-bold text-brown-950 mb-3">
            Sign In to Your Portal
          </h2>
          <p className="text-beige-600 max-w-xl mx-auto">
            Each portal is scoped to your role — only your data, your tools, your access.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PORTALS.map((portal) => (
            <Link
              key={portal.name}
              href={portal.href}
              className="group bg-white/70 backdrop-blur border border-beige-100 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-xl hover:shadow-brown-100/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: portal.accent }}
                >
                  {portal.icon}
                </div>
                <span className="text-xs font-semibold text-beige-400 uppercase tracking-widest">{portal.label}</span>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-brown-950 text-lg mb-2">{portal.name} Portal</h3>
                <p className="text-sm text-beige-600 leading-relaxed">{portal.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold mt-auto" style={{ color: portal.accent }}>
                Open portal <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-brown-950 to-brown-800 rounded-3xl p-10 md:p-14 text-center text-white">
          <Badge variant="gold" className="mb-5 text-xs">How It Works</Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 max-w-2xl mx-auto">
            From Project Brief to Verified Outcome
          </h2>
          <p className="text-brown-200 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
            GlimmoraTeam's AI engine decomposes your SOW, assembles the right team, monitors delivery, and ensures quality — end to end.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { step: "01", label: "Upload SOW", icon: <BarChart3 className="w-5 h-5" /> },
              { step: "02", label: "AI Decomposes", icon: <Sparkles className="w-5 h-5" /> },
              { step: "03", label: "Team Assembled", icon: <Users className="w-5 h-5" /> },
              { step: "04", label: "Outcome Delivered", icon: <CheckCircle className="w-5 h-5" /> },
            ].map(({ step, label, icon }) => (
              <div key={step} className="bg-white/10 rounded-2xl p-5 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brown-200">
                  {icon}
                </div>
                <span className="text-xs text-brown-400 font-mono">{step}</span>
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="gradient-cta" size="lg" className="min-w-48 shadow-xl shadow-brown-900/50">
              <Link href="/auth/register">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg" className="min-w-48">
              <Link href="#portals">
                View All Portals <ChevronDown className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20 pb-24">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl font-bold text-brown-950 mb-3">
            Trusted by Leaders Globally
          </h2>
          <p className="text-beige-600 max-w-xl mx-auto">
            See how organizations and professionals are transforming the way they work.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <div key={i} className="bg-white/70 backdrop-blur rounded-2xl p-8 border border-white shadow-xl shadow-brown-50/50 relative">
              <Quote className="w-10 h-10 text-brown-200/50 absolute top-6 left-6" />
              <div className="relative z-10">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-brown-950 text-sm leading-relaxed mb-8 font-medium italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brown-200 to-brown-300 flex items-center justify-center text-brown-700 font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-brown-950 text-sm">{testimonial.author}</h4>
                    <p className="text-xs text-beige-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────── */}
      <section id="trust" className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-white/60 backdrop-blur border border-beige-100 rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-semibold text-brown-950">Enterprise-grade security & compliance</p>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-6">
            {TRUST.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-beige-600">
                {icon}
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-beige-200 bg-white/80 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="block group mb-4 w-fit">
                <div className="relative h-24 w-64 -my-7 -ml-5">
                  <Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain object-left" priority />
                </div>
              </Link>
              <p className="text-sm text-beige-600 leading-relaxed mb-6">
                The global workforce intelligence platform. AI-governed delivery for distributed teams with measurable outcomes, built-in governance, and trusted scale.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-heading font-semibold text-brown-950 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-beige-600">
                <li><Link href="#" className="hover:text-brown-700 transition-colors">AI SOW Decomposition</Link></li>
                <li><Link href="#" className="hover:text-brown-700 transition-colors">Smart Team Formation</Link></li>
                <li><Link href="#" className="hover:text-brown-700 transition-colors">Outcome Monitoring</Link></li>
                <li><Link href="#" className="hover:text-brown-700 transition-colors">Pricing & Billing</Link></li>
                <li><Link href="#" className="hover:text-brown-700 transition-colors">Security & SOC2</Link></li>
              </ul>
            </div>

            {/* Portals Column */}
            <div>
              <h4 className="font-heading font-semibold text-brown-950 mb-4">Portals</h4>
              <ul className="space-y-3 text-sm text-beige-600">
                <li><Link href="/enterprise/login" className="hover:text-brown-700 transition-colors">Enterprise</Link></li>
                <li><Link href="/contributor/login" className="hover:text-brown-700 transition-colors">Contributor</Link></li>
                <li><Link href="/mentor/login" className="hover:text-brown-700 transition-colors">Mentor</Link></li>
                <li><Link href="/admin/login" className="hover:text-brown-700 transition-colors">Admin</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-heading font-semibold text-brown-950 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-beige-600">
                <li><Link href="#" className="hover:text-brown-700 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-brown-700 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-brown-700 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-brown-700 transition-colors">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-beige-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-beige-500">
            <p>© 2026 Glimmora International. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-brown-700 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-brown-700 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-brown-700 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>

    </MeshBackground>
  );
}
