"""
Cross-phase / Property Z — Secret hygiene.

Validates: Requirements 7.4, 7.9.

This test is a static (regex) scan. It walks every authored source file
under ``server/``, ``client/``, and ``nginx/`` (the three trees the
hygiene invariant covers per Requirement 7.9) and asserts that none of
the following hardcoded-secret patterns appear:

  * ``SECRET_KEY = 'dev'`` (or any direct ``SECRET_KEY = 'dev[-_]...'``
    literal that is NOT shielded behind ``os.environ.get(...)`` /
    ``os.getenv(...)``).
  * Hardcoded BCrypt salts / hashes — any literal ``$2a$``, ``$2b$``,
    or ``$2y$`` prefix followed by ``\\d{2}\\$`` and 22 base64 chars of
    salt (the canonical BCrypt format).
  * Hardcoded API keys — generic ``api_key`` / ``apikey`` /
    ``access_token`` / ``auth_token`` assignments to a string literal of
    length ≥ 16, when the literal is NOT obviously sourced from the
    environment / config.
  * Hardcoded SMTP credentials — direct string-literal RHS for
    ``SMTP_PASS``, ``SMTP_PASSWORD``, ``MAIL_PASSWORD``.
  * Hardcoded SMS provider tokens — direct string-literal RHS for
    ``TWILIO_AUTH_TOKEN``, ``TWILIO_ACCOUNT_SID``,
    ``SEMAPHORE_API_KEY``.
  * Hardcoded per-org HMAC secrets — direct string-literal RHS for
    ``qr_hmac_secret`` / ``HMAC_SECRET`` / ``QR_HMAC``.

Exclusions follow the spec literally:

  * Any file or directory whose path component matches ``*.example``
    (e.g. ``.env.example``, ``config.example.py``).
  * Build / cache / vendored directories that aren't authored source:
    ``node_modules/``, ``.next/``, ``__pycache__/``, ``.pytest_cache/``,
    ``.cache/``, ``.git/``, ``dist/``, ``build/``, ``coverage/``,
    ``.venv/``, ``.hypothesis/``, ``instance/``, ``sqlite_archive/``.
  * Lockfiles whose integrity hashes resemble secrets:
    ``*.lock``, ``package-lock.json``, ``yarn.lock``,
    ``pnpm-lock.yaml``, ``Pipfile.lock``, ``poetry.lock``.
  * Binary / asset extensions: ``.png``, ``.jpg``, ``.jpeg``,
    ``.webp``, ``.avif``, ``.ico``, ``.pdf``, ``.woff``, ``.woff2``,
    ``.ttf``, ``.otf``, ``.zip``, ``.tar``, ``.gz``.
  * Test sources — ``*/tests/``, ``*/__tests__/``, ``test_*.py``,
    ``*.test.{js,jsx,ts,tsx}``. Property-based and unit tests
    legitimately seed deterministic fake secrets (e.g.
    ``'super-real-production-secret-please-do-not-leak'`` from
    ``test_startup_secret_check.py``, ``'SeedPass!23'`` from the
    Phase 5 password-policy property test, BCrypt fixtures, etc.).
  * **This test file itself** (it carries the patterns as fixtures).

Allowlist
~~~~~~~~~

Any line carrying ``# pragma: allowlist secret`` (Python) or
``// pragma: allowlist secret`` (JS / nginx) on the matched line OR the
line immediately above it is exempted. This is the standard
``detect-secrets`` convention and lets fixture files opt out one line at
a time without weakening the scan globally.

Encoding & size safety
~~~~~~~~~~~~~~~~~~~~~~

* Every file is read with ``encoding='utf-8'`` and ``errors='ignore'``
  so binary or oddly-encoded files don't crash the walk.
* Files larger than 1 MB are skipped — those are almost always
  minified bundles, snapshot fixtures, or vendored dist output that
  legitimately contain long random-looking strings.

Run via::

    pytest tools/tests/test_secret_hygiene.py -v

from the repo root.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

import pytest


# ──────────────────────────────────────────────────────────────────────
# Path resolution — the test lives at ``tools/tests/test_secret_hygiene.py``
# so the repo root is two parents up.
# ──────────────────────────────────────────────────────────────────────
REPO_ROOT: Path = Path(__file__).resolve().parents[2]
WALK_ROOTS: tuple[str, ...] = ('server', 'client', 'nginx')

# Absolute path of this test file, used to skip self-scanning the very
# fixtures that document the patterns being hunted.
_SELF_PATH: Path = Path(__file__).resolve()

# Largest file (in bytes) to even consider scanning. 1 MB is comfortably
# above any authored source file in this repo and well below the size
# of typical lockfiles or minified bundles.
_MAX_FILE_BYTES: int = 1_000_000

# Allowlist marker honoured on the matched line OR the line immediately
# above. Detected case-insensitively to be forgiving of formatting
# variations.
_ALLOWLIST_MARKER: str = 'pragma: allowlist secret'


# ──────────────────────────────────────────────────────────────────────
# Walk exclusions
# ──────────────────────────────────────────────────────────────────────

# Directory NAMES (any path component equal to one of these) we never
# descend into. These are build / cache / vendored trees.
_EXCLUDE_DIR_NAMES: frozenset[str] = frozenset({
    'node_modules',
    '.next',
    '__pycache__',
    '.pytest_cache',
    '.cache',
    '.git',
    'dist',
    'build',
    'coverage',
    '.venv',
    'venv',
    '.hypothesis',
    'instance',           # Flask instance folder (DBs, runtime state)
    'sqlite_archive',     # Archived legacy SQLite snapshots
    '.turbo',
    '.idea',
    '.vscode',
    'out',
})

# Test directory NAMES — any file whose path crosses one of these is
# considered test source and therefore exempt. The hygiene contract
# explicitly excludes tests so deterministic fake secrets used as
# fixtures don't trip the scan.
_TEST_DIR_NAMES: frozenset[str] = frozenset({
    'tests',
    '__tests__',
    'test',
})

# Filename PATTERNS (case-sensitive on the filename only) that mark the
# file as test source.
_TEST_FILENAME_RE: re.Pattern[str] = re.compile(
    r'^(?:test_.*\.py'                                     # pytest
    r'|.*\.test\.(?:js|jsx|ts|tsx|mjs|cjs)'                # vitest / jest
    r'|.*\.spec\.(?:js|jsx|ts|tsx|mjs|cjs|py))$',           # spec.* style
    re.IGNORECASE,
)

# Lockfile NAMES (any of these is skipped — their integrity hashes look
# very secret-shaped).
_LOCKFILE_NAMES: frozenset[str] = frozenset({
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'Pipfile.lock',
    'poetry.lock',
    'composer.lock',
    'Cargo.lock',
})

# Binary / asset extensions we never read (they are not authored source
# and their bytes can resemble random secrets).
_BINARY_EXTENSIONS: frozenset[str] = frozenset({
    '.png', '.jpg', '.jpeg', '.webp', '.avif', '.ico', '.pdf',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.zip', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.7z',
    '.mp3', '.mp4', '.mov', '.avi', '.webm', '.ogg', '.wav',
    '.so', '.dll', '.dylib', '.exe', '.bin',
    '.class', '.jar', '.pyc', '.pyo',
    '.lock',                                                # generic lockfile suffix
})


def _path_is_example(path: Path) -> bool:
    """Return True if *any* component of ``path`` is an ``.example``
    file or sits under an ``.example``-named directory.

    Mirrors the spec wording: "excluding ``*.example``". This catches
    ``.env.example``, ``config.example.py``, and ``foo.example``
    directories alike.
    """
    for part in path.parts:
        if part.endswith('.example'):
            return True
        # ``foo.example.py`` style — extension-shifted example file.
        if re.search(r'\.example(\.[^.]+)?$', part):
            return True
    return False


def _is_test_path(path: Path) -> bool:
    """Return True for files that are part of the test suite. Test
    sources are exempted by the hygiene contract because they may
    legitimately seed deterministic fake secrets as fixtures.
    """
    parts_lower = {p.lower() for p in path.parts}
    if _TEST_DIR_NAMES & parts_lower:
        return True
    if _TEST_FILENAME_RE.match(path.name):
        return True
    return False


def _is_excluded_dir(path: Path) -> bool:
    """Return True if any component of ``path`` is in the directory
    skip-list."""
    return any(part in _EXCLUDE_DIR_NAMES for part in path.parts)


def _is_lockfile(path: Path) -> bool:
    return path.name in _LOCKFILE_NAMES


def _is_binary_asset(path: Path) -> bool:
    return path.suffix.lower() in _BINARY_EXTENSIONS


def _iter_source_files() -> Iterator[Path]:
    """Yield every non-excluded file under the configured walk roots.

    Walk order: ``server/`` → ``client/`` → ``nginx/`` (deterministic).
    """
    for root_name in WALK_ROOTS:
        root = REPO_ROOT / root_name
        if not root.exists():
            continue
        # ``os.walk`` lets us prune skipped directories before recursing
        # into them, which is much cheaper than ``rglob`` + post-filter
        # on trees as large as ``client/node_modules`` (even though
        # node_modules is also excluded — defense in depth).
        for dirpath, dirnames, filenames in os.walk(root):
            # Prune in-place so we never recurse into skipped trees.
            dirnames[:] = [
                d for d in dirnames
                if d not in _EXCLUDE_DIR_NAMES
                and not d.endswith('.example')
            ]
            for fname in filenames:
                fpath = Path(dirpath) / fname
                if fpath.resolve() == _SELF_PATH:
                    continue
                if _is_excluded_dir(fpath):
                    continue
                if _path_is_example(fpath):
                    continue
                if _is_lockfile(fpath):
                    continue
                if _is_binary_asset(fpath):
                    continue
                if _is_test_path(fpath):
                    continue
                # Skip oversize files (minified bundles, archived dumps).
                try:
                    if fpath.stat().st_size > _MAX_FILE_BYTES:
                        continue
                except OSError:
                    continue
                yield fpath


# ──────────────────────────────────────────────────────────────────────
# Pattern definitions
# ──────────────────────────────────────────────────────────────────────

# A line is "shielded" — i.e., the RHS comes from the environment or a
# config object — if it contains any of these markers. Such lines are
# NOT secret-hygiene violations even when their LHS looks like a
# credential variable name.
_ENV_VAR_FALLBACK_MARKERS: tuple[str, ...] = (
    'os.environ',
    'os.getenv',
    'getenv(',
    'process.env',
    'import.meta.env',
    'config.',
    'app.config',
    'current_app.config',
    'Config.',
    'self.config',
    'flask.current_app',
    'request.',
    'environ.get',
)

# Placeholder substrings — values containing one of these are obvious
# documentation / template placeholders, not real secrets. Mirrors the
# allow-list described in the spec ("your-", "placeholder", "example",
# "xxx", "<", "${", "change-me", "dummy", "fake", "test-", "mock",
# "redacted", "null", "None", "undefined"). Matched case-insensitively
# on the *whole line* — if any placeholder token appears anywhere on the
# line we skip it, since hardcoded production secrets do not coexist
# with words like "placeholder" or "your-...".
_PLACEHOLDER_VALUE_TOKENS: tuple[str, ...] = (
    'your-',
    'your_',
    'placeholder',
    'example',
    'xxx',
    '<',                # angle-bracketed placeholder (<your-secret>)
    '${',               # shell / template variable expansion
    '{{',               # mustache / handlebars template
    'change-me',
    'changeme',
    'change_me',
    'dummy',
    'fake',
    'test-',
    'test_',
    'mock',
    'redacted',
    'null',
    'undefined',
    'replace-me',
    'replace_me',
    'todo',
)


def _line_is_env_shielded(line: str) -> bool:
    """Return True when the given line clearly sources its value from
    the environment / Flask config / request context rather than a
    hardcoded literal. These cases are NOT hygiene violations.
    """
    return any(marker in line for marker in _ENV_VAR_FALLBACK_MARKERS)


def _line_is_placeholder(line: str) -> bool:
    """Return True when the line contains a documentation-placeholder
    token (e.g. ``your-api-key``, ``<your-secret>``, ``${PASS}``,
    ``change-me``). Such lines are not real secrets and must not be
    flagged as hygiene violations.
    """
    lowered = line.lower()
    return any(token in lowered for token in _PLACEHOLDER_VALUE_TOKENS)


def _line_is_allowlisted(line: str) -> bool:
    return _ALLOWLIST_MARKER.lower() in line.lower()


@dataclass(frozen=True)
class Violation:
    """One hardcoded-secret violation. Stores only the file location
    and the pattern name — the matched secret value is NEVER recorded
    so a failure message cannot inadvertently leak the very secret it
    is flagging.
    """
    rel_path: str
    line_number: int
    pattern_name: str

    def render(self) -> str:
        return f'{self.rel_path}:{self.line_number}: {self.pattern_name}'


# ─── Pattern: SECRET_KEY = 'dev' literal ──────────────────────────────
#
# The task's literal pattern: ``SECRET_KEY\s*=\s*['"]dev['"]``. The
# ``'dev-key-DO-NOT-USE-IN-PRODUCTION'`` fallback in
# ``server/app/__init__.py`` is shielded by ``os.environ.get(...)`` on
# the same line and therefore exempt under the env-var-fallback rule.
_SECRET_KEY_DEV_LITERAL = re.compile(
    r"""SECRET_KEY \s* = \s* ['"]dev['"] (?:$|[^a-zA-Z0-9_-])""",
    re.VERBOSE,
)

