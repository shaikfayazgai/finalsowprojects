/**
 * Enterprise acceptance decision API client.
 *
 * Wraps the persistence endpoint that records accept / rework decisions
 * to the AcceptanceDecision table. The Zustand task store uses these
 * to make its mutators truly persistent — the local store applies the
 * optimistic change instantly, calls these wrappers, and rolls back on
 * failure.
 */

export interface AcceptResponse {
  id: string;
  decidedAt: string;
}

export interface DecisionRecord {
  id: string;
  decision: "accept" | "rework";
  note: string | null;
  deciderInitials: string | null;
  decidedAt: string;
}

export class AcceptanceApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AcceptanceApiError";
  }
}

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
}

/**
 * Optional notification context. Until M9 (Task model in Postgres)
 * lands, the route can't derive the contributor from the taskId — so
 * the caller passes it explicitly. Both fields are optional; absent
 * notification is treated as a no-op (acceptance still succeeds).
 */
interface NotifyExtras {
  /** Contributor's User.id — recipient of the notification. */
  recipientUserId?: string;
  /** Display label for the task — woven into notification copy. */
  taskTitle?: string;
}

export const acceptanceApi = {
  /** Persist an enterprise acceptance decision. */
  async accept(
    taskId: string,
    opts: {
      note?: string;
      deciderInitials?: string;
    } & NotifyExtras,
  ): Promise<AcceptResponse> {
    const res = await post(`/api/enterprise/acceptance/${encodeURIComponent(taskId)}`, {
      decision: "accept",
      ...opts,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AcceptanceApiError(res.status, detail || `accept failed (${res.status})`);
    }
    return (await res.json()) as AcceptResponse;
  },

  /** Persist an enterprise rework request. `reason` is required. */
  async rework(
    taskId: string,
    opts: {
      reason: string;
      deciderInitials?: string;
    } & NotifyExtras,
  ): Promise<AcceptResponse> {
    const res = await post(`/api/enterprise/acceptance/${encodeURIComponent(taskId)}`, {
      decision: "rework",
      ...opts,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AcceptanceApiError(res.status, detail || `rework failed (${res.status})`);
    }
    return (await res.json()) as AcceptResponse;
  },

  /** Read the decision history for a task. */
  async history(taskId: string): Promise<DecisionRecord[]> {
    const res = await fetch(
      `/api/enterprise/acceptance/${encodeURIComponent(taskId)}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AcceptanceApiError(res.status, detail || `history failed (${res.status})`);
    }
    const data = (await res.json()) as { decisions: DecisionRecord[] };
    return data.decisions;
  },
};
