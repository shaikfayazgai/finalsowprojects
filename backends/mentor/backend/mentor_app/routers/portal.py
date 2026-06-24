"""
Mentor PORTAL endpoints — return the EXACT frontend shapes (DashboardResponse,
DecisionListResponse, EscalationListResponse, ...) so the mentor portal pages
render REAL data computed from mentor_reviews / mentor_escalations. Responses
are the raw FE shapes (NOT the {success,data} envelope), so the Next mock routes
can proxy them straight through.
"""

from __future__ import annotations

import json as _json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Body, HTTPException
from psycopg2.extras import Json, RealDictCursor

from shared.audit import write_audit

from mentor_app.routers.mentor import MentorDep, _conn

router = APIRouter(prefix="/api/mentor/portal", tags=["mentor-portal"])


def _iso(v: Any):
    return v.isoformat() if hasattr(v, "isoformat") else (v if v else None)


def _jdict(row: dict, key: str) -> dict:
    v = row.get(key)
    if isinstance(v, str):
        try:
            v = _json.loads(v)
        except (ValueError, TypeError):
            v = {}
    return v if isinstance(v, dict) else {}


def _decision_view(r: dict) -> dict:
    p = _jdict(r, "payload")
    dec = (r.get("decision") or "").lower()
    if dec in ("reject", "rejected"):
        dec = "reject"
    elif dec not in ("accept", "rework", "withdrawn", "reassign"):
        st = (r.get("status") or "").lower()
        dec = "accept" if st == "accepted" else ("rework" if st == "rework" else "reject")
    return {
        "id": str(r["id"]),
        "reviewId": str(r["id"]),
        "taskTitle": r.get("title") or "Review",
        "contributorId": str(r.get("contributor_id") or ""),
        "contributorName": r.get("contributor_name") or "—",
        "project": p.get("project") or p.get("sowTitle") or "—",
        "round": int(p.get("round") or 1),
        "totalRounds": int(p.get("totalRounds") or 1),
        "decision": dec,
        "decidedAt": _iso(r.get("decided_at") or r.get("updated_at")),
        "reviewerConfidence": p.get("reviewerConfidence") or "confident",
        "finalComment": r.get("comments"),
        "rubricOverall": float(r["score"]) if r.get("score") is not None else None,
        "aiAlignment": p.get("aiAlignment") or "took_as_is",
    }


def _esc_view(r: dict) -> dict:
    meta = _jdict(r, "meta")
    pr = (r.get("priority") or "normal").lower()
    sev = {"urgent": "critical", "critical": "critical", "high": "high",
           "normal": "medium", "low": "low"}.get(pr, "medium")
    st = (r.get("status") or "open").lower()
    status = {"open": "open", "in_progress": "in_review", "resolved": "resolved",
              "closed": "resolved"}.get(st, "open")
    cat = (r.get("category") or "general").lower()
    etype = meta.get("type") or {"quality": "dispute", "technical": "sla_breach",
                                 "conduct": "conflict", "general": "dispute"}.get(cat, "dispute")
    return {
        "id": str(r["id"]),
        "type": etype,
        "severity": sev,
        "status": status,
        "openedAt": _iso(r.get("created_at")),
        "resolvedAt": _iso(r.get("resolved_at")),
        "assignedTo": r.get("assignee"),
        "taskTitle": meta.get("taskTitle") or r.get("subject") or "—",
        "contributorName": meta.get("contributorName") or "—",
        "contributorId": str(meta.get("contributorId") or ""),
        "project": meta.get("project") or "—",
        "originalMentorName": meta.get("originalMentorName") or r.get("mentor_email") or "—",
        "originalDecisionId": meta.get("originalDecisionId"),
        "originalDecision": meta.get("originalDecision") or "reject",
        "originalDecisionAt": _iso(meta.get("originalDecisionAt") or r.get("created_at")),
        "rejectReason": r.get("description"),
        "contributorDispute": meta.get("dispute") or meta.get("contributorDispute"),
    }


