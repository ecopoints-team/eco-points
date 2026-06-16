# CI/CD Test Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions pipeline that runs the existing server (pytest), tools (pytest), and client (vitest) test suites plus the Next.js build on every push and pull request, so regressions are caught automatically before merge.

**Architecture:** A single workflow file at `.github/workflows/ci.yml` with three independent jobs — `server-tests`, `tools-tests`, and `client`. Each job is self-contained (its own runtime setup, dependency install, and test command) and runs in parallel. The server and tools suites are hermetic (SQLite in-memory, env defaults set in `server/tests/conftest.py`), so no database service is required; integration tests that need Postgres are excluded via the `integration` pytest marker.

**Tech Stack:** GitHub Actions, Python 3.14 + pytest 9 + Hypothesis (server), Node 20 + Vitest 2 (client), Next.js 16.

---

## Background the engineer needs

You are adding continuous integration to a project that already has a large, passing test suite but no automation to run it. Nothing here changes application code — you are wiring up CI only.

**Repository layout (relevant parts):**

```
/                              ← repo root
├── .github/workflows/         ← EMPTY today; the workflow goes here
├── server/                    ← Flask backend (Python)
│   ├── requirements.txt       ← pinned Python deps
│   └── tests/
│       ├── conftest.py        ← sets DATABASE_URL=sqlite-in-memory, SECRET_KEY, etc.
│       ├── unit/  property/  static/  smoke/
│       └── integration/       ← marked @pytest.mark.integration (needs Postgres)
├── tools/
│   └── tests/                 ← test_secret_hygiene.py (repo-wide secret scan)
├── client/                    ← Next.js frontend (Node)
│   ├── package.json           ← "test": "vitest run", "build": "next build"
│   └── package-lock.json
└── package.json               ← root; delegates to client/
```

**Key facts that make the commands below correct:**

- `server/tests/conftest.py` calls `os.environ.setdefault(...)` for `DATABASE_URL` (SQLite in-memory), `SECRET_KEY`, `JWT_EXPIRY_HOURS`, `COOKIE_SAMESITE`, and `AUTH_CSRF_DISABLED`. **Therefore the server tests need no environment configuration in CI** — they self-bootstrap.
- Integration tests use `@pytest.mark.integration` and require an external Postgres. They are excluded with `-m "not integration"`. The marker is registered in `conftest.py`, so this flag is safe.
- There is no `pytest.ini`/`pyproject.toml`. Pytest is invoked as `python -m pytest` from the directory whose `conftest.py` should apply.
- The client test runner is Vitest (`npm test` → `vitest run`). It exits non-zero on failure, which is what gates the build.

**How to run things locally on Windows (your machine) — for the pre-flight checks:**
- Server: from `server/`, `python -m pytest -m "not integration" -q`
- Tools: from repo root, `python -m pytest tools/tests -q`
- Client: from `client/`, `npm ci` then `npm test`

> ⚠️ Do NOT use `&&` to chain commands in `cmd`. Run each command separately, or use `;` in PowerShell.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Defines the CI pipeline: triggers, and the `server-tests`, `tools-tests`, and `client` jobs. | Create |
| `docs/ci.md` | Human documentation: what CI runs, how to reproduce locally, and the manual branch-protection setup that code cannot enforce. | Create |
| `server/tests/unit/test_ci_canary.py` | A throwaway failing test used ONCE to prove the gate actually blocks merges, then deleted. | Create then delete (Task 4) |

---

### Task 1: Create the workflow with the server test job

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Pre-flight — confirm the server suite passes locally**

This establishes ground truth before you encode the command in CI. Run from the `server/` directory:

Run: `python -m pytest -m "not integration" -q`
Expected: a line like `=== NNN passed, M skipped in X.XXs ===` and exit code 0. No `failed`, no `error`.

If anything fails here, STOP — the failure is pre-existing and must be reported, not encoded into a green CI.

- [ ] **Step 2: Create `.github/workflows/ci.yml` with triggers and the server job**

Create the file with exactly this content:

```yaml
name: CI

# Run on every push to any branch and on every pull request targeting main.
on:
  push:
  pull_request:
    branches: [main]

# Cancel superseded runs on the same ref to save CI minutes.
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  server-tests:
    name: Server tests (pytest)
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Python 3.14
        uses: actions/setup-python@v5
        with:
          python-version: "3.14"
          cache: pip
          cache-dependency-path: server/requirements.txt

      - name: Install server dependencies
        run: pip install -r server/requirements.txt

      - name: Run server test suite (excluding integration)
        working-directory: server
        run: python -m pytest -m "not integration" -q
```

