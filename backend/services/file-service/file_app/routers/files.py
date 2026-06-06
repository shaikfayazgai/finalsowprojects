"""
File router — /api/files/**

Bearer-protected file uploads backed by Vercel Blob (shared.blob). The blob
bytes live in Vercel Blob storage; the metadata + public URL are persisted in
the Postgres `files` table, scoped to the authenticated user's account_id.

Endpoints:
  POST   /api/files/upload   upload a file (multipart) + metadata
  GET    /api/files          list current user's files (filters: category, page)
  GET    /api/files/{id}     single file metadata + url
  DELETE /api/files/{id}     delete row + blob
  POST   /api/files/sign     return the public url for a given pathname
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
    UploadFile,
)
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

from shared.blob import blob_is_configured, delete_blob, upload_blob
from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_user

router = APIRouter(prefix="/api/files", tags=["files"])

_PAGE_SIZE = 20
_BLOB_BASE = "https://blob.vercel-storage.com"

_BLOB_NOT_CONFIGURED = (
    "File storage is not configured. Set BLOB_READ_WRITE_TOKEN "
    "(Vercel Blob) on the file-service to enable uploads."
)


def _account_id(user: dict) -> int:
    raw = user.get("id")
    if raw is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid account id in token")


def _row_to_out(row: dict) -> dict:
    created = row.get("created_at")
    return {
        "id": row["id"],
        "filename": row["filename"],
        "url": row["url"],
        "category": row.get("category"),
        "title": row.get("title"),
        "description": row.get("description"),
        "uploaded_at": created.isoformat() if created is not None else None,
        "size": row.get("size") or 0,
        "content_type": row.get("content_type"),
    }


# ── POST /api/files/upload ───────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    user: Annotated[dict, Depends(get_current_user)],
    file: UploadFile = File(...),
    category: str | None = Form(None),
    title: str | None = Form(None),
    description: str | None = Form(None),
    folder: str | None = Form(None),
):
    if not blob_is_configured():
        raise HTTPException(status_code=503, detail=_BLOB_NOT_CONFIGURED)

    account_id = _account_id(user)
    filename = file.filename or "upload"
    data = await file.read()
    size = len(data)

    prefix = (folder or category or "uploads").strip("/") or "uploads"
    pathname = f"{prefix}/{filename}"

    try:
        descriptor = await upload_blob(
            pathname=pathname,
            data=data,
            content_type=file.content_type,
        )
    except RuntimeError:
        raise HTTPException(status_code=503, detail=_BLOB_NOT_CONFIGURED)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Blob upload failed: {exc}")

    url = descriptor.get("url")
    if not url:
        raise HTTPException(status_code=502, detail="Blob upload returned no url")

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO files
                (account_id, filename, url, content_type, size,
                 category, title, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, account_id, filename, url, content_type, size,
                      category, title, description, created_at
            """,
            (
                account_id,
                filename,
                url,
                file.content_type,
                size,
                category,
                title,
                description,
            ),
        )
        row = cur.fetchone()
    conn.commit()
    return _row_to_out(row)


# ── GET /api/files ───────────────────────────────────────────────────────────

@router.get("")
@router.get("/")
def list_files(
    user: Annotated[dict, Depends(get_current_user)],
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
):
    account_id = _account_id(user)
    offset = (page - 1) * _PAGE_SIZE

    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if category:
            cur.execute(
                "SELECT COUNT(*) AS n FROM files WHERE account_id = %s AND category = %s",
                (account_id, category),
            )
            total = cur.fetchone()["n"]
            cur.execute(
                """
                SELECT id, account_id, filename, url, content_type, size,
                       category, title, description, created_at
                FROM files
                WHERE account_id = %s AND category = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (account_id, category, _PAGE_SIZE, offset),
            )
        else:
            cur.execute(
                "SELECT COUNT(*) AS n FROM files WHERE account_id = %s",
                (account_id,),
            )
            total = cur.fetchone()["n"]
            cur.execute(
                """
                SELECT id, account_id, filename, url, content_type, size,
                       category, title, description, created_at
                FROM files
                WHERE account_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (account_id, _PAGE_SIZE, offset),
            )
        rows = cur.fetchall()

    return {
        "items": [_row_to_out(r) for r in rows],
        "page": page,
        "page_size": _PAGE_SIZE,
        "total": total,
    }


# ── POST /api/files/sign ─────────────────────────────────────────────────────

class SignRequest(BaseModel):
    pathname: str


@router.post("/sign")
def sign_pathname(
    payload: SignRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Return the public Vercel Blob URL for a given pathname (kept simple)."""
    pathname = payload.pathname.lstrip("/")
    if not pathname:
        raise HTTPException(status_code=400, detail="pathname is required")
    return {"pathname": pathname, "url": f"{_BLOB_BASE}/{pathname}"}


# ── GET /api/files/{id} ──────────────────────────────────────────────────────

@router.get("/{file_id}")
def get_file(
    file_id: int,
    user: Annotated[dict, Depends(get_current_user)],
):
    account_id = _account_id(user)
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, account_id, filename, url, content_type, size,
                   category, title, description, created_at
            FROM files
            WHERE id = %s AND account_id = %s
            """,
            (file_id, account_id),
        )
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="File not found")
    return _row_to_out(row)


# ── DELETE /api/files/{id} ───────────────────────────────────────────────────

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    user: Annotated[dict, Depends(get_current_user)],
):
    account_id = _account_id(user)
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT url FROM files WHERE id = %s AND account_id = %s",
            (file_id, account_id),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="File not found")
        cur.execute(
            "DELETE FROM files WHERE id = %s AND account_id = %s",
            (file_id, account_id),
        )
    conn.commit()

    # Best-effort blob removal; row is already gone.
    try:
        await delete_blob(row["url"])
    except Exception:  # noqa: BLE001
        pass

    return {"id": file_id, "deleted": True}
