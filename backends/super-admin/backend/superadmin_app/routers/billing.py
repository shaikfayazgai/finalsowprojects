"""
Super-admin (Glimmora) BILLING — the full money view.

Read-only KPIs + transaction ledger over the live payment tables on the shared
Neon DB. This is the GLIMMORA view: it SEES everything — money IN
(enterprise → Glimmora), money OUT (Glimmora → contributor), margin, GST,
pending vs paid. (Only the ENTERPRISE portal hides contributor pay; here the
super-admin is entitled to the whole picture.)

Endpoints (Super Admin / Admin):
  GET /api/v1/superadmin/billing/summary
      → KPI rollup: inflow, outflow, margin, GST, pending/paid payouts,
        SOWs-with-payments, failed transactions.
  GET /api/v1/superadmin/billing/transactions?direction=&status=&limit=
      → unified ledger of in/out transactions across:
          • enterprise_razorpay_orders  (inflow: enterprise → Glimmora)
          • payouts                     (outflow: Glimmora → contributor)

Data model (all amounts BIGINT minor units / paise):
  payouts(account_id, task_id, task_title, amount_minor, currency, status,
          eligible_at, paid_at, external_ref, failure_reason, data jsonb)
      status ∈ eligible → requested → released → processing → paid  (+ failed)
      data jsonb carries: sowId, planId, canonicalTaskId, netMinor, grossMinor,
                          clientMinor, gstPct, commissionPct, source
  enterprise_razorpay_orders(amount, currency, status, order_type, payment_id,
          payout_id, owner_email, tenant_id, reference_id, paid_at, notes jsonb)
      status ∈ created → paid (inflow capture) / processed (outflow);  order_type
      ∈ payment | payout
  sow_escrows(plan_id, sow_id, funded_minor, spent_minor, currency)
      remaining = funded_minor − spent_minor

GST / commission knobs: platform_settings.data['commission'] = {commissionPct,
gstPct}; defaults 15% / 18%.  GST is captured per-payout inside payouts.data as
gstPct, so collected GST is derived from each row rather than recomputed.

Read-only — these endpoints never write. Money columns are returned in BOTH
minor units (…Minor) and major units (rupees) so the FE can render directly.
"""

from __future__ import annotations

import json
import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor

from shared.db import ensure_pg_clean, get_pg_connection
from shared.deps import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["superadmin-billing"])

_DEFAULT_GST_PCT = 18.0
_DEFAULT_COMMISSION_PCT = 15.0

# payout.status values we treat as "money already gone out" vs "still owed".
_PAID_STATUSES = ("paid",)
_FAILED_STATUSES = ("failed",)
# everything between eligible and paid is an obligation that hasn't settled yet
_PENDING_STATUSES = ("eligible", "requested", "released", "processing")


# ── helpers ──────────────────────────────────────────────────────────────────

def _cursor():
    ensure_pg_clean()
    return get_pg_connection().cursor(cursor_factory=RealDictCursor)


