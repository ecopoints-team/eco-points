"""Validates the authoritative per-verb RBAC matrix (Phase C)."""
import pytest
from app.permissions import (
    ROLE_ACTION_PERMISSIONS,
    categories_for_role,
    role_can,
)

EXPECTED = {
    'auditor': {
        'dashboard': {'view'},
        'users': {'view'},
        'machines': {'view'},
        'rewards': {'view'},
        'analytics': {'view'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export'},
        'settings': {'view'},
    },
    'inventory_officer': {
        'dashboard': {'view'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
    },
    'technician': {
        'dashboard': {'view'},
        'machines': {'view', 'edit'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
    },
}


@pytest.mark.parametrize('role', sorted(EXPECTED.keys()))
def test_matrix_matches_qa_spec(role):
    for category, verbs in EXPECTED[role].items():
        assert ROLE_ACTION_PERMISSIONS[role].get(category) == verbs, (
            f'{role}.{category}: expected {verbs}, got '
            f'{ROLE_ACTION_PERMISSIONS[role].get(category)}'
        )


def test_auditor_can_export_logs():
    # auditor CAN export logs per QA
    assert role_can('auditor', 'logs', 'export') is True


def test_inventory_officer_cannot_export_logs():
    assert role_can('inventory_officer', 'logs', 'export') is False


def test_head_admin_cannot_export_analytics():
    assert role_can('head_admin', 'analytics', 'export') is False


def test_categories_for_role_auditor_includes_view_only_modules():
    cats = categories_for_role('auditor')
    assert {'users', 'machines', 'rewards'}.issubset(cats)


def test_non_admin_role_has_no_permissions():
    assert role_can('user', 'users', 'view') is False
    assert categories_for_role('user') == set()
