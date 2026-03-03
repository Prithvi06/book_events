from __future__ import annotations

from datetime import datetime, timezone, timedelta

from flask import Request


def ok(data, status: int = 200):
    return {"data": data, "error": None}, status


def err(message: str, status: int):
    return {"data": None, "error": message}, status


IST = timezone(timedelta(hours=5, minutes=30))


def parse_iso_datetime(value: str) -> datetime:
    # Accepts ISO 8601 strings, including offsets (e.g. "...Z" or "+00:00").
    # Always normalize to Indian Standard Time (IST, UTC+05:30) so that
    # what the user picked in the UI is what we store and later display.
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        # Treat naive input as IST.
        dt = dt.replace(tzinfo=IST)
    return dt.astimezone(IST)


def get_request_user_id(request: Request) -> int | None:
    # Prefer explicit body user_id (used by booking endpoints),
    # but also allow X-User-Id header for convenience.
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id")
    if user_id is not None:
        try:
            return int(user_id)
        except (TypeError, ValueError):
            return None
    header_val = request.headers.get("X-User-Id")
    if header_val:
        try:
            return int(header_val)
        except ValueError:
            return None
    return None


def week_start_utc_from_iso_week(week: str) -> datetime:
    # week format: YYYY-WW, ISO week number (e.g. 2026-W10)
    # Parse as ISO week date: %G (ISO year), %V (ISO week), %u (ISO weekday 1=Mon)
    return datetime.strptime(f"{week}-1", "%G-W%V-%u").replace(tzinfo=IST)

