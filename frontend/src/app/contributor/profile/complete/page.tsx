"use client";

/**
 * Profile completion flow — contributor-umbrella personas (freelancer, student,
 * internal, women) must fill every section to 100% before the dashboard
 * unlocks (hard gate enforced in the contributor layout). Themed to match the
 * home/portal palette (warm brown / gold / beige).
 *
 * Sections: Basics · Skills · Expertise · Projects · Experience · Education.
 */

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2, CheckCircle2, Circle, Plus, Trash2, AlertCircle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  fetchProfileCompletion, listProjects, addProject, deleteProject,
  listExperience, addExperience, deleteExperience,
  listEducation, addEducation, deleteEducation, updateExpertise,
  type ProfileCompletion, type ProfileProject, type ProfileExperience, type ProfileEducation,
} from "@/lib/api/contributor";

const SECTION_LABELS: Record<string, string> = {
  basics: "Basics", skills: "Skills", expertise: "Expertise",
  projects: "Projects", experience: "Experience", education: "Education",
};

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => { const t = draft.trim(); if (t && !value.includes(t)) onChange([...value, t]); setDraft(""); };
  return (
    <div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-lg border border-beige-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brown-400" />
        <button type="button" onClick={add} className="rounded-lg bg-brown-100 px-3 text-sm font-medium text-brown-800 hover:bg-brown-200">Add</button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-brown-800">
              {t}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-brown-500 hover:text-red-600">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const cardCls = "rounded-2xl border border-beige-200 bg-white p-6 shadow-sm";
const inputCls = "flex h-10 w-full rounded-lg border border-beige-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brown-400";
const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-60";

export default function ProfileCompletePage() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const router = useRouter();

  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [projects, setProjects] = useState<ProfileProject[]>([]);
  const [experience, setExperience] = useState<ProfileExperience[]>([]);
  const [education, setEducation] = useState<ProfileEducation[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [c, p, x, e] = await Promise.all([
        fetchProfileCompletion(token), listProjects(token), listExperience(token), listEducation(token),
      ]);
      setCompletion(c); setProjects(p); setExperience(x); setEducation(e);
    } catch {
      setError("Couldn't load your profile. Please retry.");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brown-500" /></div>;
  }

  const pct = completion?.completeness ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header + progress */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brown-500">
          <Sparkles className="h-4 w-4 text-gold-600" /> Complete your profile
        </div>
        <h1 className="font-heading text-3xl font-bold text-brown-950">A few details unlock your dashboard</h1>
        <p className="text-sm text-beige-600">Add your skills, projects, experience and education. Your dashboard opens at 100%.</p>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-brown-800">{pct}% complete</span>
            {completion?.complete && (
              <button onClick={() => router.push("/contributor/dashboard")} className={btnPrimary}>Go to dashboard →</button>
            )}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-beige-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#6b4a22,#a47b2e)] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {completion && Object.entries(completion.sections).map(([k, done]) => (
              <span key={k} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                done ? "bg-forest-50 text-forest-700" : "bg-beige-100 text-beige-600")}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {SECTION_LABELS[k] ?? k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <ExpertiseSection token={token} value={expertise} setValue={setExpertise} onSaved={refresh} />
      <ProjectsSection token={token} items={projects} onChanged={refresh} />
      <ExperienceSection token={token} items={experience} onChanged={refresh} />
      <EducationSection token={token} items={education} onChanged={refresh} />

      <p className="text-center text-xs text-beige-500">
        Basics &amp; Skills are completed in your{" "}
        <a href="/contributor/profile/edit" className="text-brown-700 underline">profile settings</a>.
      </p>
    </div>
  );
}

function ExpertiseSection({ token, value, setValue, onSaved }: { token: string; value: string[]; setValue: (v: string[]) => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); try { await updateExpertise(token, value); onSaved(); } finally { setBusy(false); } };
  return (
    <section className={cardCls}>
      <h2 className="mb-1 text-lg font-semibold text-brown-900">Areas of expertise</h2>
      <p className="mb-4 text-sm text-beige-600">The domains you know best — e.g. Frontend, Data Analysis, UX Research.</p>
      <TagInput value={value} onChange={setValue} placeholder="Type an area and press Enter" />
      <div className="mt-4"><button onClick={save} disabled={busy} className={btnPrimary}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save expertise"}</button></div>
    </section>
  );
}

