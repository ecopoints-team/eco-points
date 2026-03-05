import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv

# Initialize Extensions
load_dotenv()
db = SQLAlchemy()
migrate = Migrate()


class Config:
    """Standard Flask configuration class."""
    # Production: set DATABASE_URL to your Postgres connection string.
    # Local dev fallback: SQLite file in the server/ directory.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), 'ecopoints.db')
    )
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-DO-NOT-USE-IN-PRODUCTION')
    JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', 24))
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def create_app():
    """Application factory for the EcoPoints Flask server."""
    app = Flask(__name__, instance_relative_config=False)
    # Load Config from environment or defaults
    app.config.from_object(Config)

    # Warn if using default secret key
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
        "http://127.0.0.1:3000",
        "https://ecopoints.org",
        "https://www.ecopoints.org",
        "https://rewards.ecopoints.org",
    ]

    # Add additional origins from environment variable if provided
    if os.environ.get('CORS_ORIGINS'):
        allowed_origins.extend(os.environ.get('CORS_ORIGINS').split(','))
    
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })

    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        # Import routes and models so they are registered
        from . import routes, models  # noqa: F401

        # Register blueprints
        from .controllers.auth_controller import auth_bp
        from .controllers.web_controller import web_bp
        from .controllers.rpi_controller import rpi_bp
        
        app.register_blueprint(auth_bp)
        app.register_blueprint(web_bp)
        app.register_blueprint(rpi_bp)

    # Register CLI commands
    from .seeder import seed_cmd
    app.cli.add_command(seed_cmd)

    return app