- [ ] **Step 3: Validate the workflow YAML locally**

CI YAML mistakes are the most common failure. Validate that the file parses as YAML. From the repo root:

Run (PowerShell): `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('YAML OK')"`
Expected: prints `YAML OK` and exits 0. (PyYAML ships with the server deps you just confirmed are installable; if it is not present locally, run `pip install pyyaml` first.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow with server pytest job"
```

---

### Task 2: Add the tools test job

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Pre-flight — confirm the tools suite passes locally**

Run from the repo root:

Run: `python -m pytest tools/tests -q`
Expected: `=== NNN passed in X.XXs ===` and exit code 0.

- [ ] **Step 2: Add the `tools-tests` job to `.github/workflows/ci.yml`**

Append this job under `jobs:` (same indentation level as `server-tests`, i.e. two spaces):

```yaml
  tools-tests:
    name: Tools tests (secret hygiene)
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Python 3.14
        uses: actions/setup-python@v5
        with:
          python-version: "3.14"
          cache: pip
          cache-dependency-path: server/requirements.txt

      - name: Install dependencies (pytest comes from server requirements)
        run: pip install -r server/requirements.txt

      - name: Run tools test suite
        run: python -m pytest tools/tests -q
```

- [ ] **Step 3: Validate the workflow YAML locally**

Run (PowerShell): `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('YAML OK')"`
Expected: prints `YAML OK` and exits 0.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add tools (secret hygiene) test job"
```

---

### Task 3: Add the client job (Vitest + build)

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Pre-flight — confirm the client suite and build pass locally**

Run from the `client/` directory:

Run: `npm ci`
Expected: installs dependencies from `package-lock.json`, exit code 0.

Run: `npm test`
Expected: Vitest prints a passing summary (e.g. `Test Files N passed`), exit code 0.

Run: `npm run build`
Expected: Next.js prints `✓ Compiled successfully` (or equivalent) and exits 0.

If `npm run build` requires environment variables that are absent in a clean checkout, note which ones — but do NOT add secrets to CI. The build in CI uses only what is committed plus the public defaults in `next.config.js`.

- [ ] **Step 2: Add the `client` job to `.github/workflows/ci.yml`**

Append this job under `jobs:` (two-space indentation, same level as the other jobs):

```yaml
  client:
    name: Client tests + build (vitest, next build)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: client
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: client/package-lock.json

      - name: Install client dependencies
        run: npm ci

      - name: Run client test suite
        run: npm test

      - name: Build the Next.js client
        run: npm run build
```

- [ ] **Step 3: Validate the workflow YAML locally**

Run (PowerShell): `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('YAML OK')"`
Expected: prints `YAML OK` and exits 0.

- [ ] **Step 4: Commit and push to a branch**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add client vitest + next build job"
git checkout -b ci/test-gating
git push -u origin ci/test-gating
```

- [ ] **Step 5: Verify all three jobs run green on GitHub**

Open the repository on GitHub → **Actions** tab → the run for branch `ci/test-gating`.
Expected: three jobs — `Server tests (pytest)`, `Tools tests (secret hygiene)`, `Client tests + build (vitest, next build)` — all show green checkmarks.

If a job is red, open its log, read the failing step, fix the workflow (not the application code), commit, and push again. Do not proceed to Task 4 until all three are green.

---

### Task 4: Prove the gate actually blocks failures

A green pipeline does not prove the gate works — it must also turn **red** when a test fails. This task injects a deliberate failure, confirms CI catches it, then removes it.

**Files:**
- Create then delete: `server/tests/unit/test_ci_canary.py`

- [ ] **Step 1: Add a deliberately failing canary test**

Create `server/tests/unit/test_ci_canary.py` with exactly:

```python
"""Temporary canary: proves CI fails the build on a failing test.

This file is intentionally added to confirm the CI gate turns red on a
failing test, then deleted in the same task. It must NOT remain in the
repository.
"""


def test_ci_gate_detects_failure():
    assert 1 == 2, "Intentional CI canary failure — delete this file after verifying CI went red."
```

- [ ] **Step 2: Confirm it fails locally**

Run from `server/`: `python -m pytest tests/unit/test_ci_canary.py -q`
Expected: `1 failed` and exit code 1, with the message "Intentional CI canary failure".

- [ ] **Step 3: Push the canary and confirm CI turns red**

```bash
git add server/tests/unit/test_ci_canary.py
git commit -m "test: add temporary CI canary to verify the gate blocks failures"
git push
```

Open GitHub → **Actions** → latest run on `ci/test-gating`.
Expected: the `Server tests (pytest)` job is RED (failed); the run's overall status is failure. This proves the gate works.

- [ ] **Step 4: Remove the canary**

```bash
git rm server/tests/unit/test_ci_canary.py
git commit -m "test: remove CI canary after confirming the gate blocks failures"
git push
```

- [ ] **Step 5: Confirm CI is green again**

Open GitHub → **Actions** → latest run.
Expected: all three jobs green. The canary file no longer exists in the branch (`git status` shows it gone).

---

### Task 5: Document CI and the manual branch-protection step

GitHub branch protection (requiring these checks to pass before merge) is configured in repository **Settings**, not in code — the workflow alone does not block merges. This task documents both what CI does and the one-time manual setup.

**Files:**
- Create: `docs/ci.md`

- [ ] **Step 1: Create `docs/ci.md`**

Create the file with exactly this content:

```markdown
# Continuous Integration

CI runs automatically on every push and on pull requests targeting `main`,
defined in `.github/workflows/ci.yml`. Three jobs run in parallel:

| Job | What it runs | Reproduce locally |
| --- | --- | --- |
| `server-tests` | `python -m pytest -m "not integration" -q` in `server/` | From `server/`: `python -m pytest -m "not integration" -q` |
| `tools-tests` | `python -m pytest tools/tests -q` at repo root | From repo root: `python -m pytest tools/tests -q` |
| `client` | `npm ci`, `npm test` (Vitest), `npm run build` in `client/` | From `client/`: `npm ci` then `npm test` then `npm run build` |

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
```

- [ ] **Step 2: Commit and push**

```bash
git add docs/ci.md
git commit -m "docs: document CI pipeline and branch-protection setup"
git push
```

- [ ] **Step 3: Open a pull request to main**

Use the GitHub CLI (or the web UI):

```bash
gh pr create --base main --head ci/test-gating --title "Add CI test gating" --body "Adds GitHub Actions workflow running server/tools pytest and client vitest+build on every push/PR. Verified the gate blocks failing tests (canary). Includes docs/ci.md with the manual branch-protection setup."
```

Expected: a PR URL is printed, and the PR page shows the three CI checks running, then passing.

---

## Self-Review

**1. Spec coverage (the "CI/CD gating" gap):**
- Run existing test suites on push/PR → Tasks 1 (server), 2 (tools), 3 (client). ✅
- Build the client to catch compile breaks → Task 3, Step 2 (`npm run build`). ✅
- Prove the gate blocks regressions (not just reports) → Task 4 (canary). ✅
- Make checks enforceable on merge → Task 5 (branch-protection docs; manual because GitHub has no in-repo API for it). ✅
- Exclude DB-dependent tests so CI is hermetic → Tasks 1/5 (`-m "not integration"`). ✅

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases". Every code step shows complete file content; every run step shows the exact command and expected result. ✅

**3. Type/name consistency:** Job names are identical everywhere they appear — `Server tests (pytest)`, `Tools tests (secret hygiene)`, `Client tests + build (vitest, next build)` — in the workflow (Tasks 1–3), the red/green verification steps (Tasks 3–4), and the branch-protection list (Task 5). Branch name `ci/test-gating` is consistent across Tasks 3–5. Canary file path `server/tests/unit/test_ci_canary.py` is identical in create (Task 4 Step 1) and delete (Task 4 Step 4). ✅

---

## Follow-on plans (the other 7 gaps — each its own plan/spec)

Recommended order after this one:
1. **Origin TLS** — terminate HTTPS at nginx (or switch Cloudflare to Full/strict) so the CF→origin hop is encrypted; HSTS is currently advertised but the origin listens on `:80`.
2. **Refresh tokens** — short-lived access token + rotating refresh token to shrink the 24h exposure window. *(Needs a short design first.)*
3. **Password-hash pinning** — pin `generate_password_hash(method=...)` or migrate to argon2id (small, well-scoped).
4. **Per-route/per-user rate limiting** — extend beyond the auth endpoints.
5. **Observability** — structured request logging + error tracking (e.g. Sentry). *(Needs a design.)*
6. **Service/repository layer** — extract business logic out of controllers for isolation/testability. *(Needs a design.)*
7. **Ops runbooks** — DB backup/restore, secret rotation, staging environment.
