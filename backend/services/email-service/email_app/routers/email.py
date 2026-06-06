"""
Email router — /api/email/**

  POST   /api/email/send                 send an email (any authenticated user)
  GET    /api/email/templates            list all templates (admin)
  PUT    /api/email/templates            upsert a template by key (admin)
  GET    /api/email/templates/{key}      fetch one template (admin)
  DELETE /api/email/templates/{key}      delete a template (admin)
  POST   /api/email/templates/{key}/test send a test render to an address (admin)

Uses shared.mailer for the actual SMTP delivery and Postgres for template storage.
"""

from __future__ import annotations

import re
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from shared.audit import write_audit
from shared.deps import get_current_admin, get_current_user
from shared.mailer import send_bulk_email, send_email

from email_app import repo
from email_app.schemas import (
    SendEmailRequest,
    TemplateTestRequest,
    TemplateUpsertRequest,
)

router = APIRouter(prefix="/api/email", tags=["email"])

_PLACEHOLDER = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


def _render(template: str, variables: dict[str, Any]) -> str:
    """Substitute {{name}} placeholders with provided variables (missing → blank)."""
    def _sub(match: re.Match[str]) -> str:
        return str(variables.get(match.group(1), ""))

    return _PLACEHOLDER.sub(_sub, template or "")


def _wrap_html(*, body_html: str, header_color: str | None, footer_text: str | None) -> str:
    """Wrap a template body in a branded shell using its header colour + footer."""
    header = header_color or "#0D1B2A"
    footer = footer_text or "— The Glimmora Team"
    return f"""\
<div style="font-family:Poppins,Arial,sans-serif;max-width:600px;margin:auto;color:#374151">
  <div style="background:{header};height:8px;border-radius:8px 8px 0 0"></div>
  <div style="padding:24px 8px">{body_html}</div>
  <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">{footer}</p>
</div>"""


# ── Send ──────────────────────────────────────────────────────────────────────

@router.post("/send")
def send(
    payload: SendEmailRequest,
    user: Annotated[dict, Depends(get_current_user)],
) -> dict[str, Any]:
    subject = payload.subject or ""
    html = payload.html
    text = payload.body or (re.sub(r"<[^>]+>", "", html) if html else "")

    recipients = payload.to if isinstance(payload.to, list) else [payload.to]
    recipients = [r for r in (recipients or []) if r]
    if not recipients:
        raise HTTPException(status_code=400, detail="No recipients provided")

    message_id = uuid.uuid4().hex

    if len(recipients) == 1:
        ok = send_email(
            to_email=recipients[0],
            subject=subject,
            body=text,
            html=html,
            category=payload.category,
        )
        result = {"success": bool(ok), "messageId": message_id if ok else None}
        if not ok:
            result["error"] = "Email not sent (delivery failed or SMTP not configured)"
    else:
        messages = [
            {"to_email": r, "subject": subject, "body": text, "html": html}
            for r in recipients
        ]
        outcomes = send_bulk_email(messages, category=payload.category)
        sent_any = any(o.get("sent") for o in outcomes)
        result = {
            "success": sent_any,
            "messageId": message_id if sent_any else None,
            "results": outcomes,
        }
        if not sent_any:
            result["error"] = "No emails were delivered"

    write_audit(
        actor_id=user.get("id"),
        actor_email=user.get("email"),
        actor_role=user.get("role"),
        action="email.send",
        target="email",
        details=subject,
        service="email-service",
        tenant_id=user.get("tenant_id"),
        extra={"recipients": recipients, "category": payload.category, "success": result["success"]},
    )
    return result


# ── Template CRUD ───────────────────────────────────────────────────────────--

@router.get("/templates")
def list_templates(
    admin: Annotated[dict, Depends(get_current_admin)],
) -> list[dict[str, Any]]:
    return repo.list_templates()


@router.put("/templates")
def upsert_template(
    payload: TemplateUpsertRequest,
    admin: Annotated[dict, Depends(get_current_admin)],
) -> dict[str, Any]:
    key = (payload.key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="Template key is required")
    row = repo.upsert_template(
        key=key,
        subject=payload.subject,
        body_html=payload.body_html,
        header_color=payload.header_color,
        footer_text=payload.footer_text,
    )
    write_audit(
        actor_id=admin.get("id"),
        actor_email=admin.get("email"),
        actor_role=admin.get("role"),
        action="email.template.upsert",
        target="email_template",
        target_id=key,
        service="email-service",
        tenant_id=admin.get("tenant_id"),
    )
    return row


@router.get("/templates/{key}")
def get_template(
    key: str,
    admin: Annotated[dict, Depends(get_current_admin)],
) -> dict[str, Any]:
    row = repo.get_template(key)
    if row is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return row


@router.delete("/templates/{key}")
def delete_template(
    key: str,
    admin: Annotated[dict, Depends(get_current_admin)],
) -> dict[str, Any]:
    if not repo.delete_template(key):
        raise HTTPException(status_code=404, detail="Template not found")
    write_audit(
        actor_id=admin.get("id"),
        actor_email=admin.get("email"),
        actor_role=admin.get("role"),
        action="email.template.delete",
        target="email_template",
        target_id=key,
        service="email-service",
        tenant_id=admin.get("tenant_id"),
    )
    return {"success": True, "key": key}


@router.post("/templates/{key}/test")
def test_template(
    key: str,
    payload: TemplateTestRequest,
    admin: Annotated[dict, Depends(get_current_admin)],
) -> dict[str, Any]:
    template = repo.get_template(key)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    recipient = payload.recipient
    if not recipient:
        raise HTTPException(status_code=400, detail="A 'to' or 'to_email' address is required")

    variables = payload.variables or {}
    subject = _render(template.get("subject") or "", variables)
    rendered_body = _render(template.get("body_html") or "", variables)
    html = _wrap_html(
        body_html=rendered_body,
        header_color=template.get("header_color"),
        footer_text=template.get("footer_text"),
    )
    text = re.sub(r"<[^>]+>", "", rendered_body)

    ok = send_email(
        to_email=recipient,
        subject=subject or f"[Test] {key}",
        body=text,
        html=html,
        category="template-test",
    )
    write_audit(
        actor_id=admin.get("id"),
        actor_email=admin.get("email"),
        actor_role=admin.get("role"),
        action="email.template.test",
        target="email_template",
        target_id=key,
        details=recipient,
        service="email-service",
        tenant_id=admin.get("tenant_id"),
    )
    result: dict[str, Any] = {"success": bool(ok), "messageId": uuid.uuid4().hex if ok else None}
    if not ok:
        result["error"] = "Test email not sent (delivery failed or SMTP not configured)"
    return result
