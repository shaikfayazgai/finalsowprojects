"use client";

/**
 * Complete your profile — the self-serve page that lets a freelancer fill the
 * four gating sections (expertise, portfolio projects, work experience,
 * education) so their profile reaches 100% and the public task marketplace
 * unlocks. The circular ring tracks progress live; each section flips to ✓ as
 * it's filled. Backed by the freelancer CRUD endpoints under /profile/*.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Plus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileCompletionRing } from "@/components/contributor/profile-completion-ring";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";

type Row = Record<string, unknown>;

async function getJson(url: string): Promise<Row[]> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}
async function send(url: string, body: unknown, method = "POST"): Promise<void> {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { detail?: string };
    throw new Error(j.detail || "Could not save — please try again.");
  }
}

const EXPERTISE_SUGGESTIONS = [
  "Frontend Development", "Backend Development", "Full-Stack", "Mobile Development",
  "UI/UX Design", "Data Science", "AI / ML", "DevOps", "QA / Testing", "Cloud",
];

const inputCls =
  "w-full h-9 rounded-lg border border-stroke-subtle bg-surface px-3 font-body text-[12.5px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30";

function SectionShell({
  title, done, hint, children,
}: { title: string; done: boolean; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stroke bg-surface p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        {done ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={2} style={{ color: "#0F9D6B" }} aria-hidden />
        ) : (
          <Circle className="h-5 w-5 shrink-0 mt-0.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        )}
        <div className="min-w-0">
          <h2 className="font-body text-[14.5px] font-semibold text-foreground">{title}</h2>
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

  const [expertise, setExpertise] = React.useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = React.useState("");
  const [projects, setProjects] = React.useState<Row[]>([]);
  const [experience, setExperience] = React.useState<Row[]>([]);
  const [education, setEducation] = React.useState<Row[]>([]);

  const [projDraft, setProjDraft] = React.useState({ title: "", description: "", skills: "" });
  const [expDraft, setExpDraft] = React.useState({ organization: "", role: "", kind: "job" });
  const [eduDraft, setEduDraft] = React.useState({ institution: "", degree: "", field: "" });

  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState("");

  const refreshCompletion = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["contributor", "profile", "completion"] });
  }, [qc]);

  const reload = React.useCallback(async () => {
    const [pj, ex, ed] = await Promise.all([
      getJson("/api/contributor/profile/projects"),
      getJson("/api/contributor/profile/experience"),
      getJson("/api/contributor/profile/education"),
    ]);
    setProjects(pj); setExperience(ex); setEducation(ed);
    refreshCompletion();
  }, [refreshCompletion]);
  React.useEffect(() => { reload(); }, [reload]);

  const saveExpertise = async (next: string[]) => {
    setBusy("expertise"); setErr("");
    try {
      await send("/api/contributor/profile/expertise", { expertise_areas: next }, "PATCH");
      setExpertise(next);
      refreshCompletion();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };
  const addExpertise = (val: string) => {
    const v = val.trim();
    if (!v || expertise.includes(v)) return;
    saveExpertise([...expertise, v]);
    setExpertiseInput("");
  };

  const addProject = async () => {
    if (!projDraft.title.trim()) return;
    setBusy("projects"); setErr("");
    try {
      await send("/api/contributor/profile/projects", {
        title: projDraft.title.trim(),
        description: projDraft.description.trim(),
        skills: projDraft.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setProjDraft({ title: "", description: "", skills: "" });
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  const addExperience = async () => {
    if (!expDraft.organization.trim() || !expDraft.role.trim()) return;
    setBusy("experience"); setErr("");
    try {
      await send("/api/contributor/profile/experience", {
        organization: expDraft.organization.trim(), role: expDraft.role.trim(), kind: expDraft.kind,
      });
      setExpDraft({ organization: "", role: "", kind: "job" });
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  const addEducation = async () => {
    if (!eduDraft.institution.trim()) return;
    setBusy("education"); setErr("");
    try {
      await send("/api/contributor/profile/education", {
        institution: eduDraft.institution.trim(), degree: eduDraft.degree.trim(), field: eduDraft.field.trim(),
      });
      setEduDraft({ institution: "", degree: "", field: "" });
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  const pct = completion?.completeness ?? 0;
  const complete = completion?.complete ?? false;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      <Link href="/contributor/profile" className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      {/* Header + ring */}
      <div className="rounded-xl border border-stroke bg-surface p-5 flex items-center gap-5">
        <ProfileCompletionRing value={pct} size={104} stroke={9} />
        <div className="flex-1 min-w-0">
          <h1 className="font-body text-[18px] font-semibold text-foreground tracking-[-0.01em]">
            {complete ? "Your profile is complete" : "Complete your profile"}
          </h1>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            {complete
              ? "You're eligible to view and pick up public tasks."
              : "Fill the four sections below to reach 100% and unlock public tasks."}
          </p>
          {complete ? (
            <Link href="/contributor/opportunities" className="mt-3 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-foreground text-surface font-body text-[12.5px] font-semibold hover:opacity-90">
              Browse tasks <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {err ? <p className="font-body text-[12px] text-error-text">{err}</p> : null}

      {/* 1. Expertise areas */}
      <SectionShell title="Expertise areas" done={sections.expertise === true} hint="The domains you work in — pick from the list or add your own.">
        <div className="flex flex-wrap gap-1.5">
          {expertise.map((x) => (
            <span key={x} className="inline-flex items-center gap-1 rounded-full border border-stroke-subtle bg-surface-hover px-2.5 py-1 font-body text-[12px] text-foreground">
              {x}
              <button type="button" onClick={() => saveExpertise(expertise.filter((e) => e !== x))} className="text-text-tertiary hover:text-foreground" aria-label={`Remove ${x}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {expertise.length === 0 ? <span className="font-body text-[12px] text-text-tertiary">None added yet.</span> : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXPERTISE_SUGGESTIONS.filter((s) => !expertise.includes(s)).map((s) => (
            <button key={s} type="button" disabled={busy === "expertise"} onClick={() => addExpertise(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-stroke px-2.5 py-1 font-body text-[11.5px] text-text-secondary hover:bg-surface-hover disabled:opacity-50">
              <Plus className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExpertise(expertiseInput); } }}
            placeholder="Add a custom area + Enter" className={inputCls} />
          <button type="button" disabled={busy === "expertise" || !expertiseInput.trim()} onClick={() => addExpertise(expertiseInput)}
            className="h-9 px-3.5 rounded-lg bg-foreground text-surface font-body text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 shrink-0">Add</button>
        </div>
      </SectionShell>

      {/* 2. Portfolio projects */}
      <SectionShell title="Portfolio projects" done={sections.projects === true} hint="Projects you've built — at least one is required.">
        {projects.length > 0 ? (
          <ul className="space-y-1.5">
            {projects.map((p, i) => (
              <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(p.title || "Project")}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={projDraft.title} onChange={(e) => setProjDraft({ ...projDraft, title: e.target.value })} placeholder="Project title *" className={inputCls} />
          <input value={projDraft.skills} onChange={(e) => setProjDraft({ ...projDraft, skills: e.target.value })} placeholder="Skills (comma separated)" className={inputCls} />
          <input value={projDraft.description} onChange={(e) => setProjDraft({ ...projDraft, description: e.target.value })} placeholder="Short description" className={`${inputCls} sm:col-span-2`} />
        </div>
        <button type="button" disabled={busy === "projects" || !projDraft.title.trim()} onClick={addProject}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-surface font-body text-[12px] font-semibold hover:opacity-90 disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" /> Add project
        </button>
      </SectionShell>

      {/* 3. Work experience */}
      <SectionShell title="Work experience" done={sections.experience === true} hint="Roles, internships or freelance work — at least one is required.">
        {experience.length > 0 ? (
          <ul className="space-y-1.5">
            {experience.map((x, i) => (
              <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.role || "Role")} · {String(x.organization || "")}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={expDraft.organization} onChange={(e) => setExpDraft({ ...expDraft, organization: e.target.value })} placeholder="Organization *" className={inputCls} />
          <input value={expDraft.role} onChange={(e) => setExpDraft({ ...expDraft, role: e.target.value })} placeholder="Role *" className={inputCls} />
          <select value={expDraft.kind} onChange={(e) => setExpDraft({ ...expDraft, kind: e.target.value })} className={inputCls}>
            <option value="job">Job</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </div>
        <button type="button" disabled={busy === "experience" || !expDraft.organization.trim() || !expDraft.role.trim()} onClick={addExperience}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-surface font-body text-[12px] font-semibold hover:opacity-90 disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" /> Add experience
        </button>
      </SectionShell>

      {/* 4. Education */}
      <SectionShell title="Education" done={sections.education === true} hint="Your degree or qualification — at least one is required.">
        {education.length > 0 ? (
          <ul className="space-y-1.5">
            {education.map((x, i) => (
              <li key={i} className="font-body text-[12.5px] text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#0F9D6B" }} /> {String(x.degree || "")} {String(x.field || "")} · {String(x.institution || "")}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={eduDraft.institution} onChange={(e) => setEduDraft({ ...eduDraft, institution: e.target.value })} placeholder="Institution *" className={inputCls} />
          <input value={eduDraft.degree} onChange={(e) => setEduDraft({ ...eduDraft, degree: e.target.value })} placeholder="Degree (e.g. B.Tech)" className={inputCls} />
          <input value={eduDraft.field} onChange={(e) => setEduDraft({ ...eduDraft, field: e.target.value })} placeholder="Field (e.g. CSE)" className={inputCls} />
        </div>
        <button type="button" disabled={busy === "education" || !eduDraft.institution.trim()} onClick={addEducation}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-surface font-body text-[12px] font-semibold hover:opacity-90 disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" /> Add education
        </button>
      </SectionShell>
    </div>
  );
}
