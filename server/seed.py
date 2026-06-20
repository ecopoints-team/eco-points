"""
EcoPoints - Database Seed Script
=================================
Populates all 19-table ERD with realistic sample data.

Usage:
    cd server
    python seed.py              # wipes and re-seeds (base 7 users)
    python seed.py --keep       # only seeds if tables are empty
    python seed.py --demo       # full demo: 50 users, 2020-2026 data

Alternative: flask seed --fresh
             flask seed --demo

All passwords: SeedPass!23 (or $SEED_PASSWORD env var)
"""
import sys
from app import create_app
from app.seeder.seed import run_seed
from app.models import User

if __name__ == '__main__':
    demo = '--demo' in sys.argv
    keep = '--keep' in sys.argv
    skip_wipe = '--skip-wipe' in sys.argv
    app = create_app()
    with app.app_context():
        if demo:
            from app.seeder.seed import run_demo_seed
            run_demo_seed(skip_wipe=skip_wipe)
        elif keep and User.query.first():
            print('Database already seeded. Use without --keep to re-seed.')
            sys.exit(0)
        else:
            run_seed(fresh=True, skip_wipe=skip_wipe)