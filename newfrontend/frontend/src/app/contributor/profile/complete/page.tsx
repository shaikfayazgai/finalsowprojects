"use client";

/**
 * Complete your profile — a professional, weighted, sectioned profile builder
 * (a searchable talent profile, not a basic form). Left sidebar tracks each
 * section ✓/○; the weighted bar shows 0→100%. A freelancer unlocks public work
 * only at 100%. Backed by the freelancer profile + skills/projects/experience/
 * education endpoints.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Plus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileCompletion, SECTION_LABELS } from "@/lib/hooks/use-profile-completion";
import { cn } from "@/lib/utils/cn";

type Row = Record<string, unknown>;

const SECTION_ORDER = ["basic", "professional", "skills", "expertise", "portfolio", "experience", "education"] as const;
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

function Section({ id, title, hint, done, weight, children }: { id: string; title: string; hint: string; done: boolean; weight: number; children: React.ReactNode }) {
  return (
    <section id={`sec-${id}`} className="rounded-xl border border-stroke bg-surface p-5 space-y-3 scroll-mt-4">
      <div className="flex items-start gap-2.5">
        {done ? <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#0F9D6B" }} /> : <Circle className="h-5 w-5 mt-0.5 shrink-0 text-text-tertiary" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-body text-[15px] font-semibold text-foreground">{title}</h2>
            <span className="font-body text-[10.5px] text-text-tertiary">· {weight}%</span>
          </div>
          <p className="font-body text-[11.5px] text-text-tertiary">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function CompleteProfilePage() {
  const qc = useQueryClient();
  const { data: completion } = useProfileCompletion();
  const sections = completion?.sections ?? {};
  const weights = completion?.weights ?? {};
  const pct = completion?.completeness ?? 0;
  const complete = completion?.complete ?? false;

  const refresh = React.useCallback(() => qc.invalidateQueries({ queryKey: ["contributor", "profile", "completion"] }), [qc]);

  // Basic + professional (PATCH /profile)
  const [basic, setBasic] = React.useState({ country: "", city: "", timezone: "", linkedin: "" });
  const [prof, setProf] = React.useState({ job_title: "", bio: "", years_experience: "", availability: "" });
  // lists
  const [skills, setSkills] = React.useState<Row[]>([]);
  const [expertise, setExpertise] = React.useState<string[]>([]);
  const [projects, setProjects] = React.useState<Row[]>([]);
  const [experience, setExperience] = React.useState<Row[]>([]);
  const [education, setEducation] = React.useState<Row[]>([]);
  // drafts
  const [skillDraft, setSkillDraft] = React.useState({ name: "", level: "Intermediate" });
  const [projDraft, setProjDraft] = React.useState({ title: "", category: CATEGORIES[0], description: "", skills: "", url: "" });
  const [expDraft, setExpDraft] = React.useState({ organization: "", role: "", kind: "job", start_date: "", end_date: "" });
  const [eduDraft, setEduDraft] = React.useState({ institution: "", degree: "", field: "", start_year: "", end_year: "" });
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState("");

  const reload = React.useCallback(async () => {
    const prof0 = (await getJson("/api/contributor/profile")) as Row;
    if (prof0 && typeof prof0 === "object") {
      setBasic((b) => ({ country: (prof0.country as string) || b.country, city: (prof0.city as string) || b.city, timezone: (prof0.timezone as string) || b.timezone, linkedin: (prof0.linkedin as string) || b.linkedin }));
      setProf((p) => ({ job_title: (prof0.job_title as string) || p.job_title, bio: (prof0.bio as string) || p.bio, years_experience: (prof0.years_experience as string) || p.years_experience, availability: (prof0.availability as string) || p.availability }));
      if (Array.isArray(prof0.expertise_areas)) setExpertise(prof0.expertise_areas as string[]);
    }
    const arr = (x: unknown): Row[] =>
      Array.isArray(x) ? (x as Row[]) : Array.isArray((x as { items?: Row[] })?.items) ? (x as { items: Row[] }).items : [];
    setSkills(arr(await getJson("/api/contributor/skills")));
    setProjects(arr(await getJson("/api/contributor/profile/projects")));
    setExperience(arr(await getJson("/api/contributor/profile/experience")));
    setEducation(arr(await getJson("/api/contributor/profile/education")));
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
  const addProject = () => { if (!projDraft.title.trim()) return; run("portfolio", async () => { await save("/api/contributor/profile/projects", { title: projDraft.title.trim(), description: projDraft.description.trim(), skills: projDraft.skills.split(",").map((s) => s.trim()).filter(Boolean), url: projDraft.url.trim(), data: { category: projDraft.category } }); setProjDraft({ title: "", category: CATEGORIES[0], description: "", skills: "", url: "" }); }); };
  const addExp = () => { if (!expDraft.organization.trim() || !expDraft.role.trim()) return; run("experience", async () => { await save("/api/contributor/profile/experience", { organization: expDraft.organization.trim(), role: expDraft.role.trim(), kind: expDraft.kind, start_date: expDraft.start_date || null, end_date: expDraft.end_date || null }); setExpDraft({ organization: "", role: "", kind: "job", start_date: "", end_date: "" }); }); };
  const addEdu = () => { if (!eduDraft.institution.trim()) return; run("education", async () => { await save("/api/contributor/profile/education", { institution: eduDraft.institution.trim(), degree: eduDraft.degree.trim(), field: eduDraft.field.trim(), start_year: eduDraft.start_year || null, end_year: eduDraft.end_year || null }); setEduDraft({ institution: "", degree: "", field: "", start_year: "", end_year: "" }); }); };

  return (
    <div className="pb-16">
      <Link href="/contributor/profile" className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary hover:text-foreground mb-4">
        ← Back to profile
      </Link>

      {/* progress header */}
      <div className="rounded-xl border border-stroke bg-surface p-5 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-body text-[18px] font-semibold text-foreground">{complete ? "Profile complete" : "Complete your profile"}</h1>
          <span className="font-display text-[20px] font-bold tabular-nums" style={{ color: complete ? "#0F9D6B" : pct >= 50 ? "#CA8A04" : "#D97706" }}>{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-stroke-subtle overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: complete ? "#0F9D6B" : "#CA8A04" }} />
        </div>
        <p className="mt-2 font-body text-[12px] text-text-secondary">
          {complete ? "You're eligible to view and pick up public tasks." : "Complete all sections to unlock opportunities."}
        </p>
        {complete ? (
          <Link href="/contributor/opportunities" className={cn(primaryBtn, "mt-3")}>Browse tasks <ArrowRight className="h-4 w-4" /></Link>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-4">
        {/* sidebar */}
        <aside className="lg:sticky lg:top-4 self-start rounded-xl border border-stroke bg-surface p-2">
          <nav className="space-y-0.5">
            {SECTION_ORDER.map((key) => {
              const done = sections[key] === true;
              return (
                <a key={key} href={`#sec-${key}`} className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-hover font-body text-[12.5px]">
                  {done ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#0F9D6B" }} /> : <Circle className="h-4 w-4 shrink-0 text-text-tertiary" />}
                  <span className={cn("flex-1 truncate", done ? "text-text-tertiary" : "text-foreground")}>{SECTION_LABELS[key] ?? key}</span>
                  <span className="font-body text-[10px] text-text-tertiary tabular-nums">{(weights as Record<string, number>)[key] ?? ""}%</span>
                </a>
              );
            })}
          </nav>
        </aside>

        {/* sections */}
        <div className="space-y-4">
          {err ? <p className="font-body text-[12px] text-error-text">{err}</p> : null}

          <Section id="basic" title="Basic information" hint="Where you're based + how to reach you." done={sections.basic === true} weight={15}>
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className={label}>Country *</span><select value={basic.country} onChange={(e) => setBasic({ ...basic, country: e.target.value })} className={input}><option value="">Select…</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><span className={label}>City *</span><input value={basic.city} onChange={(e) => setBasic({ ...basic, city: e.target.value })} className={input} placeholder="City" /></div>
              <div><span className={label}>Timezone *</span><select value={basic.timezone} onChange={(e) => setBasic({ ...basic, timezone: e.target.value })} className={input}><option value="">Select…</option>{TIMEZONES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><span className={label}>LinkedIn *</span><input value={basic.linkedin} onChange={(e) => setBasic({ ...basic, linkedin: e.target.value })} className={input} placeholder="https://linkedin.com/in/…" /></div>
            </div>
            <button type="button" disabled={busy === "basic"} onClick={saveBasic} className={primaryBtn}>Save basic info</button>
          </Section>

          <Section id="professional" title="Professional details" hint="Your headline, bio, experience + availability." done={sections.professional === true} weight={15}>
            <div className="space-y-2">
              <div><span className={label}>Professional headline *</span><input value={prof.job_title} onChange={(e) => setProf({ ...prof, job_title: e.target.value })} className={input} placeholder="Senior MERN Stack Developer" /></div>
              <div><span className={label}>Bio *</span><textarea value={prof.bio} onChange={(e) => setProf({ ...prof, bio: e.target.value })} rows={3} className={cn(input, "h-auto py-2 resize-none")} placeholder="Tell clients about yourself" /></div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div><span className={label}>Years of experience *</span><select value={prof.years_experience} onChange={(e) => setProf({ ...prof, years_experience: e.target.value })} className={input}><option value="">Select…</option>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></div>
                <div><span className={label}>Availability *</span><select value={prof.availability} onChange={(e) => setProf({ ...prof, availability: e.target.value })} className={input}><option value="">Select…</option>{AVAILABILITY.map((a) => <option key={a}>{a}</option>)}</select></div>
              </div>
            </div>
            <button type="button" disabled={busy === "professional"} onClick={saveProf} className={primaryBtn}>Save professional details</button>
          </Section>

          <Section id="skills" title="Skills" hint="Pick from the list — searchable, with a level each (no free-text chaos)." done={sections.skills === true} weight={20}>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full border border-stroke-subtle bg-surface-hover px-2.5 py-1 font-body text-[12px] text-foreground">
                    {String(s.name)} <span className="text-text-tertiary">· {String(s.level || "")}</span>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter((s) => !skills.some((x) => String(x.name).toLowerCase() === s.toLowerCase())).map((s) => (
                <button key={s} type="button" onClick={() => setSkillDraft({ ...skillDraft, name: s })} className="inline-flex items-center gap-1 rounded-full border border-dashed border-stroke px-2.5 py-1 font-body text-[11.5px] text-text-secondary hover:bg-surface-hover"><Plus className="h-3 w-3" /> {s}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input value={skillDraft.name} onChange={(e) => setSkillDraft({ ...skillDraft, name: e.target.value })} placeholder="Search / add a skill" className={cn(input, "flex-1 min-w-[160px]")} />
              <select value={skillDraft.level} onChange={(e) => setSkillDraft({ ...skillDraft, level: e.target.value })} className={cn(input, "w-36")}>{SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
              <button type="button" disabled={busy === "skills" || !skillDraft.name.trim()} onClick={addSkill} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
          </Section>

          <Section id="expertise" title="Expertise areas" hint="Select the domains you work in." done={sections.expertise === true} weight={10}>
            <div className="flex flex-wrap gap-1.5">
              {EXPERTISE.map((x) => {
                const on = expertise.includes(x);
                return (
                  <button key={x} type="button" disabled={busy === "expertise"} onClick={() => saveExpertise(on ? expertise.filter((e) => e !== x) : [...expertise, x])}
                    className={cn("inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 font-body text-[12px] transition-colors disabled:opacity-50", on ? "border-foreground bg-foreground text-surface" : "border-stroke text-foreground hover:bg-surface-hover")}>
                    {on ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {x}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section id="portfolio" title="Portfolio projects" hint="Real projects — with category, skills + a link." done={sections.portfolio === true} weight={20}>
            {projects.length > 0 ? <ul className="space-y-1 mb-1">{projects.map((p, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(p.title)}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={projDraft.title} onChange={(e) => setProjDraft({ ...projDraft, title: e.target.value })} placeholder="Project name *" className={input} />
              <select value={projDraft.category} onChange={(e) => setProjDraft({ ...projDraft, category: e.target.value })} className={input}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <input value={projDraft.skills} onChange={(e) => setProjDraft({ ...projDraft, skills: e.target.value })} placeholder="Skills used (comma sep)" className={input} />
              <input value={projDraft.url} onChange={(e) => setProjDraft({ ...projDraft, url: e.target.value })} placeholder="GitHub / live URL" className={input} />
              <input value={projDraft.description} onChange={(e) => setProjDraft({ ...projDraft, description: e.target.value })} placeholder="Short description" className={cn(input, "sm:col-span-2")} />
            </div>
            <button type="button" disabled={busy === "portfolio" || !projDraft.title.trim()} onClick={addProject} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add project</button>
          </Section>

          <Section id="experience" title="Work experience" hint="Roles + internships, with dates." done={sections.experience === true} weight={10}>
            {experience.length > 0 ? <ul className="space-y-1 mb-1">{experience.map((x, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.role)} · {String(x.organization)}</li>)}</ul> : null}
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
          </Section>

          <Section id="education" title="Education" hint="Your degree + specialization." done={sections.education === true} weight={10}>
            {education.length > 0 ? <ul className="space-y-1 mb-1">{education.map((x, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.degree || "")} {String(x.field || "")} · {String(x.institution)}</li>)}</ul> : null}
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
          </Section>
        </div>
      </div>
    </div>
  );
}
