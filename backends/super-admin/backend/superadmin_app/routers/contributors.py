"""
Super-admin Contributors directory — GET /api/superadmin/contributors/directory.

A single read-only endpoint that returns EVERY contributor account (the
freelancer / women / student / contributor umbrella) with its FULL profile and
ALL uploaded file references, so Glimmora super-admins can browse contributors
and open their documents for verification.

Data sources (all on the shared Neon DB, owned by the freelancer service):
  • login_accounts ............ identity, role, status, timestamps
  • contributor_profiles ...... profile (basics, professional, skills, links,
                                bank, verification, avatar) — incl. profile_extra
                                JSONB and application_data (Women-in-Tech docs)
  • contributor_projects ...... portfolio (url / video / screenshots[])
  • contributor_experience .... work / internship history
  • contributor_education ..... education history
  • contributor_skills ........ structured skill registry (level / category)
  • contributor_evidence ...... evidence links / files
  • contributor_uploads ....... task-workroom file uploads (real Blob URLs)
  • contributor_kyc ........... KYC status + data

PERFORMANCE: a fixed, small number of batched queries (NOT N+1). We fetch the
account list once, then ONE query per child table filtered by
`account_id = ANY(<all ids>)`, and stitch the rows together in Python. So the
whole directory is ~9 queries total regardless of how many contributors exist.

Every file the admin can open is collected into a flat `files[]` list on each
contributor, each entry labelled with a human `type` (avatar / id_document /
portfolio / portfolio_screenshot / evidence / task_upload / application_doc /
link) and a `category` (verification / portfolio / work / link) so the UI knows
what it is. Secrets (password hashes / mfa secrets / tokens) are never exposed.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor

from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_admin

router = APIRouter(tags=["superadmin-contributors"])

# The contributor umbrella: matches the same predicate used elsewhere in the
# super-admin backend (audit.py contributor-assignment pool).
_CONTRIB_WHERE = (
    "(role LIKE 'contributor%' OR role IN ('freelancer','women','student'))"
)


def _conn():
    ensure_pg_clean()
    return get_pg_connection()


def _iso(v: Any) -> Any:
    return v.isoformat() if isinstance(v, datetime) else v


def _as_dict(v: Any) -> dict[str, Any]:
    """JSONB columns come back as dict already; tolerate str just in case."""
    if isinstance(v, dict):
        return v
    if isinstance(v, str) and v:
        try:
            parsed = json.loads(v)
            return parsed if isinstance(parsed, dict) else {}
        except (ValueError, TypeError):
            return {}
    return {}


def _is_http_url(v: Any) -> bool:
    return isinstance(v, str) and (v.startswith("http://") or v.startswith("https://"))


def _is_openable(v: Any) -> bool:
    """A reference the admin can actually open in a browser tab: an http(s) URL
    or an inline data: URL (base64 avatars saved by the wizard)."""
    return isinstance(v, str) and (
        v.startswith("http://") or v.startswith("https://") or v.startswith("data:")
    )


def _fetch_all(cur, sql: str, params: tuple) -> list[dict[str, Any]]:
    cur.execute(sql, params)
    return cur.fetchall()


def _build_files(
    acct_id: int,
    prof: dict[str, Any],
    projects: list[dict[str, Any]],
    evidence: list[dict[str, Any]],
    uploads: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Collect every file / openable reference for one contributor, labelled."""
    files: list[dict[str, Any]] = []
    extra = _as_dict(prof.get("profile_extra"))

    # 1) Avatar (data-URL or http URL saved to profile_extra.avatar_url).
    avatar = extra.get("avatar_url")
    if _is_openable(avatar):
        files.append({
            "type": "avatar",
            "category": "identity",
            "label": "Profile photo",
            "url": avatar,
            "openable": True,
        })

    # 2) Government ID document from the verification step. NOTE: in the current
    #    wizard this is often a FILENAME or inline data-URL (real Blob upload is
    #    being wired); we surface whatever is stored and flag openability so the
    #    UI can show "uploaded: <name>" when it isn't a clickable URL.
    verif = _as_dict(extra.get("verification"))
    id_doc = verif.get("idDocument")
    if id_doc:
        files.append({
            "type": "id_document",
            "category": "verification",
            "label": f"ID document ({verif.get('idType') or 'ID'})",
            "url": id_doc if _is_openable(id_doc) else None,
            "name": id_doc if not _is_openable(id_doc) else None,
            "openable": _is_openable(id_doc),
        })

    # 3) Verification / profile links (linkedin, github, portfolio, proof URL).
    links = _as_dict(extra.get("links"))
    link_labels = {
        "linkedin": "LinkedIn", "github": "GitHub", "portfolio": "Portfolio",
        "portfolioUrl": "Portfolio", "website": "Website", "proofUrl": "Proof / reference",
    }
    seen_links: set[str] = set()
    for key, lbl in link_labels.items():
        val = links.get(key)
        if _is_http_url(val) and val not in seen_links:
            seen_links.add(val)
            files.append({
                "type": "link",
                "category": "link",
                "label": lbl,
                "url": val,
                "openable": True,
            })
    # Also the dedicated linkedin column on the profile, if distinct.
    li = prof.get("linkedin")
    if _is_http_url(li) and li not in seen_links:
        seen_links.add(li)
        files.append({
            "type": "link", "category": "link", "label": "LinkedIn",
            "url": li, "openable": True,
        })

    # 4) Women-in-Tech application docs: application_data.docs[] = {url, filename}.
    app_data = _as_dict(prof.get("application_data"))
    for d in app_data.get("docs") or []:
        if not isinstance(d, dict):
            continue
        url = d.get("url")
        files.append({
            "type": "application_doc",
            "category": "verification",
            "label": d.get("filename") or "Application document",
            "url": url if _is_openable(url) else None,
            "name": d.get("filename"),
            "openable": _is_openable(url),
        })

    # 5) Portfolio projects: url, video, screenshots[].
    for p in projects:
        title = p.get("title") or "Portfolio project"
        for col, lbl in (("url", "Project link"), ("video", "Project video")):
            val = p.get(col)
            if _is_http_url(val):
                files.append({
                    "type": "portfolio",
                    "category": "portfolio",
                    "label": f"{title} — {lbl}",
                    "url": val,
                    "openable": True,
                })
        for shot in p.get("screenshots") or []:
            if _is_http_url(shot):
                files.append({
                    "type": "portfolio_screenshot",
                    "category": "portfolio",
                    "label": f"{title} — screenshot",
                    "url": shot,
                    "openable": True,
                })

    # 6) Evidence links / files.
    for e in evidence:
        val = e.get("url")
        if _is_openable(val):
            files.append({
                "type": "evidence",
                "category": "portfolio",
                "label": e.get("title") or "Evidence",
                "url": val,
                "openable": True,
            })

    # 7) Task-workroom uploads (real Blob URLs).
    for u in uploads:
        val = u.get("url")
        if _is_openable(val):
            files.append({
                "type": "task_upload",
                "category": "work",
                "label": u.get("filename") or "Work upload",
                "url": val,
                "content_type": u.get("content_type"),
                "size_bytes": u.get("size_bytes"),
                "openable": True,
            })

    return files


