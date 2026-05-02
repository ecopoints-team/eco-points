"""
EcoPoints - Database Seed Script
=================================
Populates all 19-table ERD with realistic sample data.

Usage:
    cd server
    python seed.py          # wipes and re-seeds (fresh=True)
    python seed.py --keep   # only seeds if tables are empty

Alternative: flask seed --fresh

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