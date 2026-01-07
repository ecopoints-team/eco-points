import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()


class Config:
    # kept for backwards-compat in case someone imports from app
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'postgresql+psycopg2://postgres:admin@127.0.0.1:5433/ecopoints'
    )
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def create_app():
    app = Flask(__name__, instance_relative_config=False)
    # Load Config from environment or defaults
    app.config.from_object(Config)
    
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
        from .controllers.web_controller import web_bp
        from .controllers.rpi_controller import rpi_bp
        
        app.register_blueprint(web_bp)
        app.register_blueprint(rpi_bp)

    return app
