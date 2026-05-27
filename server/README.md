1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate

2. Install dependencies
pip install -r requirements.txt

3. Set environment variables
set DATABASE_URL=postgresql+psycopg://postgres:admin@127.0.0.1:5433/ecopoints
set SECRET_KEY=change-me
set FLASK_APP=run.py

4. Run database migrations
flask db init
flask db migrate -m "initial"
flask db upgrade

5. Start the application
python run.py

---

## Token Blacklist Cleanup

The `token_blacklist` table stores invalidated JWTs (issued on logout or
force-logout). Without periodic cleanup the table grows unboundedly, which
slows down the `jti` lookup that `@token_required` performs on every
authenticated request.

### What the command does

```
flask cleanup-tokens
```

Deletes all rows from `token_blacklist` where `expires_at < NOW()` (i.e.
tokens that have already expired and can never be presented again), commits
the transaction, and writes a log line of the form:

```
token_blacklist cleanup: deleted=<int> duration_s=<float>
```

### Schedule — run at least once per 24 hours

**Linux / macOS cron** — add to `crontab -e`:

```cron
# Run token blacklist cleanup every day at 02:00 UTC
0 2 * * * cd /path/to/server && /path/to/.venv/bin/flask cleanup-tokens >> /var/log/ecopoints-cleanup.log 2>&1
```

**Render Cron Job** (recommended for production deployments on Render):

1. In the Render dashboard, open your service and go to **Cron Jobs**.
2. Create a new Cron Job with the following settings:
   - **Name**: `Token Blacklist Cleanup`
   - **Schedule**: `0 2 * * *` (daily at 02:00 UTC)
   - **Command**: `flask cleanup-tokens`
   - **Environment**: same environment variables as the web service
     (`DATABASE_URL`, `SECRET_KEY`, `FLASK_APP=run.py`)

**GitHub Actions** (alternative):

```yaml
name: Token Blacklist Cleanup
on:
  schedule:
    - cron: '0 2 * * *'   # daily at 02:00 UTC
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r server/requirements.txt
        working-directory: .
      - name: Run cleanup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
          FLASK_APP: run.py
        run: flask cleanup-tokens
        working-directory: server
```

### Why this matters

JWTs carry an `exp` claim, so an expired token is already rejected by
`@token_required` before the blacklist lookup. However, the row must remain
in the table until the token's natural expiry so that a still-valid
blacklisted token (e.g. one issued just before a force-logout) is correctly
rejected. Once `expires_at` passes, the row is safe to delete — the token
can never be valid again regardless of the blacklist.

Running the cleanup job daily keeps the table bounded to at most
`max_token_lifetime` worth of rows (default: 24 hours × request rate),
which is typically a few thousand rows at most.
