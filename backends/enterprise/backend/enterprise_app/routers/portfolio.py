"""Portfolio + projects.

Unlike the rest of the service, /api/v1/portfolio and /api/v1/projects return
the contract shape DIRECTLY (no {success,message,data} envelope).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException

from shared.deps import get_current_user

from enterprise_app import db
from enterprise_app.seed import ensure_demo_data

portfolio_router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])
projects_router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


def _load_project(project_id: str, owner_id: str) -> dict:
    row = db.get_row("project", project_id, owner_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return row


@portfolio_router.get("/projects")
def portfolio_projects(user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    projects = db.list_rows("project", user["id"])
    return {"projects": projects}


@projects_router.get("/{project_id}/team-composition")
def team_composition(project_id: str, user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    row = _load_project(project_id, user["id"])
    return row.get("teamComposition", {"members": [], "openRoles": []})


@projects_router.get("/{project_id}/skill-coverage")
def skill_coverage(project_id: str, user: Annotated[dict, Depends(get_current_user)]):
    ensure_demo_data(user)
    row = _load_project(project_id, user["id"])
    return row.get("skillCoverage", {"skills": [], "overall": 0})


@projects_router.post("/{project_id}/skill-review-request")
def skill_review_request(project_id: str, user: Annotated[dict, Depends(get_current_user)],
                         body: dict = Body(default={})):
    row = _load_project(project_id, user["id"])
    request = {
        "id": db.new_id("srr_"),
        "projectId": project_id,
        "requestedBy": user.get("email"),
        "requestedAt": db.now_iso(),
        "status": "pending",
        "payload": body,
    }
    row.setdefault("skillReviewRequests", []).append(request)
    row["updatedAt"] = db.now_iso()
    db.update_row("project", project_id, row, user["id"])
    return request
