"""Pydantic request/response models for the email service."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class SendEmailRequest(BaseModel):
    to: str | list[str]
    subject: str
    html: str | None = None
    react: Any | None = None  # ignored; accepted for frontend compatibility
    body: str | None = None  # plain-text fallback
    category: str | None = None


class TemplateUpsertRequest(BaseModel):
    key: str
    subject: str
    body_html: str = ""
    header_color: str | None = None
    footer_text: str | None = None


class TemplateTestRequest(BaseModel):
    to: str | None = None
    to_email: str | None = None    # alias for frontend compatibility
    # optional per-render variables substituted into {{name}}-style placeholders
    variables: dict[str, Any] = Field(default_factory=dict)

    @property
    def recipient(self) -> str:
        return (self.to or self.to_email or "").strip()
