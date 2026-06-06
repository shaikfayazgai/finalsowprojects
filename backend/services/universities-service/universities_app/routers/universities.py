"""
Universities router — /api/universities/**

A university is a tenant (tenants.kind='university'). Students and faculty are
login_accounts scoped by tenant_id. The headline feature is CSV/Excel bulk
import of students using the shared two-phase bulk-import engine.

All endpoints are protected: university admins (get_current_admin) manage their
tenant; any authenticated user (get_current_user) can read where appropriate.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)

from shared.audit import query_audit, write_audit
from shared.bulk_import import import_summary, parse_rows, validate_rows
from shared.config import settings
from shared.deps import get_current_admin, get_current_user
from shared.mailer import build_credentials_body, send_bulk_email
from shared.security import generate_temp_password, hash_password

from universities_app import repo
from universities_app.schemas import (
    AccountOut,
    StudentCreate,
    StudentUpdate,
    UniversityCreate,
    UniversityOut,
)

router = APIRouter(prefix="/api/universities", tags=["universities"])

SERVICE = "universities-service"


def _client_ip(request: Request) -> str | None:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


def _require_university(tenant_id: str) -> dict:
    uni = repo.get_university(tenant_id)
    if uni is None:
        raise HTTPException(status_code=404, detail="University not found")
    return uni


def _login_url() -> str:
    return f"{settings.frontend_base_url.rstrip('/')}/login"


# ── Universities (tenants) ───────────────────────────────────────────────────

@router.get("", response_model=list[UniversityOut])
@router.get("/", response_model=list[UniversityOut], include_in_schema=False)
def list_universities(user: Annotated[dict, Depends(get_current_admin)]):
    return repo.list_universities()


@router.post("", response_model=UniversityOut, status_code=201)
@router.post("/", response_model=UniversityOut, status_code=201, include_in_schema=False)
def create_university(
    body: UniversityCreate,
    request: Request,
    user: Annotated[dict, Depends(get_current_admin)],
):
    uni = repo.create_university(name=body.name, tenant_id=body.id, metadata=body.metadata)
    write_audit(
        actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
        action="university.create", target="tenant", target_id=uni["id"],
        details=f"Created university {uni['name']}", service=SERVICE,
        tenant_id=uni["id"], ip_address=_client_ip(request),
    )
    return uni


@router.get("/{tenant_id}", response_model=UniversityOut)
def get_university(tenant_id: str, user: Annotated[dict, Depends(get_current_user)]):
    return _require_university(tenant_id)


# ── Students ─────────────────────────────────────────────────────────────────

@router.get("/{tenant_id}/students", response_model=list[AccountOut])
def list_students(tenant_id: str, user: Annotated[dict, Depends(get_current_user)]):
    _require_university(tenant_id)
    return repo.list_accounts(tenant_id, "student")


@router.post("/{tenant_id}/students", response_model=AccountOut, status_code=201)
def add_student(
    tenant_id: str,
    body: StudentCreate,
    request: Request,
    user: Annotated[dict, Depends(get_current_admin)],
):
    uni = _require_university(tenant_id)
    if repo.email_exists(body.email):
        raise HTTPException(status_code=409, detail="Email already exists")

    first = body.first_name or (body.name.split(" ")[0] if body.name else "")
    last = body.last_name or (
        " ".join(body.name.split(" ")[1:]) if body.name and " " in body.name else ""
    )
    name = body.name or f"{first} {last}".strip() or body.email.split("@")[0]
    temp_password = generate_temp_password()

    created = repo.create_account(
        email=body.email, name=name, first_name=first, last_name=last,
        phone=body.phone, department=body.department, role="student",
        tenant_id=tenant_id, password_hash=hash_password(temp_password),
        segment=body.segment,
    )
    if created is None:
        raise HTTPException(status_code=409, detail="Email already exists")

    if body.send_credentials:
        text, html = build_credentials_body(
            name=name, email=body.email, temp_password=temp_password,
            login_url=_login_url(), org_name=uni["name"],
        )
        send_bulk_email([{
            "to_email": body.email,
            "subject": f"Your {uni['name']} student account",
            "body": text, "html": html,
        }])

    write_audit(
        actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
        action="university.student.create", target="login_account",
        target_id=str(created["id"]), details=f"Added student {body.email}",
        service=SERVICE, tenant_id=tenant_id, ip_address=_client_ip(request),
    )
    return created


@router.get("/{tenant_id}/students/{account_id}", response_model=AccountOut)
def get_student(
    tenant_id: str, account_id: int,
    user: Annotated[dict, Depends(get_current_user)],
):
    _require_university(tenant_id)
    acct = repo.get_account(tenant_id, account_id, "student")
    if acct is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return acct


@router.patch("/{tenant_id}/students/{account_id}", response_model=AccountOut)
def update_student(
    tenant_id: str, account_id: int,
    body: StudentUpdate,
    request: Request,
    user: Annotated[dict, Depends(get_current_admin)],
):
    _require_university(tenant_id)
    existing = repo.get_account(tenant_id, account_id, "student")
    if existing is None:
        raise HTTPException(status_code=404, detail="Student not found")

    fields: dict = {}
    if body.first_name is not None:
        fields["first_name"] = body.first_name
    if body.last_name is not None:
        fields["last_name"] = body.last_name
    if body.name is not None:
        fields["name"] = body.name
    if body.phone is not None:
        fields["phone"] = body.phone
    if body.department is not None:
        fields["department"] = body.department
    if body.is_active is not None:
        fields["is_active"] = body.is_active

    updated = repo.update_account(tenant_id, account_id, fields, body.segment)
    if updated is None:
        raise HTTPException(status_code=404, detail="Student not found")

    write_audit(
        actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
        action="university.student.update", target="login_account",
        target_id=str(account_id), details=f"Updated student {updated['email']}",
        service=SERVICE, tenant_id=tenant_id, ip_address=_client_ip(request),
    )
    return updated


@router.delete("/{tenant_id}/students/{account_id}", status_code=204)
def delete_student(
    tenant_id: str, account_id: int,
    request: Request,
    user: Annotated[dict, Depends(get_current_admin)],
):
    _require_university(tenant_id)
    if not repo.delete_account(tenant_id, account_id):
        raise HTTPException(status_code=404, detail="Student not found")
    write_audit(
        actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
        action="university.student.delete", target="login_account",
        target_id=str(account_id), details="Deleted student",
        service=SERVICE, tenant_id=tenant_id, ip_address=_client_ip(request),
    )
    return None


# ── Faculty ──────────────────────────────────────────────────────────────────

@router.get("/{tenant_id}/faculty", response_model=list[AccountOut])
def list_faculty(tenant_id: str, user: Annotated[dict, Depends(get_current_user)]):
    _require_university(tenant_id)
    return repo.list_accounts(tenant_id, "faculty")


# ── Bulk import (the key feature) ────────────────────────────────────────────

@router.post("/{tenant_id}/students/bulk-import")
async def bulk_import_students(
    tenant_id: str,
    request: Request,
    user: Annotated[dict, Depends(get_current_admin)],
    file: UploadFile = File(...),
    commit: bool = Form(False),
    sendCredentials: bool = Form(True),
    selectedRows: str | None = Form(None),
):
    """Two-phase CSV/Excel student import.

    Phase 1 (commit=false): parse + validate, return a preview with per-row
    duplicate flags and selectable hints. No DB writes.
    Phase 2 (commit=true): insert selected, non-duplicate rows as students
    (ON CONFLICT DO NOTHING, must_change_password=TRUE), email credentials,
    write audit.
    """
    uni = _require_university(tenant_id)

    raw = await file.read()
    try:
        rows, headers = parse_rows(file.filename or "", raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    existing_emails = repo.fetch_existing_emails()
    result = validate_rows(rows, headers=headers, existing_emails=existing_emails)
    if result.get("missing_columns"):
        raise HTTPException(
            status_code=400,
            detail=f"Missing required column(s): {', '.join(result['missing_columns'])}",
        )

    valid_rows = result["valid_rows"]
    error_rows = result["error_rows"]

    # Preview phase — no writes.
    if not commit:
        summary = import_summary(valid_rows, error_rows, committed=False, inserted=0)
        write_audit(
            actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
            action="university.students.bulk_preview", target="tenant", target_id=tenant_id,
            details=f"Previewed {summary['totalRows']} rows", service=SERVICE,
            tenant_id=tenant_id, ip_address=_client_ip(request),
        )
        return summary

    # Commit phase — restrict to selected rows if the client sent a subset.
    selected: set[int] | None = None
    if selectedRows:
        try:
            selected = {int(x) for x in selectedRows.replace(" ", "").split(",") if x != ""}
        except ValueError:
            raise HTTPException(status_code=400, detail="selectedRows must be comma-separated row numbers")

    to_insert: list[dict] = []
    credential_map: dict[str, str] = {}  # email -> temp_password
    for r in valid_rows:
        if selected is not None and r["rowNumber"] not in selected:
            continue
        temp_password = r.get("_password") or generate_temp_password()
        credential_map[r["email"]] = temp_password
        to_insert.append({
            "email": r["email"],
            "name": r["name"] or r["email"].split("@")[0],
            "first_name": r["firstName"],
            "last_name": r["lastName"],
            "phone": r.get("phone"),
            "department": r.get("department"),
            "segment": None,
            "password_hash": hash_password(temp_password),
        })

    inserted, inserted_rows = repo.insert_bulk_students(tenant_id=tenant_id, accounts=to_insert)

    email_results: list[dict] = []
    if sendCredentials and inserted_rows:
        messages = []
        for ins in inserted_rows:
            text, html = build_credentials_body(
                name=ins["name"], email=ins["email"],
                temp_password=credential_map.get(ins["email"], ""),
                login_url=_login_url(), org_name=uni["name"],
            )
            messages.append({
                "to_email": ins["email"],
                "subject": f"Your {uni['name']} student account",
                "body": text, "html": html,
            })
        email_results = send_bulk_email(messages)

    write_audit(
        actor_id=user.get("id"), actor_email=user.get("email"), actor_role=user.get("role"),
        action="university.students.bulk_import", target="tenant", target_id=tenant_id,
        details=f"Imported {inserted} students", service=SERVICE,
        tenant_id=tenant_id, ip_address=_client_ip(request),
        extra={"insertedCount": inserted},
    )
    return import_summary(
        valid_rows, error_rows, committed=True, inserted=inserted,
        email_results=email_results,
    )


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/{tenant_id}/dashboard")
def dashboard(tenant_id: str, user: Annotated[dict, Depends(get_current_user)]):
    uni = _require_university(tenant_id)
    counts = repo.dashboard_counts(tenant_id)
    return {"university": uni, **counts}


# ── Audit (Mongo) ────────────────────────────────────────────────────────────

@router.get("/{tenant_id}/audit")
def audit(
    tenant_id: str,
    user: Annotated[dict, Depends(get_current_admin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    _require_university(tenant_id)
    return query_audit(filters={"tenantId": tenant_id}, page=page, page_size=page_size)