function ProjectsSection({ token, items, onChanged }: { token: string; items: ProfileProject[]; onChanged: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", role: "", url: "" });
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try { await addProject(token, form); setForm({ title: "", description: "", role: "", url: "" }); onChanged(); } finally { setBusy(false); }
  };
  return (
    <section className={cardCls}>
      <h2 className="mb-1 text-lg font-semibold text-brown-900">Projects</h2>
      <p className="mb-4 text-sm text-beige-600">Portfolio work you&apos;re proud of.</p>
      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((p) => (
            <li key={p.id} className="flex items-start justify-between rounded-lg bg-beige-50 p-3">
              <div><p className="font-medium text-brown-900">{p.title}</p><p className="text-xs text-beige-600">{p.role} · {p.description}</p></div>
              <button onClick={async () => { await deleteProject(token, p.id); onChanged(); }} className="text-beige-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Project title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className={inputCls} placeholder="Your role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <input className={cn(inputCls, "col-span-2")} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className={cn(inputCls, "col-span-2")} placeholder="Link (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
      </div>
      <div className="mt-4"><button onClick={add} disabled={busy} className={btnPrimary}><Plus className="h-4 w-4" /> Add project</button></div>
    </section>
  );
}

function ExperienceSection({ token, items, onChanged }: { token: string; items: ProfileExperience[]; onChanged: () => void }) {
  const [form, setForm] = useState({ kind: "internship", organization: "", role: "", description: "" });
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!form.organization.trim() || !form.role.trim()) return;
    setBusy(true);
    try { await addExperience(token, form); setForm({ kind: "internship", organization: "", role: "", description: "" }); onChanged(); } finally { setBusy(false); }
  };
  return (
    <section className={cardCls}>
      <h2 className="mb-1 text-lg font-semibold text-brown-900">Experience &amp; internships</h2>
      <p className="mb-4 text-sm text-beige-600">Roles, internships, or volunteer work.</p>
      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((x) => (
            <li key={x.id} className="flex items-start justify-between rounded-lg bg-beige-50 p-3">
              <div><p className="font-medium text-brown-900">{x.role} · {x.organization}</p><p className="text-xs text-beige-600 capitalize">{x.kind}{x.description ? ` · ${x.description}` : ""}</p></div>
              <button onClick={async () => { await deleteExperience(token, x.id); onChanged(); }} className="text-beige-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-3">
        <select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          <option value="internship">Internship</option><option value="job">Job</option><option value="volunteer">Volunteer</option>
        </select>
        <input className={inputCls} placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
        <input className={inputCls} placeholder="Role / title" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <input className={inputCls} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="mt-4"><button onClick={add} disabled={busy} className={btnPrimary}><Plus className="h-4 w-4" /> Add experience</button></div>
    </section>
  );
}

function EducationSection({ token, items, onChanged }: { token: string; items: ProfileEducation[]; onChanged: () => void }) {
  const [form, setForm] = useState({ institution: "", degree: "", field: "", end_year: "" });
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!form.institution.trim()) return;
    setBusy(true);
    try { await addEducation(token, form); setForm({ institution: "", degree: "", field: "", end_year: "" }); onChanged(); } finally { setBusy(false); }
  };
  return (
    <section className={cardCls}>
      <h2 className="mb-1 text-lg font-semibold text-brown-900">Education</h2>
      <p className="mb-4 text-sm text-beige-600">Your academic background.</p>
      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((ed) => (
            <li key={ed.id} className="flex items-start justify-between rounded-lg bg-beige-50 p-3">
              <div><p className="font-medium text-brown-900">{ed.degree} {ed.field}</p><p className="text-xs text-beige-600">{ed.institution}{ed.end_year ? ` · ${ed.end_year}` : ""}</p></div>
              <button onClick={async () => { await deleteEducation(token, ed.id); onChanged(); }} className="text-beige-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input className={cn(inputCls, "col-span-2")} placeholder="Institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
        <input className={inputCls} placeholder="Degree (e.g. B.Tech)" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
        <input className={inputCls} placeholder="Field of study" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} />
        <input className={inputCls} placeholder="End year" value={form.end_year} onChange={(e) => setForm({ ...form, end_year: e.target.value })} />
      </div>
      <div className="mt-4"><button onClick={add} disabled={busy} className={btnPrimary}><Plus className="h-4 w-4" /> Add education</button></div>
    </section>
  );
}
