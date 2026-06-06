"""Pydantic request/response models for the women-team service."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field


class TeamCreate(BaseModel):
    id: str | None = None          # optional caller-supplied ID
    name: str = Field(min_length=1)
    kind: str | None = None        # accepted but ignored (always women_team)
    metadata: dict[str, Any] | None = None


class MemberCreate(BaseModel):
    email: EmailStr
    firstName: str = ""
    lastName: str = ""
    name: str | None = None
    phone: str | None = None
    department: str | None = None
    jobTitle: str | None = None
    linkedin: str | None = None
    country: str | None = None
    careerStage: str | None = None
    primarySkills: list[str] | None = None
    sendCredentials: bool = True


class MemberUpdate(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    phone: str | None = None
    department: str | None = None
    isActive: bool | None = None
    jobTitle: str | None = None
    linkedin: str | None = None
    country: str | None = None
    careerStage: str | None = None


def team_out(row: dict[str, Any]) -> dict[str, Any]:
    created = row.get("created_at")
    return {
        "id": row["id"],
        "name": row["name"],
        "kind": row["kind"],
        "metadata": row.get("metadata") or {},
        "isActive": row.get("is_active", True),
        "memberCount": int(row.get("member_count", 0) or 0),
        "createdAt": created.isoformat() if hasattr(created, "isoformat") else created,
    }


def member_out(row: dict[str, Any]) -> dict[str, Any]:
    created = row.get("created_at")
    last_login = row.get("last_login_at")
    return {
        "id": row["id"],
        "email": row["email"],
        "firstName": row.get("first_name"),
        "lastName": row.get("last_name"),
        "name": row.get("name"),
        "role": row.get("role"),
        "phone": row.get("phone"),
        "tenantId": row.get("tenant_id"),
        "department": row.get("department"),
        "segment": row.get("segment"),
        "jobTitle": row.get("job_title"),
        "linkedin": row.get("linkedin"),
        "country": row.get("country"),
        "careerStage": row.get("career_stage"),
        "primarySkills": row.get("primary_skills") or [],
        "isActive": row.get("is_active", True),
        "mustChangePassword": row.get("must_change_password", False),
        "lastLoginAt": last_login.isoformat() if hasattr(last_login, "isoformat") else last_login,
        "createdAt": created.isoformat() if hasattr(created, "isoformat") else created,
    }
