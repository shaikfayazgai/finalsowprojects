"use client";

/**
 * Complete your profile — a step-by-step wizard. One section at a time (fill →
 * Next → next section), with a progress bar + step chips. A weighted, searchable
 * talent profile, not a basic form. A freelancer unlocks public work only at 100%.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileCompletion, SECTION_LABELS } from "@/lib/hooks/use-profile-completion";
import { cn } from "@/lib/utils/cn";

type Row = Record<string, unknown>;

const SECTION_ORDER = ["basic", "professional", "skills", "expertise", "portfolio", "experience", "education", "certifications", "verification", "links"] as const;
const ID_TYPES = ["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"];
const VISIBILITY = ["Public", "Private", "Recruiters Only"];
function validateId(type: string, num: string): string | null {
  const v = num.trim().toUpperCase();
  if (!v) return "ID number is required.";
  if (type === "Aadhaar") return /^\d{12}$/.test(v) ? null : "Aadhaar must be 12 digits.";
  if (type === "PAN") return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v) ? null : "PAN must look like ABCDE1234F.";
  if (type === "Passport") return /^[A-Z][0-9]{7}$/.test(v) ? null : "Passport must look like A1234567.";
  return null; // Driving License / Voter ID — loose
}
const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "Singapore", "United Arab Emirates"];
const TIMEZONES = ["Asia/Kolkata", "Asia/Singapore", "Asia/Dubai", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Australia/Sydney"];
const YEARS = ["0-1", "1-3", "3-5", "5-8", "8+"];
const AVAILABILITY = ["Full Time", "Part Time", "Flexible"];
const EXPERTISE = ["Frontend Development", "Backend Development", "Full Stack", "Mobile Development", "AI / ML", "Cloud", "DevOps", "QA Testing", "Cyber Security", "UI/UX", "Data Science"];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const SKILL_SUGGESTIONS = ["React", "Node.js", "TypeScript", "Python", "MongoDB", "PostgreSQL", "AWS", "Docker", "Next.js", "Express", "TensorFlow", "Figma"];
const CATEGORIES = ["Web Development", "Mobile Development", "UI/UX", "AI/ML", "Data Science", "Cloud", "DevOps", "Testing", "Cyber Security", "Blockchain"];
const EMPLOYMENT = ["Full Time", "Internship", "Contract", "Freelance", "Volunteer"];

async function getJson(url: string): Promise<Row[] | Row> {
  try { const r = await fetch(url, { cache: "no-store" }); return r.ok ? await r.json() : []; } catch { return []; }
}
async function save(url: string, body: unknown, method = "POST"): Promise<void> {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { detail?: string }).detail || "Could not save.");
}

const input = "w-full h-9 rounded-lg border border-stroke-subtle bg-surface px-3 font-body text-[12.5px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30";
const label = "font-body text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary";
const primaryBtn = "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-surface font-body text-[12px] font-semibold hover:opacity-90 disabled:opacity-50";
const KEYWORDS = ["Authentication", "JWT", "RBAC", "Dashboard", "Payments", "Admin Panel", "Reporting", "Analytics", "Notifications", "Search", "Chat", "CRM", "Inventory", "Booking"];

/** Searchable multi-select chips — keeps skills/keywords clean (no comma chaos). */
function ChipField({ values, setValues, suggestions, placeholder }: { values: string[]; setValues: (v: string[]) => void; suggestions: string[]; placeholder: string }) {
  const [inp, setInp] = React.useState("");
  const add = (v: string) => { const t = v.trim(); if (t && !values.includes(t)) setValues([...values, t]); setInp(""); };
  return (
    <div className="space-y-1.5">
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full border border-stroke-subtle bg-surface-hover px-2.5 py-1 font-body text-[12px] text-foreground">
              {v}<button type="button" onClick={() => setValues(values.filter((x) => x !== v))} className="text-text-tertiary hover:text-foreground">×</button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.filter((s) => !values.includes(s)).slice(0, 10).map((s) => (
          <button key={s} type="button" onClick={() => add(s)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-stroke px-2.5 py-1 font-body text-[11.5px] text-text-secondary hover:bg-surface-hover"><Plus className="h-3 w-3" /> {s}</button>
        ))}
      </div>
      <input value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(inp); } }} placeholder={placeholder} className={input} />
    </div>
  );
}