def _name(acct: dict[str, Any]) -> str:
    return (
        (acct.get("name") or "").strip()
        or f"{acct.get('first_name') or ''} {acct.get('last_name') or ''}".strip()
        or acct.get("email")
        or ""
    )


def _status(acct: dict[str, Any]) -> str:
    """Derive a coarse account status for the directory filter."""
    approval = (acct.get("approval_status") or "").lower()
    if approval == "rejected":
        return "rejected"
    if approval == "pending":
        return "pending"
    if acct.get("is_active") is False:
        return "inactive"
    return "active"


@router.get("/api/superadmin/contributors/directory")
async def list_contributors_directory(
    admin: Annotated[dict, Depends(get_current_admin)],
):
    """All contributors with full profile + every uploaded file reference.

    NOTE on path: the bare `/api/superadmin/contributors` is already taken by the
    lightweight task-assign candidate pool (audit.py). This richer
    document-verification directory therefore lives at `.../contributors/directory`
    so both coexist without collision (additive-only).

    Read-only. Batched (no N+1): the account list plus one query per child
    table keyed by `account_id = ANY(ids)`.
    """
    conn = _conn()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 1) Accounts (the contributor umbrella). Never select secrets.
        cur.execute(
            "SELECT id, email, first_name, last_name, name, role, phone, "
            "tenant_id, department, is_active, approval_status, email_verified, "
            "phone_verified, last_login_at, created_at, updated_at "
            f"FROM login_accounts WHERE {_CONTRIB_WHERE} "
            "ORDER BY created_at DESC"
        )
        accounts = cur.fetchall()
        ids = [a["id"] for a in accounts]

        if not ids:
            return {"contributors": [], "total": 0}

        # 2) Profiles (one row per account).
        profiles = {
            p["account_id"]: p
            for p in _fetch_all(
                cur, "SELECT * FROM contributor_profiles WHERE account_id = ANY(%s)", (ids,)
            )
        }
        # 3) KYC (one row per account).
        kyc = {
            k["account_id"]: k
            for k in _fetch_all(
                cur, "SELECT account_id, status, data, updated_at FROM contributor_kyc "
                "WHERE account_id = ANY(%s)", (ids,)
            )
        }
        # 4) Child collections — grouped in Python after a single query each.
        def _group(sql: str) -> dict[int, list[dict[str, Any]]]:
            out: dict[int, list[dict[str, Any]]] = {}
            for r in _fetch_all(cur, sql, (ids,)):
                out.setdefault(r["account_id"], []).append(r)
            return out

        projects = _group(
            "SELECT account_id, id, title, description, role, url, video, screenshots, "
            "skills, keywords, category, start_date, end_date, created_at "
            "FROM contributor_projects WHERE account_id = ANY(%s) ORDER BY created_at DESC"
        )
        experience = _group(
            "SELECT account_id, id, kind, organization, role, description, location, "
            "start_date, end_date, is_current, created_at "
            "FROM contributor_experience WHERE account_id = ANY(%s) ORDER BY created_at DESC"
        )
        education = _group(
            "SELECT account_id, id, institution, degree, field, grade, start_year, "
            "end_year, created_at FROM contributor_education WHERE account_id = ANY(%s) "
            "ORDER BY created_at DESC"
        )
        skills = _group(
            "SELECT account_id, slug, name, category, level, evidence_count "
            "FROM contributor_skills WHERE account_id = ANY(%s) ORDER BY created_at"
        )
        evidence = _group(
            "SELECT account_id, id, title, kind, url, status, created_at "
            "FROM contributor_evidence WHERE account_id = ANY(%s) ORDER BY created_at DESC"
        )
        uploads = _group(
            "SELECT account_id, id, filename, url, content_type, size_bytes, created_at "
            "FROM contributor_uploads WHERE account_id = ANY(%s) ORDER BY created_at DESC"
        )

    contributors: list[dict[str, Any]] = []
    for acct in accounts:
        aid = acct["id"]
        prof = profiles.get(aid) or {}
        extra = _as_dict(prof.get("profile_extra"))
        basic = _as_dict(extra.get("basic"))
        professional = _as_dict(extra.get("professional"))
        bank = _as_dict(extra.get("bank"))
        verif = _as_dict(extra.get("verification"))
        links = _as_dict(extra.get("links"))
        agreements = _as_dict(extra.get("agreements"))
        kyc_row = kyc.get(aid) or {}

        acct_projects = projects.get(aid, [])
        acct_evidence = evidence.get(aid, [])
        acct_uploads = uploads.get(aid, [])

        files = _build_files(aid, prof, acct_projects, acct_evidence, acct_uploads)

        contributors.append({
            # ── identity ──
            "id": str(aid),
            "accountId": aid,
            "email": acct.get("email"),
            "name": _name(acct),
            "firstName": acct.get("first_name") or basic.get("firstName") or "",
            "lastName": acct.get("last_name") or basic.get("lastName") or "",
            "phone": acct.get("phone") or extra.get("mobileNumber"),
            "role": acct.get("role"),
            "segment": prof.get("segment"),
            "tenantId": acct.get("tenant_id"),
            "department": acct.get("department"),
            "isActive": acct.get("is_active", True),
            "status": _status(acct),
            "approvalStatus": acct.get("approval_status"),
            "emailVerified": acct.get("email_verified", False),
            "phoneVerified": acct.get("phone_verified", False),
            "kycStatus": kyc_row.get("status") or "not_started",
            "profileCompleted": bool(prof.get("profile_completed")),
            "createdAt": _iso(acct.get("created_at")),
            "lastLoginAt": _iso(acct.get("last_login_at")),
            # ── basic / location ──
            "country": prof.get("country"),
            "city": prof.get("city"),
            "state": basic.get("state"),
            "pincode": basic.get("pincode"),
            "timezone": prof.get("timezone"),
            "languages": extra.get("languages") or [],
            "gender": prof.get("gender"),
            "dob": _iso(prof.get("dob")),
            # ── professional ──
            "bio": prof.get("bio"),
            "jobTitle": prof.get("job_title"),
            "careerStage": prof.get("career_stage"),
            "yearsExperience": prof.get("years_experience"),
            "availability": prof.get("availability"),
            "weeklyHours": float(prof["weekly_hours"]) if prof.get("weekly_hours") is not None else None,
            "professional": professional,
            # ── skills & expertise ──
            "primarySkills": prof.get("primary_skills") or [],
            "secondarySkills": prof.get("secondary_skills") or [],
            "otherSkills": prof.get("other_skills") or [],
            "expertiseAreas": prof.get("expertise_areas") or [],
            "skills": [
                {
                    "id": s.get("slug"), "name": s.get("name"),
                    "category": s.get("category"), "level": s.get("level"),
                    "evidenceCount": s.get("evidence_count"),
                }
                for s in skills.get(aid, [])
            ],
            # ── portfolio / experience / education ──
            "projects": [
                {
                    "id": p.get("id"), "title": p.get("title"),
                    "description": p.get("description"), "role": p.get("role"),
                    "url": p.get("url"), "video": p.get("video"),
                    "screenshots": p.get("screenshots") or [],
                    "skills": p.get("skills") or [], "keywords": p.get("keywords") or [],
                    "category": p.get("category"),
                    "startDate": p.get("start_date"), "endDate": p.get("end_date"),
                }
                for p in acct_projects
            ],
            "experience": [
                {
                    "id": e.get("id"), "kind": e.get("kind"),
                    "organization": e.get("organization"), "role": e.get("role"),
                    "description": e.get("description"), "location": e.get("location"),
                    "startDate": e.get("start_date"), "endDate": e.get("end_date"),
                    "isCurrent": e.get("is_current"),
                }
                for e in experience.get(aid, [])
            ],
            "education": [
                {
                    "id": ed.get("id"), "institution": ed.get("institution"),
                    "degree": ed.get("degree"), "field": ed.get("field"),
                    "grade": ed.get("grade"), "startYear": ed.get("start_year"),
                    "endYear": ed.get("end_year"),
                }
                for ed in education.get(aid, [])
            ],
            # ── verification / links / bank / agreements ──
            "linkedin": prof.get("linkedin"),
            "links": links,
            "verification": {
                "idType": verif.get("idType"),
                "idNumber": verif.get("idNumber"),
                "idDocument": verif.get("idDocument"),
            },
            "bank": bank,
            "agreements": agreements,
            "kyc": {
                "status": kyc_row.get("status") or "not_started",
                "data": _as_dict(kyc_row.get("data")),
                "updatedAt": _iso(kyc_row.get("updated_at")),
            },
            # ── ALL openable files for document verification ──
            "files": files,
            "fileCount": len(files),
        })

    return {"contributors": contributors, "total": len(contributors)}
