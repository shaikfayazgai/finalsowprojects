"""
Stub endpoints for admin portal features that are not yet fully implemented.
These return empty but valid-shaped data so the frontend doesn't crash with 404s.
As real backends are developed, replace these stubs with actual implementations.
"""

from fastapi import APIRouter

router = APIRouter(tags=["stubs"])


# ── Identity ─────────────────────────────────────────────────────────────

@router.get("/api/superadmin/me")
async def admin_me():
    return {"profile": {"id": "", "email": "", "name": "", "role": "super_admin"}}


# ── Tenants ──────────────────────────────────────────────────────────────

@router.get("/api/superadmin/tenants")
async def list_tenants():
    return {"items": [], "counts": {"all": 0, "active": 0, "provisioning": 0, "paused": 0}}


@router.get("/api/superadmin/tenants/{tenant_id}")
async def get_tenant(tenant_id: str):
    return {"tenant": {"id": tenant_id, "name": ""}, "users": [], "provisioning": []}


# ── Mentor pools ─────────────────────────────────────────────────────────

@router.get("/api/superadmin/mentors/pools")
async def list_mentor_pools():
    return {"items": [], "mentors": []}


@router.get("/api/superadmin/mentors/pools/{pool_id}")
async def get_mentor_pool(pool_id: str):
    return {"pool": {"id": pool_id, "name": ""}, "members": []}


# ── Skill taxonomy ───────────────────────────────────────────────────────

@router.get("/api/superadmin/skill-taxonomy")
async def list_skills():
    return {"items": []}


@router.get("/api/superadmin/skill-taxonomy/{skill_id}")
async def get_skill(skill_id: str):
    return {"skill": {"id": skill_id, "name": ""}}


# ── Rubric templates ─────────────────────────────────────────────────────

@router.get("/api/superadmin/rubric-templates")
async def list_rubric_templates():
    return {"items": []}


@router.get("/api/superadmin/rubric-templates/{template_id}")
async def get_rubric_template(template_id: str):
    return {"template": {"id": template_id, "name": ""}}


# ── Governance ───────────────────────────────────────────────────────────

@router.get("/api/superadmin/governance")
async def list_governance_cases():
    return {"items": [], "summary": {"openAssignedToMe": 0, "unassigned": 0, "closedLast30d": 0}}


@router.get("/api/superadmin/governance/{case_id}")
async def get_governance_case(case_id: str):
    return {"case": {"id": case_id, "status": "open"}}


# ── AI agents + prompts ──────────────────────────────────────────────────

@router.get("/api/superadmin/ai")
async def list_ai_agents():
    return {"items": []}


@router.get("/api/superadmin/ai/{agent_id}")
async def get_ai_agent(agent_id: str):
    return {"agent": {"id": agent_id, "name": ""}, "activePrompt": None}


@router.get("/api/superadmin/ai/prompts")
async def list_prompts():
    return {"items": [], "agents": []}


@router.get("/api/superadmin/ai/prompts/{prompt_id}")
async def get_prompt(prompt_id: str):
    return {"prompt": {"id": prompt_id, "name": ""}, "agent": None}


# ── Payment rails ────────────────────────────────────────────────────────

@router.get("/api/superadmin/payment-rails")
async def list_payment_rails():
    return {"items": []}


@router.get("/api/superadmin/payment-rails/{rail_id}")
async def get_payment_rail(rail_id: str):
    return {"rail": {"id": rail_id, "name": ""}}


# ── System health ────────────────────────────────────────────────────────

@router.get("/api/superadmin/system-health")
async def system_health():
    return {"services": [], "alerts": []}


# ── Partnerships ─────────────────────────────────────────────────────────

@router.get("/api/superadmin/partnerships/universities")
async def list_universities():
    return {"items": []}


@router.get("/api/superadmin/partnerships/universities/{uni_id}")
async def get_university(uni_id: str):
    return {"partner": {"id": uni_id, "name": ""}}


@router.get("/api/superadmin/partnerships/women-workforce")
async def list_ww_partners():
    return {"items": []}


@router.get("/api/superadmin/partnerships/women-workforce/{org_id}")
async def get_ww_partner(org_id: str):
    return {"partner": {"id": org_id, "name": ""}}


# ── Roles ────────────────────────────────────────────────────────────────

@router.get("/api/superadmin/roles")
async def list_roles():
    return {"items": []}