# ─── Pattern: BCrypt salt / hash ──────────────────────────────────────
#
# Standard BCrypt format: $2a$NN$<22 base64 chars>... The regex
# captures the prefix-plus-salt portion which is the part you'd find in
# a hardcoded literal (the trailing 31 chars are the actual hash).
_BCRYPT_LITERAL = re.compile(r'\$2[aby]\$\d{2}\$[./A-Za-z0-9]{22}')

# ─── Pattern: generic API key / token assignment ──────────────────────
#
# ``api_key``, ``apikey``, ``access_token``, ``auth_token`` (case
# insensitive) assigned via ``=`` or ``:`` to a 16+ char string literal.
# Lines containing env / config markers are skipped (see
# ``_line_is_env_shielded``).
_GENERIC_API_KEY = re.compile(
    r"""(?ix)
    \b
    (?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token)
    \s* [:=] \s*
    ['"][A-Za-z0-9._\-]{16,}['"]
    """,
)

# ─── Pattern: SMTP credentials ────────────────────────────────────────
_SMTP_CREDENTIAL = re.compile(
    r"""(?x)
    \b(?:SMTP_PASS|SMTP_PASSWORD|MAIL_PASSWORD)\b
    \s* [:=] \s*
    ['"][^'"]+['"]
    """,
)

