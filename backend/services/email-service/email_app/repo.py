"""Postgres persistence for email_templates."""

from __future__ import annotations

from typing import Any

from psycopg2.extras import RealDictCursor

from shared.db import ensure_pg_clean, get_pg_connection

CREATE_EMAIL_TEMPLATES = """
CREATE TABLE IF NOT EXISTS email_templates (
    id           SERIAL PRIMARY KEY,
    key          TEXT UNIQUE NOT NULL,
    subject      TEXT NOT NULL DEFAULT '',
    body_html    TEXT NOT NULL DEFAULT '',
    header_color TEXT,
    footer_text  TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


def init_email_schema() -> None:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(CREATE_EMAIL_TEMPLATES)
    conn.commit()


def list_templates() -> list[dict[str, Any]]:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, key, subject, body_html, header_color, footer_text, updated_at "
            "FROM email_templates ORDER BY key"
        )
        return list(cur.fetchall())


def get_template(key: str) -> dict[str, Any] | None:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, key, subject, body_html, header_color, footer_text, updated_at "
            "FROM email_templates WHERE key = %s",
            (key,),
        )
        return cur.fetchone()


def upsert_template(
    *,
    key: str,
    subject: str,
    body_html: str,
    header_color: str | None,
    footer_text: str | None,
) -> dict[str, Any]:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO email_templates (key, subject, body_html, header_color, footer_text, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (key) DO UPDATE SET
                subject      = EXCLUDED.subject,
                body_html    = EXCLUDED.body_html,
                header_color = EXCLUDED.header_color,
                footer_text  = EXCLUDED.footer_text,
                updated_at   = NOW()
            RETURNING id, key, subject, body_html, header_color, footer_text, updated_at
            """,
            (key, subject, body_html, header_color, footer_text),
        )
        row = cur.fetchone()
    conn.commit()
    return row


def delete_template(key: str) -> bool:
    ensure_pg_clean()
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM email_templates WHERE key = %s", (key,))
        deleted = cur.rowcount
    conn.commit()
    return deleted > 0