export default function CompleteProfilePage() {
  const qc = useQueryClient();
  const { data: completion } = useProfileCompletion();
  const sections = completion?.sections ?? {};
  const weights = (completion?.weights ?? {}) as Record<string, number>;
  const pct = completion?.completeness ?? 0;
  const complete = completion?.complete ?? false;

  const [step, setStep] = React.useState(0);
  const currentKey = SECTION_ORDER[step];
  const lastStep = SECTION_ORDER.length - 1;

  const refresh = React.useCallback(() => qc.invalidateQueries({ queryKey: ["contributor", "profile", "completion"] }), [qc]);

  const [basic, setBasic] = React.useState({ country: "", city: "", timezone: "", linkedin: "" });
  const [prof, setProf] = React.useState({ job_title: "", bio: "", years_experience: "", availability: "" });
  const [skills, setSkills] = React.useState<Row[]>([]);
  const [expertise, setExpertise] = React.useState<string[]>([]);
  const [projects, setProjects] = React.useState<Row[]>([]);
  const [experience, setExperience] = React.useState<Row[]>([]);
  const [education, setEducation] = React.useState<Row[]>([]);
  const [skillDraft, setSkillDraft] = React.useState({ name: "", level: "Intermediate" });
  const [projDraft, setProjDraft] = React.useState({ title: "", category: CATEGORIES[0], description: "", url: "" });
  const [projSkills, setProjSkills] = React.useState<string[]>([]);
  const [projKeywords, setProjKeywords] = React.useState<string[]>([]);
  const [expDraft, setExpDraft] = React.useState({ organization: "", role: "", kind: "job", start_date: "", end_date: "" });
  const [eduDraft, setEduDraft] = React.useState({ institution: "", degree: "", field: "", start_year: "", end_year: "" });
  const [certs, setCerts] = React.useState<Row[]>([]);
  const [certDraft, setCertDraft] = React.useState({ name: "", issuer: "", url: "", date: "" });
  const [verif, setVerif] = React.useState({ idType: "", idNumber: "" });
  const [links, setLinks] = React.useState({ linkedin: "", github: "", portfolio: "", behance: "", dribbble: "", kaggle: "", medium: "" });
  const [prefs, setPrefs] = React.useState({ visibility: "Public", remoteOnly: false });
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState("");

  const reload = React.useCallback(async () => {
    const prof0 = (await getJson("/api/contributor/profile")) as Row;
    if (prof0 && typeof prof0 === "object") {
      setBasic((b) => ({ country: (prof0.country as string) || b.country, city: (prof0.city as string) || b.city, timezone: (prof0.timezone as string) || b.timezone, linkedin: (prof0.linkedin as string) || b.linkedin }));
      setProf((p) => ({ job_title: (prof0.job_title as string) || p.job_title, bio: (prof0.bio as string) || p.bio, years_experience: (prof0.years_experience as string) || p.years_experience, availability: (prof0.availability as string) || p.availability }));
      if (Array.isArray(prof0.expertise_areas)) setExpertise(prof0.expertise_areas as string[]);
    }
    const arr = (x: unknown): Row[] => Array.isArray(x) ? (x as Row[]) : Array.isArray((x as { items?: Row[] })?.items) ? (x as { items: Row[] }).items : [];
    setSkills(arr(await getJson("/api/contributor/skills")));
    setProjects(arr(await getJson("/api/contributor/profile/projects")));
    setExperience(arr(await getJson("/api/contributor/profile/experience")));
    setEducation(arr(await getJson("/api/contributor/profile/education")));
    const ex = (await getJson("/api/contributor/profile/extra")) as Row;
    if (ex && typeof ex === "object" && !Array.isArray(ex)) {
      setCerts(Array.isArray(ex.certifications) ? (ex.certifications as Row[]) : []);
      const v = (ex.verification as Row) || {}; setVerif({ idType: (v.idType as string) || "", idNumber: (v.idNumber as string) || "" });
      const l = (ex.links as Record<string, string>) || {}; setLinks((p) => ({ ...p, ...l }));
      const pr = (ex.preferences as Row) || {}; setPrefs((p) => ({ visibility: (pr.visibility as string) || p.visibility, remoteOnly: Boolean(pr.remoteOnly) }));
    }
    refresh();
  }, [refresh]);
  React.useEffect(() => { reload(); }, [reload]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setErr("");
    try { await fn(); await reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(null); }
  };
  const saveBasic = () => run("basic", () => save("/api/contributor/profile", basic, "PATCH"));
  const saveProf = () => run("professional", () => save("/api/contributor/profile", prof, "PATCH"));
  const saveExpertise = (next: string[]) => run("expertise", async () => { await save("/api/contributor/profile/expertise", { expertise_areas: next }, "PATCH"); setExpertise(next); });
  const addSkill = () => { if (!skillDraft.name.trim()) return; run("skills", async () => { await save("/api/contributor/skills", { name: skillDraft.name.trim(), level: skillDraft.level }); setSkillDraft({ name: "", level: "Intermediate" }); }); };
  const addProject = () => { if (!projDraft.title.trim()) return; run("portfolio", async () => { await save("/api/contributor/profile/projects", { title: projDraft.title.trim(), description: projDraft.description.trim(), skills: projSkills, keywords: projKeywords, url: projDraft.url.trim(), category: projDraft.category }); setProjDraft({ title: "", category: CATEGORIES[0], description: "", url: "" }); setProjSkills([]); setProjKeywords([]); }); };
  const addExp = () => { if (!expDraft.organization.trim() || !expDraft.role.trim()) return; run("experience", async () => { await save("/api/contributor/profile/experience", { organization: expDraft.organization.trim(), role: expDraft.role.trim(), kind: expDraft.kind, start_date: expDraft.start_date || null, end_date: expDraft.end_date || null }); setExpDraft({ organization: "", role: "", kind: "job", start_date: "", end_date: "" }); }); };
  const addEdu = () => { if (!eduDraft.institution.trim()) return; run("education", async () => { await save("/api/contributor/profile/education", { institution: eduDraft.institution.trim(), degree: eduDraft.degree.trim(), field: eduDraft.field.trim(), start_year: eduDraft.start_year || null, end_year: eduDraft.end_year || null }); setEduDraft({ institution: "", degree: "", field: "", start_year: "", end_year: "" }); }); };

  const addCert = () => { if (!certDraft.name.trim()) return; run("certifications", async () => { const next = [...certs, { ...certDraft }]; await save("/api/contributor/profile/extra", { certifications: next }, "PATCH"); setCerts(next); setCertDraft({ name: "", issuer: "", url: "", date: "" }); }); };
  const saveVerif = () => { if (!verif.idType) { setErr("Select an ID type."); return; } const e = validateId(verif.idType, verif.idNumber); if (e) { setErr(e); return; } run("verification", () => save("/api/contributor/profile/extra", { verification: verif }, "PATCH")); };
  const saveLinks = () => { if (!links.linkedin.trim()) { setErr("LinkedIn is required."); return; } const proof = links.github || links.portfolio || links.behance || links.dribbble || links.kaggle || links.medium; if (!proof) { setErr("Add at least one proof link besides LinkedIn (GitHub, Portfolio, Behance…)."); return; } run("links", () => save("/api/contributor/profile/extra", { links, preferences: prefs }, "PATCH")); };

  const sectionDone = sections[currentKey] === true;

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <Link href="/contributor/profile" className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      {/* progress */}
      <div className="rounded-xl border border-stroke bg-surface p-5 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-body text-[18px] font-semibold text-foreground">{complete ? "Profile complete" : "Complete your profile"}</h1>
          <span className="font-display text-[20px] font-bold tabular-nums" style={{ color: complete ? "#0F9D6B" : pct >= 50 ? "#CA8A04" : "#D97706" }}>{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-stroke-subtle overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: complete ? "#0F9D6B" : "#CA8A04" }} />
        </div>
        {complete ? (
          <Link href="/contributor/opportunities" className={cn(primaryBtn, "mt-3")}>Browse tasks <ArrowRight className="h-4 w-4" /></Link>
        ) : null}
      </div>

      {/* step chips */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {SECTION_ORDER.map((key, i) => {
          const done = sections[key] === true;
          return (
            <button key={key} type="button" onClick={() => setStep(i)}
              className={cn("inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-body text-[11.5px] whitespace-nowrap shrink-0 transition-colors",
                i === step ? "bg-foreground text-surface" : done ? "text-text-tertiary hover:bg-surface-hover" : "text-text-secondary hover:bg-surface-hover")}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: i === step ? "currentColor" : "#0F9D6B" }} /> : <span className="grid place-items-center h-4 w-4 rounded-full border border-current text-[9px] font-semibold">{i + 1}</span>}
              {SECTION_LABELS[key]}
            </button>
          );
        })}
      </div>

      {err ? <p className="mb-3 font-body text-[12px] text-error-text">{err}</p> : null}

      {/* current section */}
      <div className="rounded-xl border border-stroke bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-body text-[16px] font-semibold text-foreground">{SECTION_LABELS[currentKey]}</h2>
          <span className="font-body text-[11px] text-text-tertiary">· {weights[currentKey] ?? 0}%</span>
          {sectionDone ? <span className="ml-auto inline-flex items-center gap-1 font-body text-[11.5px]" style={{ color: "#0F9D6B" }}><CheckCircle2 className="h-3.5 w-3.5" /> Done</span> : null}
        </div>

        {currentKey === "basic" ? (
          <>
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className={label}>Country *</span><select value={basic.country} onChange={(e) => setBasic({ ...basic, country: e.target.value })} className={input}><option value="">Select…</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><span className={label}>City *</span><input value={basic.city} onChange={(e) => setBasic({ ...basic, city: e.target.value })} className={input} placeholder="City" /></div>
              <div><span className={label}>Timezone *</span><select value={basic.timezone} onChange={(e) => setBasic({ ...basic, timezone: e.target.value })} className={input}><option value="">Select…</option>{TIMEZONES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><span className={label}>LinkedIn *</span><input value={basic.linkedin} onChange={(e) => setBasic({ ...basic, linkedin: e.target.value })} className={input} placeholder="https://linkedin.com/in/…" /></div>
            </div>
            <button type="button" disabled={busy === "basic"} onClick={saveBasic} className={primaryBtn}>Save basic info</button>
          </>
        ) : null}

        {currentKey === "professional" ? (
          <>
            <div><span className={label}>Professional headline *</span><input value={prof.job_title} onChange={(e) => setProf({ ...prof, job_title: e.target.value })} className={input} placeholder="Senior MERN Stack Developer" /></div>
            <div><span className={label}>Bio *</span><textarea value={prof.bio} onChange={(e) => setProf({ ...prof, bio: e.target.value })} rows={3} className={cn(input, "h-auto py-2 resize-none")} placeholder="Tell clients about yourself" /></div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className={label}>Years of experience *</span><select value={prof.years_experience} onChange={(e) => setProf({ ...prof, years_experience: e.target.value })} className={input}><option value="">Select…</option>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></div>
              <div><span className={label}>Availability *</span><select value={prof.availability} onChange={(e) => setProf({ ...prof, availability: e.target.value })} className={input}><option value="">Select…</option>{AVAILABILITY.map((a) => <option key={a}>{a}</option>)}</select></div>
            </div>
            <button type="button" disabled={busy === "professional"} onClick={saveProf} className={primaryBtn}>Save professional details</button>
          </>
        ) : null}

        {currentKey === "skills" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Pick from the list — searchable, with a level each (no comma chaos).</p>
            {skills.length > 0 ? <div className="flex flex-wrap gap-1.5">{skills.map((s, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full border border-stroke-subtle bg-surface-hover px-2.5 py-1 font-body text-[12px] text-foreground">{String(s.name)} <span className="text-text-tertiary">· {String(s.level || "")}</span></span>)}</div> : null}
            <div className="flex flex-wrap gap-1.5">{SKILL_SUGGESTIONS.filter((s) => !skills.some((x) => String(x.name).toLowerCase() === s.toLowerCase())).map((s) => <button key={s} type="button" onClick={() => setSkillDraft({ ...skillDraft, name: s })} className="inline-flex items-center gap-1 rounded-full border border-dashed border-stroke px-2.5 py-1 font-body text-[11.5px] text-text-secondary hover:bg-surface-hover"><Plus className="h-3 w-3" /> {s}</button>)}</div>
            <div className="flex flex-wrap gap-2">
              <input value={skillDraft.name} onChange={(e) => setSkillDraft({ ...skillDraft, name: e.target.value })} placeholder="Search / add a skill" className={cn(input, "flex-1 min-w-[160px]")} />
              <select value={skillDraft.level} onChange={(e) => setSkillDraft({ ...skillDraft, level: e.target.value })} className={cn(input, "w-36")}>{SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
              <button type="button" disabled={busy === "skills" || !skillDraft.name.trim()} onClick={addSkill} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
          </>
        ) : null}

        {currentKey === "expertise" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Select the domains you work in.</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPERTISE.map((x) => { const on = expertise.includes(x); return (
                <button key={x} type="button" disabled={busy === "expertise"} onClick={() => saveExpertise(on ? expertise.filter((e) => e !== x) : [...expertise, x])}
                  className={cn("inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 font-body text-[12px] transition-colors disabled:opacity-50", on ? "border-foreground bg-foreground text-surface" : "border-stroke text-foreground hover:bg-surface-hover")}>
                  {on ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {x}
                </button>); })}
            </div>
          </>
        ) : null}

        {currentKey === "portfolio" ? (
          <>
            {projects.length > 0 ? <ul className="space-y-1">{projects.map((p, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(p.title)}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={projDraft.title} onChange={(e) => setProjDraft({ ...projDraft, title: e.target.value })} placeholder="Project name *" className={input} />
              <select value={projDraft.category} onChange={(e) => setProjDraft({ ...projDraft, category: e.target.value })} className={input}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <input value={projDraft.url} onChange={(e) => setProjDraft({ ...projDraft, url: e.target.value })} placeholder="GitHub / live URL" className={input} />
              <input value={projDraft.description} onChange={(e) => setProjDraft({ ...projDraft, description: e.target.value })} placeholder="Short description" className={input} />
            </div>
            <div><span className={label}>Skills used * (technology)</span><ChipField values={projSkills} setValues={setProjSkills} suggestions={SKILL_SUGGESTIONS} placeholder="Add a skill + Enter — React, Node.js…" /></div>
            <div><span className={label}>Keywords * (features)</span><ChipField values={projKeywords} setValues={setProjKeywords} suggestions={KEYWORDS} placeholder="Add a keyword + Enter — Login, Payments…" /></div>
            <button type="button" disabled={busy === "portfolio" || !projDraft.title.trim()} onClick={addProject} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add project</button>
          </>
        ) : null}

        {currentKey === "experience" ? (
          <>
            {experience.length > 0 ? <ul className="space-y-1">{experience.map((x, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.role)} · {String(x.organization)}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={expDraft.organization} onChange={(e) => setExpDraft({ ...expDraft, organization: e.target.value })} placeholder="Organization *" className={input} />
              <input value={expDraft.role} onChange={(e) => setExpDraft({ ...expDraft, role: e.target.value })} placeholder="Role *" className={input} />
              <select value={expDraft.kind} onChange={(e) => setExpDraft({ ...expDraft, kind: e.target.value })} className={input}>{EMPLOYMENT.map((k) => <option key={k} value={k.toLowerCase().replace(" ", "_")}>{k}</option>)}</select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={expDraft.start_date} onChange={(e) => setExpDraft({ ...expDraft, start_date: e.target.value })} className={input} />
                <input type="date" value={expDraft.end_date} onChange={(e) => setExpDraft({ ...expDraft, end_date: e.target.value })} className={input} />
              </div>
            </div>
            <button type="button" disabled={busy === "experience" || !expDraft.organization.trim() || !expDraft.role.trim()} onClick={addExp} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add experience</button>
          </>
        ) : null}

        {currentKey === "education" ? (
          <>
            {education.length > 0 ? <ul className="space-y-1">{education.map((x, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.degree || "")} {String(x.field || "")} · {String(x.institution)}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={eduDraft.institution} onChange={(e) => setEduDraft({ ...eduDraft, institution: e.target.value })} placeholder="Institution *" className={input} />
              <input value={eduDraft.degree} onChange={(e) => setEduDraft({ ...eduDraft, degree: e.target.value })} placeholder="Degree (B.Tech)" className={input} />
              <input value={eduDraft.field} onChange={(e) => setEduDraft({ ...eduDraft, field: e.target.value })} placeholder="Specialization (CSE)" className={input} />
              <div className="grid grid-cols-2 gap-2">
                <input value={eduDraft.start_year} onChange={(e) => setEduDraft({ ...eduDraft, start_year: e.target.value })} placeholder="Start year" className={input} />
                <input value={eduDraft.end_year} onChange={(e) => setEduDraft({ ...eduDraft, end_year: e.target.value })} placeholder="End year" className={input} />
              </div>
            </div>
            <button type="button" disabled={busy === "education" || !eduDraft.institution.trim()} onClick={addEdu} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add education</button>
          </>
        ) : null}

        {currentKey === "certifications" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Optional — add any certifications you hold.</p>
            {certs.length > 0 ? <ul className="space-y-1">{certs.map((c, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(c.name)}{c.issuer ? ` · ${String(c.issuer)}` : ""}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={certDraft.name} onChange={(e) => setCertDraft({ ...certDraft, name: e.target.value })} placeholder="Certificate name" className={input} />
              <input value={certDraft.issuer} onChange={(e) => setCertDraft({ ...certDraft, issuer: e.target.value })} placeholder="Issuer" className={input} />
              <input value={certDraft.url} onChange={(e) => setCertDraft({ ...certDraft, url: e.target.value })} placeholder="Credential URL" className={input} />
              <input type="date" value={certDraft.date} onChange={(e) => setCertDraft({ ...certDraft, date: e.target.value })} className={input} />
            </div>
            <button type="button" disabled={busy === "certifications" || !certDraft.name.trim()} onClick={addCert} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add certification</button>
          </>
        ) : null}

        {currentKey === "verification" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Government ID — kept private, used for trust only.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className={label}>ID type *</span><select value={verif.idType} onChange={(e) => setVerif({ ...verif, idType: e.target.value })} className={input}><option value="">Select…</option>{ID_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><span className={label}>ID number *</span><input value={verif.idNumber} onChange={(e) => setVerif({ ...verif, idNumber: e.target.value })} className={input} placeholder={verif.idType === "Aadhaar" ? "12 digits" : verif.idType === "PAN" ? "ABCDE1234F" : "ID number"} /></div>
            </div>
            <button type="button" disabled={busy === "verification"} onClick={saveVerif} className={primaryBtn}>Save verification</button>
          </>
        ) : null}

        {currentKey === "links" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">LinkedIn is required, plus at least one proof link.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={links.linkedin} onChange={(e) => setLinks({ ...links, linkedin: e.target.value })} placeholder="LinkedIn *" className={input} />
              <input value={links.github} onChange={(e) => setLinks({ ...links, github: e.target.value })} placeholder="GitHub" className={input} />
              <input value={links.portfolio} onChange={(e) => setLinks({ ...links, portfolio: e.target.value })} placeholder="Portfolio website" className={input} />
              <input value={links.behance} onChange={(e) => setLinks({ ...links, behance: e.target.value })} placeholder="Behance" className={input} />
              <input value={links.dribbble} onChange={(e) => setLinks({ ...links, dribbble: e.target.value })} placeholder="Dribbble" className={input} />
              <input value={links.kaggle} onChange={(e) => setLinks({ ...links, kaggle: e.target.value })} placeholder="Kaggle" className={input} />
              <input value={links.medium} onChange={(e) => setLinks({ ...links, medium: e.target.value })} placeholder="Medium" className={input} />
            </div>
            <div className="grid sm:grid-cols-2 gap-2 pt-1">
              <div><span className={label}>Profile visibility</span><select value={prefs.visibility} onChange={(e) => setPrefs({ ...prefs, visibility: e.target.value })} className={input}>{VISIBILITY.map((v) => <option key={v}>{v}</option>)}</select></div>
              <label className="flex items-center gap-2 mt-5 cursor-pointer"><input type="checkbox" checked={prefs.remoteOnly} onChange={(e) => setPrefs({ ...prefs, remoteOnly: e.target.checked })} className="h-3.5 w-3.5 rounded accent-brand" /><span className="font-body text-[12.5px] text-foreground">Remote only</span></label>
            </div>
            <button type="button" disabled={busy === "links"} onClick={saveLinks} className={primaryBtn}>Save links &amp; preferences</button>
          </>
        ) : null}
      </div>

      {/* wizard nav */}
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-stroke font-body text-[12.5px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="font-body text-[12px] text-text-tertiary">Step {step + 1} of {SECTION_ORDER.length}</span>
        {step < lastStep ? (
          <button type="button" onClick={() => setStep((s) => Math.min(lastStep, s + 1))} className={primaryBtn}>
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : complete ? (
          <Link href="/contributor/opportunities" className={primaryBtn}>Finish <ArrowRight className="h-4 w-4" /></Link>
        ) : (
          <span className="font-body text-[12px] text-text-tertiary">Reach 100% to finish</span>
        )}
      </div>
    </div>
  );
}
