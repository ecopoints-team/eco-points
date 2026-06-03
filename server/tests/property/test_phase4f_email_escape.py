"""
Phase 4F / Property T — Email HTML escape.

Validates: Requirements 4F.26, 4F.27.

For every user-controllable interpolation point in
`notification_service._build_email_html` (subject, body, org_name), and for
every XSS/injection payload in the canonical attack set, the rendered HTML:

  1. MUST contain `html.escape(payload, quote=True)` verbatim.
  2. MUST NOT contain the raw payload when the payload includes a `<` character
     (i.e., the unescaped form must not appear in the output).

No Flask app context or database is required — `_build_email_html` is a pure
string-rendering function.
"""
from __future__ import annotations

import html
import sys
from pathlib import Path

import pytest
from hypothesis import given, settings, strategies as st

# Ensure `server/` is on sys.path so `from app.services...` resolves.
_SERVER_ROOT = Path(__file__).resolve().parents[2]
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))

from app.services.notification_service import _build_email_html  # noqa: E402

# ── Attack payloads (Requirement 4F.27 canonical set) ─────────────────────
PAYLOADS = [
    '<script>alert(1)</script>',
    '"',
    "'",
    '<',
    '>',
    '&',
]

# Multi-character payloads that contain `<` — the full string must not appear
# unescaped in the output.  The single-char payload `'<'` is excluded because
# the template itself contains many `<` characters (HTML tags), so a bare
# substring check would always fail even when the injection is correctly escaped.
# For `'<'` alone, assertion 1 (escaped form `&lt;` is present) is sufficient.
PAYLOADS_WITH_LT = {p for p in PAYLOADS if '<' in p and len(p) > 1}

# Interpolation points under test.
FIELDS = ['subject', 'body', 'org_name']

# Safe placeholder values for the fields that are NOT under test in a given
# example, chosen to be free of any of the attack characters.
_SAFE_SUBJECT = 'safe-subject'
_SAFE_BODY = 'safe-body'
_SAFE_ORG = 'Acme University'


def _render(field: str, payload: str) -> str:
    """Call _build_email_html with `payload` injected into `field` only."""
    if field == 'subject':
        return _build_email_html(subject=payload, body=_SAFE_BODY, org_name=_SAFE_ORG)
    if field == 'body':
        return _build_email_html(subject=_SAFE_SUBJECT, body=payload, org_name=_SAFE_ORG)
    # field == 'org_name'
    return _build_email_html(subject=_SAFE_SUBJECT, body=_SAFE_BODY, org_name=payload)


# ── Parametric smoke tests (deterministic, no Hypothesis overhead) ─────────

@pytest.mark.parametrize('field', FIELDS)
@pytest.mark.parametrize('payload', PAYLOADS)
def test_email_escape_parametric(field: str, payload: str) -> None:
    """Deterministic coverage: every (field, payload) pair must satisfy both
    escape assertions without relying on Hypothesis shrinking.
    """
    rendered = _render(field, payload)
    escaped = html.escape(payload, quote=True)

    # Assertion 1: the escaped form is present verbatim.
    assert escaped in rendered, (
        f'field={field!r} payload={payload!r}: '
        f'expected escaped form {escaped!r} to appear in rendered HTML'
    )

    # Assertion 2: for payloads containing `<`, the raw form must be absent.
    if payload in PAYLOADS_WITH_LT:
        assert payload not in rendered, (
            f'field={field!r} payload={payload!r}: '
            f'raw unescaped payload must not appear in rendered HTML'
        )


# ── Property-based test (Hypothesis) ──────────────────────────────────────

@settings(max_examples=200, deadline=None)
@given(
    field=st.sampled_from(FIELDS),
    payload=st.sampled_from(PAYLOADS),
)
def test_email_escape_property(field: str, payload: str) -> None:
    """Property T: for every (field, payload) combination drawn by Hypothesis,
    the rendered HTML must contain the escaped form and must not contain the
    raw form when the payload includes `<`.
    """
    rendered = _render(field, payload)
    escaped = html.escape(payload, quote=True)

    assert escaped in rendered, (
        f'field={field!r} payload={payload!r}: '
        f'escaped form {escaped!r} not found in rendered HTML'
    )

    if payload in PAYLOADS_WITH_LT:
        assert payload not in rendered, (
            f'field={field!r} payload={payload!r}: '
            f'raw unescaped payload must not appear in rendered HTML'
        )
