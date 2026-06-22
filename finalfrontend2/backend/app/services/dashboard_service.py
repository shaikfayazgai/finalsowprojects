"""
Dashboard service — all database queries for the admin dashboard.

Storage architecture:
  PostgreSQL  →  ALL operational data
                   Tenant, Mentor, Sow, SafetyReport, KycCheck,
                   PayoutRecord, AuditEvent, system_health (custom table)
  MongoDB     →  AI / vector data ONLY
                   platform_signals (AI-computed insight cards)

Response shape matches MockAdminDashboard (frontend/src/mocks/admin/dashboard.ts)
so the API is a drop-in replacement for the frontend mock.
"""

import asyncio
from datetime import datetime, timedelta

import asyncpg
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.dashboard import (
    ActionBreakdown,
    AiSignal,
    AttentionItem,
    DashboardResponse,
    Kpis,
    OperatorSnapshotResponse,
    Pipeline,
    PlatformGlanceResponse,
    RecentItem,
)

# SLA windows (hours)
_SLA = {"governance": 4, "kyc": 8}

_GOV_OPEN   = ("open", "triaging")
_KYC_ACTIVE = ("pending", "submitted", "under_review")
_SOW_ACTIVE = ("draft", "approval", "approved")


def _now() -> datetime:
    """Naive UTC datetime — asyncpg requires naive for TIMESTAMP WITHOUT TIME ZONE."""
    return datetime.utcnow()


# ── Shared query helpers ──────────────────────────────────────────────────────

async def _fetch_kpis(conn: asyncpg.Connection, mongo_db: AsyncIOMotorDatabase) -> Kpis:
    """
    PostgreSQL: tenant count, mentor count, active SOW count.
    PostgreSQL system_health table: services up / total.
    MongoDB: NOT used here — system_health is operational data → PostgreSQL.
    """
    tenants = await conn.fetchval(
        'SELECT COUNT(*) FROM "Tenant" WHERE status = $1 AND "deletedAt" IS NULL',
        "active",
    ) or 0

    mentors = await conn.fetchval(
        'SELECT COUNT(*) FROM "Mentor" WHERE status = $1',
        "active",
    ) or 0

    active_sows = await conn.fetchval(
        'SELECT COUNT(*) FROM "Sow" WHERE status = ANY($1)',
        list(_SOW_ACTIVE),
    ) or 0

    # Services from system_health table in PostgreSQL
    services_total = await conn.fetchval(
        "SELECT COUNT(*) FROM system_health WHERE service_type = $1",
        "service",
    ) or 0

    services_up = await conn.fetchval(
        "SELECT COUNT(*) FROM system_health WHERE service_type = $1 AND status = $2",
        "service", "healthy",
    ) or 0

    # Fallback when table not yet seeded
    if services_total == 0:
        services_total = 12
        services_up = 12

    return Kpis(
        servicesUp=int(services_up),
        servicesTotal=int(services_total),
        tenants=int(tenants),
        mentors=int(mentors),
        activeSows=int(active_sows),
    )


async def _fetch_pipeline(conn: asyncpg.Connection) -> Pipeline:
    """All counts from PostgreSQL operational tables."""
    tenants_active = await conn.fetchval(
        'SELECT COUNT(*) FROM "Tenant" WHERE status = $1 AND "deletedAt" IS NULL',
        "active",
    ) or 0

    commercial_gate = await conn.fetchval(
        'SELECT COUNT(*) FROM "Sow" WHERE status = $1',
        "approval",
    ) or 0

    governance_open = await conn.fetchval(
        'SELECT COUNT(*) FROM "SafetyReport" WHERE status = ANY($1) AND "deletedAt" IS NULL',
        list(_GOV_OPEN),
    ) or 0

    kyc_pending = await conn.fetchval(
        'SELECT COUNT(*) FROM "KycCheck" WHERE status = ANY($1)',
        list(_KYC_ACTIVE),
    ) or 0

    mentors_active = await conn.fetchval(
        'SELECT COUNT(*) FROM "Mentor" WHERE status = $1',
        "active",
    ) or 0

    return Pipeline(
        tenantsActive=int(tenants_active),
        commercialGate=int(commercial_gate),
        governanceOpen=int(governance_open),
        kycPending=int(kyc_pending),
        mentorsActive=int(mentors_active),
    )


async def _fetch_action_breakdown(conn: asyncpg.Connection) -> ActionBreakdown:
    """All counts from PostgreSQL operational tables."""
    thirty_days_ago = _now() - timedelta(days=30)

    resolved_30d = await conn.fetchval(
        '''SELECT COUNT(*) FROM "SafetyReport"
           WHERE status = ANY($1) AND "decidedAt" >= $2''',
        ["resolved", "dismissed"], thirty_days_ago,
    ) or 0

    escalated = await conn.fetchval(
        'SELECT COUNT(*) FROM "SafetyReport" WHERE status = $1',
        "escalated_external",
    ) or 0

    on_hold = await conn.fetchval(
        'SELECT COUNT(*) FROM "PayoutRecord" WHERE status = $1 AND "deletedAt" IS NULL',
        "on_hold",
    ) or 0

    return ActionBreakdown(
        resolved30d=int(resolved_30d),
        escalated=int(escalated),
        onHold=int(on_hold),
    )


