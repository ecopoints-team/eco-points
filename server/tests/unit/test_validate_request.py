"""
Unit tests for Phase 4E / Task 14.2 — the ``@validate_request(Schema)``
decorator in :mod:`app.middleware`.

Validates: Requirements 4E.24, 4E.25 (Property L / Property S contract).

Covers the four behavioral cases the task contract enumerates:

  1. **Valid body** → handler is called with ``payload=<ModelInstance>``.
  2. **Unknown key** → HTTP 400 with ``error.code == 'UNKNOWN_FIELD'``,
     ``error.field`` populated with the offending key, and ``error.errors``
     is the full flattened ``[{field, message}]`` list.
  3. **Wrong type / missing required** → HTTP 400 with
     ``error.code == 'VALIDATION_ERROR'`` and a non-empty ``error.errors``
     ``[{field, message}]`` array.
  4. **Empty body against an empty-body schema** → handler is called with
     ``payload=<empty model>`` (the schema validates ``{}``).

The decorator must also raise ``TypeError`` at decoration time when given
something that is not a ``pydantic.BaseModel`` subclass — a regression
guard against accidentally passing an instance, a string, or ``None``.
"""
from __future__ import annotations

from typing import Optional

import pytest
from flask import Flask, jsonify
from pydantic import ConfigDict

# `app` is on sys.path via tests/conftest.py.
from app.middleware import validate_request
from app.schemas import _StrictModel


# ── Schemas used only by these tests ──────────────────────────────────


class _SampleSchema(_StrictModel):
    """Strict body with one required and one optional field."""

    name: str
    age: Optional[int] = None


class _EmptySchema(_StrictModel):
    """Empty body — no fields. With ``extra='forbid'`` the only valid
    body is ``{}`` (or, per the decorator's empty-body tolerance, no
    body at all)."""


# ── Flask app fixture ────────────────────────────────────────────────


@pytest.fixture()
def app():
    """Minimal Flask app with two routes — one validating ``_SampleSchema``,
    one validating ``_EmptySchema``. Each handler echoes the received
    ``payload`` back to the test so we can assert handler invocation
    semantics without any DB / auth wiring.
    """
    application = Flask(__name__)
    application.config['TESTING'] = True

    @application.route('/sample', methods=['POST'])
    @validate_request(_SampleSchema)
    def sample_handler(payload):
        return jsonify({
            'success': True,
            'name': payload.name,
            'age': payload.age,
            'payload_type': type(payload).__name__,
        }), 200

    @application.route('/empty', methods=['POST'])
    @validate_request(_EmptySchema)
    def empty_handler(payload):
        return jsonify({
            'success': True,
            'payload_type': type(payload).__name__,
        }), 200

    return application


# ─────────────────────────────────────────────────────────────────────
# 1. Valid body → handler called with ``payload=<model>``
# ─────────────────────────────────────────────────────────────────────


