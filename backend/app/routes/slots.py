from __future__ import annotations

from datetime import timedelta

from flask import Blueprint, request
from sqlalchemy import and_

from ..extensions import db
from ..models import Category, TimeSlot, User
from .utils import err, get_request_user_id, ok, parse_iso_datetime, week_start_utc_from_iso_week

slots_bp = Blueprint("slots", __name__)


def _require_admin_from_request() -> User | None:
    user_id = get_request_user_id(request)
    if user_id is None:
        return None
    user = db.session.get(User, user_id)
    if not user or not user.is_admin:
        return None
    return user


@slots_bp.get("/slots")
def list_slots():
    week = request.args.get("week")
    category = request.args.get("category")

    q = (
        db.session.query(TimeSlot)
        .join(Category, TimeSlot.category_id == Category.id)
        .outerjoin(User, TimeSlot.booked_by_user_id == User.id)
    )

    filters = []
    if category:
        filters.append(Category.name == category)
    if week:
        try:
            start = week_start_utc_from_iso_week(week)
        except ValueError:
            return err("Invalid week format. Use YYYY-WW (e.g. 2026-W10).", 400)
        end = start + timedelta(days=7)
        filters.append(and_(TimeSlot.start_time >= start, TimeSlot.start_time < end))

    if filters:
        q = q.filter(and_(*filters))

    q = q.order_by(TimeSlot.start_time.asc())
    slots = q.all()
    return ok([s.to_dict() for s in slots])


@slots_bp.post("/slots")
def create_slot():
    admin = _require_admin_from_request()
    if not admin:
        return err("Admin privileges required", 403)

    body = request.get_json(silent=True) or {}
    category = body.get("category")
    start_time = body.get("start_time")
    end_time = body.get("end_time")

    if category not in {"Cat 1", "Cat 2", "Cat 3"}:
        return err("Invalid category", 400)
    if not isinstance(start_time, str) or not isinstance(end_time, str):
        return err("start_time and end_time must be ISO 8601 strings", 400)

    try:
        start_dt = parse_iso_datetime(start_time)
        end_dt = parse_iso_datetime(end_time)
    except ValueError:
        return err("Invalid datetime format", 400)

    if end_dt <= start_dt:
        return err("end_time must be strictly after start_time", 400)

    cat_row = db.session.query(Category).filter(Category.name == category).one_or_none()
    if cat_row is None:
        # Keep app robust even if seed wasn't run.
        cat_row = Category(name=category)
        db.session.add(cat_row)
        db.session.flush()

    slot = TimeSlot(
        category_id=cat_row.id,
        start_time=start_dt,
        end_time=end_dt,
        booked_by_user_id=None,
    )
    db.session.add(slot)
    db.session.commit()
    return ok(slot.to_dict(), 201)


@slots_bp.delete("/slots/<int:slot_id>")
def delete_slot(slot_id: int):
    admin = _require_admin_from_request()
    if not admin:
        return err("Admin privileges required", 403)

    slot = db.session.get(TimeSlot, slot_id)
    if not slot:
        return err("Slot not found", 404)

    db.session.delete(slot)
    db.session.commit()
    return ok({"deleted": True})

