"""
Admin Dashboard Router
======================
All endpoints are prefixed with /api/v1/admin/dashboard (set in main.py).

GET  /                  Full dashboard — matches MockAdminDashboard shape exactly
GET  /operator-snapshot inQueue, withinSla, resolved30d, heldPayouts
GET  /next-actions      Attention queue items (governance, KYC, rail, system)
GET  /platform-glance   { kpis, pipeline } — matches d.kpis / d.pipeline in frontend
GET  /recent-activity   Last N AuditEvent rows
GET  /platform-signals  AI insight cards from MongoDB

POST /platform-signals  Upsert one AI signal (internal / AI pipeline)
POST /system-health     Upsert one service health entry (internal)
"""

from fastapi import APIRouter, Request, Query, status

from app.schemas.dashboard import (
    AiSignal,
    AttentionItem,
    DashboardResponse,
    OperatorSnapshotResponse,
    PlatformGlanceResponse,
    RecentItem,
    UpsertAiSignalRequest,
    UpsertSystemHealthRequest,
)
from app.services import dashboard_service

router = APIRouter(tags=["Admin · Dashboard"])


@router.get(
    "/",
    response_model=DashboardResponse,
    summary="Full dashboard",
    description=(
        "All dashboard sections in one call. "
        "Response shape matches MockAdminDashboard — drop-in replacement for the frontend mock. "
        "PostgreSQL and MongoDB are queried concurrently."
    ),
)
async def get_dashboard(request: Request) -> DashboardResponse:
    return await dashboard_service.get_full_dashboard(
        pool=request.app.state.pg_pool,
        mongo_db=request.app.state.mongo_db,
        env=request.app.state.app_env,
    )


@router.get(
    "/operator-snapshot",
    response_model=OperatorSnapshotResponse,
    summary="Operator snapshot",
    description=(
        "The four summary stats shown in the Operator Snapshot bar: "
        "inQueue, withinSla, resolved30d, heldPayouts."
    ),
)
async def get_operator_snapshot(request: Request) -> OperatorSnapshotResponse:
    return await dashboard_service.get_operator_snapshot(
        pool=request.app.state.pg_pool,
        mongo_db=request.app.state.mongo_db,
    )


@router.get(
    "/next-actions",
    response_model=list[AttentionItem],
    summary="Next actions (attention queue)",
    description=(
        "Ordered attention items for the operator today. "
        "Governance + KYC from PostgreSQL; degraded rails + down services from MongoDB."
    ),
)
async def get_next_actions(request: Request) -> list[AttentionItem]:
    return await dashboard_service.get_next_actions(
        pool=request.app.state.pg_pool,
        mongo_db=request.app.state.mongo_db,
    )


@router.get(
    "/platform-glance",
    response_model=PlatformGlanceResponse,
    summary="Platform glance (KPI tiles)",
    description=(
        "Returns { kpis, pipeline } matching the structure used by pulseBandForRole() "
        "in the frontend. kpis.servicesUp/servicesTotal come from MongoDB system_health."
    ),
)
async def get_platform_glance(request: Request) -> PlatformGlanceResponse:
    return await dashboard_service.get_platform_glance(
        pool=request.app.state.pg_pool,
        mongo_db=request.app.state.mongo_db,
    )


@router.get(
    "/recent-activity",
    response_model=list[RecentItem],
    summary="Recent platform activity",
    description="Most recent AuditEvent rows ordered by timestamp DESC. Default limit 10.",
)
async def get_recent_activity(
    request: Request,
    limit: int = Query(default=10, ge=1, le=100, description="Max rows to return"),
) -> list[RecentItem]:
    return await dashboard_service.get_recent_activity(
        pool=request.app.state.pg_pool,
        limit=limit,
    )


@router.get(
    "/platform-signals",
    response_model=list[AiSignal],
    summary="AI platform signals",
    description="AI insight cards from MongoDB platform_signals collection, sorted by computed_at DESC.",
)
async def get_platform_signals(request: Request) -> list[AiSignal]:
    return await dashboard_service.get_ai_signals(request.app.state.mongo_db)


@router.post(
    "/platform-signals",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Upsert a platform signal",
    description="Create or replace an AI insight card by id. For AI pipeline / internal tooling.",
)
async def upsert_platform_signal(
    request: Request,
    body: UpsertAiSignalRequest,
) -> None:
    await dashboard_service.upsert_ai_signal(
        mongo_db=request.app.state.mongo_db,
        signal_id=body.id,
        tone=body.tone,
        title=body.title,
        description=body.description,
        href=body.href,
    )


@router.post(
    "/system-health",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Upsert a service health entry",
    description=(
        "Create or update a service status in MongoDB system_health. "
        "service_type='service' for platform services, 'payment_rail' for Razorpay etc."
    ),
)
async def upsert_system_health(
    request: Request,
    body: UpsertSystemHealthRequest,
) -> None:
    await dashboard_service.upsert_system_health(
        pool=request.app.state.pg_pool,
        service_id=body.service_id,
        service_name=body.service_name,
        status=body.status,
        service_type=body.service_type,
        title=body.title,
        entity=body.entity,
        href=body.href,
    )
