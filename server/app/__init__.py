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
        'DATABASE_URL', 'mysql+pymysql://root:password@localhost:3306/flaskapp'
    )
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def create_app():
    app = Flask(__name__, instance_relative_config=False)
    # Load Config from environment or defaults
    app.config.from_object(Config)
    
    # Enable CORS for frontend and Raspberry Pi
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
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