def _jsonb(value: Any) -> dict:
    """Coerce a jsonb column (dict or str) into a dict."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except (ValueError, TypeError):
            return {}
    return {}


def _table_exists(cur, table: str) -> bool:
    try:
        cur.execute("SELECT to_regclass(%s)", (f"public.{table}",))
        row = cur.fetchone()
        return bool(row and row.get("to_regclass"))
    except Exception:  # noqa: BLE001
        return False


def _pricing_cfg(cur) -> dict[str, float]:
    """Live commission % + GST % from platform_settings.data['commission']."""
    commission = _DEFAULT_COMMISSION_PCT
    gst = _DEFAULT_GST_PCT
    try:
        cur.execute("SELECT data FROM platform_settings WHERE id = 1")
        row = cur.fetchone()
        data = _jsonb((row or {}).get("data"))
        cfg = data.get("commission") or {}
        if cfg.get("commissionPct") is not None:
            commission = float(cfg.get("commissionPct"))
        if cfg.get("gstPct") is not None:
            gst = float(cfg.get("gstPct"))
    except Exception:  # noqa: BLE001
        pass
    return {"commissionPct": commission, "gstPct": gst}


def _minor_to_major(minor: int | None) -> float:
    return round((int(minor or 0)) / 100.0, 2)


# ── KPI summary ──────────────────────────────────────────────────────────────

@router.get("/api/v1/superadmin/billing/summary")
async def billing_summary(admin: Annotated[dict, Depends(get_current_admin)]):
    """KPI rollup for the Glimmora billing dashboard.

    inflow  = Σ amount of PAID enterprise orders (enterprise → Glimmora)
    outflow = Σ amount_minor of PAID contributor payouts (Glimmora → contributor)
    gst     = Σ GST embedded in paid payouts (gross − net, derived from gstPct)
    margin  = inflow − outflow − gst   (Glimmora's take after paying the
              contributor and remitting GST; never reported below 0)
    pending = payouts not yet paid (count + amount owed)
    paidPayouts        = paid payout count + amount
    sowsWithPayments   = distinct SOWs that have at least one payout row
    failedTransactions = failed payouts + failed enterprise orders
    """
    cfg_commission = _DEFAULT_COMMISSION_PCT
    cfg_gst = _DEFAULT_GST_PCT

    inflow_minor = 0
    outflow_minor = 0
    gst_minor = 0
    pending_count = 0
    pending_minor = 0
    paid_count = 0
    paid_minor = 0
    sows_with_payments = 0
    failed_count = 0
    escrow_funded_minor = 0
    escrow_spent_minor = 0
    currency = "INR"

    try:
        with _cursor() as cur:
            cfg = _pricing_cfg(cur)
            cfg_commission = cfg["commissionPct"]
            cfg_gst = cfg["gstPct"]

            # ── inflow: paid enterprise orders (payment captures) ──
            if _table_exists(cur, "enterprise_razorpay_orders"):
                cur.execute(
                    """
                    SELECT COALESCE(SUM(amount), 0) AS total
                      FROM enterprise_razorpay_orders
                     WHERE status = 'paid'
                       AND COALESCE(order_type, 'payment') = 'payment'
                    """
                )
                inflow_minor = int((cur.fetchone() or {}).get("total") or 0)

                # failed enterprise orders (defensive — simulated flow may not set this)
                cur.execute(
                    "SELECT COUNT(*) AS n FROM enterprise_razorpay_orders WHERE status = 'failed'"
                )
                failed_count += int((cur.fetchone() or {}).get("n") or 0)

            # ── outflow + GST + pending/paid + per-status: payouts ──
            if _table_exists(cur, "payouts"):
                # Pull every payout once; derive the buckets in Python so GST
                # (which lives inside data->>'gstPct') is computed per-row.
                cur.execute(
                    "SELECT amount_minor, status, currency, data FROM payouts"
                )
                seen_sows: set[str] = set()
                for r in cur.fetchall():
                    amt = int(r.get("amount_minor") or 0)
                    status = (r.get("status") or "").lower()
                    if r.get("currency"):
                        currency = r["currency"]
                    data = _jsonb(r.get("data"))
                    sow_id = data.get("sowId") or data.get("planId")
                    if sow_id:
                        seen_sows.add(str(sow_id))

                    if status in _PAID_STATUSES:
                        outflow_minor += amt
                        paid_count += 1
                        paid_minor += amt
                        # GST embedded in this paid payout: gross − net.
                        net = data.get("netMinor")
                        if net is not None:
                            try:
                                gst_minor += max(0, amt - int(net))
                            except (TypeError, ValueError):
                                pass
                        else:
                            try:
                                g = float(data.get("gstPct", cfg_gst))
                            except (TypeError, ValueError):
                                g = cfg_gst
                            # gross = net*(1+g) → net = gross/(1+g) → gst = gross − net
                            gst_minor += int(round(amt - amt / (1.0 + g / 100.0)))
                    elif status in _FAILED_STATUSES:
                        failed_count += 1
                    elif status in _PENDING_STATUSES:
                        pending_count += 1
                        pending_minor += amt
                    else:
                        # unknown/legacy status → treat as still-owed obligation
                        pending_count += 1
                        pending_minor += amt
                sows_with_payments = len(seen_sows)

            # ── escrow funded/spent (context on the money held) ──
            if _table_exists(cur, "sow_escrows"):
                cur.execute(
                    "SELECT COALESCE(SUM(funded_minor),0) AS funded, "
                    "       COALESCE(SUM(spent_minor),0) AS spent FROM sow_escrows"
                )
                esc = cur.fetchone() or {}
                escrow_funded_minor = int(esc.get("funded") or 0)
                escrow_spent_minor = int(esc.get("spent") or 0)
    except Exception as exc:  # noqa: BLE001
        logger.warning("billing_summary query failed: %s", exc)

    margin_minor = max(0, inflow_minor - outflow_minor - gst_minor)

    def money(minor: int) -> dict[str, Any]:
        return {"minor": int(minor), "major": _minor_to_major(minor)}

    return {
        "currency": currency,
        "config": {"commissionPct": cfg_commission, "gstPct": cfg_gst},
        "kpis": {
            "inflow": money(inflow_minor),
            "outflow": money(outflow_minor),
            "margin": money(margin_minor),
            "gst": money(gst_minor),
            "pending": {**money(pending_minor), "count": pending_count},
            "paid": {**money(paid_minor), "count": paid_count},
            "sowsWithPayments": sows_with_payments,
            "failedTransactions": failed_count,
            "escrow": {
                "funded": money(escrow_funded_minor),
                "spent": money(escrow_spent_minor),
                "remaining": money(max(0, escrow_funded_minor - escrow_spent_minor)),
            },
        },
    }


# ── transactions ledger ──────────────────────────────────────────────────────

@router.get("/api/v1/superadmin/billing/transactions")
async def billing_transactions(
    admin: Annotated[dict, Depends(get_current_admin)],
    direction: str | None = None,   # 'in' | 'out'
    status: str | None = None,
    limit: int = 200,
):
    """Unified billing ledger. Each row:
        { id, direction ('in'|'out'), sowId, sowName, taskId, taskTitle,
          counterparty, counterpartyRole, amountMinor, amount, currency,
          status, transactionId, date }

    direction='in'  → enterprise_razorpay_orders (enterprise → Glimmora)
    direction='out' → payouts (Glimmora → contributor)
    Both are merged and sorted newest-first; filterable by direction + status.
    """
    limit = max(1, min(int(limit or 200), 1000))
    want_dir = (direction or "").lower().strip() or None
    want_status = (status or "").lower().strip() or None

    rows: list[dict[str, Any]] = []

    try:
        with _cursor() as cur:
            sow_names = _sow_name_map(cur)
            account_names = _account_name_map(cur)

            # ── OUT: contributor payouts ──
            if want_dir in (None, "out") and _table_exists(cur, "payouts"):
                cur.execute(
                    """
                    SELECT id, account_id, task_id, task_title, amount_minor,
                           currency, status, external_ref, eligible_at, paid_at,
                           created_at, data
                      FROM payouts
                     ORDER BY COALESCE(paid_at, created_at, eligible_at) DESC
                     LIMIT %s
                    """,
                    (limit,),
                )
                for r in cur.fetchall():
                    data = _jsonb(r.get("data"))
                    sow_id = data.get("sowId") or data.get("planId")
                    acct = str(r.get("account_id") or "")
                    counterparty = account_names.get(acct) or (f"Contributor #{acct}" if acct else "Contributor")
                    txn_id = r.get("external_ref") or r.get("id")
                    when = r.get("paid_at") or r.get("created_at") or r.get("eligible_at")
                    rows.append({
                        "id": str(r.get("id")),
                        "direction": "out",
                        "sowId": str(sow_id) if sow_id else None,
                        "sowName": sow_names.get(str(sow_id)) if sow_id else None,
                        "taskId": str(r.get("task_id")) if r.get("task_id") else None,
                        "taskTitle": r.get("task_title") or data.get("taskTitle") or None,
                        "counterparty": counterparty,
                        "counterpartyRole": "contributor",
                        "amountMinor": int(r.get("amount_minor") or 0),
                        "amount": _minor_to_major(r.get("amount_minor")),
                        "currency": r.get("currency") or "INR",
                        "status": (r.get("status") or "").lower(),
                        "transactionId": txn_id,
                        "date": _iso(when),
                    })

            # ── IN: enterprise orders (payment captures into Glimmora) ──
            if want_dir in (None, "in") and _table_exists(cur, "enterprise_razorpay_orders"):
                cur.execute(
                    """
                    SELECT id, tenant_id, owner_email, amount, currency, status,
                           order_type, reference_id, payment_id, payout_id,
                           paid_at, created_at, notes
                      FROM enterprise_razorpay_orders
                     WHERE COALESCE(order_type, 'payment') = 'payment'
                     ORDER BY COALESCE(paid_at, created_at) DESC
                     LIMIT %s
                    """,
                    (limit,),
                )
                for r in cur.fetchall():
                    notes = _jsonb(r.get("notes"))
                    sow_id = notes.get("sowId") or notes.get("planId") or r.get("reference_id")
                    counterparty = r.get("owner_email") or notes.get("clientOrganisation") or "Enterprise"
                    txn_id = r.get("payment_id") or r.get("id")
                    when = r.get("paid_at") or r.get("created_at")
                    rows.append({
                        "id": str(r.get("id")),
                        "direction": "in",
                        "sowId": str(sow_id) if sow_id else None,
                        "sowName": sow_names.get(str(sow_id)) if sow_id else None,
                        "taskId": None,
                        "taskTitle": notes.get("description") or None,
                        "counterparty": counterparty,
                        "counterpartyRole": "enterprise",
                        "amountMinor": int(r.get("amount") or 0),
                        "amount": _minor_to_major(r.get("amount")),
                        "currency": r.get("currency") or "INR",
                        "status": (r.get("status") or "").lower(),
                        "transactionId": txn_id,
                        "date": _iso(when),
                    })
    except Exception as exc:  # noqa: BLE001
        logger.warning("billing_transactions query failed: %s", exc)

    # status filter (post-merge so the same code covers both sources)
    if want_status:
        rows = [t for t in rows if t["status"] == want_status]

    # newest first across both sources
    rows.sort(key=lambda t: t.get("date") or "", reverse=True)
    rows = rows[:limit]

    return {"items": rows, "total": len(rows)}


# ── lookup maps (enrichment) ─────────────────────────────────────────────────

def _sow_name_map(cur) -> dict[str, str]:
    """sowId/planId → human SOW name (projectTitle). Maps both the SOW id and any
    decomp plan id to the SOW's title so payout rows (keyed by either) resolve."""
    out: dict[str, str] = {}
    try:
        if _table_exists(cur, "enterprise_sows"):
            cur.execute("SELECT id, data FROM enterprise_sows")
            for r in cur.fetchall():
                data = _jsonb(r.get("data"))
                title = data.get("projectTitle") or data.get("clientOrganisation")
                if r.get("id") and title:
                    out[str(r["id"])] = title
        # plan_id → sow title (payouts often carry planId rather than sowId)
        if _table_exists(cur, "decomp_plans"):
            cur.execute("SELECT id, sow_id FROM decomp_plans")
            for r in cur.fetchall():
                sid = r.get("sow_id")
                if r.get("id") and sid and str(sid) in out:
                    out[str(r["id"])] = out[str(sid)]
    except Exception as exc:  # noqa: BLE001
        logger.debug("sow_name_map failed: %s", exc)
    return out


def _account_name_map(cur) -> dict[str, str]:
    """login_accounts.id → display name/email (for contributor counterparty)."""
    out: dict[str, str] = {}
    try:
        cur.execute(
            "SELECT id, email, first_name, last_name FROM login_accounts"
        )
        for r in cur.fetchall():
            name = f"{(r.get('first_name') or '').strip()} {(r.get('last_name') or '').strip()}".strip()
            out[str(r["id"])] = name or r.get("email") or str(r["id"])
    except Exception as exc:  # noqa: BLE001
        logger.debug("account_name_map failed: %s", exc)
    return out


# ── serialization helpers ────────────────────────────────────────────────────

def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return value.isoformat()
    except Exception:  # noqa: BLE001
        return str(value)
