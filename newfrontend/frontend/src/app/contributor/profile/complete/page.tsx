"use client";

/**
 * Complete your profile — the 10-step contributor onboarding wizard, matching the
 * Glimmora template field-for-field, in the GT theme. One section at a time
 * (fill -> Next). Builds a searchable talent profile: identity, skills+keywords,
 * portfolio, experience, education, verification, bank, agreements. A freelancer
 * unlocks public work only at 100%.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileCompletion, SECTION_LABELS } from "@/lib/hooks/use-profile-completion";
import { cn } from "@/lib/utils/cn";

type Row = Record<string, unknown>;

const SECTION_ORDER = ["basic", "professional", "skills", "expertise", "portfolio", "experience", "education", "verification", "bank", "agreements"] as const;

const COUNTRY_MAP: Record<string, Record<string, string[]>> = {
  India: { "Andhra Pradesh": ["Anantapur", "Vijayawada", "Visakhapatnam", "Tirupati"], Telangana: ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad"], "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"], Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"], Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"] },
  "United States": { California: ["Los Angeles", "San Francisco", "San Diego"], Texas: ["Austin", "Dallas", "Houston"], "New York": ["New York City", "Buffalo", "Rochester"] },
  "United Kingdom": { England: ["London", "Manchester", "Birmingham"], Scotland: ["Edinburgh", "Glasgow", "Aberdeen"] },
  Australia: { "New South Wales": ["Sydney", "Newcastle", "Wollongong"], Victoria: ["Melbourne", "Geelong", "Ballarat"] },
  Canada: { Ontario: ["Toronto", "Ottawa", "Waterloo"], "British Columbia": ["Vancouver", "Victoria", "Kelowna"] },
};
const COUNTRIES = Object.keys(COUNTRY_MAP);
const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York", "America/Los_Angeles"];
const YEARS = ["Fresher", "0-1 Years", "1-3 Years", "3-5 Years", "5-8 Years", "8+ Years"];
const WEEKLY = ["10 Hours", "20 Hours", "30 Hours", "40 Hours", "Flexible"];
const AVAILABILITY = ["Full Time", "Part Time", "Weekends", "Flexible"];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const SKILL_YEARS = ["0-6 Months", "6-12 Months", "1 Year", "2 Years", "3 Years", "4 Years", "5+ Years"];
const LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam"];
const SKILLS = ["React", "Node.js", "TypeScript", "JavaScript", "Python", "MongoDB", "PostgreSQL", "AWS", "Docker", "Next.js", "Express", "TensorFlow", "Figma", "Java", "Spring Boot", "Flutter", "React Native", "GraphQL"];
const KEYWORDS = ["Authentication", "JWT", "RBAC", "Dashboard", "Payments", "Admin Panel", "Reporting", "Analytics", "Inventory", "Attendance", "Chat", "Socket.IO", "CRM", "ERP", "Booking", "Notifications"];
const EXPERTISE = ["Frontend Development", "Backend Development", "Full Stack", "Mobile Development", "AI / ML", "Data Science", "Cloud", "DevOps", "QA Testing", "Cyber Security", "UI/UX", "Graphic Design", "Content Writing", "Business Analysis", "Project Coordination"];
const TECHNICAL = ["Frontend Development", "Backend Development", "Full Stack", "Mobile Development", "AI / ML", "Data Science", "Cloud", "DevOps", "Cyber Security"];
const PREFERENCES = ["Web", "Mobile", "AI", "Cloud", "Education", "Healthcare", "Finance", "Ecommerce", "SaaS", "Remote Only"];
const PROJECT_CATEGORIES = ["Web Development", "Mobile App", "AI Project", "Cloud Project", "Data Science", "Desktop Application", "UI/UX"];
const EMPLOYMENT = ["Full Time", "Part Time", "Internship", "Contract", "Freelance"];
const DEGREES = ["B.Tech", "B.E", "BCA", "MCA", "M.Tech", "MBA", "B.Sc", "M.Sc", "PhD", "Other"];
const SPECIALIZATIONS = ["Computer Science", "Information Technology", "AI & ML", "Data Science", "Electronics", "Mechanical", "Civil", "Business Administration"];
const ID_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID"];
const ACCOUNT_TYPES = ["Savings", "Current"];

function validateId(type: string, num: string): string | null {
  const v = num.trim().toUpperCase();
  if (!v) return "ID number is required.";
  if (type === "Aadhaar Card") return /^\d{12}$/.test(v) ? null : "Aadhaar must be 12 digits.";
  if (type === "PAN Card") return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v) ? null : "PAN must look like ABCDE1234F.";
  if (type === "Passport") return /^[A-Z][0-9]{7}$/.test(v) ? null : "Passport must look like A1234567.";
  return null;
}

async function getJson(url: string): Promise<Row[] | Row> {
  try { const r = await fetch(url, { cache: "no-store" }); return r.ok ? await r.json() : []; } catch { return []; }
}
async function save(url: string, body: unknown, method = "POST"): Promise<void> {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { detail?: string }).detail || "Could not save.");
}
const arr = (x: unknown): Row[] => Array.isArray(x) ? (x as Row[]) : Array.isArray((x as { items?: Row[] })?.items) ? (x as { items: Row[] }).items : [];

const inputCls = "w-full h-9 rounded-lg border border-stroke-subtle bg-surface px-3 font-body text-[12.5px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30";
const labelCls = "block font-body text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary mb-1";
const primaryBtn = "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-surface font-body text-[12px] font-semibold hover:opacity-90 disabled:opacity-50";

/** Searchable multi-select chips — keeps languages/skills/keywords clean. */
function ChipField({ values, setValues, suggestions, placeholder }: { values: string[]; setValues: (v: string[]) => void; suggestions: string[]; placeholder: string }) {
  const [inp, setInp] = React.useState("");
  const add = (v: string) => { const t = v.trim(); if (t && !values.includes(t)) setValues([...values, t]); setInp(""); };
  return (
    <div className="space-y-1.5">
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">{values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-stroke-subtle bg-surface-hover px-2.5 py-1 font-body text-[12px] text-foreground">{v}<button type="button" onClick={() => setValues(values.filter((x) => x !== v))} className="text-text-tertiary hover:text-foreground">×</button></span>
        ))}</div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">{suggestions.filter((s) => !values.includes(s)).slice(0, 12).map((s) => (
        <button key={s} type="button" onClick={() => add(s)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-stroke px-2.5 py-1 font-body text-[11.5px] text-text-secondary hover:bg-surface-hover"><Plus className="h-3 w-3" /> {s}</button>
      ))}</div>
      <input value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(inp); } }} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

