# Continuous Integration

CI runs automatically on every push and on pull requests targeting `main`,
defined in `.github/workflows/ci.yml`. Three jobs run in parallel:

| Job | What it runs | Reproduce locally |
| --- | --- | --- |
| `Server tests (pytest)` | `python -m pytest -m "not integration" -q` in `server/` | From `server/`: `python -m pytest -m "not integration" -q` |
| `Tools tests (secret hygiene)` | `python -m pytest tools/tests -q` at repo root | From repo root: `python -m pytest tools/tests -q` |
| `Client tests + build (vitest, next build)` | `npm ci`, `npm test` (Vitest), `npm run build` in `client/` | From `client/`: `npm ci` then `npm test` then `npm run build` |

## Why integration tests are excluded

Tests marked `@pytest.mark.integration` (e.g. migration reversibility) need an
external Postgres instance. They are excluded in CI via `-m "not integration"`.
Run them manually against a Postgres test database when working on migrations.

## Required: enable branch protection (one-time, manual)

The workflow reports status but does not block merges on its own. To make these
checks mandatory:

1. GitHub repository → **Settings** → **Branches** → **Add branch ruleset**
   (or **Add rule**) for `main`.
2. Enable **Require status checks to pass before merging**.
3. Select these required checks:
   - `Server tests (pytest)`
   - `Tools tests (secret hygiene)`
   - `Client tests + build (vitest, next build)`
4. (Recommended) Enable **Require a pull request before merging**.
5. Save.

After this, a pull request cannot merge into `main` until all three jobs pass.