async def _fetch_attention(
    conn: asyncpg.Connection,
    mongo_db: AsyncIOMotorDatabase,
) -> list[AttentionItem]:
    """
    Governance cases + KYC → PostgreSQL (SafetyReport, KycCheck).
    Payment rail alerts + system alerts → PostgreSQL system_health table.
    MongoDB is NOT used here.
    """
    now = _now()
    items: list[AttentionItem] = []

    # --- Governance (PostgreSQL) ---
    gov_count = await conn.fetchval(
        'SELECT COUNT(*) FROM "SafetyReport" WHERE status = ANY($1) AND "deletedAt" IS NULL',
        list(_GOV_OPEN),
    ) or 0

    if gov_count > 0:
        oldest = await conn.fetchrow(
            '''SELECT "createdAt" FROM "SafetyReport"
               WHERE status = ANY($1) AND "deletedAt" IS NULL
               ORDER BY "createdAt" ASC LIMIT 1''',
            list(_GOV_OPEN),
        )
        hours_old = int((now - oldest["createdAt"]).total_seconds() / 3600)
        items.append(AttentionItem(
            id="att-gov-1",
            kind="governance",
            title=f"{int(gov_count)} governance case{'s' if int(gov_count) != 1 else ''} assigned",
            entity=f"Oldest · {hours_old}h",
            href="/admin/governance",
            slaHours=_SLA["governance"],
        ))

    # --- KYC (PostgreSQL) ---
    kyc_count = await conn.fetchval(
        'SELECT COUNT(*) FROM "KycCheck" WHERE status = ANY($1)',
        list(_KYC_ACTIVE),
    ) or 0

    if kyc_count > 0:
        oldest_kyc = await conn.fetchrow(
            '''SELECT COALESCE("submittedAt", "createdAt") AS ref_at
               FROM "KycCheck" WHERE status = ANY($1)
               ORDER BY ref_at ASC LIMIT 1''',
            list(_KYC_ACTIVE),
        )
        hours_elapsed = (now - oldest_kyc["ref_at"]).total_seconds() / 3600
        sla_remaining = max(0, int(_SLA["kyc"] - hours_elapsed))
        items.append(AttentionItem(
            id="att-kyc-1",
            kind="kyc",
            title=f"{int(kyc_count)} KYC review{'s' if int(kyc_count) != 1 else ''} pending",
            entity=f"SLA · {sla_remaining}h remaining",
            href="/admin/kyc",
            slaHours=sla_remaining,
        ))

    # --- Degraded payment rail (PostgreSQL system_health) ---
    rail = await conn.fetchrow(
        '''SELECT title, entity, href FROM system_health
           WHERE service_type = $1 AND status = $2
           ORDER BY updated_at DESC LIMIT 1''',
        "payment_rail", "degraded",
    )
    if rail:
        items.append(AttentionItem(
            id="att-rail-1",
            kind="rail",
            title=rail["title"] or "Payment rail degraded",
            entity=rail["entity"] or "Status · degraded",
            href=rail["href"] or "/admin/payment-rails",
        ))

    # --- Down system service (PostgreSQL system_health) ---
    sys_down = await conn.fetchrow(
        '''SELECT service_name, title, entity, href FROM system_health
           WHERE service_type = $1 AND status = $2
           ORDER BY updated_at DESC LIMIT 1''',
        "service", "down",
    )
    if sys_down:
        items.append(AttentionItem(
            id="att-sys-1",
            kind="system",
            title=sys_down["title"] or f"Service '{sys_down['service_name']}' down",
            entity=sys_down["entity"] or "Status · down",
            href=sys_down["href"] or "/admin/system-health",
        ))

    return items


_RESOURCE_KIND: dict[str, str] = {
    "tenant": "tenant",
    "mentor": "mentor",
    "agent": "ai",
    "prompt": "ai",
    "prompt_template": "ai",
    "skill": "skill",
    "payment_rail": "rail",
    "payout": "rail",
    "payout_record": "rail",
}


def _resource_kind(resource_type: str) -> str:
    return _RESOURCE_KIND.get(resource_type.lower(), "rail")


def _event_text(action: str, resource_type: str, resource_label: str | None) -> str:
    label = resource_label or resource_type.replace("_", " ").title()
    parts = action.split(".")
    verb = parts[-1].capitalize() if parts else action.capitalize()
    resource = parts[0].replace("_", " ").title() if len(parts) > 1 else resource_type.title()
    subject = f"'{label}'" if label and label.lower() != resource.lower() else resource
    return f"{resource} {subject} — {verb}"


async def _fetch_recent(conn: asyncpg.Connection, limit: int = 5) -> list[RecentItem]:
    """AuditEvent from PostgreSQL."""
    rows = await conn.fetch(
        '''SELECT action, "resourceType", "resourceLabel", timestamp
           FROM "AuditEvent"
           ORDER BY timestamp DESC
           LIMIT $1''',
        limit,
    )
    return [
        RecentItem(
            at=row["timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ"),
            text=_event_text(row["action"], row["resourceType"], row["resourceLabel"]),
            kind=_resource_kind(row["resourceType"]),  # type: ignore[arg-type]
        )
        for row in rows
    ]


