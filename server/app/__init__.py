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

# Secrets that MUST be present in production — app cannot function without them.
CRITICAL_PRODUCTION_SECRETS = (
    'SECRET_KEY',
    'DATABASE_URL',
)

# Secrets for optional services — app starts but features degrade gracefully.
OPTIONAL_PRODUCTION_SECRETS = (
    'RESEND_API_KEY',     # Resend API key used by notification_service._send_email
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
    'RESEND_API_KEY': frozenset({
        # Matches the placeholder in `server/.env`.
        'your-resend-api-key',
        'changeme',
    }),
}


def _check_required_secrets_in_production():
    """Check production secrets. Critical secrets block startup; optional
    secrets only emit warnings (features degrade gracefully).

    Logs only variable NAMES (never values).
    Validates Requirement 7.5 (Task 21.1).
    """
    if os.environ.get('FLASK_ENV') != 'production':
        return

    logger = logging.getLogger(__name__)

    # ── Critical secrets: missing or insecure → exit(1) ──
    fatal = False
    for name in CRITICAL_PRODUCTION_SECRETS:
        value = os.environ.get(name)
        if not value:
            logger.critical(
                'Refusing to start in production: required secret %s is not set',
                name,
            )
            fatal = True
        elif value in KNOWN_DEV_DEFAULTS.get(name, frozenset()):
            logger.critical(
                'Refusing to start in production: required secret %s is set to a '
                'known development default value',
                name,
            )
            fatal = True

    if fatal:
        sys.exit(1)

    # ── Optional secrets: missing → warn, app still starts ──
    for name in OPTIONAL_PRODUCTION_SECRETS:
        value = os.environ.get(name)
        if not value:
            logger.warning(
                'Optional secret %s is not set — related features '
                '(email/SMS notifications) will be unavailable',
                name,
            )
        elif value in KNOWN_DEV_DEFAULTS.get(name, frozenset()):
            logger.warning(
                'Optional secret %s is set to a known development default — '
                'related features may not work correctly',
                name,
            )


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
    # Supabase (PgBouncer) drops idle connections. pool_pre_ping checks each
    # connection before use so stale connections are transparently recycled.
    # pool_recycle forces connections to be replaced after 5 minutes, preventing
    # "connection already closed" errors on long-idle Supabase pooler sessions.
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True, 'pool_recycle': 300}


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

    # Rate-limit storage: use Redis when available so limits are GLOBAL across
    # all gunicorn workers (memory:// gives each worker its own counter, making
    # the effective limit N×higher). Falls back to in-memory if Redis is down so
    # a cache outage never rejects legitimate requests.
    _redis_url = os.environ.get('REDIS_URL')
    if _redis_url:
        app.config['RATELIMIT_STORAGE_URI'] = _redis_url
        app.config['RATELIMIT_STORAGE_OPTIONS'] = {'socket_connect_timeout': 3}
        app.config['RATELIMIT_IN_MEMORY_FALLBACK_ENABLED'] = True
        print('[RATELIMIT] Using Redis storage (global across workers)')
    else:
        print('[RATELIMIT] REDIS_URL not set — using in-memory storage (per-worker)')
    limiter.init_app(app)

    # Initialize Redis cache (non-fatal — app degrades gracefully if unavailable)
    from .cache import init_redis
    init_redis(app)

    with app.app_context():
        # Import routes and models so they are registered
        from . import routes, models  # noqa: F401

        # Ensure qr_token column exists in database (Auto-Migration)
        # Uses a lightweight catalog query instead of SQLAlchemy inspector
        # so startup doesn't block on slow/cold Supabase pooler connections.
        try:
            result = db.session.execute(db.text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='users' AND column_name='qr_token' LIMIT 1"
            )).fetchone()

            if result is None:
                # Column missing — add it
                app.logger.info("Adding 'qr_token' column to 'users' table...")
                db.session.execute(db.text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_token VARCHAR(100) UNIQUE"
                ))
                db.session.commit()
                app.logger.info("'qr_token' column added successfully.")

            # Backfill existing users without qr_token
            from .models import User
            import secrets
            users_to_backfill = User.query.filter(User.qr_token == None).all()
            if users_to_backfill:
                app.logger.info(f"Backfilling {len(users_to_backfill)} users with secure QR tokens...")
                for u in users_to_backfill:
                    u.qr_token = secrets.token_hex(16)
                db.session.commit()
                app.logger.info("Backfill completed successfully.")
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error during qr_token migration/backfill startup hook: {e}")

        # Auto-migrate: ensure last_username_change column exists
        try:
            result = db.session.execute(db.text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='users' AND column_name='last_username_change' LIMIT 1"
            )).fetchone()
            if result is None:
                app.logger.info("Adding 'last_username_change' column to 'users' table...")
                db.session.execute(db.text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMP"
                ))
                db.session.commit()
                app.logger.info("'last_username_change' column added successfully.")
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error during last_username_change migration: {e}")

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
        from .controllers.groups_controller import groups_bp
        from .controllers.analytics_controller import analytics_bp
        from .controllers.settings_controller import settings_bp
        from .controllers.sessions_controller import sessions_bp
        from .controllers.reward_categories_controller import reward_categories_bp
        from .controllers.leaderboard_controller import leaderboard_bp

        for sub_bp in (
            dashboard_bp, users_bp, locations_bp, machines_bp, rewards_bp,
            logs_bp, leaderboard_bp, groups_bp, analytics_bp, settings_bp,
            sessions_bp, reward_categories_bp,
        ):
            web_bp.register_blueprint(sub_bp)

        app.register_blueprint(auth_bp)
        app.register_blueprint(web_bp)
        app.register_blueprint(rpi_bp)

        # Serve uploaded files (avatars, etc.)
        from flask import send_from_directory
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

        @app.route('/uploads/<path:filename>')
        def serve_upload(filename):
            return send_from_directory(uploads_dir, filename)

    # Register CLI commands
    from .seeder import seed_cmd, demo_seed_cmd
    app.cli.add_command(seed_cmd)
    app.cli.add_command(demo_seed_cmd)

    # Phase 4I (task 18.1): register the token-blacklist cleanup command.
    # Validates Requirements 4I.32, 4I.33.
    from .seeder.cleanup import cleanup_tokens
    app.cli.add_command(cleanup_tokens)

    return app
