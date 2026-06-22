"""Task delivery deadline (SLA) derivation.

Contributors need a due date so the platform can track on-time delivery
(profile "Before deadline" / reliability). We derive it from the task's
estimated effort — roughly PRODUCTIVE_HOURS_PER_DAY of focused work a day plus a
small buffer — clamped to a sensible MIN/MAX-day window. An explicit override
(ISO string or datetime, e.g. supplied by the assigner) always wins.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any

PRODUCTIVE_HOURS_PER_DAY = 6
BUFFER_DAYS = 2
MIN_DAYS = 3
MAX_DAYS = 30
DEFAULT_DAYS = 7


def _parse(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def compute_due_at(
    estimated_hours: Any = None,
    override: Any = None,
    now: datetime | None = None,
) -> datetime:
    """Return the delivery deadline for a task as a tz-aware datetime.

    - override: explicit deadline (ISO string or datetime); used verbatim if set.
    - estimated_hours: task effort; mapped to calendar days at
      PRODUCTIVE_HOURS_PER_DAY + BUFFER_DAYS, clamped to [MIN_DAYS, MAX_DAYS].
    - Falls back to DEFAULT_DAYS when there's no usable estimate.
    """
    explicit = _parse(override)
    if explicit is not None:
        return explicit

    base = now or datetime.now(timezone.utc)
    try:
        hours = float(estimated_hours) if estimated_hours is not None else 0.0
    except (TypeError, ValueError):
        hours = 0.0

    if hours > 0:
        days = math.ceil(hours / PRODUCTIVE_HOURS_PER_DAY) + BUFFER_DAYS
    else:
        days = DEFAULT_DAYS
    days = max(MIN_DAYS, min(days, MAX_DAYS))
    return base + timedelta(days=days)
