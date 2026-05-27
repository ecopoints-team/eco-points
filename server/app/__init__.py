import logging
import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

# Initialize Extensions
load_dotenv()
db = SQLAlchemy()
migrate = Migrate()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per minute"], storage_uri="memory://")


# ──────────────────────────────────────────────────────────────────────
# Task 21.1 — Startup-time secret-presence check (Requirement 7.5).
#
# Required-secret set is `{SECRET_KEY, DATABASE_URL, SMTP password,
# SMS provider key}`. The per-org QR HMAC secret (Phase 4A) is derived
# from SECRET_KEY via HKDF so no additional env var is required.
#
# Behaviour:
#   * Runs only when `FLASK_ENV == 'production'`.
#   * Refuses to start if any required secret is missing/empty OR if it
#     equals one of the documented development-default values below.
#   * Logs only the offending variable NAME — never its value.
#   * Exits with a non-zero status (`sys.exit(1)`) on any violation so a
#     misconfigured production deployment refuses to come up.
# ──────────────────────────────────────────────────────────────────────

# Canonical env-var names for the required production secrets. Kept in
# sync with `server/app/services/notification_service.py` (`SMTP_PASS`,
# `TWILIO_AUTH_TOKEN`) and the JWT/DB stack.
REQUIRED_PRODUCTION_SECRETS = (
    'SECRET_KEY',
    'DATABASE_URL',
    'SMTP_PASS',          # SMTP password used by notification_service._send_email
    'TWILIO_AUTH_TOKEN',  # SMS provider key used by notification_service._send_sms
)

# Per-variable known development-default values that MUST NOT be present
# in production. These cover the documented in-repo defaults and the
# placeholder values shipped in `server/.env` examples.
KNOWN_DEV_DEFAULTS = {
    'SECRET_KEY': frozenset({
        'dev',
        'dev-secret',
        'dev-key',
        'dev-key-DO-NOT-USE-IN-PRODUCTION',
        'changeme',
        'change-me',
        'secret',
    }),
    'DATABASE_URL': frozenset({
        'sqlite:///dev.db',
        'sqlite:///:memory:',
        'changeme',
    }),
    'SMTP_PASS': frozenset({
        'your-smtp-password',
        'your-app-password',
        'changeme',
    }),
    'TWILIO_AUTH_TOKEN': frozenset({
        # Matches the placeholder in `server/.env`.
        'your-auth-token',
        'changeme',
    }),
}


def _check_required_secrets_in_production():
    """Refuse to start in production when required secrets are missing
    or set to a known development default.

    Logs only variable NAMES (never values) and exits with status 1 on
    any violation. Returns silently in non-production environments.

    Validates Requirement 7.5 (Task 21.1).
    """
    if os.environ.get('FLASK_ENV') != 'production':
        return

    logger = logging.getLogger(__name__)

    missing = []
    insecure = []
    for name in REQUIRED_PRODUCTION_SECRETS:
        value = os.environ.get(name)
        if not value:
            missing.append(name)
            continue
        if value in KNOWN_DEV_DEFAULTS.get(name, frozenset()):
            insecure.append(name)

    if not missing and not insecure:
        return

    if missing:
        # Log each missing secret on its own line so log-aggregation
        # filters (and the Property AA test) can match the variable name
        # without scraping a comma-joined list.
        for name in missing:
            logger.critical(
                'Refusing to start in production: required secret %s is not set',
                name,
            )
    if insecure:
        for name in insecure:
            logger.critical(
                'Refusing to start in production: required secret %s is set to a '
                'known development default value',
                name,
            )

    sys.exit(1)


