"""
File-service Postgres DDL. Idempotent CREATE TABLE for the `files` metadata
table. Run on startup after the shared `init_schema()`. Blob bytes live in
Vercel Blob; only the metadata + public URL live in Postgres.
"""

from __future__ import annotations

import logging

from shared.db import get_pg_connection

logger = logging.getLogger(__name__)

FILES_SQL = """
CREATE TABLE IF NOT EXISTS files (
    id           BIGSERIAL PRIMARY KEY,
    account_id   BIGINT NOT NULL,
    filename     TEXT NOT NULL,
    url          TEXT NOT NULL,
    content_type TEXT,
    size         BIGINT NOT NULL DEFAULT 0,
    category     TEXT,
    title        TEXT,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_files_account ON files(account_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
"""


def init_file_schema() -> None:
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(FILES_SQL)
    conn.commit()
    logger.info("file-service: files table ensured.")
