# Password Hash Pinning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin the password-hashing algorithm explicitly to `scrypt` so password hashes are reproducible across Python/Werkzeug versions instead of relying on the library default.

**Architecture:** `User.set_password()` currently calls `werkzeug.security.generate_password_hash(password)` with no `method=` argument, so the algorithm is whatever the installed Werkzeug version defaults to (currently `scrypt`, but this can drift between versions). We pin `method='scrypt'` explicitly. Because `scrypt` is already the current default, existing stored hashes remain valid, and `check_password_hash` reads the algorithm from each stored hash string, so verification keeps working for any previously-stored hash regardless of algorithm. No database migration or password reset is required.

**Tech Stack:** Python, Werkzeug `security` module, pytest.

---

## Background the engineer needs

- The `User` model lives in `server/app/models.py`. Two methods matter:
  - `set_password(self, password)` — hashes and stores into `self.password_hash`.
  - `check_password(self, password)` — verifies a plaintext against the stored hash.
- Werkzeug's `generate_password_hash(password, method=..., salt_length=...)` embeds the method name as a prefix in the output string, e.g. `scrypt:32768:8:1$<salt>$<hash>` or `pbkdf2:sha256:...`. `check_password_hash` parses that prefix, so it can verify a hash made by ANY supported method — that's why pinning the *write* path does not break verifying *old* hashes.
- Tests run from the `server/` directory with `python -m pytest`. The test suite is hermetic (SQLite in-memory, configured in `server/tests/conftest.py`). A bare `User()` can be instantiated without a database session because `set_password`/`check_password` only touch the in-memory `password_hash` attribute.

Why `scrypt` and not `argon2id`: `scrypt` is the current Werkzeug default, so pinning it is a zero-risk, no-new-dependency change that makes the existing behaviour explicit. Migrating to `argon2id` would add the `argon2-cffi` dependency and is a larger, separate decision — out of scope here (YAGNI).

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `server/tests/unit/test_password_hash_method.py` | Pin the hashing method and verify round-trip + backward compatibility | Create |
| `server/app/models.py` | `User.set_password` — add explicit `method='scrypt'` | Modify (1 line) |

---

### Task 1: Pin the password hash method to scrypt

**Files:**
- Create: `server/tests/unit/test_password_hash_method.py`
- Modify: `server/app/models.py` (the `set_password` method, ~line 234)

- [ ] **Step 1: Write the failing test**

Create `server/tests/unit/test_password_hash_method.py` with exactly this content:

```python
"""
Unit tests pinning the password-hashing algorithm.

`User.set_password` must produce a `scrypt`-prefixed hash so the algorithm
is explicit and reproducible across Werkzeug/Python versions, instead of
silently following the library default. `check_password` must still verify
correctly (round-trip), and must also verify a legacy `pbkdf2:sha256` hash
(backward compatibility — old rows in the DB may use a different method).
"""
from werkzeug.security import generate_password_hash

from app.models import User


_SAMPLE_PASSWORD = 'S0me-Str0ng-Passw0rd!'


def test_set_password_pins_scrypt_method():
    """New hashes MUST be scrypt, pinned explicitly (not left to the
    Werkzeug default which can drift across versions)."""
    user = User()
    user.set_password(_SAMPLE_PASSWORD)

    assert user.password_hash is not None
    assert user.password_hash.startswith('scrypt:'), (
        'expected an explicitly-pinned scrypt hash; got prefix '
        f'{user.password_hash.split("$", 1)[0]!r}'
    )


def test_check_password_round_trip():
    """A freshly-set password verifies true; a wrong password verifies
    false."""
    user = User()
    user.set_password(_SAMPLE_PASSWORD)

    assert user.check_password(_SAMPLE_PASSWORD) is True
    assert user.check_password('not-the-password') is False


def test_check_password_verifies_legacy_pbkdf2_hash():
    """Backward compatibility: a hash stored under the old default
    (pbkdf2:sha256) MUST still verify, because check_password_hash reads
    the algorithm from the stored hash string."""
    user = User()
    user.password_hash = generate_password_hash(
        _SAMPLE_PASSWORD, method='pbkdf2:sha256'
    )

    assert user.check_password(_SAMPLE_PASSWORD) is True
    assert user.check_password('wrong') is False
```

- [ ] **Step 2: Run the test to verify the pin assertion fails**

Run (from `server/`): `python -m pytest tests/unit/test_password_hash_method.py -v`

Expected: `test_set_password_pins_scrypt_method` may PASS or FAIL depending on the installed Werkzeug default, while the other two PASS. The point of the next step is to make the scrypt prefix *guaranteed* rather than incidental. If all three already pass, that confirms scrypt is the current default — proceed to Step 3 to lock it in so a future Werkzeug upgrade cannot silently change it.

- [ ] **Step 3: Pin the method in `set_password`**

In `server/app/models.py`, change the `set_password` method:

```python
    def set_password(self, password):
        # Pin the algorithm explicitly so stored hashes are reproducible
        # across Werkzeug/Python versions. scrypt is the current Werkzeug
        # default, so this is a no-op for existing hashes (no migration
        # needed) — it only guards against a future default change.
        self.password_hash = generate_password_hash(password, method='scrypt')
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `server/`): `python -m pytest tests/unit/test_password_hash_method.py -v`

Expected: all three tests PASS.

- [ ] **Step 5: Run the broader auth/password suite to confirm no regression**

Run (from `server/`): `python -m pytest tests/property/test_phase4g_password_policy.py tests/unit -q`

Expected: all PASS (no `failed`, no `error`).

- [ ] **Step 6: Commit**

```bash
git add server/tests/unit/test_password_hash_method.py server/app/models.py
git commit -m "security: pin password hashing to scrypt explicitly"
```

---

## Self-Review

**1. Spec coverage:** Gap = "pin `generate_password_hash(method=...)`". Task 1 pins `method='scrypt'` (Step 3) and proves it (Step 1 test). Backward compatibility with existing hashes is covered by `test_check_password_verifies_legacy_pbkdf2_hash`. ✅

**2. Placeholder scan:** No TBD/TODO. Every step shows exact file content and exact commands. ✅

**3. Type/name consistency:** `set_password`/`check_password`/`password_hash` match `server/app/models.py`. Test file path is identical across Steps 1, 2, 4, 6. The pinned method string `'scrypt'` matches the asserted prefix `'scrypt:'`. ✅

---

## Notes / Future

If stronger brute-force resistance is later required, migrating to `argon2id` (via `argon2-cffi`) is the natural next step — but that adds a dependency and warrants its own plan. `check_password` would transparently verify both old scrypt and new argon2id hashes during a gradual rehash-on-login migration.
