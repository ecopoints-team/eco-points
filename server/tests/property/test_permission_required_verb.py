"""permission_required category set derived from matrix (Phase C)."""
import pytest
from app.middleware import ROLE_PERMISSIONS
from app.permissions import categories_for_role


@pytest.mark.parametrize('role', ['superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician'])
def test_role_permissions_categories_match_matrix(role):
    assert ROLE_PERMISSIONS[role] == categories_for_role(role)