# ─── Pattern: SMS provider tokens ─────────────────────────────────────
_SMS_TOKEN = re.compile(
    r"""(?x)
    \b(?:TWILIO_AUTH_TOKEN|TWILIO_ACCOUNT_SID|SEMAPHORE_API_KEY)\b
    \s* [:=] \s*
    ['"][^'"]+['"]
    """,
)

# ─── Pattern: per-org HMAC secrets ────────────────────────────────────
#
# Detects either hex-encoded literals of length ≥ 32 (typical of a
# raw-bytes-as-hex key) or any string literal of length ≥ 16 assigned
# to one of the canonical HMAC secret names.
_HMAC_SECRET_HEX = re.compile(
    r"""(?ix)
    \b(?:qr_hmac_secret|HMAC_SECRET|QR_HMAC(?:_SECRET)?)\b
    \s* [:=] \s*
    b? ['"][A-Fa-f0-9]{32,}['"]
    """,
)
_HMAC_SECRET_ANY = re.compile(
    r"""(?ix)
    \b(?:qr_hmac_secret|HMAC_SECRET|QR_HMAC(?:_SECRET)?)\b
    \s* [:=] \s*
    b? ['"][^'"]{16,}['"]
    """,
)


# ``(pattern_name, compiled_regex, requires_env_shield_check)`` tuples.
# When ``requires_env_shield_check`` is True, lines containing
# ``os.environ.get(...)`` etc. are skipped — those represent
# env-var-with-fallback patterns that 21.1's runtime check covers.
_PATTERNS: tuple[tuple[str, re.Pattern[str], bool], ...] = (
    ('SECRET_KEY = "dev" literal', _SECRET_KEY_DEV_LITERAL, True),
    ('Hardcoded BCrypt salt/hash', _BCRYPT_LITERAL, False),
    ('Hardcoded API key / auth token', _GENERIC_API_KEY, True),
    ('Hardcoded SMTP credential', _SMTP_CREDENTIAL, True),
    ('Hardcoded SMS provider token', _SMS_TOKEN, True),
    ('Hardcoded per-org HMAC secret (hex)', _HMAC_SECRET_HEX, True),
    ('Hardcoded per-org HMAC secret', _HMAC_SECRET_ANY, True),
)


