"""
EcoPoints Database Seeder
~~~~~~~~~~~~~~~~~~~~~~~~~
Flask CLI command to populate the database with realistic sample data.

Usage:
    flask seed           # Seed only if DB is empty
    flask seed --fresh   # Wipe all data, then reseed
"""
import click
from flask.cli import with_appcontext


@click.command('seed')
@click.option('--fresh', is_flag=True, help='Truncate all tables before seeding.')
@with_appcontext
def seed_cmd(fresh):
    """Populate the database with sample data for dashboard testing."""
    from .seed import run_seed
    run_seed(fresh=fresh)
