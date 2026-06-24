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
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Plus, Upload, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileCompletion, SECTION_LABELS } from "@/lib/hooks/use-profile-completion";
import { handleAuthTokenError } from "@/lib/auth/token-expiry";
import { cn } from "@/lib/utils/cn";

type Row = Record<string, unknown>;

const SECTION_ORDER = ["basic", "professional", "skills", "expertise", "portfolio", "experience", "education", "verification", "bank", "agreements"] as const;

// Fallback IANA zones if Intl.supportedValuesOf is unavailable (older browsers).
const TIMEZONES_FALLBACK = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles", "Australia/Sydney", "UTC"];
/** Full IANA timezone list from the browser (Intl.supportedValuesOf), with a
 * static fallback. No external API needed — these are standard built-in values. */
function getTimezones(): string[] {
  try {
    const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (typeof sv === "function") { const z = sv("timeZone"); if (Array.isArray(z) && z.length) return z; }
  } catch { /* fall through */ }
  return TIMEZONES_FALLBACK;
}
/** The user's detected IANA zone, e.g. "Asia/Kolkata" (best-effort). */
function detectedTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; }
}

type DialCode = { country: string; dialCode: string; flag: string; cca2: string };
// Minimal fallback if restcountries.com is unreachable — keeps the form usable.
const DIAL_CODES_FALLBACK: DialCode[] = [
  { country: "India", dialCode: "+91", flag: "🇮🇳", cca2: "IN" },
  { country: "United States", dialCode: "+1", flag: "🇺🇸", cca2: "US" },
  { country: "United Kingdom", dialCode: "+44", flag: "🇬🇧", cca2: "GB" },
  { country: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", cca2: "AE" },
  { country: "Singapore", dialCode: "+65", flag: "🇸🇬", cca2: "SG" },
  { country: "Australia", dialCode: "+61", flag: "🇦🇺", cca2: "AU" },
  { country: "Canada", dialCode: "+1", flag: "🇨🇦", cca2: "CA" },
  { country: "Germany", dialCode: "+49", flag: "🇩🇪", cca2: "DE" },
];
/** Build a sorted dialing-code list from restcountries.com (GET, no auth).
 * Returns the fallback list on any failure so the form never breaks. */
async function fetchDialCodes(signal?: AbortSignal): Promise<DialCode[]> {
  try {
    const r = await fetch("https://restcountries.com/v3.1/all?fields=name,idd,cca2,flag", { signal });
    if (!r.ok) return DIAL_CODES_FALLBACK;
    const data = (await r.json()) as Array<{ name?: { common?: string }; idd?: { root?: string; suffixes?: string[] }; cca2?: string; flag?: string }>;
    const out: DialCode[] = [];
    for (const c of Array.isArray(data) ? data : []) {
      const root = c.idd?.root;
      if (!root) continue;
      const suffixes = c.idd?.suffixes && c.idd.suffixes.length ? c.idd.suffixes : [""];
      // Most countries have one dialing code (root + first suffix). Skip multi-suffix
      // sprawl (e.g. +1 with 30 area suffixes) by taking only the first.
      const dialCode = `${root}${suffixes[0] || ""}`;
      out.push({ country: c.name?.common || c.cca2 || "", dialCode, flag: c.flag || "", cca2: c.cca2 || "" });
    }
    out.sort((a, b) => a.country.localeCompare(b.country));
    return out.length ? out : DIAL_CODES_FALLBACK;
  } catch { return DIAL_CODES_FALLBACK; }
}
// Split a stored mobile ("+91 9876543210") into { dialCode, number } best-effort.
function splitMobile(saved: string, codes: DialCode[]): { dialCode: string; number: string } {
  const v = (saved || "").trim();
  if (!v) return { dialCode: "+91", number: "" };
  // Longest matching dial code wins (so +971 beats +9).
  const match = codes.filter((c) => v.replace(/\s/g, "").startsWith(c.dialCode))
    .sort((a, b) => b.dialCode.length - a.dialCode.length)[0];
  if (match) return { dialCode: match.dialCode, number: v.replace(/\s/g, "").slice(match.dialCode.length) };
  if (v.startsWith("+")) { const m = v.match(/^(\+\d{1,4})\s?(.*)$/); if (m) return { dialCode: m[1], number: m[2].replace(/\s/g, "") }; }
  return { dialCode: "+91", number: v.replace(/\s/g, "") };
}
const YEARS = ["Fresher", "0-1 Years", "1-3 Years", "3-5 Years", "5-8 Years", "8+ Years"];
const WEEKLY = ["10 Hours", "20 Hours", "30 Hours", "40 Hours", "Flexible"];
const AVAILABILITY = ["Full Time", "Part Time", "Weekends", "Flexible"];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const SKILL_YEARS = ["0-6 Months", "6-12 Months", "1 Year", "2 Years", "3 Years", "4 Years", "5+ Years"];
const LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam"];
const SKILLS = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Dart", "Scala", "R", "MATLAB", "Perl", "Objective-C", "Elixir", "Haskell", "Lua", "Solidity", "Julia", "Groovy", "Clojure", "Erlang", "Bash", "PowerShell", "SQL", "GraphQL", "Assembly", "VB.NET",
  // Frontend
  "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte", "SvelteKit", "SolidJS", "Astro", "Remix", "Redux", "Zustand", "MobX", "React Query", "RxJS", "jQuery", "HTML", "CSS", "Sass", "Less", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", "Ant Design", "styled-components", "Three.js", "D3.js", "Framer Motion", "Storybook", "Webpack", "Vite", "Babel", "ESLint",
  // Backend
  "Node.js", "Express", "NestJS", "Fastify", "Koa", "Django", "Flask", "FastAPI", "Spring Boot", "Spring", "Laravel", "Ruby on Rails", "ASP.NET Core", ".NET", "Gin", "Fiber", "Phoenix", "Symfony", "Apollo", "gRPC", "REST API", "WebSockets", "Socket.IO", "Prisma", "Sequelize", "TypeORM", "Hibernate", "SQLAlchemy",
  // Databases
  "MongoDB", "PostgreSQL", "MySQL", "MariaDB", "SQLite", "Redis", "Cassandra", "DynamoDB", "Firebase", "Firestore", "Supabase", "Elasticsearch", "Neo4j", "CouchDB", "Oracle", "SQL Server", "Snowflake", "BigQuery", "InfluxDB",
  // Mobile
  "React Native", "Flutter", "SwiftUI", "Jetpack Compose", "Android", "iOS", "Ionic", "Xamarin", "Expo",
  // AI / ML / Data
  "TensorFlow", "PyTorch", "Keras", "scikit-learn", "Pandas", "NumPy", "Matplotlib", "OpenCV", "Hugging Face", "LangChain", "OpenAI API", "spaCy", "NLTK", "XGBoost", "Apache Spark", "Hadoop", "Apache Kafka", "Airflow", "Tableau", "Power BI", "Jupyter", "NLP", "Computer Vision", "Deep Learning", "Machine Learning", "Data Analysis",
  // Cloud / DevOps
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Helm", "Prometheus", "Grafana", "Nginx", "Apache", "Linux", "Serverless", "AWS Lambda", "Amazon S3", "Amazon EC2", "CloudFormation", "ArgoCD", "Vault",
  // Tools / Platforms
  "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Figma", "Adobe XD", "Sketch", "Postman", "Swagger", "VS Code", "Notion", "OAuth", "JWT", "Stripe", "Razorpay", "Twilio", "SendGrid", "WebRTC", "Electron", "Tauri", "Unity", "Unreal Engine", "Blender", "WordPress", "Shopify", "Salesforce", "SAP", "Webflow",
  // Security
  "Penetration Testing", "Burp Suite", "Metasploit", "Wireshark", "Nmap", "Kali Linux", "OWASP", "Cryptography", "Ethical Hacking", "SIEM",
  // Blockchain
  "Ethereum", "Web3.js", "Ethers.js", "Hardhat", "Truffle", "Smart Contracts", "Solana",
  // Design
  "UI Design", "UX Design", "Wireframing", "Prototyping", "Photoshop", "Illustrator", "After Effects", "Canva",
];
const KEYWORDS = [
  // Auth & identity
  "Authentication", "Authorization", "JWT", "OAuth", "SSO", "RBAC", "Two-Factor Authentication", "Multi-Factor Authentication", "Session Management", "Password Reset", "Social Login", "Biometric Authentication", "KYC", "Identity Verification",
  // Payments
  "Payments", "Payment Gateway", "Subscriptions", "Billing", "Invoicing", "Wallet", "Refunds", "Checkout", "UPI", "Escrow", "Payouts", "Recurring Billing",
  // Dashboard & analytics
  "Dashboard", "Admin Panel", "Analytics", "Reporting", "Data Visualization", "Charts", "KPIs", "Audit Logs", "Activity Feed",
  // Communication
  "Chat", "Real-time Messaging", "Notifications", "Push Notifications", "Email", "SMS", "Video Call", "Voice Call", "Comments", "Live Streaming", "Forums",
  // Commerce
  "E-commerce", "Shopping Cart", "Product Catalog", "Order Management", "Inventory", "Wishlist", "Reviews & Ratings", "Coupons", "Search & Filter", "Recommendations", "Returns",
  // Business domains
  "CRM", "ERP", "HRMS", "LMS", "CMS", "POS", "Supply Chain", "Booking", "Scheduling", "Appointments", "Attendance", "Payroll", "Ticketing", "Helpdesk", "Project Management", "Task Management", "Time Tracking", "Asset Management",
  // Data / AI features
  "Search", "Recommendation Engine", "Chatbot", "NLP", "Image Recognition", "Sentiment Analysis", "Fraud Detection", "Predictive Analytics", "ETL", "Data Pipeline", "OCR", "Voice Recognition", "Personalization",
  // Architecture / infra
  "API Integration", "Microservices", "REST API", "GraphQL", "Webhooks", "Caching", "Load Balancing", "CI/CD", "Containerization", "Serverless", "Multi-tenancy", "Cloud Migration", "Message Queue", "Rate Limiting",
  // Product features
  "File Upload", "Maps & Geolocation", "Calendar", "PDF Generation", "Export/Import", "Internationalization", "Dark Mode", "Accessibility", "SEO", "PWA", "Offline Support", "Drag & Drop", "Workflow Automation", "Role Management", "Onboarding", "Document Management", "Forms", "Surveys", "Geofencing", "QR Code", "Barcode Scanning", "Gamification", "Loyalty Program", "Referral System", "Audit Trail",
];
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
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) return await r.json();
    // Token expired while loading the wizard → auto-logout (clean re-auth).
    if (r.status === 401) {
      const j = await r.json().catch(() => ({}));
      handleAuthTokenError(j);
    }
    return [];
  } catch { return []; }
}
async function save(url: string, body: unknown, method = "POST"): Promise<void> {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) {
    // The error shape varies: FastAPI sends { detail }, while our Next proxy's own
    // failures (401 AUTH_TOKEN_UNAVAILABLE / 503 BACKEND_UNAVAILABLE) send
    // { error, message } with NO `detail`. Read all of them so the user sees the
    // real reason instead of a misleading generic "Could not save." `detail` may
    // also be a 422 array.
    const j = (await r.json().catch(() => ({}))) as { detail?: unknown; message?: string; error?: string };
    // Genuine token-expiry → auto-logout to the portal login (clean re-auth)
    // instead of showing "Session is reconnecting — please retry". A navigation
    // is now in flight; throw a benign error so the caller's catch is a no-op.
    if (r.status === 401 && handleAuthTokenError(j)) {
      throw new Error("Your session has expired. Redirecting to sign in…");
    }
    const detailMsg = typeof j.detail === "string" ? j.detail : Array.isArray(j.detail)
      ? (j.detail as Array<{ msg?: string }>).map((d) => d?.msg).filter(Boolean).join(", ")
      : "";
    throw new Error(detailMsg || j.message || j.error || `Could not save. (HTTP ${r.status})`);
  }
}
const arr = (x: unknown): Row[] => Array.isArray(x) ? (x as Row[]) : Array.isArray((x as { items?: Row[] })?.items) ? (x as { items: Row[] }).items : [];