# ──────────────────────────────────────────────────────────────────────
# Per-file scan
# ──────────────────────────────────────────────────────────────────────

def _check_file(path: Path) -> list[Violation]:
    """Scan ``path`` line-by-line and return a list of violations.

    The matched secret value is never included in the returned
    metadata — only the relative path, line number, and pattern name.
    """
    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
    except OSError:
        return []

    rel = path.relative_to(REPO_ROOT).as_posix()
    lines = content.splitlines()
    violations: list[Violation] = []

    for idx, line in enumerate(lines, start=1):
        # Allowlist on the matched line itself or the line immediately
        # above (typical detect-secrets convention: comment ABOVE the
        # fixture, or trailing inline-comment ON the fixture line).
        if _line_is_allowlisted(line):
            continue
        if idx >= 2 and _line_is_allowlisted(lines[idx - 2]):
            continue

        for pattern_name, regex, requires_env_shield in _PATTERNS:
            if not regex.search(line):
                continue
            if requires_env_shield and _line_is_env_shielded(line):
                continue
            if requires_env_shield and _line_is_placeholder(line):
                continue
            violations.append(Violation(
                rel_path=rel,
                line_number=idx,
                pattern_name=pattern_name,
            ))

    return violations


def _scan_all() -> list[Violation]:
    """Walk every source file and aggregate every violation. Exposed
    as a helper so the per-pattern parametrized tests and the combined
    test can share the same walk.
    """
    out: list[Violation] = []
    for fpath in _iter_source_files():
        out.extend(_check_file(fpath))
    return out


