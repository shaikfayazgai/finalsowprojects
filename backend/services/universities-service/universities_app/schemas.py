"""Pydantic request/response models for the universities service."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ── Universities (tenants kind='university') ─────────────────────────────────

class UniversityCreate(BaseModel):
    name: str = Field(..., min_length=1)
    id: str | None = None  # optional explicit tenant id; otherwise slugified
    metadata: dict[str, Any] = Field(default_factory=dict)


class UniversityOut(BaseModel):
    id: str
    name: str
    kind: str
    metadata: dict[str, Any]
    is_active: bool
    created_at: str | None = None


# ── Students / faculty (login_accounts) ──────────────────────────────────────

class StudentCreate(BaseModel):
    email: EmailStr
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    department: str | None = None
    segment: str | None = None  # contributor_profiles.segment (optional)
    send_credentials: bool = True


class StudentUpdate(BaseModel):
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    department: str | None = None
    is_active: bool | None = None
    segment: str | None = None


class AccountOut(BaseModel):
    id: int
    email: str
    name: str
    first_name: str
    last_name: str
    role: str
    phone: str | None = None
    tenant_id: str | None = None
    department: str | None = None
    is_active: bool
    must_change_password: bool
    segment: str | None = None
    created_at: str | None = None