class Config:
    """Standard Flask configuration class."""
    # Production: set DATABASE_URL to your Postgres connection string.
    # Presence is enforced inside `create_app()` (uniformly for prod via
    # `_check_required_secrets_in_production` and for dev via an
    # explicit fast-fail) so the import path stays side-effect free.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-DO-NOT-USE-IN-PRODUCTION')
    JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', 24))
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def create_app():
    """Application factory for the EcoPoints Flask server."""
    # Task 21.1 / Requirement 7.5 — gate startup on required-secret
    # presence before Flask, blueprints, or the DB are touched. In
    # non-production this is a no-op; in production a missing or
    # dev-default secret terminates the process with status 1 after
    # logging only the offending variable NAME(s).
    _check_required_secrets_in_production()

    app = Flask(__name__, instance_relative_config=False)
    # Load Config from environment or defaults
    app.config.from_object(Config)

    # Dev/test fast-fail: outside production we still require
    # DATABASE_URL up front so a missing connection string surfaces
    # immediately with a clear, value-free error message. (In
    # production the secret-presence check above has already exited.)
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Please check your .env file to ensure PostgreSQL connection is configured."
        )

    # Outside production, warn (don't fail) when SECRET_KEY is the
    # documented dev default. In production the secret-presence check
    # above would already have exited.
    if app.config['SECRET_KEY'] == 'dev-key-DO-NOT-USE-IN-PRODUCTION':
        import warnings
        warnings.warn(
            'SECRET_KEY is using the default dev value. '
            'Set the SECRET_KEY environment variable for production!',
            RuntimeWarning
        )

    # Enable CORS for frontend and Raspberry Pi
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://ecopoints.org",
        "https://www.ecopoints.org",
        "https://eco-points-client.pages.dev",
    ]

    # Add additional origins from environment variable if provided
    if os.environ.get('CORS_ORIGINS'):
        allowed_origins.extend(
            origin.strip() for origin in os.environ.get('CORS_ORIGINS').split(',')
            if origin.strip()
        )
    
    # Phase 4B (task 11.4): include X-CSRF-Token in allow_headers so that
    # browsers can attach the CSRF double-submit header on cross-origin
    # state-changing requests. supports_credentials remains True so the
    # HttpOnly token cookie + csrf_token cookie are sent with requests.
    # Validates Requirement 4B.15.
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-CSRF-Token"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    with app.app_context():
        # Import routes and models so they are registered
        from . import routes, models  # noqa: F401

        # Register blueprints
        from .controllers.auth_controller import auth_bp
        from .controllers.web_controller import web_bp
        from .controllers.rpi_controller import rpi_bp

        # Domain_Controllers (Phase 1, task 3.13) registered as
        # sub-blueprints under `web_bp` so `/api/web/...` URLs remain
        # byte-identical with the pre-Phase-1 routing surface
        # (Requirements 1.1, 1.2, 1.6, 7.1).
        from .controllers.dashboard_controller import dashboard_bp
        from .controllers.users_controller import users_bp
        from .controllers.locations_controller import locations_bp
        from .controllers.machines_controller import machines_bp
        from .controllers.rewards_controller import rewards_bp
        from .controllers.logs_controller import logs_bp
        from .controllers.leaderboard_controller import leaderboard_bp
        from .controllers.groups_controller import groups_bp
        from .controllers.analytics_controller import analytics_bp
        from .controllers.settings_controller import settings_bp
        from .controllers.sessions_controller import sessions_bp

        for sub_bp in (
            dashboard_bp, users_bp, locations_bp, machines_bp, rewards_bp,
            logs_bp, leaderboard_bp, groups_bp, analytics_bp, settings_bp,
            sessions_bp,
        ):
            web_bp.register_blueprint(sub_bp)

        app.register_blueprint(auth_bp)
        app.register_blueprint(web_bp)
        app.register_blueprint(rpi_bp)

    # Register CLI commands
    from .seeder import seed_cmd, demo_seed_cmd
    app.cli.add_command(seed_cmd)
    app.cli.add_command(demo_seed_cmd)

    # Phase 4I (task 18.1): register the token-blacklist cleanup command.
    # Validates Requirements 4I.32, 4I.33.
    from .seeder.cleanup import cleanup_tokens
    app.cli.add_command(cleanup_tokens)

    return app
