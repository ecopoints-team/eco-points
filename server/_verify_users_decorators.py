"""Verify decorator chain on every moved users handler is identical to the
pre-extraction decorator chain, by inspecting the AST of users_controller.py.

Expected stack (top to bottom in source) for every handler:
    @users_bp.route(...)
    @token_required
    @admin_required
"""
import ast
from pathlib import Path

SRC = Path(__file__).resolve().parent / 'app' / 'controllers' / 'users_controller.py'
EXPECTED_FUNCS = {
    'get_users', 'get_user', 'create_user',
    'update_user', 'delete_user', 'adjust_user_points',
}

tree = ast.parse(SRC.read_text(encoding='utf-8'))


def deco_summary(d):
    if isinstance(d, ast.Call):
        return deco_summary(d.func) + '(...)'
    if isinstance(d, ast.Attribute):
        return f'{deco_summary(d.value)}.{d.attr}'
    if isinstance(d, ast.Name):
        return d.id
    return '?'


errors = []
seen = set()
for node in ast.walk(tree):
    if not isinstance(node, ast.FunctionDef):
        continue
    if node.name not in EXPECTED_FUNCS:
        continue
    seen.add(node.name)
    decs = [deco_summary(d) for d in node.decorator_list]
    print(f'{node.name}: {decs}')
    if len(decs) != 3:
        errors.append(f'{node.name}: expected 3 decorators, got {len(decs)}: {decs}')
        continue
    route_dec, d2, d3 = decs
    if not route_dec.startswith('users_bp.route('):
        errors.append(f'{node.name}: top decorator is {route_dec!r}, expected users_bp.route(...)')
    if d2 != 'token_required':
        errors.append(f'{node.name}: 2nd decorator is {d2!r}, expected token_required')
    if d3 != 'admin_required':
        errors.append(f'{node.name}: 3rd decorator is {d3!r}, expected admin_required')

missing = EXPECTED_FUNCS - seen
if missing:
    errors.append(f'Missing handlers: {sorted(missing)}')

if errors:
    print('FAIL:')
    for e in errors:
        print(' -', e)
    raise SystemExit(1)

print(f'OK: all {len(EXPECTED_FUNCS)} handlers carry [users_bp.route(...), token_required, admin_required].')
