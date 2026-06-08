/**
 * Contributor opportunities client — the "price-visible → I'm interested" board.
 *
 * Lists OPEN decomposed tasks across enterprise plans and lets a contributor
 * express / withdraw interest. Talks to the freelancer backend via the Next API
 * proxy at /api/contributor/opportunities. The backend's read side
 * (fetch_open_plan_tasks over the shared enterprise_plans table) is implemented;
 * the interest-write + payout endpoints may not be wired yet, in which case these
 * helpers degrade gracefully (empty board / no-op) rather than throwing, so the
 * page shows its empty state and never fabricates data.
 */

export interface OpportunityPay {
  contributor_net_minor: number;
  contributor_gross_minor: number;
  contributor_gst_minor: number;
  contributor_hourly_minor: number;
}

export interface Opportunity {
  plan_id: string;
  task_id: string;
  sow_id?: string | null;
  project_name: string;
  milestone?: string | null;
  title: string;
  description?: string | null;
  technologies: string[];
  effort_hours: number;
  priority?: string | null;
  deadline?: string | null;
  interest_count: number;
  my_interest?: "interested" | null;
  selected: boolean;
  selected_is_me: boolean;
  pay: OpportunityPay;
}

const ZERO_PAY: OpportunityPay = {
  contributor_net_minor: 0,
  contributor_gross_minor: 0,
  contributor_gst_minor: 0,
  contributor_hourly_minor: 0,
};

function normalize(row: Record<string, unknown>): Opportunity {
  const str = (k: string, d = "") => (typeof row[k] === "string" ? (row[k] as string) : d);
  const num = (k: string, d = 0) => (typeof row[k] === "number" ? (row[k] as number) : d);
  const payRaw = (row.pay && typeof row.pay === "object" ? row.pay : {}) as Record<string, number>;
  return {
    plan_id: str("plan_id"),
    task_id: str("task_id"),
    sow_id: (row.sow_id as string) ?? null,
    project_name: str("project_name") || "Project",
    milestone: (row.milestone as string) ?? null,
    title: str("title") || "Untitled task",
    description: (row.description as string) ?? null,
    technologies: Array.isArray(row.technologies) ? (row.technologies as string[]) : [],
    effort_hours: num("effort_hours"),
    priority: (row.priority as string) ?? null,
    deadline: (row.deadline as string) ?? null,
    interest_count: num("interest_count"),
    my_interest: row.my_interest === "interested" ? "interested" : null,
    selected: Boolean(row.selected),
    selected_is_me: Boolean(row.selected_is_me),
    pay: {
      contributor_net_minor: Number(payRaw.contributor_net_minor) || 0,
      contributor_gross_minor: Number(payRaw.contributor_gross_minor) || 0,
      contributor_gst_minor: Number(payRaw.contributor_gst_minor) || 0,
      contributor_hourly_minor: Number(payRaw.contributor_hourly_minor) || 0,
    },
  };
}

async function call(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api/contributor/opportunities${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export interface OpportunityList {
  items: Opportunity[];
}

/** Open opportunities. Returns { items: [] } if the board isn't reachable yet. */
export async function listOpportunities(token: string): Promise<OpportunityList> {
  try {
    const res = await call("", token);
    if (!res.ok) return { items: [] };
    const body = (await res.json()) as
      | { data?: { items?: Record<string, unknown>[] }; items?: Record<string, unknown>[] };
    const items = body.data?.items ?? body.items ?? [];
    return { items: Array.isArray(items) ? items.map(normalize) : [] };
  } catch {
    return { items: [] };
  }
}

/** Express interest in a task. No-op-safe if the endpoint isn't wired yet. */
export async function expressInterest(token: string, planId: string, taskId: string): Promise<void> {
  const res = await call(`/${encodeURIComponent(planId)}/${encodeURIComponent(taskId)}/interest`, token, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Could not express interest (${res.status})`);
}

/** Withdraw interest in a task. */
export async function withdrawInterest(token: string, planId: string, taskId: string): Promise<void> {
  const res = await call(`/${encodeURIComponent(planId)}/${encodeURIComponent(taskId)}/interest`, token, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Could not withdraw interest (${res.status})`);
}

export { ZERO_PAY };