/** Read an image File into a data-URL (persisted to profile_extra.avatar_url). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const AVATAR_TYPES = ["image/png", "image/jpeg"];

/** India Post PIN-code lookup → { city, state } (free, no auth). Returns null on failure. */
async function lookupPincode(pin: string, signal?: AbortSignal): Promise<{ city: string; state: string } | null> {
  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal });
    if (!r.ok) return null;
    const data = (await r.json()) as Array<{ Status?: string; PostOffice?: Array<{ Name?: string; District?: string; State?: string }> | null }>;
    const first = Array.isArray(data) ? data[0] : undefined;
    const po = first?.PostOffice?.[0];
    if (first?.Status !== "Success" || !po) return null;
    return { city: po.District || po.Name || "", state: po.State || "" };
  } catch { return null; }
}

/** Razorpay IFSC lookup → bank/branch/city/state (free, no auth). Returns null on 404/failure. */
async function lookupIfsc(ifsc: string, signal?: AbortSignal): Promise<{ bank: string; branch: string; city: string; state: string } | null> {
  try {
    const r = await fetch(`https://ifsc.razorpay.com/${ifsc}`, { signal });
    if (!r.ok) return null;
    const d = (await r.json()) as { BANK?: string; BRANCH?: string; CITY?: string; STATE?: string };
    return { bank: d.BANK || "", branch: d.BRANCH || "", city: d.CITY || "", state: d.STATE || "" };
  } catch { return null; }
}