async def _fetch_ai_signals(mongo_db: AsyncIOMotorDatabase) -> list[AiSignal]:
    """
    MongoDB ONLY — platform_signals collection stores AI-computed vector insights.
    This is the only query that touches MongoDB.
    """
    docs = await mongo_db["platform_signals"].find(
        {}, {"_id": 0}
    ).sort("computed_at", -1).limit(10).to_list(length=10)

    return [
        AiSignal(
            id=doc["id"],
            tone=doc.get("tone", "neutral"),
            title=doc.get("title", ""),
            description=doc.get("description", ""),
            href=doc.get("href", "/admin"),
        )
        for doc in docs
        if doc.get("id") and doc.get("title")
    ]


# ── Public endpoint functions ─────────────────────────────────────────────────

async def get_operator_snapshot(
    pool: asyncpg.Pool,
    mongo_db: AsyncIOMotorDatabase,
) -> OperatorSnapshotResponse:
    """
    inQueue   = attention.length  (distinct problem groups)
    withinSla = attention items where slaHours <= 8
    resolved30d + heldPayouts from actionBreakdown (PostgreSQL)
    """
    async with pool.acquire() as conn:
        attention_items, action_bd = await asyncio.gather(
            _fetch_attention(conn, mongo_db),
            _fetch_action_breakdown(conn),
        )

    return OperatorSnapshotResponse(
        inQueue=len(attention_items),
        withinSla=sum(
            1 for a in attention_items
            if a.slaHours is not None and a.slaHours <= 8
        ),
        resolved30d=action_bd.resolved30d,
        heldPayouts=action_bd.onHold,
    )


async def get_platform_glance(
    pool: asyncpg.Pool,
    mongo_db: AsyncIOMotorDatabase,
) -> PlatformGlanceResponse:
    async with pool.acquire() as conn:
        kpis, pipeline = await asyncio.gather(
            _fetch_kpis(conn, mongo_db),
            _fetch_pipeline(conn),
        )
    return PlatformGlanceResponse(kpis=kpis, pipeline=pipeline)


async def get_next_actions(
    pool: asyncpg.Pool,
    mongo_db: AsyncIOMotorDatabase,
) -> list[AttentionItem]:
    async with pool.acquire() as conn:
        return await _fetch_attention(conn, mongo_db)


async def get_recent_activity(pool: asyncpg.Pool, limit: int = 10) -> list[RecentItem]:
    async with pool.acquire() as conn:
        return await _fetch_recent(conn, limit)


async def get_ai_signals(mongo_db: AsyncIOMotorDatabase) -> list[AiSignal]:
    return await _fetch_ai_signals(mongo_db)


# ── Full dashboard ────────────────────────────────────────────────────────────

async def get_full_dashboard(
    pool: asyncpg.Pool,
    mongo_db: AsyncIOMotorDatabase,
    env: str = "PROD",
) -> DashboardResponse:
    async with pool.acquire() as conn:
        kpis, pipeline, action_bd, attention, recent = await asyncio.gather(
            _fetch_kpis(conn, mongo_db),
            _fetch_pipeline(conn),
            _fetch_action_breakdown(conn),
            _fetch_attention(conn, mongo_db),
            _fetch_recent(conn, limit=5),
        )

    ai_signals = await _fetch_ai_signals(mongo_db)

    return DashboardResponse(
        env=env,  # type: ignore[arg-type]
        kpis=kpis,
        pipeline=pipeline,
        actionBreakdown=action_bd,
        attention=attention,
        recent=recent,
        aiSignals=ai_signals,
        generatedAt=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


# ── Upsert helpers ────────────────────────────────────────────────────────────

async def upsert_ai_signal(
    mongo_db: AsyncIOMotorDatabase,
    signal_id: str,
    tone: str,
    title: str,
    description: str,
    href: str,
) -> None:
    """Writes to MongoDB — AI/vector data."""
    await mongo_db["platform_signals"].update_one(
        {"id": signal_id},
        {"$set": {
            "id": signal_id, "tone": tone, "title": title,
            "description": description, "href": href,
            "computed_at": datetime.utcnow(),
        }},
        upsert=True,
    )


async def upsert_system_health(
    pool: asyncpg.Pool,
    service_id: str,
    service_name: str,
    status: str,
    service_type: str = "service",
    title: str | None = None,
    entity: str | None = None,
    href: str | None = None,
) -> None:
    """Writes to PostgreSQL system_health table — operational data."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO system_health
                (service_id, service_name, status, service_type, title, entity, href, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (service_id) DO UPDATE SET
                service_name = EXCLUDED.service_name,
                status       = EXCLUDED.status,
                service_type = EXCLUDED.service_type,
                title        = EXCLUDED.title,
                entity       = EXCLUDED.entity,
                href         = EXCLUDED.href,
                updated_at   = NOW()
            """,
            service_id, service_name, status, service_type, title, entity, href,
        )