def test_valid_body_passes_parsed_model_as_payload_kwarg(app):
    with app.test_client() as client:
        resp = client.post(
            '/sample',
            data=b'{"name": "alice", "age": 30}',
            content_type='application/json',
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body == {
        'success': True,
        'name': 'alice',
        'age': 30,
        'payload_type': '_SampleSchema',
    }


def test_valid_body_with_only_required_field_succeeds(app):
    with app.test_client() as client:
        resp = client.post(
            '/sample',
            data=b'{"name": "bob"}',
            content_type='application/json',
        )

    assert resp.status_code == 200
    body = resp.get_json()
    assert body['name'] == 'bob'
    assert body['age'] is None


# ─────────────────────────────────────────────────────────────────────
# 2. Unknown key → 400 UNKNOWN_FIELD with ``error.field`` populated
# ─────────────────────────────────────────────────────────────────────


def test_unknown_key_returns_400_unknown_field_with_offending_key(app):
    with app.test_client() as client:
        resp = client.post(
            '/sample',
            data=b'{"name": "carol", "rogue": "value"}',
            content_type='application/json',
        )

    assert resp.status_code == 400, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is False
    assert body['error']['code'] == 'UNKNOWN_FIELD'
    assert body['error']['field'] == 'rogue'
    # The full Pydantic error list is included; at minimum the
    # extra_forbidden record names ``rogue``.
    errors = body['error']['errors']
    assert isinstance(errors, list) and len(errors) >= 1
    assert any(entry['field'] == 'rogue' for entry in errors)
    for entry in errors:
        assert set(entry.keys()) == {'field', 'message'}


# ─────────────────────────────────────────────────────────────────────
# 3. Wrong type / missing required → 400 VALIDATION_ERROR
# ─────────────────────────────────────────────────────────────────────


def test_missing_required_field_returns_400_validation_error(app):
    with app.test_client() as client:
        resp = client.post(
            '/sample',
            data=b'{}',
            content_type='application/json',
        )

    assert resp.status_code == 400
    body = resp.get_json()
    assert body['success'] is False
    assert body['error']['code'] == 'VALIDATION_ERROR'
    errors = body['error']['errors']
    assert isinstance(errors, list) and len(errors) >= 1
    assert any(entry['field'] == 'name' for entry in errors)
    for entry in errors:
        assert set(entry.keys()) == {'field', 'message'}


def test_wrong_type_returns_400_validation_error(app):
    with app.test_client() as client:
        resp = client.post(
            '/sample',
            # ``age`` typed Optional[int]; passing a string under
            # ``strict=True`` produces an ``int_type`` error, not coercion.
            data=b'{"name": "dave", "age": "not-an-int"}',
            content_type='application/json',
        )

    assert resp.status_code == 400
    body = resp.get_json()
    assert body['error']['code'] == 'VALIDATION_ERROR'
    errors = body['error']['errors']
    assert any(entry['field'] == 'age' for entry in errors)


def test_malformed_json_returns_400_validation_error(app):
    """A malformed JSON body MUST surface as a clean
    ``VALIDATION_ERROR`` rather than a Flask 500 / unhandled exception.
    """
    with app.test_client() as client:
        resp = client.post(
            '/sample',
            data=b'{not-json',
            content_type='application/json',
        )

    assert resp.status_code == 400
    body = resp.get_json()
    assert body['error']['code'] == 'VALIDATION_ERROR'
    assert isinstance(body['error']['errors'], list)


# ─────────────────────────────────────────────────────────────────────
# 4. Empty body against an empty-body schema → handler called
# ─────────────────────────────────────────────────────────────────────


def test_empty_body_against_empty_schema_succeeds(app):
    """Empty/whitespace-only request body MUST be treated as ``{}`` so
    empty-body schemas (LogoutSchema, ForceLogoutSchema) validate cleanly.
    """
    with app.test_client() as client:
        resp = client.post(
            '/empty',
            data=b'',
            content_type='application/json',
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body == {'success': True, 'payload_type': '_EmptySchema'}


def test_whitespace_only_body_against_empty_schema_succeeds(app):
    with app.test_client() as client:
        resp = client.post(
            '/empty',
            data=b'   \n\t  ',
            content_type='application/json',
        )

    assert resp.status_code == 200
    assert resp.get_json()['success'] is True


def test_empty_schema_rejects_unknown_key(app):
    """The empty-body tolerance must NOT weaken ``extra='forbid'`` —
    sending a populated body to an empty-schema route is still rejected
    as ``UNKNOWN_FIELD``.
    """
    with app.test_client() as client:
        resp = client.post(
            '/empty',
            data=b'{"surprise": 1}',
            content_type='application/json',
        )

    assert resp.status_code == 400
    body = resp.get_json()
    assert body['error']['code'] == 'UNKNOWN_FIELD'
    assert body['error']['field'] == 'surprise'


# ─────────────────────────────────────────────────────────────────────
# 5. Decoration-time guards
# ─────────────────────────────────────────────────────────────────────


def test_validate_request_without_schema_raises_type_error():
    """Passing a non-class (or a non-BaseModel class) MUST fail loudly at
    decoration time so the mistake is caught before any traffic hits the
    route."""
    with pytest.raises(TypeError):
        validate_request(None)

    with pytest.raises(TypeError):
        validate_request("SomeSchema")

    with pytest.raises(TypeError):
        # An instance, not the class.
        validate_request(_SampleSchema(name='oops'))

    class _NotAModel:
        pass

    with pytest.raises(TypeError):
        validate_request(_NotAModel)


# ─────────────────────────────────────────────────────────────────────
# 6. Nested-loc rendering (regression guard for the spec's example)
# ─────────────────────────────────────────────────────────────────────


class _NestedItem(_StrictModel):
    detected_class: str


class _NestedListSchema(_StrictModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    items: list[_NestedItem]


def test_nested_loc_is_rendered_as_dotted_path():
    """Pydantic ``loc`` like ``('items', 0, 'detected_class')`` MUST
    render as ``'items.0.detected_class'`` so error messages stay
    addressable for clients."""
    application = Flask(__name__)
    application.config['TESTING'] = True

    @application.route('/nested', methods=['POST'])
    @validate_request(_NestedListSchema)
    def nested_handler(payload):
        return jsonify({'success': True}), 200

    with application.test_client() as client:
        resp = client.post(
            '/nested',
            data=b'{"items": [{"detected_class": 123}]}',
            content_type='application/json',
        )

    assert resp.status_code == 400
    body = resp.get_json()
    assert body['error']['code'] == 'VALIDATION_ERROR'
    fields = [entry['field'] for entry in body['error']['errors']]
    assert 'items.0.detected_class' in fields
