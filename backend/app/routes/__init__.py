from flask import Blueprint

from .bookings import bookings_bp
from .slots import slots_bp
from .users import users_bp

api_bp = Blueprint("api", __name__)
api_bp.register_blueprint(slots_bp)
api_bp.register_blueprint(bookings_bp)
api_bp.register_blueprint(users_bp)

from flask import Blueprint

from .bookings import bookings_bp
from .slots import slots_bp
from .users import users_bp

api_bp = Blueprint("api", __name__)
api_bp.register_blueprint(slots_bp)
api_bp.register_blueprint(bookings_bp)
api_bp.register_blueprint(users_bp)