const inputCls = "w-full h-9 rounded-lg border border-stroke-subtle bg-surface px-3 font-body text-[12.5px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30";
const labelCls = "block font-body text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary mb-1";
const primaryBtn = "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50";

/** Searchable multi-select dropdown with checkboxes; picked values show as
 * horizontal chips with an × to remove. Used for languages, skills, keywords. */
function ChipField({ values, setValues, suggestions, placeholder }: { values: string[]; setValues: (v: string[]) => void; suggestions: string[]; placeholder: string }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (v: string) => { const t = v.trim(); if (!t) return; setValues(values.includes(t) ? values.filter((x) => x !== t) : [...values, t]); };
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));
  const canAdd = !!q.trim() && !suggestions.some((s) => s.toLowerCase() === q.trim().toLowerCase()) && !values.some((v) => v.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="space-y-1.5" ref={ref}>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">{values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 font-body text-[12px] text-brand">{v}<button type="button" onClick={() => toggle(v)} aria-label={`Remove ${v}`} className="hover:text-brand-hover"><X className="h-3 w-3" /></button></span>
        ))}</div>
      ) : null}
      <div className="relative">
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "Enter" && canAdd) { e.preventDefault(); toggle(q); setQ(""); } }} placeholder={placeholder} className={inputCls} />
        {open ? (
          <div className="absolute z-20 mt-1 w-full max-h-52 overflow-auto rounded-lg border border-stroke bg-surface shadow-lg p-1">
            {filtered.map((s) => { const on = values.includes(s); return (
              <button key={s} type="button" onClick={() => toggle(s)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-body text-[12.5px] text-foreground hover:bg-surface-hover text-left">
                <span className={cn("grid place-items-center h-4 w-4 rounded border shrink-0", on ? "bg-brand border-brand text-on-brand" : "border-stroke")}>{on ? <Check className="h-3 w-3" /> : null}</span>{s}
              </button>
            ); })}
            {canAdd ? (
              <button type="button" onClick={() => { toggle(q); setQ(""); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-body text-[12.5px] text-brand hover:bg-surface-hover text-left"><Plus className="h-3.5 w-3.5" /> Add &ldquo;{q.trim()}&rdquo;</button>
            ) : null}
            {filtered.length === 0 && !canAdd ? <p className="px-2 py-1.5 font-body text-[12px] text-text-tertiary">No matches</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** File picker — shows the chosen filename (real upload to Blob is wired later).
 * For the profile photo it enforces a KB cap + passport-size (portrait) dimensions. */
function FileField({ text, name, onPick, onClear, accept, multiple, maxKB, passport, pdfOnly, onErr }: { text: string; name: string; onPick: (n: string) => void; onClear?: () => void; accept: string; multiple?: boolean; maxKB?: number; passport?: boolean; pdfOnly?: boolean; onErr?: (m: string) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const handle = async (files: FileList) => {
    const f = files[0];
    if (pdfOnly && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { onErr?.("Only a PDF file is allowed for the ID document."); return; }
    if (maxKB && f.size > maxKB * 1024) { onErr?.(`File must be under ${maxKB} KB (yours is ${Math.round(f.size / 1024)} KB).`); return; }
    if (passport) {
      const ok = await new Promise<boolean>((res) => {
        const img = new window.Image();
        img.onload = () => { const r = img.width / img.height; res(img.width >= 150 && img.height >= 150 && r >= 0.6 && r <= 0.95); };
        img.onerror = () => res(false);
        img.src = URL.createObjectURL(f);
      });
      if (!ok) { onErr?.("Use a passport-size photo — portrait, min 150×150."); return; }
    }
    onErr?.("");
    onPick(multiple ? Array.from(files).map((x) => x.name).join(", ") : f.name);
  };
  const clear = () => { if (ref.current) ref.current.value = ""; onErr?.(""); onClear?.(); };
  return (
    <div className="flex items-center gap-1.5">
      <label className="flex-1 flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-dashed border-stroke bg-surface cursor-pointer hover:bg-surface-hover">
        <span className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-secondary truncate"><Upload className="h-3.5 w-3.5 shrink-0" /> {name || text}</span>
        <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => { const f = e.target.files; if (f && f.length) handle(f); }} />
      </label>
      {name ? (
        <button type="button" onClick={clear} aria-label="Remove file" className="grid place-items-center h-9 w-9 shrink-0 rounded-lg border border-stroke bg-surface text-text-tertiary hover:bg-surface-hover hover:text-error-text"><X className="h-4 w-4" /></button>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className={labelCls}>{label}</span>{children}</div>;
}

export default function CompleteProfilePage() {
  const qc = useQueryClient();
  const { data: completion } = useProfileCompletion();
  const sections = completion?.sections ?? {};
  const rawWeights = (completion?.weights ?? {}) as Record<string, number>;
  const rawPct = completion?.completeness ?? 0;

  const [step, setStep] = React.useState(0);
  const currentKey = SECTION_ORDER[step];
  const lastStep = SECTION_ORDER.length - 1;
  const refresh = React.useCallback(() => qc.invalidateQueries({ queryKey: ["contributor", "profile", "completion"] }), [qc]);

  const [basic, setBasic] = React.useState({ firstName: "", lastName: "", country: "", state: "", city: "", pincode: "", mobileNumber: "", timezone: "", profilePhoto: "" });
  // Profile image — `avatarPreview` is what we show (a stored data-URL loaded from
  // profile_extra.avatar_url, or an object-URL while picking). `avatarDataUrl` is
  // set only when a new photo is picked this session and is what we persist.
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = React.useState<string | null>(null);
  const [avatarError, setAvatarError] = React.useState("");
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const avatarObjUrlRef = React.useRef<string | null>(null);
  const [pinLookup, setPinLookup] = React.useState<{ loading: boolean; error: string }>({ loading: false, error: "" });
  const [ifscLookup, setIfscLookup] = React.useState<{ loading: boolean; error: string; branch: string; city: string; state: string }>({ loading: false, error: "", branch: "", city: "", state: "" });
  const [languages, setLanguages] = React.useState<string[]>([]);
  // Country-code (mobile) — dial-code list from restcountries.com, default +91.
  const [dialCodes, setDialCodes] = React.useState<DialCode[]>(DIAL_CODES_FALLBACK);
  const [mobileDial, setMobileDial] = React.useState("+91");
  const [mobileLocal, setMobileLocal] = React.useState("");
  // Latest dial codes for use inside the (stable) reload callback without re-creating it.
  const dialCodesRef = React.useRef<DialCode[]>(DIAL_CODES_FALLBACK);
  // Full IANA timezone list (browser built-in), default = the user's detected zone.
  const [timezones] = React.useState<string[]>(() => getTimezones());
  const [prof, setProf] = React.useState({ headline: "", bio: "", yearsExperience: "", weeklyHours: "", hourlyRate: "", availability: "" });
  const [skills, setSkills] = React.useState<Row[]>([]);
  const [skillDraft, setSkillDraft] = React.useState({ name: "", level: "Intermediate", years: "1 Year" });
  const [expertise, setExpertise] = React.useState<string[]>([]);
  const [projects, setProjects] = React.useState<Row[]>([]);
  const [projDraft, setProjDraft] = React.useState({ name: "", category: "", description: "", github: "", live: "", video: "" });
  const [projSkills, setProjSkills] = React.useState<string[]>([]);
  const [projKeywords, setProjKeywords] = React.useState<string[]>([]);
  const [experience, setExperience] = React.useState<Row[]>([]);
  const [expDraft, setExpDraft] = React.useState({ organization: "", role: "", employmentType: "Full Time", startDate: "", endDate: "", description: "" });
  const [education, setEducation] = React.useState<Row[]>([]);
  const [eduDraft, setEduDraft] = React.useState({ institution: "", degree: "", specialization: "", grade: "", startYear: "", endYear: "" });
  const [links, setLinks] = React.useState({ linkedin: "", github: "", portfolio: "", proofUrl: "" });
  const [verif, setVerif] = React.useState({ idType: "", idNumber: "", idDocument: "" });
  const [preferences, setPreferences] = React.useState<string[]>([]);
  const [bank, setBank] = React.useState({ accountHolderName: "", bankName: "", accountNumber: "", confirmAccountNumber: "", ifscCode: "", accountType: "", upiId: "" });
  const [agree, setAgree] = React.useState({ termsAccepted: false, paymentPolicyAccepted: false, privacyPolicyAccepted: false, notificationConsent: false, truthDeclaration: false });
  // Agreements already accepted in the saved profile are locked (can't be un-accepted).
  const [agreeLocked, setAgreeLocked] = React.useState({ termsAccepted: false, paymentPolicyAccepted: false, privacyPolicyAccepted: false, notificationConsent: false, truthDeclaration: false });
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
      const savedMobile = (ex.mobileNumber as string) || b.mobileNumber || "";
      setBasic((x) => ({ ...x, firstName: b.firstName || x.firstName, lastName: b.lastName || x.lastName, state: b.state || x.state, pincode: b.pincode || x.pincode, mobileNumber: savedMobile || x.mobileNumber, profilePhoto: b.profilePhoto || x.profilePhoto }));
      // Split the saved mobile back into the country-code selector + local number.
      if (savedMobile) { const sp = splitMobile(savedMobile, dialCodesRef.current); setMobileDial(sp.dialCode); setMobileLocal(sp.number); }
      if (Array.isArray(ex.languages)) setLanguages(ex.languages as string[]);
      const pr = (ex.professional as Record<string, string>) || {}; setProf((x) => ({ ...x, weeklyHours: pr.weeklyHours || x.weeklyHours, hourlyRate: pr.hourlyRate || x.hourlyRate }));
      setLinks((x) => ({ ...x, ...((ex.links as Record<string, string>) || {}) }));
      const v = (ex.verification as Record<string, string>) || {}; setVerif((x) => ({ idType: v.idType || x.idType, idNumber: v.idNumber || x.idNumber, idDocument: v.idDocument || x.idDocument }));
      if (Array.isArray(ex.preferences)) setPreferences(ex.preferences as string[]);
      setBank((x) => ({ ...x, ...((ex.bank as Record<string, string>) || {}) }));
      const savedAgree = (ex.agreements as Record<string, boolean>) || {};
      setAgree((x) => ({ ...x, ...savedAgree }));
      // Lock any agreement that was already accepted in the saved profile.
      setAgreeLocked((x) => ({
        termsAccepted: x.termsAccepted || savedAgree.termsAccepted === true,
        paymentPolicyAccepted: x.paymentPolicyAccepted || savedAgree.paymentPolicyAccepted === true,
        privacyPolicyAccepted: x.privacyPolicyAccepted || savedAgree.privacyPolicyAccepted === true,
        notificationConsent: x.notificationConsent || savedAgree.notificationConsent === true,
        truthDeclaration: x.truthDeclaration || savedAgree.truthDeclaration === true,
      }));
      // Pre-load the saved profile image (shared with the simple edit page).
      const savedAvatar = ex.avatar_url as string | undefined;
      if (savedAvatar) setAvatarPreview((cur) => cur ?? savedAvatar);
    }
    refresh();
  }, [refresh]);
  React.useEffect(() => { reload(); }, [reload]);

  // Load the dialing-code list (restcountries.com) once on mount; keep the
  // fallback if it fails.
  React.useEffect(() => {
    const ctrl = new AbortController();
    fetchDialCodes(ctrl.signal).then((codes) => {
      if (ctrl.signal.aborted || !codes.length) return;
      dialCodesRef.current = codes;
      setDialCodes(codes);
    });
    return () => ctrl.abort();
  }, []);

  // Re-split the saved mobile whenever the (richer) dial-code list arrives, so a
  // mobile loaded before the API resolved gets the correct country code.
  React.useEffect(() => {
    if (basic.mobileNumber) { const sp = splitMobile(basic.mobileNumber, dialCodes); setMobileDial(sp.dialCode); setMobileLocal(sp.number); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialCodes]);

  // Default the timezone to the user's detected IANA zone (only if unset).
  React.useEffect(() => {
    const tz = detectedTimezone();
    if (tz) setBasic((b) => (b.timezone ? b : { ...b, timezone: tz }));
  }, []);

  // Keep the saved mobile (basic.mobileNumber) = dialCode + space + local number.
  const setMobile = (dial: string, local: string) => {
    setMobileDial(dial);
    setMobileLocal(local);
    setBasic((b) => ({ ...b, mobileNumber: local.trim() ? `${dial} ${local.trim()}` : "" }));
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setErr("");
    try { await fn(); await reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(null); }
  };
  const patchExtra = (body: object) => save("/api/contributor/profile/extra", body, "PATCH");

  const saveBasic = () => run("basic", async () => {
    await save("/api/contributor/profile", { country: basic.country, city: basic.city, timezone: basic.timezone }, "PATCH");
    await patchExtra({ basic: { firstName: basic.firstName, lastName: basic.lastName, state: basic.state, pincode: basic.pincode, mobileNumber: basic.mobileNumber, profilePhoto: basic.profilePhoto }, mobileNumber: basic.mobileNumber, languages, ...(avatarDataUrl ? { avatar_url: avatarDataUrl } : {}) });
    if (avatarDataUrl) { setAvatarPreview(avatarDataUrl); setAvatarDataUrl(null); }
  });

  // Profile image: validate (PNG/JPG, ≤2 MB), preview via object-URL, encode to a
  // data-URL for persistence (saved to profile_extra.avatar_url on "Save basic info").
  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarError("");
    if (!AVATAR_TYPES.includes(file.type)) { setAvatarError("Use a PNG or JPG image."); return; }
    if (file.size > AVATAR_MAX_BYTES) { setAvatarError("Image must be 2 MB or smaller."); return; }
    if (avatarObjUrlRef.current) URL.revokeObjectURL(avatarObjUrlRef.current);
    const objUrl = URL.createObjectURL(file);
    avatarObjUrlRef.current = objUrl;
    setAvatarPreview(objUrl);
    try { setAvatarDataUrl(await fileToDataUrl(file)); } catch { setAvatarError("Could not read that image. Try another file."); }
  };
  React.useEffect(() => () => { if (avatarObjUrlRef.current) URL.revokeObjectURL(avatarObjUrlRef.current); }, []);

  // PIN-code → City + State auto-fill (India Post). Fires when 6 digits are entered.
  const pinAbort = React.useRef<AbortController | null>(null);
  const onPincode = (raw: string) => {
    const pin = raw.replace(/\D/g, "").slice(0, 6);
    setBasic((b) => ({ ...b, pincode: pin }));
    setPinLookup({ loading: false, error: "" });
    pinAbort.current?.abort();
    if (pin.length !== 6) return;
    const ctrl = new AbortController();
    pinAbort.current = ctrl;
    setPinLookup({ loading: true, error: "" });
    lookupPincode(pin, ctrl.signal).then((res) => {
      if (ctrl.signal.aborted) return;
      if (!res) { setPinLookup({ loading: false, error: "Couldn't find that PIN code" }); return; }
      setBasic((b) => ({ ...b, country: "India", state: res.state || b.state, city: res.city || b.city }));
      setPinLookup({ loading: false, error: "" });
    });
  };

  // IFSC → Bank name auto-fill (Razorpay). Fires when 11 chars are entered.
  const ifscAbort = React.useRef<AbortController | null>(null);
  const onIfsc = (raw: string) => {
    const code = raw.toUpperCase().slice(0, 11);
    setBank((b) => ({ ...b, ifscCode: code }));
    setIfscLookup({ loading: false, error: "", branch: "", city: "", state: "" });
    ifscAbort.current?.abort();
    if (code.length !== 11) return;
    const ctrl = new AbortController();
    ifscAbort.current = ctrl;
    setIfscLookup({ loading: true, error: "", branch: "", city: "", state: "" });
    lookupIfsc(code, ctrl.signal).then((res) => {
      if (ctrl.signal.aborted) return;
      if (!res) { setIfscLookup({ loading: false, error: "Invalid IFSC code", branch: "", city: "", state: "" }); return; }
      setBank((b) => ({ ...b, bankName: res.bank || b.bankName }));
      setIfscLookup({ loading: false, error: "", branch: res.branch, city: res.city, state: res.state });
    });
  };
  const saveProf = () => run("professional", async () => {
    await save("/api/contributor/profile", { job_title: prof.headline, bio: prof.bio, years_experience: prof.yearsExperience, availability: prof.availability }, "PATCH");
    await patchExtra({ professional: { weeklyHours: prof.weeklyHours, hourlyRate: prof.hourlyRate } });
  });
  const addSkill = () => { if (!skillDraft.name.trim()) return; run("skills", async () => { await save("/api/contributor/skills", { name: skillDraft.name.trim(), level: skillDraft.level, years: skillDraft.years }); setSkillDraft({ name: "", level: "Intermediate", years: "1 Year" }); }); };
  const saveExpertise = (next: string[]) => run("expertise", async () => { await save("/api/contributor/profile/expertise", { expertise_areas: next }, "PATCH"); setExpertise(next); });
  const addProject = () => { if (!projDraft.name.trim()) return; run("portfolio", async () => { await save("/api/contributor/profile/projects", { title: projDraft.name.trim(), description: projDraft.description.trim(), category: projDraft.category, skills: projSkills, keywords: projKeywords, url: projDraft.github || projDraft.live, video: projDraft.video }); setProjDraft({ name: "", category: "", description: "", github: "", live: "", video: "" }); setProjSkills([]); setProjKeywords([]); }); };
  const addExp = () => { if (!expDraft.organization.trim() || !expDraft.role.trim()) return; run("experience", async () => { await save("/api/contributor/profile/experience", { organization: expDraft.organization.trim(), role: expDraft.role.trim(), kind: expDraft.employmentType, start_date: expDraft.startDate || null, end_date: expDraft.endDate || null, description: expDraft.description }); setExpDraft({ organization: "", role: "", employmentType: "Full Time", startDate: "", endDate: "", description: "" }); }); };
  const addEdu = () => { if (!eduDraft.institution.trim()) return; run("education", async () => { await save("/api/contributor/profile/education", { institution: eduDraft.institution.trim(), degree: eduDraft.degree, field: eduDraft.specialization, grade: eduDraft.grade, start_year: eduDraft.startYear || null, end_year: eduDraft.endYear || null }); setEduDraft({ institution: "", degree: "", specialization: "", grade: "", startYear: "", endYear: "" }); }); };

  const githubRequired = expertise.some((e) => TECHNICAL.includes(e));
  const saveVerif = () => {
    if (!links.linkedin.trim()) { setErr("LinkedIn is required."); return; }
    if (githubRequired && !links.github.trim()) { setErr("GitHub is required for the technical areas you selected."); return; }
    if (!verif.idType) { setErr("Select a government ID type."); return; }
    const e = validateId(verif.idType, verif.idNumber); if (e) { setErr(e); return; }
    run("verification", () => patchExtra({ links, verification: verif, preferences }));
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

  // The backend's completion math omits the Agreements step from its weights, so
  // it can report 100% / "complete" while none of the 5 agreement checkboxes are
  // accepted. Re-weight the Agreements step in on the client so it carries weight,
  // and require all 5 boxes for 100%. Agreements gets a 5% slice (same as
  // verification/bank); the backend's 0–100 score is scaled into the other 95%.
  const AGREEMENTS_WEIGHT = 5;
  const agreeKeys = Object.keys(agree) as Array<keyof typeof agree>;
  const agreeCount = agreeKeys.filter((k) => agree[k]).length;
  const allAgreed = agreeCount === agreeKeys.length;
  // The Agreements step's own "· X%" — proportional to boxes checked (each = 20%).
  const agreementsPct = Math.round((agreeCount / agreeKeys.length) * 100);

  // Per-step weights shown next to each section heading, with Agreements added.
  const weights: Record<string, number> = { ...rawWeights, agreements: AGREEMENTS_WEIGHT };
  // Overall %: backend score scaled into 95, plus the agreements slice (0–5).
  const pct = Math.min(
    100,
    Math.round((rawPct / 100) * (100 - AGREEMENTS_WEIGHT)) +
      Math.round((agreeCount / agreeKeys.length) * AGREEMENTS_WEIGHT),
  );
  // Complete only when the backend gate is satisfied AND every agreement is accepted.
  const complete = (completion?.complete ?? false) && allAgreed;

  const sectionDone = currentKey === "agreements" ? allAgreed : sections[currentKey] === true;

  return (
    <div className="w-full pb-16">
      <Link href="/contributor/profile" className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Back to profile</Link>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 items-start">
        <aside className="space-y-3 min-w-0 lg:sticky lg:top-4">
        <div className="rounded-xl border border-stroke bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-body text-[18px] font-semibold text-foreground">{complete ? "Profile complete" : "Complete your profile"}</h1>
          <span className="font-display text-[20px] font-bold tabular-nums" style={{ color: complete ? "#0F9D6B" : "var(--color-brand)" }}>{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-stroke-subtle overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: complete ? "#0F9D6B" : "var(--color-brand)" }} /></div>
        {complete ? <Link href="/contributor/opportunities" className={cn(primaryBtn, "mt-3")}>Browse tasks <ArrowRight className="h-4 w-4" /></Link> : null}
      </div>

        <nav className="rounded-xl border border-stroke bg-surface p-1.5 flex lg:flex-col gap-0.5 overflow-x-auto">
          {SECTION_ORDER.map((key, i) => {
            const done = sections[key] === true;
            const active = i === step;
            return (
              <button key={key} type="button" onClick={() => setStep(i)} className={cn("shrink-0 lg:w-full flex items-center gap-2 px-2.5 py-2 rounded-lg font-body text-[12.5px] text-left whitespace-nowrap transition-colors", active ? "bg-brand text-on-brand" : "hover:bg-surface-hover")}>
                {done ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: active ? "currentColor" : "#0F9D6B" }} /> : <span className={cn("grid place-items-center h-4 w-4 rounded-full border text-[9px] font-semibold shrink-0", active ? "border-current" : "border-stroke text-text-tertiary")}>{i + 1}</span>}
                <span className={active ? "" : done ? "text-text-secondary" : "text-foreground"}>{SECTION_LABELS[key]}</span>
              </button>
            );
          })}
        </nav>
        </aside>

        <div className="min-w-0">
        {err ? <p className="mb-3 font-body text-[12px] text-error-text">{err}</p> : null}

        <div className="rounded-xl border border-stroke bg-surface p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-body text-[16px] font-semibold text-foreground">{SECTION_LABELS[currentKey]}</h2>
          <span className="font-body text-[11px] text-text-tertiary">· {currentKey === "agreements" ? agreementsPct : weights[currentKey] ?? 0}%</span>
          {sectionDone ? <span className="ml-auto inline-flex items-center gap-1 font-body text-[11.5px]" style={{ color: "#0F9D6B" }}><CheckCircle2 className="h-3.5 w-3.5" /> Done</span> : null}
        </div>

        {currentKey === "basic" ? (
          <>
            <Field label="Profile photo">
              <div className="flex flex-wrap items-center gap-4">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Profile photo" className="h-16 w-16 rounded-full object-cover shrink-0 ring-4 ring-surface shadow-sm" />
                ) : (
                  <div aria-hidden className="h-16 w-16 rounded-full bg-brand text-on-brand inline-flex items-center justify-center font-body text-[18px] font-semibold shrink-0 ring-4 ring-surface shadow-sm">{(basic.firstName?.[0] || "") + (basic.lastName?.[0] || "") || "👤"}</div>
                )}
                <div className="space-y-1.5 min-w-0">
                  <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => void onPickAvatar(e)} />
                  <button type="button" onClick={() => avatarInputRef.current?.click()} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-stroke text-text-secondary hover:text-foreground hover:bg-surface-hover font-body text-[12px] font-semibold transition-colors"><Upload className="h-3.5 w-3.5" /> {avatarPreview ? "Change photo" : "Upload photo"}</button>
                  <p className="font-body text-[11px] text-text-tertiary">PNG or JPG, max 2 MB. Saved with your basic info.</p>
                  {avatarError ? <p className="font-body text-[11px] text-error-text">{avatarError}</p> : null}
                </div>
              </div>
            </Field>
            <FileField text="Upload passport-size photo (max 200 KB)" name={basic.profilePhoto} accept=".jpg,.jpeg,.png,.webp" maxKB={200} passport onErr={setErr} onPick={(n) => setBasic({ ...basic, profilePhoto: n })} onClear={() => setBasic({ ...basic, profilePhoto: "" })} />
            <p className="font-body text-[11px] text-text-tertiary">Your name is prefilled from your account &mdash; edit it here if needed. Your email is managed in <Link href="/contributor/settings/account" className="text-text-link hover:underline font-medium">Account settings</Link> (major changes may need re-verification).</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="First name *"><input value={basic.firstName} onChange={(e) => setBasic({ ...basic, firstName: e.target.value })} className={inputCls} placeholder="Aarav" /></Field>
              <Field label="Last name *"><input value={basic.lastName} onChange={(e) => setBasic({ ...basic, lastName: e.target.value })} className={inputCls} placeholder="Sharma" /></Field>
              <Field label="Pincode *">
                <div className="relative">
                  <input value={basic.pincode} onChange={(e) => onPincode(e.target.value)} className={inputCls} placeholder="400001" inputMode="numeric" maxLength={6} />
                  {pinLookup.loading ? <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-text-tertiary" /> : null}
                </div>
                {pinLookup.error ? <p className="mt-1 font-body text-[11px] text-error-text">{pinLookup.error}</p> : <p className="mt-1 font-body text-[11px] text-text-tertiary">Enter your 6-digit PIN to auto-fill city &amp; state.</p>}
              </Field>
              <Field label="Country *"><input value={basic.country} onChange={(e) => setBasic({ ...basic, country: e.target.value })} className={inputCls} placeholder="India" /></Field>
              <Field label="State *"><input value={basic.state} onChange={(e) => setBasic({ ...basic, state: e.target.value })} className={inputCls} placeholder="Maharashtra" /></Field>
              <Field label="City *"><input value={basic.city} onChange={(e) => setBasic({ ...basic, city: e.target.value })} className={inputCls} placeholder="Mumbai" /></Field>
              <Field label="Mobile number *">
                <div className="flex gap-1.5">
                  <select aria-label="Country dialing code" value={mobileDial} onChange={(e) => setMobile(e.target.value, mobileLocal)} className={cn(inputCls, "w-[112px] shrink-0 px-2")}>
                    {/* De-dup by dial code (many countries share +1) — show flag + code. */}
                    {Array.from(new Map(dialCodes.map((c) => [`${c.dialCode}|${c.cca2}`, c])).values()).map((c) => (
                      <option key={`${c.cca2}-${c.dialCode}`} value={c.dialCode}>{c.flag ? `${c.flag} ` : ""}{c.dialCode} {c.cca2}</option>
                    ))}
                  </select>
                  <input value={mobileLocal} onChange={(e) => setMobile(mobileDial, e.target.value.replace(/[^\d]/g, ""))} className={inputCls} placeholder="98765 43210" inputMode="numeric" />
                </div>
              </Field>
              <Field label="Timezone *"><select value={basic.timezone} onChange={(e) => setBasic({ ...basic, timezone: e.target.value })} className={inputCls}><option value="">Select timezone</option>{timezones.map((t) => <option key={t}>{t}</option>)}</select></Field>
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
                <button key={a} type="button" onClick={() => setProf({ ...prof, availability: a })} className={cn("px-3 py-1.5 rounded-lg border font-body text-[12px]", prof.availability === a ? "border-brand bg-brand text-on-brand" : "border-stroke text-foreground hover:bg-surface-hover")}>{a}</button>
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
              <button key={x} type="button" disabled={busy === "expertise"} onClick={() => saveExpertise(on ? expertise.filter((e) => e !== x) : [...expertise, x])} className={cn("inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 font-body text-[12px] disabled:opacity-50", on ? "border-brand bg-brand text-on-brand" : "border-stroke text-foreground hover:bg-surface-hover")}>{on ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {x}</button>
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
            <FileField text="Upload ID document — PDF only (max 2000 KB) *" name={verif.idDocument} accept=".pdf,application/pdf" pdfOnly maxKB={2000} onErr={setErr} onPick={(n) => setVerif({ ...verif, idDocument: n })} onClear={() => setVerif({ ...verif, idDocument: "" })} />
            <Field label="Project preferences">
              <div className="flex flex-wrap gap-1.5">{PREFERENCES.map((p) => { const on = preferences.includes(p); return (
                <button key={p} type="button" onClick={() => setPreferences(on ? preferences.filter((x) => x !== p) : [...preferences, p])} className={cn("px-2.5 py-1 rounded-full border font-body text-[11.5px]", on ? "border-brand bg-brand text-on-brand" : "border-stroke text-foreground hover:bg-surface-hover")}>{p}</button>
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
              <Field label="IFSC code *">
                <div className="relative">
                  <input value={bank.ifscCode} onChange={(e) => onIfsc(e.target.value)} className={inputCls} placeholder="HDFC0001234" maxLength={11} />
                  {ifscLookup.loading ? <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-text-tertiary" /> : null}
                </div>
                {ifscLookup.error ? (
                  <p className="mt-1 font-body text-[11px] text-error-text">{ifscLookup.error}</p>
                ) : ifscLookup.branch || ifscLookup.city || ifscLookup.state ? (
                  <p className="mt-1 font-body text-[11px] text-text-tertiary">{[ifscLookup.branch, ifscLookup.city, ifscLookup.state].filter(Boolean).join(" · ")}</p>
                ) : (
                  <p className="mt-1 font-body text-[11px] text-text-tertiary">Enter your 11-character IFSC to auto-fill the bank.</p>
                )}
              </Field>
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
            ] as const).map(([k, text]) => {
              const locked = agreeLocked[k];
              return (
                <label key={k} className={cn("flex items-start gap-2", locked ? "cursor-default" : "cursor-pointer")}>
                  <input type="checkbox" checked={agree[k]} disabled={locked} onChange={(e) => { if (!locked) setAgree({ ...agree, [k]: e.target.checked }); }} className={cn("mt-0.5 h-3.5 w-3.5 rounded accent-brand", locked && "cursor-not-allowed")} />
                  <span className="font-body text-[12.5px] text-foreground">{text}{locked ? <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle font-body text-[10.5px] text-text-tertiary"><Check className="h-3 w-3" />Accepted</span> : null}</span>
                </label>
              );
            })}
            <button type="button" disabled={busy === "agreements" || !allAgreed} onClick={saveAgreements} className={primaryBtn}>Save agreements</button>
            {!allAgreed ? <p className="font-body text-[11.5px] text-text-tertiary">Accept all {agreeKeys.length} agreements to finish ({agreeCount}/{agreeKeys.length} accepted).</p> : null}
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
      </div>
    </div>
  );
}
