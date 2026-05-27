"""
Password Policy Service (Phase 4G — Requirement 4G.28).

Provides a single shared validator used by both public registration
(auth_controller.register) and admin user-create
(users_controller.create_user) so the policy is defined in exactly one
place and cannot drift between the two paths.

Policy:
  - Minimum length: 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one digit (0-9)
"""
from __future__ import annotations

import re


def validate_password_policy(password: str) -> tuple[bool, str]:
    """Validate *password* against the platform password policy.

    Returns:
        ``(True, "")`` when the password satisfies every rule.
        ``(False, "<descriptive message>")`` when it fails the first
        violated rule (rules are checked in the order listed below).

    Rules (in check order):
        1. Length ≥ 8 characters.
        2. At least one uppercase letter (A-Z).
        3. At least one lowercase letter (a-z).
        4. At least one digit (0-9).
    """
    if not password or len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one digit'
    return True, ''
