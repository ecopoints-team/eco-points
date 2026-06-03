"""
Phase 0 / Property B — Decorator stacking.

Validates: Requirements 0.5, 0.9.

Two static (AST-walking) properties are enforced here:

1. For every function in `server/app/controllers/*.py` whose decorator list
   includes `@permission_required(...)`, the decorator immediately above it
   MUST be `@token_required`. This guarantees that `current_user` is in
   scope when `permission_required` evaluates `_require_admin_or_403` and
   the category set.

2. No source file outside `*.example` may retain the historical
   `if request.method != 'GET':` early-return inside a function literally
   named `admin_required` or `permission_required`. The presence of that
   pattern is the GET-bypass defect Phase 0 closes.

These checks are pure AST walks: no Flask app, no DB. They run in CI on
every commit.
"""
from __future__ import annotations

import ast
from pathlib import Path
from typing import Iterable, Tuple

# Resolve `server/app` from this test file's location.
_SERVER_ROOT = Path(__file__).resolve().parents[2]
_APP_ROOT = _SERVER_ROOT / 'app'
_CONTROLLERS_DIR = _APP_ROOT / 'controllers'


def _iter_python_files(root: Path) -> Iterable[Path]:
    """Yield every `.py` file under `root`, excluding `*.example` siblings,
    `__pycache__`, and virtualenv directories.
    """
    if not root.exists():
        return
    for path in root.rglob('*.py'):
        # Skip example and pycache content.
        if any(part == '__pycache__' for part in path.parts):
            continue
        if path.suffix == '.example' or path.name.endswith('.example'):
            continue
        if any(part.endswith('.example') for part in path.parts):
            continue
        yield path


def _decorator_name(node: ast.expr) -> str | None:
    """Return the bare name of a decorator AST node.

    Handles:
      @foo                        → 'foo'
      @foo.bar                    → 'bar'
      @foo(...)                   → 'foo'
      @foo.bar(...)               → 'bar'
    Returns None when the decorator is not a recognizable Name/Attribute.
    """
    if isinstance(node, ast.Call):
        return _decorator_name(node.func)
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _collect_decorated_routes(tree: ast.AST) -> Iterable[Tuple[ast.FunctionDef, list[str]]]:
    """Yield (function_node, ordered_decorator_names) for every function or
    async-function definition in the tree.

    Decorator order in `node.decorator_list` matches source order from
    top to bottom. So `decorator_list[0]` is the topmost `@` line.
    """
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            names = [_decorator_name(d) or '' for d in node.decorator_list]
            yield node, names


def test_permission_required_is_preceded_by_token_required():
    """Property B (stacking): every `@permission_required` MUST sit
    immediately below `@token_required` in the same function's decorator
    list, across every controller in `server/app/controllers/`.
    """
    violations: list[str] = []
    files_scanned = 0

    for path in _iter_python_files(_CONTROLLERS_DIR):
        files_scanned += 1
        source = path.read_text(encoding='utf-8')
        try:
            tree = ast.parse(source, filename=str(path))
        except SyntaxError as e:
            violations.append(f'{path}: failed to parse: {e}')
            continue

        for func, dec_names in _collect_decorated_routes(tree):
            for idx, name in enumerate(dec_names):
                if name != 'permission_required':
                    continue
                # The decorator IMMEDIATELY ABOVE in source is the previous
                # entry in the list (decorator_list is top-to-bottom).
                if idx == 0:
                    violations.append(
                        f'{path}:{func.lineno} {func.name}: '
                        f'@permission_required has no decorator above it; '
                        f'@token_required must precede it'
                    )
                    continue
                prev = dec_names[idx - 1]
                if prev != 'token_required':
                    violations.append(
                        f'{path}:{func.lineno} {func.name}: '
                        f'expected @token_required immediately above '
                        f'@permission_required, found @{prev}'
                    )

    assert files_scanned > 0, (
        f'No controller files scanned at {_CONTROLLERS_DIR}; '
        f'check that the path resolution is correct.'
    )
    assert not violations, (
        'Decorator stacking violations detected:\n  - '
        + '\n  - '.join(violations)
    )


def _function_contains_get_bypass(func: ast.FunctionDef | ast.AsyncFunctionDef) -> bool:
    """Return True if `func` (or any nested function inside it, which is
    where the historical decorator wraps lived) contains a statement of the
    form `if request.method != 'GET': ...`.

    Both decorators wrap their inner `decorated()` function, so we walk the
    full subtree.
    """
    for node in ast.walk(func):
        if not isinstance(node, ast.If):
            continue
        test = node.test
        if not isinstance(test, ast.Compare):
            continue
        if not (len(test.ops) == 1 and isinstance(test.ops[0], ast.NotEq)):
            continue
        # Left side: `request.method`
        left = test.left
        if not (
            isinstance(left, ast.Attribute)
            and left.attr == 'method'
            and isinstance(left.value, ast.Name)
            and left.value.id == 'request'
        ):
            continue
        # Right side: literal 'GET'
        right = test.comparators[0]
        if isinstance(right, ast.Constant) and right.value == 'GET':
            return True
    return False


def test_no_get_bypass_in_admin_or_permission_decorators():
    """Property B (no-GET-leakage residue): no source file under `server/`
    may retain an `if request.method != 'GET'` early-return inside a
    function literally named `admin_required` or `permission_required`.

    `*.example` files (templates / historical snapshots) are excluded.
    """
    violations: list[str] = []
    files_scanned = 0

    for path in _iter_python_files(_APP_ROOT):
        files_scanned += 1
        source = path.read_text(encoding='utf-8')
        try:
            tree = ast.parse(source, filename=str(path))
        except SyntaxError as e:
            violations.append(f'{path}: failed to parse: {e}')
            continue

        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            if node.name not in ('admin_required', 'permission_required'):
                continue
            if _function_contains_get_bypass(node):
                violations.append(
                    f'{path}:{node.lineno} {node.name}: '
                    f"contains `if request.method != 'GET'` early-return "
                    f"(Phase 0 GET-bypass defect)"
                )

    assert files_scanned > 0, (
        f'No source files scanned at {_APP_ROOT}; '
        f'check that the path resolution is correct.'
    )
    assert not violations, (
        'GET-bypass residue detected (Phase 0 invariant violated):\n  - '
        + '\n  - '.join(violations)
    )
