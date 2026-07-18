"""AI Interview Coach - Flask backend entry point."""

import os
import logging

from flask import Flask
from flask_cors import CORS

from routes.upload import upload_bp
from routes.evaluate import evaluate_bp

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    app = Flask(__name__)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    app.config["UPLOAD_FOLDER"] = os.path.join(base_dir, "uploads")
    app.config["INTERVIEWS"] = {}
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

    # CORS for Vite dev server
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(upload_bp)
    app.register_blueprint(evaluate_bp)

    return app


app = create_app()


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")
    logger.info(
        "Starting AI Interview Coach backend on %s:%s (debug=%s)", host, port, debug
    )
    app.run(host=host, port=port, debug=debug)