# ──────────────────────────────────────────────────────────────────────
# Tests
# ──────────────────────────────────────────────────────────────────────

@pytest.fixture(scope='module')
def _all_violations() -> list[Violation]:
    """Single walk per pytest module run — every test below filters
    this aggregate list rather than re-walking the tree."""
    return _scan_all()


def test_walk_finds_source_files():
    """Sanity check: the walk must yield at least a handful of files
    from each non-empty walk root, otherwise the path resolution is
    wrong and a "passing" hygiene test would be vacuous.
    """
    by_root: dict[str, int] = {root: 0 for root in WALK_ROOTS}
    for fpath in _iter_source_files():
        # First component AFTER the repo root is the walk-root name.
        rel_parts = fpath.relative_to(REPO_ROOT).parts
        if rel_parts:
            top = rel_parts[0]
            if top in by_root:
                by_root[top] += 1

    # ``server/`` and ``client/`` always exist in this repo. ``nginx/``
    # has at least ``default.conf``.
    assert by_root['server'] > 0, (
        f'No server source files were scanned. '
        f'REPO_ROOT={REPO_ROOT} resolved incorrectly?'
    )
    assert by_root['client'] > 0, (
        f'No client source files were scanned. '
        f'REPO_ROOT={REPO_ROOT} resolved incorrectly?'
    )
    # nginx/ exists in this repo with default.conf.
    nginx_root = REPO_ROOT / 'nginx'
    if nginx_root.exists() and any(nginx_root.iterdir()):
        assert by_root['nginx'] > 0, (
            f'nginx/ exists with files but none were scanned. '
            f'REPO_ROOT={REPO_ROOT} resolved incorrectly?'
        )


