from flask import Blueprint, request

from ..extensions import db
from ..models import TimeSlot, User
from .utils import err, ok

bookings_bp = Blueprint("bookings", __name__)


@bookings_bp.post("/slots/<int:slot_id>/book")
def book_slot(slot_id: int):
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id")
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return err("user_id is required", 400)

    user = db.session.get(User, user_id)
    if not user:
        return err("User not found", 404)

    slot = db.session.get(TimeSlot, slot_id)
    if not slot:
        return err("Slot not found", 404)

    if slot.booked_by_user_id is not None and slot.booked_by_user_id != user_id:
        return err("Slot already booked", 409)

    slot.booked_by_user_id = user_id
    db.session.commit()
    db.session.refresh(slot)
    return ok(slot.to_dict())


@bookings_bp.delete("/slots/<int:slot_id>/book")
def unbook_slot(slot_id: int):
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id")
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return err("user_id is required", 400)

    user = db.session.get(User, user_id)
    if not user:
        return err("User not found", 404)

    slot = db.session.get(TimeSlot, slot_id)
    if not slot:
        return err("Slot not found", 404)

    if slot.booked_by_user_id is None:
        return err("Slot is not booked", 409)
    if slot.booked_by_user_id != user_id:
        return err("Slot is booked by another user", 409)

    slot.booked_by_user_id = None
    db.session.commit()
    db.session.refresh(slot)
    return ok(slot.to_dict())

