"""Seed one reviewer_assignment for the tenant-connected reviewer so the QA
queue is non-empty for end-to-end testing. Additive + idempotent (skips if a
seed row already exists). Deletes nothing."""
from shared.db import get_pg_connection
from psycopg2.extras import RealDictCursor, Json
from auth_app import repo

EMAIL = "mychatgptcourse@gmail.com"
SEED_TITLE = "QA: Landing page hero refactor"

row = repo.find_account_by_email(EMAIL)
assert row, f"{EMAIL} not found"
rid = row["id"]

# MockReviewerItem-shaped payload the UI/queue mapper reads from data JSONB.
data = {
    "taskSubtitle": "React/Next.js · responsive hero + a11y pass",
    "project": "Fayaz Test Tenant — Web Revamp",
    "projectName": "Fayaz Test Tenant — Web Revamp",
    "tenant": "Fayaz Test Tenant",
    "tenantName": "Fayaz Test Tenant",
    "contributorName": "Asha Contributor",
    "mentorName": "Ravi Mentor",
    "round": 1,
    "totalRounds": 3,
    "submittedAt": "2026-06-10T09:00:00+00:00",
    "mentorAcceptedAt": "2026-06-10T12:30:00+00:00",
    "mentorOverall": 4.2,
    "mentorNote": "Mentor cleared — clean component split, minor a11y nits noted.",
    "contributorCoverNote": "Reworked the hero per the brief; added aria labels.",
    "criteriaValidatedCount": 3,
    "criteria": [
        {"id": "c1", "label": "Matches design spec", "validated": True},
        {"id": "c2", "label": "Responsive 320–1440px", "validated": True},
        {"id": "c3", "label": "WCAG AA contrast", "validated": True},
    ],
    "evidence": [
        {"id": "e1", "kind": "link", "label": "Preview deploy", "url": "https://example.com/preview"},
        {"id": "e2", "kind": "image", "label": "Lighthouse report", "url": "https://example.com/lh.png"},
    ],
}

conn = get_pg_connection()
with conn.cursor(cursor_factory=RealDictCursor) as cur:
    cur.execute(
        "SELECT id FROM reviewer_assignments WHERE reviewer_id=%s AND title=%s",
        (rid, SEED_TITLE),
    )
    existing = cur.fetchone()
    if existing:
        print(f"[seed] assignment already exists (id={existing['id']}) — left untouched")
    else:
        cur.execute(
            """
            INSERT INTO reviewer_assignments
                (reviewer_id, reviewer_email, project_id, project_name, title, status, priority, data)
            VALUES (%s,%s,%s,%s,%s,'pending','high',%s)
            RETURNING id
            """,
            (rid, EMAIL, "proj-fayaz-web", "Fayaz Test Tenant — Web Revamp",
             SEED_TITLE, Json(data)),
        )
        new_id = cur.fetchone()["id"]
        conn.commit()
        print(f"[seed] created reviewer_assignment id={new_id} for reviewer {rid} ({EMAIL})")