@pytest.mark.parametrize('pattern_name', [name for name, _, _ in _PATTERNS])
def test_no_hardcoded_secret_per_pattern(
    pattern_name: str, _all_violations: list[Violation],
) -> None:
    """One pytest case per pattern. Every violation is reported by
    file:line and pattern name; the matched secret value is NEVER
    printed to keep the failure log itself secret-free.
    """
    matching = [v for v in _all_violations if v.pattern_name == pattern_name]
    assert not matching, (
        f'Hardcoded-secret violations detected for pattern '
        f'"{pattern_name}":\n  - '
        + '\n  - '.join(v.render() for v in matching)
        + '\n\nIf the offender is a legitimate fixture, add a '
        '"# pragma: allowlist secret" (or "// pragma: allowlist secret") '
        'comment ON or ABOVE the line. Otherwise, source the value from '
        'an environment variable.'
    )


def test_secret_hygiene(_all_violations: list[Violation]) -> None:
    """Combined Property Z assertion: zero violations across every
    pattern, every source file, every walk root.

    Validates: Requirements 7.4, 7.9.
    """
    assert not _all_violations, (
        'Property Z (secret hygiene) violated. The following hardcoded '
        'secrets were found in repo source (excluding *.example files, '
        'tests, lockfiles, and binary assets):\n  - '
        + '\n  - '.join(v.render() for v in _all_violations)
        + '\n\nFix by sourcing each value from an environment variable, '
        'or — for legitimate fixtures — adding a "# pragma: allowlist '
        'secret" (or "// pragma: allowlist secret") marker on or above '
        'the line.'
    )


# ──────────────────────────────────────────────────────────────────────
# Pattern self-tests — pin each regex's behaviour so a future edit
# cannot silently weaken detection. These tests do NOT walk the tree;
# they exercise each pattern against a curated positive example and a
# curated set of negative (placeholder / env-shielded) examples.
# ──────────────────────────────────────────────────────────────────────

# Map pattern name → one canonical *bad* line that MUST match.
# Distinct from a fixture file so the matched values cannot be mistaken
# for a real production secret. Every value below is intentionally fake
# but shaped like the real thing so the regex behaviour is exercised.
_POSITIVE_CONTROL_LINES: dict[str, str] = {
    'SECRET_KEY = "dev" literal':
        "SECRET_KEY = 'dev'",
    'Hardcoded BCrypt salt/hash':
        "salt = '$2b$12$abcdefghijklmnopqrstuv'",
    'Hardcoded API key / auth token':
        "api_key = 'sk_live_1234567890ABCDEF'",
    'Hardcoded SMTP credential':
        "SMTP_PASSWORD = 'hunter2hunter2'",
    'Hardcoded SMS provider token':
        "TWILIO_AUTH_TOKEN = 'AC0123456789abcdef0123456789abcdef'",
    'Hardcoded per-org HMAC secret (hex)':
        "qr_hmac_secret = '0123456789abcdef0123456789abcdef'",
    'Hardcoded per-org HMAC secret':
        "HMAC_SECRET = 'this-is-a-real-hmac-secret-here'",
}

