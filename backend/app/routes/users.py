from flask import Blueprint, request

from ..extensions import db
from ..models import User
from .utils import err, ok

users_bp = Blueprint("users", __name__)


@users_bp.get("/users/<int:user_id>")
def get_user(user_id: int):
    user = db.session.get(User, user_id)
    if not user:
        return err("User not found", 404)
    return ok(
        {
            "id": user.id,
            "name": user.name,
            "is_admin": bool(user.is_admin),
            "preferences": user.preferences or [],
        }
    )


@users_bp.get("/users/<int:user_id>/preferences")
def get_preferences(user_id: int):
    user = db.session.get(User, user_id)
    if not user:
        return err("User not found", 404)
    return ok(user.preferences or [])


@users_bp.put("/users/<int:user_id>/preferences")
def update_preferences(user_id: int):
    user = db.session.get(User, user_id)
    if not user:
        return err("User not found", 404)

    body = request.get_json(silent=True) or {}
    prefs = body.get("preferences")
    if not isinstance(prefs, list) or not all(isinstance(x, str) for x in prefs):
        return err("preferences must be an array of strings", 400)

    allowed = {"Cat 1", "Cat 2", "Cat 3"}
    if any(p not in allowed for p in prefs):
        return err("preferences contains invalid categories", 400)

    user.preferences = prefs
    db.session.commit()
    return ok(user.preferences or [])

