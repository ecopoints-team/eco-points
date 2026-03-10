"""
EcoPoints - Database Seed Script
=================================
Populates all 16 tables with realistic test data.

Usage:
    cd server
    python seed.py          # wipes and re-seeds
    python seed.py --keep   # only seeds if tables are empty

All passwords: test123
"""
import sys
from app import create_app
from app.seeder.seed import run_seed
from app.models import User

if __name__ == '__main__':
    keep = '--keep' in sys.argv
    app = create_app()
    with app.app_context():
        if keep and User.query.first():
            print('Database already seeded. Use without --keep to re-seed.')
            sys.exit(0)
        run_seed(fresh=True)