# Map pattern name → list of negative-control lines that MUST NOT be
# flagged. Mix of placeholder values, env-var shielded assignments, and
# obviously-templated values.
_NEGATIVE_CONTROL_LINES: dict[str, tuple[str, ...]] = {
    'SECRET_KEY = "dev" literal': (
        "SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-DO-NOT-USE-IN-PRODUCTION')",
        "SECRET_KEY = os.getenv('SECRET_KEY')",
        "self.config['SECRET_KEY'] = current_app.config['SECRET_KEY']",
        # Note: a comment that literally contains ``SECRET_KEY = 'dev'``
        # WILL be flagged by this pattern because the regex makes no
        # attempt to parse comments. The convention for legitimate
        # mentions in source is to add a ``# pragma: allowlist secret``
        # marker on the same line (or the line immediately above).
    ),
    'Hardcoded BCrypt salt/hash': (
        # BCrypt regex is structural — it has no env-shield exemption,
        # so the only legitimate way to reference it in non-test code
        # is inside a comment / docstring (which the line below is).
        "# Example BCrypt prefix format: $2b$12$<22-char-salt>",
    ),
    'Hardcoded API key / auth token': (
        "api_key = os.environ.get('API_KEY')",
        "apiKey: process.env.NEXT_PUBLIC_API_KEY",
        "auth_token = '<your-api-key>'",
        "access_token = 'your-api-key-here-please-replace'",
        "API_KEY = '${API_KEY}'",
        "api_key = current_app.config['API_KEY']",
        "api_key = 'change-me-in-production'",
    ),
    'Hardcoded SMTP credential': (
        "SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')",
        "MAIL_PASSWORD = process.env.MAIL_PASSWORD",
        "SMTP_PASS = '<your-smtp-password>'",
        "SMTP_PASSWORD = 'placeholder'",
        "SMTP_PASSWORD = '${SMTP_PASSWORD}'",
    ),
    'Hardcoded SMS provider token': (
        "TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')",
        "SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY",
        "TWILIO_AUTH_TOKEN = '<your-twilio-token>'",
        "TWILIO_ACCOUNT_SID = 'your-account-sid'",
        "SEMAPHORE_API_KEY = 'replace-me'",
    ),
    'Hardcoded per-org HMAC secret (hex)': (
        "qr_hmac_secret = os.environ.get('QR_HMAC_SECRET')",
        "HMAC_SECRET = process.env.HMAC_SECRET",
        "qr_hmac_secret = current_app.config['QR_HMAC_SECRET']",
    ),
    'Hardcoded per-org HMAC secret': (
        "qr_hmac_secret = os.environ.get('QR_HMAC_SECRET')",
        "HMAC_SECRET = '<your-hmac-secret>'",
        "QR_HMAC_SECRET = 'placeholder-please-replace'",
        "qr_hmac_secret = '${QR_HMAC_SECRET}'",
        "HMAC_SECRET = 'change-me-in-production'",
    ),
}


def _flags_violation(pattern_name: str, line: str) -> bool:
    """Apply the same matching policy ``_check_file`` uses to one line.

    Returns True when *all* of the following hold:

    * The pattern's regex matches the line.
    * The line is not env-shielded (or the pattern doesn't require shielding).
    * The line is not a placeholder (or the pattern doesn't require shielding).
    """
    for name, regex, requires_env_shield in _PATTERNS:
        if name != pattern_name:
            continue
        if not regex.search(line):
            return False
        if requires_env_shield and _line_is_env_shielded(line):
            return False
        if requires_env_shield and _line_is_placeholder(line):
            return False
        return True
    raise KeyError(f'Unknown pattern name: {pattern_name!r}')


@pytest.mark.parametrize(
    'pattern_name,line',
    list(_POSITIVE_CONTROL_LINES.items()),
)
def test_pattern_detects_known_bad_string(
    pattern_name: str, line: str,
) -> None:
    """Positive control: every regex MUST flag its canonical bad form.

    Pins detection so a future edit that accidentally narrows a regex
    (e.g. requires anchors, drops a tier of the alternation) fails this
    test instead of silently letting hardcoded secrets through.
    """
    assert _flags_violation(pattern_name, line), (
        f'Pattern {pattern_name!r} failed to flag its canonical bad '
        f'example. Line under test: {line!r}'
    )


# Build a flat parametrize list of (pattern, negative_line) pairs so
# each negative example is its own test case in the report.
_NEGATIVE_CASES: list[tuple[str, str]] = [
    (name, line)
    for name, lines in _NEGATIVE_CONTROL_LINES.items()
    for line in lines
]


@pytest.mark.parametrize('pattern_name,line', _NEGATIVE_CASES)
def test_pattern_does_not_match_placeholders(
    pattern_name: str, line: str,
) -> None:
    """Negative control: every documented placeholder / env-shielded
    form MUST NOT be flagged. Pins the allow-list so a future edit that
    over-tightens a regex doesn't start producing false positives on
    legitimate ``os.environ.get(...)`` patterns or ``<your-…>``
    placeholders.
    """
    assert not _flags_violation(pattern_name, line), (
        f'Pattern {pattern_name!r} unexpectedly flagged a placeholder / '
        f'env-shielded line. Line under test: {line!r}'
    )
