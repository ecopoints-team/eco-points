"""Smoke check that a weak SEED_PASSWORD exits non-zero with no rows touched."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Run the seeder with a weak password in a subprocess so we can capture
# the sys.exit(1).
weak_password_script = HERE / '_seed_weak_password_runner.py'
weak_password_script.write_text(
    """
import os
import sys
os.environ['SEED_PASSWORD'] = 'short'   # too short, no upper, no digit
os.environ.setdefault(
    'DATABASE_URL',
    'sqlite:///file:weak-pw-smoke?mode=memory&cache=shared&uri=true',
)
os.environ.setdefault('SECRET_KEY', 'smoke-test-key')

from app import create_app, db
from app.models import User
from app.seeder.seed import run_seed

app = create_app()
with app.app_context():
    db.create_all()
    before = User.query.count()
    try:
        run_seed(fresh=False)
    except SystemExit as e:
        # The seeder uses sys.exit(1); we expect that.
        after = User.query.count()
        print(f'EXIT_CODE={e.code} ROWS_BEFORE={before} ROWS_AFTER={after}')
        sys.exit(0 if (e.code == 1 and before == after) else 99)
    # If we got here without SystemExit, that's a contract violation.
    print('NO_EXIT_RAISED — contract violated')
    sys.exit(99)
""".lstrip(),
    encoding='utf-8',
)

result = subprocess.run(
    [sys.executable, str(weak_password_script)],
    cwd=str(HERE),
    capture_output=True,
    text=True,
)
print('--- subprocess stdout ---')
print(result.stdout)
print('--- subprocess stderr ---')
print(result.stderr)
print(f'--- subprocess exit: {result.returncode} ---')

# Cleanup
weak_password_script.unlink()

if result.returncode != 0:
    print('FAILED: weak-password smoke check did not satisfy contract.')
    sys.exit(1)
print('PASSED: weak SEED_PASSWORD exited non-zero with no rows touched.')
