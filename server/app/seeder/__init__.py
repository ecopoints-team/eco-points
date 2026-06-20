"""
EcoPoints Database Seeder
~~~~~~~~~~~~~~~~~~~~~~~~~
Flask CLI command to populate the database with realistic sample data.

Usage:
    flask seed                # Seed only if DB is empty (base 7 users)
    flask seed --fresh        # Wipe all data, then reseed (base 7 users)
    flask seed --demo         # Full demo: 50 users, 2020-2026 activity data
"""
import click
from flask.cli import with_appcontext


@click.command('seed')
@click.option('--fresh', is_flag=True, help='Truncate all tables before seeding.')
@click.option('--demo', is_flag=True, help='Include demo data (50 users, 7 years of activity).')
@click.option('--skip-wipe', 'skip_wipe', is_flag=True, help='Skip the TRUNCATE step (use after manually wiping on Supabase).')
@with_appcontext
def seed_cmd(fresh, demo, skip_wipe):
    """Populate the database with sample data for dashboard testing."""
    from .seed import run_seed, run_demo_seed
    if demo:
        run_demo_seed(skip_wipe=skip_wipe)
    else:
        run_seed(fresh=fresh, skip_wipe=skip_wipe)