@router.get("/dashboard")
def portal_dashboard(user: MentorDep):
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT
                 COUNT(*) FILTER (WHERE status IN ('pending','in_review')) AS pending,
                 COUNT(*) FILTER (WHERE status IN ('pending','in_review')
                                  AND created_at < now() - interval '24 hours') AS sla_risk,
                 COUNT(*) FILTER (WHERE status IN ('accepted','rework','rejected')
                                  AND updated_at >= now() - interval '7 days') AS done7d
               FROM mentor_reviews WHERE mentor_id = %s OR mentor_id = 'pool'""",
            (mentor_id,))
        s = cur.fetchone() or {}
        # Lifetime totals for the dashboard stat cards: SOWs worked + decision outcomes.
        cur.execute(
            """SELECT
                 COUNT(DISTINCT COALESCE(payload->>'sowId', payload->>'sow_id')) AS sows,
                 COUNT(*) FILTER (WHERE decision='accept' OR status='accepted') AS accept,
                 COUNT(*) FILTER (WHERE decision='rework' OR status='rework') AS rework,
                 COUNT(*) FILTER (WHERE decision IN ('reject','rejected') OR status='rejected') AS reject
               FROM mentor_reviews WHERE mentor_id = %s""",
            (mentor_id,))
        life = cur.fetchone() or {}
        cur.execute(
            "SELECT id, mentor_email, subject, category, priority, status, description, "
            "assignee, meta, resolved_at, created_at FROM mentor_escalations "
            "WHERE mentor_id = %s AND status IN ('open','in_progress') "
            "ORDER BY created_at DESC LIMIT 5", (mentor_id,))
        escs = [_esc_view(dict(r)) for r in cur.fetchall()]
        # Hero = the single most-urgent pending review to act on next (oldest first).
        # Was hardcoded None, so the dashboard wrongly showed "Queue clear" while the
        # pending KPI read >0.
        cur.execute(
            "SELECT id, title, contributor_name, submission_type, payload, created_at "
            "FROM mentor_reviews WHERE (mentor_id = %s OR mentor_id = 'pool') "
            "AND status IN ('pending','in_review') ORDER BY created_at ASC LIMIT 1",
            (mentor_id,))
        hrow = cur.fetchone()
    hero = None
    if hrow:
        pl = hrow.get("payload") if isinstance(hrow.get("payload"), dict) else {}
        created = hrow.get("created_at")
        hero = {
            "id": str(hrow.get("id")),
            "taskTitle": hrow.get("title") or "Submission",
            "round": int(pl.get("round") or 1),
            "contributorName": hrow.get("contributor_name") or "Contributor",
            "submittedAt": pl.get("submittedAt") or (created.isoformat() if created else None),
            "project": pl.get("projectName") or pl.get("project") or hrow.get("title") or "Delivery",
            "stage": "two_stage" if hrow.get("submission_type") == "two_stage" else "single",
        }
    pending = int(s.get("pending") or 0)
    sla = int(s.get("sla_risk") or 0)
    return {
        "pendingCount": pending,
        "slaRiskCount": sla,
        "hero": hero,
        "todaySessions": [],
        "openEscalations": escs,
        "teamLoad": {"poolName": "Review pool", "members": []},
        "queueGlance": {"pending": pending, "slaRisk": sla,
                        "done7d": int(s.get("done7d") or 0), "avgTimeMin": 0},
        "lifetime": {"assignedSows": int(life.get("sows") or 0),
                     "accepted": int(life.get("accept") or 0),
                     "rework": int(life.get("rework") or 0),
                     "rejected": int(life.get("reject") or 0)},
    }


@router.get("/decisions")
def portal_decisions(user: MentorDep):
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT id, title, contributor_id, contributor_name, status, decision, score,
                      comments, payload, decided_at, created_at, updated_at
                 FROM mentor_reviews
                WHERE mentor_id = %s
                  AND (decision IS NOT NULL OR status IN ('accepted','rework','rejected'))
                ORDER BY COALESCE(decided_at, updated_at) DESC""",
            (mentor_id,))
        items = [_decision_view(dict(r)) for r in cur.fetchall()]
        cur.execute(
            """SELECT
                 COUNT(*) FILTER (WHERE decision='accept' OR status='accepted') AS accept,
                 COUNT(*) FILTER (WHERE decision='rework' OR status='rework') AS rework,
                 COUNT(*) FILTER (WHERE decision IN ('reject','rejected') OR status='rejected') AS reject,
                 COUNT(*) AS total
               FROM mentor_reviews WHERE mentor_id=%s
                 AND (decision IS NOT NULL OR status IN ('accepted','rework','rejected'))""",
            (mentor_id,))
        m = cur.fetchone() or {}
        notes = 0
        try:
            cur.execute("SELECT COUNT(*) AS n FROM mentor_notes WHERE mentor_id=%s", (mentor_id,))
            notes = int((cur.fetchone() or {}).get("n") or 0)
        except Exception:  # noqa: BLE001
            notes = 0
    total = int(m.get("total") or 0)
    accept = int(m.get("accept") or 0)
    metrics = {
        "periodDays": 30,
        "reviewCount": total,
        "avgTimeMin": 0,
        "slaHitPct": 100 if total else 0,
        "acceptPct": round(accept / total * 100) if total else 0,
        "decisionsByKind": {"accept": accept, "rework": int(m.get("rework") or 0),
                            "reject": int(m.get("reject") or 0)},
        "aiAlignment": {"tookAsIs": total, "modified": 0, "overrode": 0},
        "coachingNotesWritten": notes,
    }
    return {"items": items, "total": len(items), "metrics": metrics}


