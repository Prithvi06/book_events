from flask import Flask, jsonify

from .extensions import cors, db


def create_app(env_name: str = "development") -> Flask:
    app = Flask(__name__)

    if env_name == "production":
        app.config.from_object("config.ProductionConfig")
    else:
        app.config.from_object("config.DevelopmentConfig")

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "http://localhost:4200"}})

    from .routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    @app.get("/health")
    def health():
        return jsonify({"data": {"ok": True}, "error": None})

    return app