/** File picker — shows the chosen filename (real upload to Blob is wired later). */
function FileField({ text, name, onPick, accept, multiple }: { text: string; name: string; onPick: (n: string) => void; accept: string; multiple?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-dashed border-stroke bg-surface cursor-pointer hover:bg-surface-hover">
      <span className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-secondary truncate"><Upload className="h-3.5 w-3.5 shrink-0" /> {name || text}</span>
      <input type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => { const f = e.target.files; if (f && f.length) onPick(multiple ? Array.from(f).map((x) => x.name).join(", ") : f[0].name); }} />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className={labelCls}>{label}</span>{children}</div>;
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

  const [basic, setBasic] = React.useState({ firstName: "", lastName: "", username: "", country: "", state: "", city: "", pincode: "", mobileNumber: "", timezone: "", profilePhoto: "" });
  const [languages, setLanguages] = React.useState<string[]>([]);
  const [prof, setProf] = React.useState({ headline: "", bio: "", yearsExperience: "", weeklyHours: "", hourlyRate: "", availability: "" });
  const [skills, setSkills] = React.useState<Row[]>([]);
  const [skillDraft, setSkillDraft] = React.useState({ name: "", level: "Intermediate", years: "1 Year" });
  const [expertise, setExpertise] = React.useState<string[]>([]);
  const [projects, setProjects] = React.useState<Row[]>([]);
  const [projDraft, setProjDraft] = React.useState({ name: "", category: "", description: "", github: "", live: "", video: "", screenshots: "" });
  const [projSkills, setProjSkills] = React.useState<string[]>([]);
  const [projKeywords, setProjKeywords] = React.useState<string[]>([]);
  const [experience, setExperience] = React.useState<Row[]>([]);
  const [expDraft, setExpDraft] = React.useState({ organization: "", role: "", employmentType: "Full Time", startDate: "", endDate: "", description: "" });
  const [education, setEducation] = React.useState<Row[]>([]);
  const [eduDraft, setEduDraft] = React.useState({ institution: "", degree: "", specialization: "", grade: "", startYear: "", endYear: "" });
  const [links, setLinks] = React.useState({ linkedin: "", github: "", portfolio: "", proofUrl: "" });
  const [verif, setVerif] = React.useState({ idType: "", idNumber: "", idDocument: "" });
  const [resume, setResume] = React.useState("");
  const [preferences, setPreferences] = React.useState<string[]>([]);
  const [bank, setBank] = React.useState({ accountHolderName: "", bankName: "", accountNumber: "", confirmAccountNumber: "", ifscCode: "", accountType: "", upiId: "" });
  const [agree, setAgree] = React.useState({ termsAccepted: false, paymentPolicyAccepted: false, privacyPolicyAccepted: false, notificationConsent: false, truthDeclaration: false });
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState("");

  const reload = React.useCallback(async () => {
    const p = (await getJson("/api/contributor/profile")) as Row;
    if (p && typeof p === "object" && !Array.isArray(p)) {
      setBasic((b) => ({ ...b, country: (p.country as string) || b.country, city: (p.city as string) || b.city, timezone: (p.timezone as string) || b.timezone }));
      setProf((x) => ({ ...x, headline: (p.job_title as string) || x.headline, bio: (p.bio as string) || x.bio, yearsExperience: (p.years_experience as string) || x.yearsExperience, availability: (p.availability as string) || x.availability }));
      if (Array.isArray(p.expertise_areas)) setExpertise(p.expertise_areas as string[]);
    }
    setSkills(arr(await getJson("/api/contributor/skills")));
    setProjects(arr(await getJson("/api/contributor/profile/projects")));
    setExperience(arr(await getJson("/api/contributor/profile/experience")));
    setEducation(arr(await getJson("/api/contributor/profile/education")));
    const ex = (await getJson("/api/contributor/profile/extra")) as Row;
    if (ex && typeof ex === "object" && !Array.isArray(ex)) {
      const b = (ex.basic as Record<string, string>) || {};
      setBasic((x) => ({ ...x, firstName: b.firstName || x.firstName, lastName: b.lastName || x.lastName, username: b.username || x.username, state: b.state || x.state, pincode: b.pincode || x.pincode, mobileNumber: (ex.mobileNumber as string) || b.mobileNumber || x.mobileNumber, profilePhoto: b.profilePhoto || x.profilePhoto }));
      if (Array.isArray(ex.languages)) setLanguages(ex.languages as string[]);
      const pr = (ex.professional as Record<string, string>) || {}; setProf((x) => ({ ...x, weeklyHours: pr.weeklyHours || x.weeklyHours, hourlyRate: pr.hourlyRate || x.hourlyRate }));
      setLinks((x) => ({ ...x, ...((ex.links as Record<string, string>) || {}) }));
      const v = (ex.verification as Record<string, string>) || {}; setVerif((x) => ({ idType: v.idType || x.idType, idNumber: v.idNumber || x.idNumber, idDocument: v.idDocument || x.idDocument }));
      if (ex.resume) setResume(ex.resume as string);
      if (Array.isArray(ex.preferences)) setPreferences(ex.preferences as string[]);
      setBank((x) => ({ ...x, ...((ex.bank as Record<string, string>) || {}) }));
      setAgree((x) => ({ ...x, ...((ex.agreements as Record<string, boolean>) || {}) }));
    }
    refresh();
  }, [refresh]);
  React.useEffect(() => { reload(); }, [reload]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setErr("");
    try { await fn(); await reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(null); }
  };
  const patchExtra = (body: object) => save("/api/contributor/profile/extra", body, "PATCH");

  const saveBasic = () => run("basic", async () => {
    await save("/api/contributor/profile", { country: basic.country, city: basic.city, timezone: basic.timezone }, "PATCH");
    await patchExtra({ basic: { firstName: basic.firstName, lastName: basic.lastName, username: basic.username, state: basic.state, pincode: basic.pincode, mobileNumber: basic.mobileNumber, profilePhoto: basic.profilePhoto }, mobileNumber: basic.mobileNumber, languages });
  });
  const saveProf = () => run("professional", async () => {
    await save("/api/contributor/profile", { job_title: prof.headline, bio: prof.bio, years_experience: prof.yearsExperience, availability: prof.availability }, "PATCH");
    await patchExtra({ professional: { weeklyHours: prof.weeklyHours, hourlyRate: prof.hourlyRate } });
  });
  const addSkill = () => { if (!skillDraft.name.trim()) return; run("skills", async () => { await save("/api/contributor/skills", { name: skillDraft.name.trim(), level: skillDraft.level, years: skillDraft.years }); setSkillDraft({ name: "", level: "Intermediate", years: "1 Year" }); }); };
  const saveExpertise = (next: string[]) => run("expertise", async () => { await save("/api/contributor/profile/expertise", { expertise_areas: next }, "PATCH"); setExpertise(next); });
  const addProject = () => { if (!projDraft.name.trim()) return; run("portfolio", async () => { await save("/api/contributor/profile/projects", { title: projDraft.name.trim(), description: projDraft.description.trim(), category: projDraft.category, skills: projSkills, keywords: projKeywords, url: projDraft.github || projDraft.live, video: projDraft.video, screenshots: projDraft.screenshots ? projDraft.screenshots.split(",").map((s) => s.trim()) : [] }); setProjDraft({ name: "", category: "", description: "", github: "", live: "", video: "", screenshots: "" }); setProjSkills([]); setProjKeywords([]); }); };
  const addExp = () => { if (!expDraft.organization.trim() || !expDraft.role.trim()) return; run("experience", async () => { await save("/api/contributor/profile/experience", { organization: expDraft.organization.trim(), role: expDraft.role.trim(), kind: expDraft.employmentType, start_date: expDraft.startDate || null, end_date: expDraft.endDate || null, description: expDraft.description }); setExpDraft({ organization: "", role: "", employmentType: "Full Time", startDate: "", endDate: "", description: "" }); }); };
  const addEdu = () => { if (!eduDraft.institution.trim()) return; run("education", async () => { await save("/api/contributor/profile/education", { institution: eduDraft.institution.trim(), degree: eduDraft.degree, field: eduDraft.specialization, grade: eduDraft.grade, start_year: eduDraft.startYear || null, end_year: eduDraft.endYear || null }); setEduDraft({ institution: "", degree: "", specialization: "", grade: "", startYear: "", endYear: "" }); }); };

  const githubRequired = expertise.some((e) => TECHNICAL.includes(e));
  const saveVerif = () => {
    if (!links.linkedin.trim()) { setErr("LinkedIn is required."); return; }
    if (githubRequired && !links.github.trim()) { setErr("GitHub is required for the technical areas you selected."); return; }
    if (!verif.idType) { setErr("Select a government ID type."); return; }
    const e = validateId(verif.idType, verif.idNumber); if (e) { setErr(e); return; }
    run("verification", () => patchExtra({ links, verification: verif, resume, preferences }));
  };
  const saveBank = () => {
    if (!bank.accountHolderName.trim() || !bank.accountNumber.trim() || !bank.ifscCode.trim()) { setErr("Holder name, account number and IFSC are required."); return; }
    if (bank.accountNumber !== bank.confirmAccountNumber) { setErr("Account numbers do not match."); return; }
    if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bank.ifscCode.trim())) { setErr("IFSC must look like HDFC0001234."); return; }
    run("bank", () => patchExtra({ bank }));
  };
  const saveAgreements = () => {
    if (!Object.values(agree).every(Boolean)) { setErr("Please accept all agreements to finish."); return; }
    run("agreements", () => patchExtra({ agreements: agree }));
  };

  const states = basic.country ? Object.keys(COUNTRY_MAP[basic.country] || {}) : [];
  const cities = basic.country && basic.state ? (COUNTRY_MAP[basic.country]?.[basic.state] || []) : [];
  const sectionDone = sections[currentKey] === true;

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <Link href="/contributor/profile" className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Back to profile</Link>

      <div className="rounded-xl border border-stroke bg-surface p-5 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-body text-[18px] font-semibold text-foreground">{complete ? "Profile complete" : "Complete your profile"}</h1>
          <span className="font-display text-[20px] font-bold tabular-nums" style={{ color: complete ? "#0F9D6B" : pct >= 50 ? "#CA8A04" : "#D97706" }}>{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-stroke-subtle overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: complete ? "#0F9D6B" : "#CA8A04" }} /></div>
        {complete ? <Link href="/contributor/opportunities" className={cn(primaryBtn, "mt-3")}>Browse tasks <ArrowRight className="h-4 w-4" /></Link> : null}
      </div>

      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {SECTION_ORDER.map((key, i) => {
          const done = sections[key] === true;
          return (
            <button key={key} type="button" onClick={() => setStep(i)} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-body text-[11.5px] whitespace-nowrap shrink-0 transition-colors", i === step ? "bg-foreground text-surface" : done ? "text-text-tertiary hover:bg-surface-hover" : "text-text-secondary hover:bg-surface-hover")}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: i === step ? "currentColor" : "#0F9D6B" }} /> : <span className="grid place-items-center h-4 w-4 rounded-full border border-current text-[9px] font-semibold">{i + 1}</span>}
              {SECTION_LABELS[key]}
            </button>
          );
        })}
      </div>

      {err ? <p className="mb-3 font-body text-[12px] text-error-text">{err}</p> : null}

      <div className="rounded-xl border border-stroke bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-body text-[16px] font-semibold text-foreground">{SECTION_LABELS[currentKey]}</h2>
          <span className="font-body text-[11px] text-text-tertiary">· {weights[currentKey] ?? 0}%</span>
          {sectionDone ? <span className="ml-auto inline-flex items-center gap-1 font-body text-[11.5px]" style={{ color: "#0F9D6B" }}><CheckCircle2 className="h-3.5 w-3.5" /> Done</span> : null}
        </div>

        {currentKey === "basic" ? (
          <>
            <FileField text="Upload profile photo" name={basic.profilePhoto} accept=".jpg,.jpeg,.png,.webp" onPick={(n) => setBasic({ ...basic, profilePhoto: n })} />
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="First name *"><input value={basic.firstName} onChange={(e) => setBasic({ ...basic, firstName: e.target.value })} className={inputCls} placeholder="Aarav" /></Field>
              <Field label="Last name *"><input value={basic.lastName} onChange={(e) => setBasic({ ...basic, lastName: e.target.value })} className={inputCls} placeholder="Sharma" /></Field>
              <Field label="Username *"><input value={basic.username} onChange={(e) => setBasic({ ...basic, username: e.target.value })} className={inputCls} placeholder="fayaz-dev" /></Field>
              <Field label="Country *"><select value={basic.country} onChange={(e) => setBasic({ ...basic, country: e.target.value, state: "", city: "" })} className={inputCls}><option value="">Select country</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="State *"><select value={basic.state} onChange={(e) => setBasic({ ...basic, state: e.target.value, city: "" })} className={inputCls} disabled={!basic.country}><option value="">Select state</option>{states.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="City *"><select value={basic.city} onChange={(e) => setBasic({ ...basic, city: e.target.value })} className={inputCls} disabled={!basic.state}><option value="">Select city</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Pincode *"><input value={basic.pincode} onChange={(e) => setBasic({ ...basic, pincode: e.target.value })} className={inputCls} placeholder="400001" inputMode="numeric" /></Field>
              <Field label="Mobile number *"><input value={basic.mobileNumber} onChange={(e) => setBasic({ ...basic, mobileNumber: e.target.value })} className={inputCls} placeholder="+91 98765 43210" /></Field>
              <Field label="Timezone *"><select value={basic.timezone} onChange={(e) => setBasic({ ...basic, timezone: e.target.value })} className={inputCls}><option value="">Select timezone</option>{TIMEZONES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            </div>
            <Field label="Languages *"><ChipField values={languages} setValues={setLanguages} suggestions={LANGUAGES} placeholder="Search or add language + Enter" /></Field>
            <button type="button" disabled={busy === "basic"} onClick={saveBasic} className={primaryBtn}>Save basic info</button>
          </>
        ) : null}

        {currentKey === "professional" ? (
          <>
            <Field label="Professional headline *"><input value={prof.headline} onChange={(e) => setProf({ ...prof, headline: e.target.value })} className={inputCls} placeholder="Senior MERN Stack Developer" /></Field>
            <Field label="Bio *"><textarea value={prof.bio} onChange={(e) => setProf({ ...prof, bio: e.target.value })} rows={4} className={cn(inputCls, "h-auto py-2 resize-none")} placeholder="Tell clients what you build, how you work, and what makes you reliable." /></Field>
            <div className="grid sm:grid-cols-3 gap-2">
              <Field label="Years of experience *"><select value={prof.yearsExperience} onChange={(e) => setProf({ ...prof, yearsExperience: e.target.value })} className={inputCls}><option value="">Select</option>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></Field>
              <Field label="Weekly availability *"><select value={prof.weeklyHours} onChange={(e) => setProf({ ...prof, weeklyHours: e.target.value })} className={inputCls}><option value="">Select</option>{WEEKLY.map((w) => <option key={w}>{w}</option>)}</select></Field>
              <Field label="Hourly rate"><input type="number" min={0} value={prof.hourlyRate} onChange={(e) => setProf({ ...prof, hourlyRate: e.target.value })} className={inputCls} placeholder="25" /></Field>
            </div>
            <Field label="Availability *">
              <div className="flex flex-wrap gap-1.5">{AVAILABILITY.map((a) => (
                <button key={a} type="button" onClick={() => setProf({ ...prof, availability: a })} className={cn("px-3 py-1.5 rounded-lg border font-body text-[12px]", prof.availability === a ? "border-foreground bg-foreground text-surface" : "border-stroke text-foreground hover:bg-surface-hover")}>{a}</button>
              ))}</div>
            </Field>
            <button type="button" disabled={busy === "professional"} onClick={saveProf} className={primaryBtn}>Save professional details</button>
          </>
        ) : null}

        {currentKey === "skills" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Pick standardized skills. Each needs a level and years used.</p>
            {skills.length > 0 ? <div className="flex flex-wrap gap-1.5">{skills.map((s, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full border border-stroke-subtle bg-surface-hover px-2.5 py-1 font-body text-[12px] text-foreground">{String(s.name)} <span className="text-text-tertiary">· {String(s.level || "")}</span></span>)}</div> : null}
            <div className="flex flex-wrap gap-1.5">{SKILLS.filter((s) => !skills.some((x) => String(x.name).toLowerCase() === s.toLowerCase())).slice(0, 12).map((s) => <button key={s} type="button" onClick={() => setSkillDraft({ ...skillDraft, name: s })} className="inline-flex items-center gap-1 rounded-full border border-dashed border-stroke px-2.5 py-1 font-body text-[11.5px] text-text-secondary hover:bg-surface-hover"><Plus className="h-3 w-3" /> {s}</button>)}</div>
            <div className="grid sm:grid-cols-3 gap-2">
              <Field label="Skill"><input value={skillDraft.name} onChange={(e) => setSkillDraft({ ...skillDraft, name: e.target.value })} className={inputCls} placeholder="React" /></Field>
              <Field label="Level"><select value={skillDraft.level} onChange={(e) => setSkillDraft({ ...skillDraft, level: e.target.value })} className={inputCls}>{SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field>
              <Field label="Years used"><select value={skillDraft.years} onChange={(e) => setSkillDraft({ ...skillDraft, years: e.target.value })} className={inputCls}>{SKILL_YEARS.map((y) => <option key={y}>{y}</option>)}</select></Field>
            </div>
            <button type="button" disabled={busy === "skills" || !skillDraft.name.trim()} onClick={addSkill} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add skill</button>
          </>
        ) : null}

        {currentKey === "expertise" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Select the domains you work in. GitHub becomes required for technical categories.</p>
            <div className="flex flex-wrap gap-1.5">{EXPERTISE.map((x) => { const on = expertise.includes(x); return (
              <button key={x} type="button" disabled={busy === "expertise"} onClick={() => saveExpertise(on ? expertise.filter((e) => e !== x) : [...expertise, x])} className={cn("inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 font-body text-[12px] disabled:opacity-50", on ? "border-foreground bg-foreground text-surface" : "border-stroke text-foreground hover:bg-surface-hover")}>{on ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {x}</button>
            ); })}</div>
          </>
        ) : null}

        {currentKey === "portfolio" ? (
          <>
            {projects.length > 0 ? <ul className="space-y-1">{projects.map((p, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(p.title)}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="Project name *"><input value={projDraft.name} onChange={(e) => setProjDraft({ ...projDraft, name: e.target.value })} className={inputCls} placeholder="Bus Booking System" /></Field>
              <Field label="Category *"><select value={projDraft.category} onChange={(e) => setProjDraft({ ...projDraft, category: e.target.value })} className={inputCls}><option value="">Select category</option>{PROJECT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            </div>
            <Field label="Description *"><textarea value={projDraft.description} onChange={(e) => setProjDraft({ ...projDraft, description: e.target.value })} rows={3} className={cn(inputCls, "h-auto py-2 resize-none")} placeholder="What problem does this project solve?" /></Field>
            <Field label="Skills used * (technology)"><ChipField values={projSkills} setValues={setProjSkills} suggestions={SKILLS} placeholder="Add a skill + Enter — React, Node.js…" /></Field>
            <Field label="Keywords * (features)"><ChipField values={projKeywords} setValues={setProjKeywords} suggestions={KEYWORDS} placeholder="Add a keyword + Enter — Authentication, Payments…" /></Field>
            <div className="grid sm:grid-cols-3 gap-2">
              <Field label="GitHub URL"><input value={projDraft.github} onChange={(e) => setProjDraft({ ...projDraft, github: e.target.value })} className={inputCls} placeholder="https://github.com/…" /></Field>
              <Field label="Live URL"><input value={projDraft.live} onChange={(e) => setProjDraft({ ...projDraft, live: e.target.value })} className={inputCls} placeholder="https://…" /></Field>
              <Field label="Video URL"><input value={projDraft.video} onChange={(e) => setProjDraft({ ...projDraft, video: e.target.value })} className={inputCls} placeholder="https://…" /></Field>
            </div>
            <FileField text="Attach screenshots" name={projDraft.screenshots} accept=".jpg,.jpeg,.png,.webp" multiple onPick={(n) => setProjDraft({ ...projDraft, screenshots: n })} />
            <button type="button" disabled={busy === "portfolio" || !projDraft.name.trim()} onClick={addProject} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add project</button>
          </>
        ) : null}

        {currentKey === "experience" ? (
          <>
            {experience.length > 0 ? <ul className="space-y-1">{experience.map((x, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.role)} · {String(x.organization)}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="Organization *"><input value={expDraft.organization} onChange={(e) => setExpDraft({ ...expDraft, organization: e.target.value })} className={inputCls} placeholder="Glimmora Labs" /></Field>
              <Field label="Role *"><input value={expDraft.role} onChange={(e) => setExpDraft({ ...expDraft, role: e.target.value })} className={inputCls} placeholder="Frontend Developer" /></Field>
              <Field label="Employment type *"><select value={expDraft.employmentType} onChange={(e) => setExpDraft({ ...expDraft, employmentType: e.target.value })} className={inputCls}>{EMPLOYMENT.map((k) => <option key={k}>{k}</option>)}</select></Field>
              <div />
              <Field label="Start date *"><input type="date" value={expDraft.startDate} onChange={(e) => setExpDraft({ ...expDraft, startDate: e.target.value })} className={inputCls} /></Field>
              <Field label="End date"><input type="date" value={expDraft.endDate} onChange={(e) => setExpDraft({ ...expDraft, endDate: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Description *"><textarea value={expDraft.description} onChange={(e) => setExpDraft({ ...expDraft, description: e.target.value })} rows={3} className={cn(inputCls, "h-auto py-2 resize-none")} placeholder="Responsibilities, impact, and technologies." /></Field>
            <button type="button" disabled={busy === "experience" || !expDraft.organization.trim() || !expDraft.role.trim()} onClick={addExp} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add experience</button>
          </>
        ) : null}

        {currentKey === "education" ? (
          <>
            {education.length > 0 ? <ul className="space-y-1">{education.map((x, i) => <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.degree || "")} {String(x.field || "")} · {String(x.institution)}</li>)}</ul> : null}
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="Institution *"><input value={eduDraft.institution} onChange={(e) => setEduDraft({ ...eduDraft, institution: e.target.value })} className={inputCls} placeholder="ABC University" /></Field>
              <Field label="Degree *"><select value={eduDraft.degree} onChange={(e) => setEduDraft({ ...eduDraft, degree: e.target.value })} className={inputCls}><option value="">Select degree</option>{DEGREES.map((d) => <option key={d}>{d}</option>)}</select></Field>
              <Field label="Specialization *"><select value={eduDraft.specialization} onChange={(e) => setEduDraft({ ...eduDraft, specialization: e.target.value })} className={inputCls}><option value="">Select specialization</option>{SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="CGPA / grade"><input value={eduDraft.grade} onChange={(e) => setEduDraft({ ...eduDraft, grade: e.target.value })} className={inputCls} placeholder="8.2 CGPA" /></Field>
              <Field label="Start year"><input type="number" value={eduDraft.startYear} onChange={(e) => setEduDraft({ ...eduDraft, startYear: e.target.value })} className={inputCls} placeholder="2020" /></Field>
              <Field label="End year"><input type="number" value={eduDraft.endYear} onChange={(e) => setEduDraft({ ...eduDraft, endYear: e.target.value })} className={inputCls} placeholder="2024" /></Field>
            </div>
            <button type="button" disabled={busy === "education" || !eduDraft.institution.trim()} onClick={addEdu} className={primaryBtn}><Plus className="h-3.5 w-3.5" /> Add education</button>
          </>
        ) : null}

        {currentKey === "verification" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Add proof links, ID verification, resume, and preferences.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="LinkedIn profile *"><input value={links.linkedin} onChange={(e) => setLinks({ ...links, linkedin: e.target.value })} className={inputCls} placeholder="https://linkedin.com/in/…" /></Field>
              <Field label={`GitHub profile${githubRequired ? " *" : ""}`}><input value={links.github} onChange={(e) => setLinks({ ...links, github: e.target.value })} className={inputCls} placeholder="https://github.com/…" /></Field>
              <Field label="Portfolio website"><input value={links.portfolio} onChange={(e) => setLinks({ ...links, portfolio: e.target.value })} className={inputCls} placeholder="https://…" /></Field>
              <Field label="Behance / Dribbble / Kaggle / Medium"><input value={links.proofUrl} onChange={(e) => setLinks({ ...links, proofUrl: e.target.value })} className={inputCls} placeholder="https://…" /></Field>
              <Field label="Government ID type *"><select value={verif.idType} onChange={(e) => setVerif({ ...verif, idType: e.target.value })} className={inputCls}><option value="">Select</option>{ID_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="ID number *"><input value={verif.idNumber} onChange={(e) => setVerif({ ...verif, idNumber: e.target.value })} className={inputCls} placeholder={verif.idType === "Aadhaar Card" ? "12 digits" : verif.idType === "PAN Card" ? "ABCDE1234F" : "Enter ID number"} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <FileField text="Upload ID document *" name={verif.idDocument} accept=".pdf,.jpg,.jpeg,.png" onPick={(n) => setVerif({ ...verif, idDocument: n })} />
              <FileField text="Upload resume" name={resume} accept=".pdf,.doc,.docx" onPick={setResume} />
            </div>
            <Field label="Project preferences">
              <div className="flex flex-wrap gap-1.5">{PREFERENCES.map((p) => { const on = preferences.includes(p); return (
                <button key={p} type="button" onClick={() => setPreferences(on ? preferences.filter((x) => x !== p) : [...preferences, p])} className={cn("px-2.5 py-1 rounded-full border font-body text-[11.5px]", on ? "border-foreground bg-foreground text-surface" : "border-stroke text-foreground hover:bg-surface-hover")}>{p}</button>
              ); })}</div>
            </Field>
            <button type="button" disabled={busy === "verification"} onClick={saveVerif} className={primaryBtn}>Save verification &amp; links</button>
          </>
        ) : null}

        {currentKey === "bank" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Needed before paid work can be released. Stored securely.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="Account holder name *"><input value={bank.accountHolderName} onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })} className={inputCls} placeholder="Aarav Sharma" /></Field>
              <Field label="Bank name *"><input value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} className={inputCls} placeholder="HDFC Bank" /></Field>
              <Field label="Account number *"><input value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} className={inputCls} placeholder="123456789012" inputMode="numeric" /></Field>
              <Field label="Confirm account number *"><input value={bank.confirmAccountNumber} onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value })} className={inputCls} placeholder="Re-enter account number" inputMode="numeric" /></Field>
              <Field label="IFSC code *"><input value={bank.ifscCode} onChange={(e) => setBank({ ...bank, ifscCode: e.target.value })} className={inputCls} placeholder="HDFC0001234" maxLength={11} /></Field>
              <Field label="Account type *"><select value={bank.accountType} onChange={(e) => setBank({ ...bank, accountType: e.target.value })} className={inputCls}><option value="">Select account type</option>{ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="UPI ID"><input value={bank.upiId} onChange={(e) => setBank({ ...bank, upiId: e.target.value })} className={inputCls} placeholder="name@upi" /></Field>
            </div>
            <button type="button" disabled={busy === "bank"} onClick={saveBank} className={primaryBtn}>Save bank details</button>
          </>
        ) : null}

        {currentKey === "agreements" ? (
          <>
            <p className="font-body text-[11.5px] text-text-tertiary">Confirm the contributor terms, payment, privacy and notification policies before finishing.</p>
            {([
              ["termsAccepted", "I agree to Glimmora contributor terms and conditions."],
              ["paymentPolicyAccepted", "I accept the payment, payout, refund, and dispute policies."],
              ["privacyPolicyAccepted", "I agree to the privacy policy and consent to secure profile verification."],
              ["notificationConsent", "I agree to receive work, payment, verification, and account notifications."],
              ["truthDeclaration", "I confirm that all profile, portfolio, identity, and bank details are correct."],
            ] as const).map(([k, text]) => (
              <label key={k} className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agree[k]} onChange={(e) => setAgree({ ...agree, [k]: e.target.checked })} className="mt-0.5 h-3.5 w-3.5 rounded accent-brand" />
                <span className="font-body text-[12.5px] text-foreground">{text}</span>
              </label>
            ))}
            <button type="button" disabled={busy === "agreements"} onClick={saveAgreements} className={primaryBtn}>Save agreements</button>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-stroke font-body text-[12.5px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Back</button>
        <span className="font-body text-[12px] text-text-tertiary">Step {step + 1} of {SECTION_ORDER.length}</span>
        {step < lastStep ? (
          <button type="button" onClick={() => setStep((s) => Math.min(lastStep, s + 1))} className={primaryBtn}>Next <ArrowRight className="h-4 w-4" /></button>
        ) : complete ? (
          <Link href="/contributor/opportunities" className={primaryBtn}>Finish <ArrowRight className="h-4 w-4" /></Link>
        ) : (
          <span className="font-body text-[12px] text-text-tertiary">Reach 100% to finish</span>
        )}
      </div>
    </div>
  );
}