@router.get("/decisions/{decision_id}")
def portal_decision_detail(decision_id: str, user: MentorDep):
    mentor_id = str(user["id"])
    try:
        rid = int(decision_id)
    except ValueError:
        rid = -1
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, title, contributor_id, contributor_name, status, decision, score, "
            "comments, payload, decided_at, created_at, updated_at "
            "FROM mentor_reviews WHERE id=%s AND mentor_id=%s", (rid, mentor_id))
        r = cur.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Decision not found")
    return {"decision": _decision_view(dict(r))}


@router.get("/escalations")
def portal_escalations(user: MentorDep):
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, mentor_email, subject, category, priority, status, description, "
            "assignee, meta, resolved_at, created_at FROM mentor_escalations "
            "WHERE mentor_id = %s ORDER BY created_at DESC", (mentor_id,))
        items = [_esc_view(dict(r)) for r in cur.fetchall()]
        cur.execute(
            "SELECT COUNT(*) FILTER (WHERE status IN ('open','in_progress')) AS open_cnt, "
            "COUNT(*) FILTER (WHERE status IN ('resolved','closed') "
            "  AND resolved_at >= now() - interval '30 days') AS resolved30 "
            "FROM mentor_escalations WHERE mentor_id=%s", (mentor_id,))
        m = cur.fetchone() or {}
    metrics = {"openCount": int(m.get("open_cnt") or 0),
               "resolvedLast30": int(m.get("resolved30") or 0), "avgResolveHours": 0}
    return {"items": items, "total": len(items), "metrics": metrics}


@router.get("/escalations/{escalation_id}")
def portal_escalation_detail(escalation_id: str, user: MentorDep):
    mentor_id = str(user["id"])
    try:
        eid = int(escalation_id)
    except ValueError:
        eid = -1
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, mentor_email, subject, category, priority, status, description, "
            "assignee, meta, resolved_at, created_at FROM mentor_escalations "
            "WHERE id=%s AND mentor_id=%s", (eid, mentor_id))
        r = cur.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return {"escalation": _esc_view(dict(r))}


@router.get("/mentorship-stats")
def portal_mentorship_stats(user: MentorDep):
    """Profile 'Mentorship' tile — real counts from mentor_sessions.
    sessionsHeld = sessions marked held this month; activeMentees = distinct
    contributors with an active (scheduled/held) session."""
    mentor_id = str(user["id"])
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT
                 COUNT(*) FILTER (
                   WHERE status = 'held'
                     AND scheduled_at >= date_trunc('month', now())) AS held_month,
                 COUNT(DISTINCT contributor_id) FILTER (
                   WHERE status IN ('scheduled','rescheduled','held')) AS active_mentees
               FROM mentor_sessions WHERE mentor_id = %s""",
            (mentor_id,))
        s = cur.fetchone() or {}
    return {"sessionsHeld": int(s.get("held_month") or 0),
            "activeMentees": int(s.get("active_mentees") or 0)}


@router.post("/escalations/{escalation_id}/adjudicate")
def portal_escalation_adjudicate(escalation_id: str, user: MentorDep, body: dict = Body(default={})):
    mentor_id = str(user["id"])
    decision = (body or {}).get("decision") or "uphold"
    reason = (body or {}).get("reason") or ""
    try:
        eid = int(escalation_id)
    except ValueError:
        eid = -1
    entry = {"at": datetime.now(timezone.utc).isoformat(), "status": "resolved",
             "decision": decision, "reason": reason, "by": user.get("email")}
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "UPDATE mentor_escalations SET status='resolved', resolved_at=now(), updated_at=now(), "
            "timeline = COALESCE(timeline,'[]'::jsonb) || %s::jsonb "
            "WHERE id=%s AND mentor_id=%s RETURNING id, mentor_email, subject, category, "
            "priority, status, description, assignee, meta, resolved_at, created_at",
            (Json([entry]), eid, mentor_id))
        r = cur.fetchone()
    conn.commit()
    if not r:
        raise HTTPException(status_code=404, detail="Escalation not found")
    write_audit(actor_id=mentor_id, actor_email=user.get("email"), actor_role=user.get("role"),
                action=f"mentor.escalation.adjudicate.{decision}", target="mentor_escalations",
                target_id=str(eid), service="mentor-service")
    return {"escalation": _esc_view(dict(r))}
