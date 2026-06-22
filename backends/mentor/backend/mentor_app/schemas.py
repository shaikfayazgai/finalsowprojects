"""Pydantic request/response models for the mentor service."""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class DecisionRequest(BaseModel):
    # accept → requirement check passed (→ reviewer QA); rework → returned to
    # contributor to fix; reject → requirement check FAILED (terminal); escalate.
    decision: Literal["accept", "rework", "reject", "escalate"]
    score: Optional[float] = None
    comments: Optional[str] = None


class MenteeNoteRequest(BaseModel):
    body: str = Field(min_length=1)
    attachments: list[dict[str, Any]] = Field(default_factory=list)


class EscalationCreateRequest(BaseModel):
    subject: str = Field(min_length=1)
    category: str = "general"
    priority: str = "normal"
    description: Optional[str] = None
    review_id: Optional[int] = None
    mentee_id: Optional[int] = None
    meta: dict[str, Any] = Field(default_factory=dict)


class EscalationUpdateRequest(BaseModel):
    status: Optional[Literal["open", "in_progress", "resolved", "closed"]] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    note: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    timezone: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None
    links: Optional[dict[str, Any]] = None
    # Mentorship intro shown to contributors — stored in settings JSONB
    # (no dedicated column); surfaced back via GET /profile settings.mentorshipIntro.
    mentorship_intro: Optional[str] = None


class SettingsUpdateRequest(BaseModel):
    settings: dict[str, Any]
