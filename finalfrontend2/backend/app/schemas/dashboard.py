"""
Pydantic schemas — shaped to match the frontend MockAdminDashboard TypeScript
interface exactly (same field names, same nesting) so the API response is a
drop-in replacement for the mock data.

TypeScript interface reference:
  frontend/src/mocks/admin/dashboard.ts  →  MockAdminDashboard
"""

from pydantic import BaseModel
from typing import Optional, Literal


# ── Sub-objects that mirror the TS interface ──────────────────────────────────

class Kpis(BaseModel):
    """Maps to MockAdminDashboard.kpis — used by Platform Glance tiles."""
    servicesUp: int
    servicesTotal: int
    tenants: int
    mentors: int
    activeSows: int


class Pipeline(BaseModel):
    """Maps to MockAdminDashboard.pipeline — open/pending counts per domain."""
    tenantsActive: int
    commercialGate: int
    governanceOpen: int
    kycPending: int
    mentorsActive: int


class ActionBreakdown(BaseModel):
    """Maps to MockAdminDashboard.actionBreakdown — shown in Operator Snapshot bar."""
    resolved30d: int
    escalated: int
    onHold: int


class AttentionItem(BaseModel):
    """
    One card in the Next Action / Also Pending queue.
    Maps to MockAdminAttentionItem.
    """
    id: str
    kind: Literal["governance", "kyc", "rail", "system"]
    title: str
    entity: str
    href: str
    slaHours: Optional[int] = None


class RecentItem(BaseModel):
    """
    One row in the Recent Activity list.
    Maps to MockAdminDashboard.recent[].
    """
    at: str  # ISO-8601 UTC string
    text: str
    kind: Literal["tenant", "mentor", "ai", "skill", "rail"]


class AiSignal(BaseModel):
    """
    One AI insight card.
    Maps to MockAdminDashboard.aiSignals[].
    """
    id: str
    tone: Literal["positive", "neutral", "warning"]
    title: str
    description: str
    href: str


# ── Full dashboard response — matches MockAdminDashboard exactly ──────────────

class DashboardResponse(BaseModel):
    """
    Full admin dashboard payload.
    Shape matches MockAdminDashboard so the frontend can use it as a
    drop-in replacement for MOCK_ADMIN_DASHBOARD.
    """
    env: Literal["PROD", "STAGING", "DEV"]
    kpis: Kpis
    pipeline: Pipeline
    actionBreakdown: ActionBreakdown
    attention: list[AttentionItem]
    recent: list[RecentItem]
    aiSignals: list[AiSignal]
    generatedAt: str


# ── Individual endpoint responses (granular APIs) ─────────────────────────────

class OperatorSnapshotResponse(BaseModel):
    """Returned by GET /operator-snapshot."""
    inQueue: int
    withinSla: int
    resolved30d: int
    heldPayouts: int


class PlatformGlanceResponse(BaseModel):
    """Returned by GET /platform-glance — mirrors full dashboard kpis + pipeline."""
    kpis: Kpis
    pipeline: Pipeline


# ── Seed / write payloads ─────────────────────────────────────────────────────

class UpsertAiSignalRequest(BaseModel):
    id: str
    tone: Literal["positive", "neutral", "warning"]
    title: str
    description: str
    href: str


class UpsertSystemHealthRequest(BaseModel):
    service_id: str
    service_name: str
    status: Literal["healthy", "degraded", "down"]
    service_type: Literal["service", "payment_rail"] = "service"
    title: Optional[str] = None
    entity: Optional[str] = None
    href: Optional[str] = None
