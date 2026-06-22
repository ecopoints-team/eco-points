# Reward Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the dormant `REWARD_VARIANTS` table to life — let admins define named variants (e.g. "Red - Medium", "Blue - Large") with their own stock and an optional per-variant points price, created/edited through a widened landscape Add/Edit Reward modal.

**Architecture:** The `reward_variants` table already exists and is wired into stock + redemption flows, but the create/update/serialize paths only ever touch a single hard-coded `'Default'` variant, and the table has **no price column**. This plan (1) adds a nullable `points_required` column to `RewardVariant` where `NULL` means "inherit the parent reward's price"; (2) extends the reward create/update schemas + handlers to accept a `variants[]` array (upsert by id, soft-deactivate removed ones); (3) makes redemption charge the variant's price when set; and (4) replaces the single Stock field in the reward modal with a repeatable variant editor inside a wider landscape modal. The legacy single-variant `'Default'` behaviour is preserved as the fallback when no variants are supplied, so existing rewards and callers keep working.

**Tech Stack:** Flask + SQLAlchemy + Alembic + Pydantic v2 + pytest/hypothesis (server); Next.js (app router) + React + Tailwind + vitest/fast-check (client).

> **REQUIRED SCHEMA CHANGE:** This feature **must add a new `points_required` price column to the `reward_variants` table** (and the `RewardVariant` model + the ERD). The ERD's `REWARD_VARIANTS` definition has no price column today, so per-variant pricing is impossible without it. The column is nullable: `NULL` means the variant inherits the parent `REWARDS.points_required`; a non-null value is the variant's own custom price. This is implemented in **Task 1.1** and reflected in `ERD.md`.


**Three independently-shippable phases:**
- **Phase 1 — Data model**: add `points_required` to `RewardVariant` + migration + serializer field. Ships safely (additive, nullable).
- **Phase 2 — API**: variant array in create/update schemas + handlers + price-aware redemption.
- **Phase 3 — UI**: landscape modal + variant editor with "same as main price" toggle.

Recommended order: 1 → 2 → 3. Each phase leaves the app working.

---

## Current State (confirmed by code read)

- `server/app/models.py::RewardVariant` columns: `id`, `reward_id`, `variety_name`, `stock_quantity`, `image_url`, `is_active`, `created_at`. **No price column.**
- `Reward.points_required` is `nullable=False` — the parent price.
- `server/app/controllers/rewards_controller.py::create_reward` creates exactly one variant: `variety_name='Default'`, stock from `payload.stockQuantity`.
- `update_reward` only updates the `'Default'` variant's stock.
- `redeem_reward` charges `reward.points_required * quantity` — it ignores any per-variant price.
- `server/app/controllers/_shared.py::_serialize_reward` returns `variants: [{id, varietyName, stockQuantity, isActive}]` (no price, no imageUrl).
- `RewardCreateSchema` / `RewardUpdateSchema` (`server/app/schemas/__init__.py`) have NO `variants` field and use `extra='forbid'` — so the client cannot send variants until the schema is extended.
- The reward modal (`client/app/admin/rewards/page.js`, ~line 868) is `max-w-2xl`, single-column, with one Points Cost + one Stock field.
- `formData` shape: `{ name, description, pointsRequired, stockQuantity, category, imageUrl }`.

---

## Phase 1 — Data Model: variant price column

### Task 1.1: Add `points_required` to RewardVariant

**Files:**
- Modify: `server/app/models.py` (RewardVariant)
- Test: `server/tests/property/test_reward_variant_price_inherit.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_reward_variant_price_inherit.py`:

```python
"""A variant's effective price inherits the parent reward when its own
points_required is NULL, and overrides it when set."""
import uuid
import pytest
from flask import Flask

from app import Config, db
from app.models import (
    CommunityGroup, Organization, OrgType, Reward, RewardVariant,
)


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    db.init_app(app)
    with app.app_context():
        db.create_all()
    return app


def _seed_reward(points_required):
    ot = OrgType(name=f'VarUni-{uuid.uuid4().hex[:6]}')
    db.session.add(ot); db.session.flush()
    org = Organization(name=f'VarOrg-{uuid.uuid4().hex[:6]}', full_name='Var Org',
                        type_id=ot.id, status='Active')
    db.session.add(org); db.session.flush()
    reward = Reward(organization_id=org.id, name='Tumbler', category='Merchandise',
                    points_required=points_required, is_active=True)
    db.session.add(reward); db.session.flush()
    return reward


def _effective_price(variant, reward):
    """The pricing rule this feature implements."""
    return variant.points_required if variant.points_required is not None else reward.points_required


@pytest.fixture(scope='module')
def app_ctx():
    app = _build_app()
    with app.app_context():
        yield app
        db.session.remove()
        db.drop_all()


def test_variant_price_column_exists_and_is_nullable(app_ctx):
    with app_ctx.app_context():
        reward = _seed_reward(100)
        v = RewardVariant(reward_id=reward.id, variety_name='Large',
                          stock_quantity=5, is_active=True, points_required=None)
        db.session.add(v)
        db.session.commit()
        assert v.points_required is None
        assert _effective_price(v, reward) == 100  # inherits


def test_variant_price_override(app_ctx):
    with app_ctx.app_context():
        reward = _seed_reward(100)
        v = RewardVariant(reward_id=reward.id, variety_name='XL',
                          stock_quantity=5, is_active=True, points_required=150)
        db.session.add(v)
        db.session.commit()
        assert _effective_price(v, reward) == 150  # overrides
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_reward_variant_price_inherit.py -v` (in `server/`)
Expected: FAIL with `TypeError: 'points_required' is an invalid keyword argument for RewardVariant`.

- [ ] **Step 3: Add the column**

In `server/app/models.py`, find the `RewardVariant` class body:

```python
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False, index=True)
    variety_name = db.Column(db.String(200), nullable=False)      # e.g. "Red - Medium"
    stock_quantity = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(500), nullable=True)          # Variant-specific product image
    is_active = db.Column(db.Boolean, default=True)
```

Replace with (add `points_required` after `stock_quantity`):

```python
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False, index=True)
    variety_name = db.Column(db.String(200), nullable=False)      # e.g. "Red - Medium"
    stock_quantity = db.Column(db.Integer, default=0)
    points_required = db.Column(db.Integer, nullable=True)        # NULL = inherit parent Reward.points_required
    image_url = db.Column(db.String(500), nullable=True)          # Variant-specific product image
    is_active = db.Column(db.Boolean, default=True)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_reward_variant_price_inherit.py -v` (in `server/`)
Expected: PASS (both).

- [ ] **Step 5: Generate the migration**

Run: `flask db migrate -m "add points_required to reward_variants"` (in `server/`, with the app env active and `DATABASE_URL` set to the dev DB)

Then open the generated file under `server/migrations/versions/` and confirm `upgrade()` contains exactly:

```python
def upgrade():
    op.add_column('reward_variants', sa.Column('points_required', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('reward_variants', 'points_required')
```

If autogenerate added unrelated operations (e.g. drift from other models), delete those lines so the migration contains ONLY the `points_required` add/drop above.

- [ ] **Step 6: Apply the migration**

Run: `flask db upgrade` (in `server/`)
Expected: applies cleanly.

- [ ] **Step 7: Commit**

```bash
git add server/app/models.py server/migrations/versions/ server/tests/property/test_reward_variant_price_inherit.py
git commit -m "feat: add nullable points_required to reward_variants (null = inherit parent price)"
```

- [ ] **Step 8: Update the ERD to document the new column**

In `ERD.md`, the `REWARD_VARIANTS` block must include the price column (this may already be done — verify it reads exactly):

```
    REWARD_VARIANTS {
        int id PK
        int reward_id FK "Reference -> REWARDS"
        string variety_name "e.g. Red - Medium, Blue - Large"
        int stock_quantity "inventory for item"
        int points_required "Nullable - per-variant price; NULL inherits REWARDS.points_required"
        string image_url "Nullable - Variant-specific product image"
        boolean is_active
        datetime created_at
    }
```

Then commit:

```bash
git add ERD.md
git commit -m "docs: add points_required to REWARD_VARIANTS in ERD"
```

---

### Task 1.2: Surface variant price + image in the reward serializer

**Files:**
- Modify: `server/app/controllers/_shared.py` (`_serialize_reward`)
- Test: `server/tests/property/test_reward_serializer_variants.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_reward_serializer_variants.py`:

```python
"""_serialize_reward must expose per-variant pointsRequired (effective) and imageUrl."""
import uuid
import pytest
from flask import Flask

from app import Config, db
from app.models import CommunityGroup, Organization, OrgType, Reward, RewardVariant
from app.controllers._shared import _serialize_reward


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    db.init_app(app)
    with app.app_context():
        db.create_all()
    return app


@pytest.fixture(scope='module')
def app_ctx():
    app = _build_app()
    with app.app_context():
        yield app
        db.session.remove()
        db.drop_all()


def test_serializer_exposes_variant_price_and_image(app_ctx):
    with app_ctx.app_context():
        ot = OrgType(name=f'SerUni-{uuid.uuid4().hex[:6]}'); db.session.add(ot); db.session.flush()
        org = Organization(name=f'SerOrg-{uuid.uuid4().hex[:6]}', full_name='Ser Org',
                           type_id=ot.id, status='Active'); db.session.add(org); db.session.flush()
        reward = Reward(organization_id=org.id, name='Pen', category='Merchandise',
                        points_required=50, is_active=True); db.session.add(reward); db.session.flush()
        v1 = RewardVariant(reward_id=reward.id, variety_name='Blue', stock_quantity=3,
                           points_required=None, is_active=True)
        v2 = RewardVariant(reward_id=reward.id, variety_name='Gold', stock_quantity=2,
                           points_required=75, image_url='/uploads/rewards/gold.png', is_active=True)
        db.session.add_all([v1, v2]); db.session.commit()

        out = _serialize_reward(reward)
        variants = {v['varietyName']: v for v in out['variants']}
        # Blue inherits parent price (50); Gold overrides (75)
        assert variants['Blue']['pointsRequired'] == 50
        assert variants['Gold']['pointsRequired'] == 75
        assert variants['Gold']['imageUrl'] == '/uploads/rewards/gold.png'
        assert variants['Blue']['imageUrl'] is None
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_reward_serializer_variants.py -v` (in `server/`)
Expected: FAIL — `pointsRequired`/`imageUrl` keys missing from variant dicts.

- [ ] **Step 3: Update the serializer**

In `server/app/controllers/_shared.py`, in `_serialize_reward`, find:

```python
    variants = [{'id': v.id, 'varietyName': v.variety_name,
                 'stockQuantity': v.stock_quantity, 'isActive': v.is_active}
                for v in (r.variants or [])]
```

Replace with (add effective price + image; `None` variant price inherits the parent):

```python
    variants = [{
        'id': v.id,
        'varietyName': v.variety_name,
        'stockQuantity': v.stock_quantity,
        # Effective price: the variant's own points_required when set,
        # otherwise inherit the parent reward's points_required.
        'pointsRequired': v.points_required if v.points_required is not None else r.points_required,
        # Raw override flag the UI uses to drive the "same as main" toggle.
        'pointsRequiredOverride': v.points_required,
        'imageUrl': v.image_url,
        'isActive': v.is_active,
    } for v in (r.variants or [])]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_reward_serializer_variants.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 5: Run the full server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass (same pre-existing failures as baseline, no new ones).

- [ ] **Step 6: Commit**

```bash
git add server/app/controllers/_shared.py server/tests/property/test_reward_serializer_variants.py
git commit -m "feat: serialize per-variant effective price + image in _serialize_reward"
```

---

## Phase 2 — API: variant arrays + price-aware redemption

### Task 2.1: Add variant schema to reward create/update

**Files:**
- Modify: `server/app/schemas/__init__.py`
- Test: `server/tests/property/test_reward_variant_schema.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_reward_variant_schema.py`:

```python
"""RewardCreateSchema must accept a variants[] array with optional per-variant price."""
import pytest
from pydantic import ValidationError
from app.schemas import RewardCreateSchema


def test_accepts_variants_array():
    payload = RewardCreateSchema(
        name='Tumbler', pointsRequired=100, category='Merchandise',
        variants=[
            {'varietyName': 'Small', 'stockQuantity': 5, 'pointsRequired': None},
            {'varietyName': 'Large', 'stockQuantity': 3, 'pointsRequired': 150},
        ],
    )
    assert len(payload.variants) == 2
    assert payload.variants[0].pointsRequired is None
    assert payload.variants[1].pointsRequired == 150


def test_variants_optional():
    payload = RewardCreateSchema(name='Pen', pointsRequired=10, category='Merchandise')
    assert payload.variants is None


def test_rejects_unknown_variant_field():
    with pytest.raises(ValidationError):
        RewardCreateSchema(
            name='X', pointsRequired=1, category='Merchandise',
            variants=[{'varietyName': 'A', 'stockQuantity': 1, 'bogusField': 9}],
        )
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_reward_variant_schema.py -v` (in `server/`)
Expected: FAIL — `variants` is not a field; `extra='forbid'` rejects it.

- [ ] **Step 3: Add the variant input schema and wire it into create/update**

In `server/app/schemas/__init__.py`, find the rewards section header comment:

```python
# ══════════════════════════════════════════════════════════════════════════
# rewards_controller (rewards_bp — prefix /api/web/rewards)
# ══════════════════════════════════════════════════════════════════════════


class RewardCreateSchema(_StrictModel):
```

Insert the new `RewardVariantInputSchema` immediately BEFORE `class RewardCreateSchema`:

```python
class RewardVariantInputSchema(_StrictModel):
    """One variant inside a reward create/update payload.

    ``pointsRequired = None`` means the variant inherits the parent reward's
    price. ``id`` is present only when editing an existing variant (upsert).
    """

    id: Optional[int] = None
    varietyName: Optional[str] = None
    stockQuantity: Optional[int] = None
    pointsRequired: Optional[int] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None


```

Then in `RewardCreateSchema`, add a `variants` field (after `stockQuantity`):

```python
class RewardCreateSchema(_StrictModel):
    """Body for ``POST /api/web/rewards``."""

    locationId: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    categoryId: Optional[int] = None
    pointsRequired: Optional[int] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    stockQuantity: Optional[int] = None
    variants: Optional[List[RewardVariantInputSchema]] = None
```

And the identical field in `RewardUpdateSchema` (after its `stockQuantity`):

```python
class RewardUpdateSchema(_StrictModel):
    """Body for ``PUT /api/web/rewards/<id>``."""

    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    categoryId: Optional[int] = None
    pointsRequired: Optional[int] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    stockQuantity: Optional[int] = None
    variants: Optional[List[RewardVariantInputSchema]] = None
```

Then add `'RewardVariantInputSchema'` to the `__all__` list in the rewards_controller section (next to `'RewardCreateSchema'`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_reward_variant_schema.py -v` (in `server/`)
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
git add server/app/schemas/__init__.py server/tests/property/test_reward_variant_schema.py
git commit -m "feat: accept variants[] in reward create/update schemas"
```

---

### Task 2.2: Persist variants in create_reward and update_reward

**Files:**
- Modify: `server/app/controllers/rewards_controller.py`
- Test: `server/tests/property/test_reward_variant_persist.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_reward_variant_persist.py`:

```python
"""Creating/updating a reward persists its variants (upsert + deactivate)."""
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask, Blueprint

from app import Config, db
from app.controllers.rewards_controller import rewards_bp
from app.models import CommunityGroup, Organization, OrgType, Reward, RewardVariant, User


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    db.init_app(app)
    web_bp = Blueprint('web_var_persist', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(rewards_bp)
    app.register_blueprint(web_bp)
    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        ot = OrgType(name=f'VPUni-{uuid.uuid4().hex[:6]}'); db.session.add(ot); db.session.flush()
        org = Organization(name=f'VPOrg-{uuid.uuid4().hex[:6]}', full_name='VP Org',
                           type_id=ot.id, status='Active'); db.session.add(org); db.session.flush()
        grp = CommunityGroup(organization_id=org.id, name='VPG', abbreviation='VPG')
        db.session.add(grp); db.session.flush()
        admin = User(community_group_id=grp.id, first_name='VP', last_name='Admin',
                     email=f'vp-{uuid.uuid4().hex[:6]}@t.test', username=f'vp_{uuid.uuid4().hex[:6]}',
                     password_hash='x', role='superadmin', is_active=True)
        db.session.add(admin); db.session.commit()
        return admin.id, org.id


def _mint(app, uid):
    now = datetime.now(timezone.utc)
    return jwt.encode({'user_id': uid, 'role': 'superadmin', 'iat': int(now.timestamp()),
                       'exp': int((now + timedelta(hours=1)).timestamp()), 'jti': uuid.uuid4().hex},
                      app.config['SECRET_KEY'], algorithm='HS256')


@pytest.fixture(scope='module')
def ctx():
    app = _build_app()
    uid, org_id = _seed(app)
    token = _mint(app, uid)
    yield app, token, org_id
    with app.app_context():
        db.session.remove(); db.drop_all()


def _auth(token):
    return {'Authorization': f'Bearer {token}'}


def test_create_with_variants_persists_all(ctx):
    app, token, org_id = ctx
    with app.test_client() as c:
        r = c.post('/api/web/rewards', headers=_auth(token), json={
            'name': 'Shirt', 'pointsRequired': 100, 'category': 'Merchandise',
            'locationId': org_id,
            'variants': [
                {'varietyName': 'Small', 'stockQuantity': 5, 'pointsRequired': None},
                {'varietyName': 'Large', 'stockQuantity': 3, 'pointsRequired': 120},
            ],
        })
    assert r.status_code == 201, r.get_data(as_text=True)
    reward = r.get_json()['reward']
    names = sorted(v['varietyName'] for v in reward['variants'])
    assert names == ['Large', 'Small']
    large = next(v for v in reward['variants'] if v['varietyName'] == 'Large')
    small = next(v for v in reward['variants'] if v['varietyName'] == 'Small')
    assert large['pointsRequired'] == 120     # override
    assert small['pointsRequired'] == 100     # inherits parent


def test_update_upserts_and_deactivates(ctx):
    app, token, org_id = ctx
    with app.test_client() as c:
        # create with two variants
        r = c.post('/api/web/rewards', headers=_auth(token), json={
            'name': 'Cap', 'pointsRequired': 60, 'category': 'Merchandise', 'locationId': org_id,
            'variants': [
                {'varietyName': 'Red', 'stockQuantity': 2, 'pointsRequired': None},
                {'varietyName': 'Blue', 'stockQuantity': 4, 'pointsRequired': 80},
            ],
        })
        rid = r.get_json()['reward']['id']
        red_id = next(v['id'] for v in r.get_json()['reward']['variants'] if v['varietyName'] == 'Red')

        # update: keep Red (new stock), drop Blue, add Green
        r2 = c.put(f'/api/web/rewards/{rid}', headers=_auth(token), json={
            'variants': [
                {'id': red_id, 'varietyName': 'Red', 'stockQuantity': 9, 'pointsRequired': None},
                {'varietyName': 'Green', 'stockQuantity': 1, 'pointsRequired': 70},
            ],
        })
    assert r2.status_code == 200, r2.get_data(as_text=True)
    active = {v['varietyName']: v for v in r2.get_json()['reward']['variants'] if v['isActive']}
    assert 'Red' in active and active['Red']['stockQuantity'] == 9
    assert 'Green' in active
    assert 'Blue' not in active  # deactivated
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_reward_variant_persist.py -v` (in `server/`)
Expected: FAIL — create still only makes the single `'Default'` variant; update ignores `variants`.

- [ ] **Step 3: Add a shared variant-sync helper**

In `server/app/controllers/rewards_controller.py`, add this helper after the `_ALLOWED_IMAGE_EXT` constant (before `create_reward`):

```python
def _sync_reward_variants(reward, variants_payload):
    """Upsert the reward's variants from a validated payload list.

    * Items with an ``id`` matching an existing variant are updated in place.
    * Items without an ``id`` (or an unknown one) are created.
    * Existing variants NOT present in the payload are soft-deactivated
      (``is_active = False``) so historical redemptions keep their FK.

    A ``pointsRequired`` of ``None`` is stored as NULL (inherit parent price).
    """
    existing = {v.id: v for v in (reward.variants or [])}
    seen_ids = set()

    for item in variants_payload:
        data = item.model_dump(exclude_unset=True)
        vid = data.get('id')
        name = (data.get('varietyName') or '').strip() or 'Default'
        stock = data.get('stockQuantity') if data.get('stockQuantity') is not None else 0
        price = data.get('pointsRequired')  # may be None → inherit
        image = data.get('imageUrl')
        active = data.get('isActive') if data.get('isActive') is not None else True

        if vid and vid in existing:
            v = existing[vid]
            v.variety_name = name
            v.stock_quantity = stock
            v.points_required = price
            if 'imageUrl' in data:
                v.image_url = image
            v.is_active = active
            seen_ids.add(vid)
        else:
            v = RewardVariant(
                reward_id=reward.id,
                variety_name=name,
                stock_quantity=stock,
                points_required=price,
                image_url=image,
                is_active=active,
            )
            db.session.add(v)

    # Soft-deactivate variants the client removed.
    for vid, v in existing.items():
        if vid not in seen_ids and v.is_active:
            v.is_active = False
```

- [ ] **Step 4: Use the helper in create_reward**

In `create_reward`, find the default-variant block:

```python
        db.session.add(reward)
        db.session.flush()

        # Create default variant
        variant = RewardVariant(
            reward_id=reward.id,
            variety_name='Default',
            stock_quantity=payload.stockQuantity if payload.stockQuantity is not None else 0,
            is_active=True,
        )
        db.session.add(variant)
```

Replace with (use payload variants when provided; else keep the single Default):

```python
        db.session.add(reward)
        db.session.flush()

        if payload.variants:
            _sync_reward_variants(reward, payload.variants)
        else:
            # Backward-compatible single "Default" variant from stockQuantity.
            db.session.add(RewardVariant(
                reward_id=reward.id,
                variety_name='Default',
                stock_quantity=payload.stockQuantity if payload.stockQuantity is not None else 0,
                points_required=None,
                is_active=True,
            ))
```

- [ ] **Step 5: Use the helper in update_reward**

In `update_reward`, find the existing default-variant stock block:

```python
        # Update default variant stock if stockQuantity sent
        if 'stockQuantity' in data:
            default_var = RewardVariant.query.filter_by(reward_id=reward.id, variety_name='Default').first()
            if default_var:
                default_var.stock_quantity = data['stockQuantity']
            else:
                default_var = RewardVariant(reward_id=reward.id, variety_name='Default',
                                           stock_quantity=data['stockQuantity'], is_active=True)
                db.session.add(default_var)
```

Replace with (variants array wins; fall back to the legacy single-stock path):

```python
        # Variant sync takes precedence; otherwise keep the legacy
        # single-"Default"-variant stock update for back-compat.
        if payload.variants is not None:
            _sync_reward_variants(reward, payload.variants)
        elif 'stockQuantity' in data:
            default_var = RewardVariant.query.filter_by(reward_id=reward.id, variety_name='Default').first()
            if default_var:
                default_var.stock_quantity = data['stockQuantity']
            else:
                default_var = RewardVariant(reward_id=reward.id, variety_name='Default',
                                           stock_quantity=data['stockQuantity'],
                                           points_required=None, is_active=True)
                db.session.add(default_var)
```

> NOTE: `data = payload.model_dump(exclude_unset=True)` already exists earlier in `update_reward`. `payload.variants` is the parsed Pydantic list — use it directly (not `data['variants']`) so each item is a `RewardVariantInputSchema` with `.model_dump()`.

- [ ] **Step 6: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_reward_variant_persist.py -v` (in `server/`)
Expected: PASS (both).

- [ ] **Step 7: Run the full server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass (no new failures).

- [ ] **Step 8: Commit**

```bash
git add server/app/controllers/rewards_controller.py server/tests/property/test_reward_variant_persist.py
git commit -m "feat: persist reward variants on create/update (upsert + soft-deactivate)"
```

---

### Task 2.3: Charge the variant's price on redemption

**Files:**
- Modify: `server/app/controllers/rewards_controller.py` (`redeem_reward`)
- Test: `server/tests/property/test_reward_variant_redeem_price.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_reward_variant_redeem_price.py`:

```python
"""Redeeming a variant charges the variant's price when set, else the parent's."""
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask, Blueprint

from app import Config, db
from app.controllers.rewards_controller import rewards_bp
from app.models import (
    CommunityGroup, Organization, OrgType, Reward, RewardVariant, User, Wallet,
)


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    db.init_app(app)
    web_bp = Blueprint('web_var_redeem', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(rewards_bp)
    app.register_blueprint(web_bp)
    with app.app_context():
        db.create_all()
    return app


def _seed(app, variant_price):
    with app.app_context():
        ot = OrgType(name=f'RPUni-{uuid.uuid4().hex[:6]}'); db.session.add(ot); db.session.flush()
        org = Organization(name=f'RPOrg-{uuid.uuid4().hex[:6]}', full_name='RP Org',
                           type_id=ot.id, status='Active'); db.session.add(org); db.session.flush()
        grp = CommunityGroup(organization_id=org.id, name='RPG', abbreviation='RPG')
        db.session.add(grp); db.session.flush()
        user = User(community_group_id=grp.id, first_name='RP', last_name='User',
                    email=f'rp-{uuid.uuid4().hex[:6]}@t.test', username=f'rp_{uuid.uuid4().hex[:6]}',
                    password_hash='x', role='user', is_active=True)
        db.session.add(user); db.session.flush()
        wallet = Wallet(user_id=user.id, points_balance=1000, lifetime_points=1000, streak=0)
        db.session.add(wallet)
        reward = Reward(organization_id=org.id, name='Mug', category='Merchandise',
                        points_required=100, is_active=True); db.session.add(reward); db.session.flush()
        variant = RewardVariant(reward_id=reward.id, variety_name='Special', stock_quantity=10,
                                points_required=variant_price, is_active=True)
        db.session.add(variant); db.session.commit()
        return user.id, reward.id, variant.id


def _mint(app, uid, role='user'):
    now = datetime.now(timezone.utc)
    return jwt.encode({'user_id': uid, 'role': role, 'iat': int(now.timestamp()),
                       'exp': int((now + timedelta(hours=1)).timestamp()), 'jti': uuid.uuid4().hex},
                      app.config['SECRET_KEY'], algorithm='HS256')


def test_redeem_uses_variant_price_when_set():
    app = _build_app()
    uid, rid, vid = _seed(app, variant_price=150)
    token = _mint(app, uid)
    with app.test_client() as c:
        r = c.post(f'/api/web/rewards/{rid}/redeem',
                   headers={'Authorization': f'Bearer {token}'},
                   json={'variantId': vid, 'quantity': 1})
    assert r.status_code == 201, r.get_data(as_text=True)
    with app.app_context():
        w = Wallet.query.filter_by(user_id=uid).first()
        assert w.points_balance == 1000 - 150  # charged the variant price, not 100
    with app.app_context():
        db.session.remove(); db.drop_all()


def test_redeem_inherits_parent_price_when_null():
    app = _build_app()
    uid, rid, vid = _seed(app, variant_price=None)
    token = _mint(app, uid)
    with app.test_client() as c:
        r = c.post(f'/api/web/rewards/{rid}/redeem',
                   headers={'Authorization': f'Bearer {token}'},
                   json={'variantId': vid, 'quantity': 1})
    assert r.status_code == 201, r.get_data(as_text=True)
    with app.app_context():
        w = Wallet.query.filter_by(user_id=uid).first()
        assert w.points_balance == 1000 - 100  # inherited parent price
    with app.app_context():
        db.session.remove(); db.drop_all()
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_reward_variant_redeem_price.py -v` (in `server/`)
Expected: FAIL on `test_redeem_uses_variant_price_when_set` — it currently charges 100 (parent) regardless.

- [ ] **Step 3: Make redemption price variant-aware**

In `server/app/controllers/rewards_controller.py`, in `redeem_reward`, find:

```python
        total_points_required = reward.points_required * quantity
```

Replace with:

```python
        # Variant price overrides the parent reward price when set (NULL = inherit).
        unit_price = variant.points_required if variant.points_required is not None else reward.points_required
        total_points_required = unit_price * quantity
```

> `variant` is already resolved above this line in `redeem_reward` (either from `variantId` or the first in-stock active variant), so `variant.points_required` is safe to read here.

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_reward_variant_redeem_price.py -v` (in `server/`)
Expected: PASS (both).

- [ ] **Step 5: Run the full server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add server/app/controllers/rewards_controller.py server/tests/property/test_reward_variant_redeem_price.py
git commit -m "feat: redemption charges variant price when set (else inherits parent)"
```

---

## Phase 3 — UI: landscape modal + variant editor

### Task 3.1: Add a VariantEditor component

**Files:**
- Create: `client/src/components/admin/RewardVariantEditor.jsx`
- Test: `client/tests/property/reward-variant-editor.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/tests/property/reward-variant-editor.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RewardVariantEditor from '../../src/components/admin/RewardVariantEditor';

describe('RewardVariantEditor', () => {
    it('adds a variant row and reports it via onChange', async () => {
        const onChange = vi.fn();
        render(<RewardVariantEditor variants={[]} mainPrice={'100'} onChange={onChange} />);
        await act(async () => { screen.getByText('Add Variant').click(); });
        const last = onChange.mock.calls.at(-1)[0];
        expect(last).toHaveLength(1);
        expect(last[0].samePrice).toBe(true);     // defaults to inherit main price
        expect(last[0].pointsRequired).toBe(null);
    });

    it('toggling "same as main" off exposes a price input and stores the value', async () => {
        const onChange = vi.fn();
        const variants = [{ varietyName: 'Large', stockQuantity: '5', pointsRequired: null, samePrice: true }];
        render(<RewardVariantEditor variants={variants} mainPrice={'100'} onChange={onChange} />);

        // Uncheck "same as main"
        const toggle = screen.getByLabelText('Same price as main', { exact: false });
        await act(async () => { fireEvent.click(toggle); });
        let last = onChange.mock.calls.at(-1)[0];
        expect(last[0].samePrice).toBe(false);

        // Enter a custom price
        const priceInput = screen.getByPlaceholderText('Variant price');
        await act(async () => { fireEvent.change(priceInput, { target: { value: '150' } }); });
        last = onChange.mock.calls.at(-1)[0];
        expect(last[0].pointsRequired).toBe('150');
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- reward-variant-editor` (in `client/`)
Expected: FAIL — component does not exist.

- [ ] **Step 3: Create the component**

Create `client/src/components/admin/RewardVariantEditor.jsx`:

```jsx
'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Repeatable editor for reward variants.
 *
 * Each variant row: { id?, varietyName, stockQuantity, pointsRequired, samePrice }
 *   - `samePrice = true`  → variant inherits the main reward price (pointsRequired = null on submit)
 *   - `samePrice = false` → admin types a custom `pointsRequired`
 *
 * Props:
 *   - variants: array of variant rows
 *   - mainPrice: the main reward's points price (string) — shown as the inherited value
 *   - onChange: (nextVariants) => void
 */
export default function RewardVariantEditor({ variants = [], mainPrice = '', onChange }) {
    const update = (idx, patch) => {
        const next = variants.map((v, i) => (i === idx ? { ...v, ...patch } : v));
        onChange(next);
    };

    const addRow = () => {
        onChange([
            ...variants,
            { varietyName: '', stockQuantity: '', pointsRequired: null, samePrice: true },
        ]);
    };

    const removeRow = (idx) => {
        onChange(variants.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variants</label>
                <button type="button" onClick={addRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                    <Plus size={14} /> Add Variant
                </button>
            </div>

            {variants.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No variants yet. Add one (e.g. "Red - Medium") or leave empty for a single default item.
                </p>
            )}

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {variants.map((v, idx) => (
                    <div key={v.id ?? `new-${idx}`}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Variant name (e.g. Red - Medium)"
                                value={v.varietyName || ''}
                                onChange={(e) => update(idx, { varietyName: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button type="button" onClick={() => removeRow(idx)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Stock</label>
                                <input
                                    type="number" min="0"
                                    value={v.stockQuantity ?? ''}
                                    onChange={(e) => update(idx, { stockQuantity: e.target.value })}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Points Price</label>
                                <input
                                    type="number" min="0"
                                    placeholder="Variant price"
                                    disabled={v.samePrice}
                                    value={v.samePrice ? (mainPrice || '') : (v.pointsRequired ?? '')}
                                    onChange={(e) => update(idx, { pointsRequired: e.target.value })}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!v.samePrice}
                                onChange={(e) => update(idx, {
                                    samePrice: e.target.checked,
                                    pointsRequired: e.target.checked ? null : (v.pointsRequired ?? ''),
                                })}
                                className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                            />
                            Same price as main product ({mainPrice || 0} pts)
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- reward-variant-editor` (in `client/`)
Expected: PASS (both).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/admin/RewardVariantEditor.jsx client/tests/property/reward-variant-editor.test.jsx
git commit -m "feat: RewardVariantEditor component with same-as-main price toggle"
```

---

### Task 3.2: Wire the editor into the reward modal (landscape layout)

**Files:**
- Modify: `client/app/admin/rewards/page.js`

- [ ] **Step 1: Import the editor**

In `client/app/admin/rewards/page.js`, add to the imports near the top (after the `PageSizeSelector` import):

```javascript
import RewardVariantEditor from '../../../src/components/admin/RewardVariantEditor';
```

- [ ] **Step 2: Add variants to formData and reset logic**

Find the `formData` initial state:

```javascript
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pointsRequired: '',
        stockQuantity: '',
        category: 'Merchandise',
        imageUrl: null
    });
```

Add `variants: []`:

```javascript
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pointsRequired: '',
        stockQuantity: '',
        category: 'Merchandise',
        imageUrl: null,
        variants: [],
    });
```

In `openAddModal`, change the reset to include empty variants:

```javascript
        setFormData({ name: '', description: '', pointsRequired: '', stockQuantity: '', category: 'Merchandise', imageUrl: null, variants: [] });
```

In `openEditModal`, map the reward's existing variants into editor rows. Find:

```javascript
    const openEditModal = (r) => {
        setEditingReward(r);
        setFormData({
            name: r.name,
            description: r.description || '',
            pointsRequired: r.pointsRequired.toString(),
            stockQuantity: r.stockQuantity.toString(),
            category: r.category,
            imageUrl: r.imageUrl || null
        });
        setShowModal(true);
    };
```

Replace with:

```javascript
    const openEditModal = (r) => {
        setEditingReward(r);
        setFormData({
            name: r.name,
            description: r.description || '',
            pointsRequired: r.pointsRequired.toString(),
            stockQuantity: r.stockQuantity.toString(),
            category: r.category,
            imageUrl: r.imageUrl || null,
            variants: (r.variants || [])
                .filter(v => v.isActive !== false && v.varietyName !== 'Default')
                .map(v => ({
                    id: v.id,
                    varietyName: v.varietyName,
                    stockQuantity: String(v.stockQuantity ?? 0),
                    pointsRequired: v.pointsRequiredOverride != null ? String(v.pointsRequiredOverride) : null,
                    samePrice: v.pointsRequiredOverride == null,
                })),
        });
        setImagePreview(null);
        setImageUploading(false);
        setShowModal(true);
    };
```

> `pointsRequiredOverride` is the raw (possibly null) per-variant price from the serializer (Task 1.2). When it's null the variant inherits → `samePrice: true`.

- [ ] **Step 3: Send variants in handleSubmit**

In `handleSubmit`, both the create and update `rewardsApi` calls send a fixed object. Build a `variantsPayload` once at the top of `handleSubmit` (after the validation block) and include it in both calls:

Find the start of `handleSubmit`:

```javascript
    const handleSubmit = async () => {
        const { errors: fieldErrors, isValid } = validateAll(VALIDATION_RULES.reward, formData);
        if (!isValid) {
            alert(Object.values(fieldErrors)[0]);
            return;
        }
        const stockQuantity = parseInt(formData.stockQuantity);
```

Add the variants payload builder right after `const stockQuantity = parseInt(formData.stockQuantity);`:

```javascript
        // Map editor rows → API shape. samePrice ⇒ pointsRequired: null (inherit).
        const variantsPayload = (formData.variants || [])
            .filter(v => (v.varietyName || '').trim() !== '')
            .map(v => ({
                ...(v.id ? { id: v.id } : {}),
                varietyName: v.varietyName.trim(),
                stockQuantity: parseInt(v.stockQuantity) || 0,
                pointsRequired: v.samePrice ? null : (parseInt(v.pointsRequired) || 0),
            }));
```

Then in the `rewardsApi.update(...)` call, add `variants` to the body. Find:

```javascript
                const updated = await rewardsApi.update(editingReward.id, {
                    name: formData.name,
                    description: formData.description,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity,
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                });
```

Replace with (only send `variants` when the admin defined any, so single-item rewards still use the legacy stock path):

```javascript
                const updated = await rewardsApi.update(editingReward.id, {
                    name: formData.name,
                    description: formData.description,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity,
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                    ...(variantsPayload.length ? { variants: variantsPayload } : {}),
                });
```

And in the `rewardsApi.create(...)` call. Find:

```javascript
                const created = await rewardsApi.create({
                    name: formData.name,
                    description: formData.description,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity,
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                    locationId: effectiveLocationId,
                });
```

Replace with:

```javascript
                const created = await rewardsApi.create({
                    name: formData.name,
                    description: formData.description,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity,
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                    locationId: effectiveLocationId,
                    ...(variantsPayload.length ? { variants: variantsPayload } : {}),
                });
```

> The optimistic `setRewards(...)` calls right after these can stay as-is — the list refetches on the next location change and the table reads `stockQuantity`/`pointsRequired` which are still set. (Optional: trigger a reload after submit for accurate per-variant totals.)

- [ ] **Step 4: Widen the modal to landscape + two columns**

Find the modal container:

```javascript
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl">
```

Replace the inner `max-w-2xl` wrapper with a wider one that scrolls on small screens:

```javascript
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
```

Then find the form body container:

```javascript
                        <div className="p-5 space-y-3">
```

Replace with a two-column grid. The LEFT column keeps Image / Name / Description / Points / Category; the RIGHT column holds the variant editor:

```javascript
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
```

Now locate the END of the original form body (the closing `</div>` immediately before the footer `<div className="flex gap-3 p-6 pt-0">`). The original Category field block ends like this:

```javascript
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                                <CategorySearchField
                                    value={formData.category}
                                    onChange={(v) => setFormData(p => ({ ...p, category: v }))}
                                    existingCategories={categories}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
```

Replace that closing section with: close the LEFT column, open the RIGHT column containing the variant editor, then close the grid, then the footer:

```javascript
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                                <CategorySearchField
                                    value={formData.category}
                                    onChange={(v) => setFormData(p => ({ ...p, category: v }))}
                                    existingCategories={categories}
                                />
                            </div>
                            </div>{/* end left column */}

                            <div className="space-y-3 md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-6">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Add product variants (e.g. sizes or colors). Each variant tracks its own stock.
                                    Leave the price as "same as main" to inherit the Points Cost above, or set a custom price.
                                </p>
                                <RewardVariantEditor
                                    variants={formData.variants}
                                    mainPrice={formData.pointsRequired}
                                    onChange={(next) => setFormData(p => ({ ...p, variants: next }))}
                                />
                            </div>
                        </div>{/* end grid */}
                        <div className="flex gap-3 p-6 pt-0">
```

> The "Stock *" field in the left column now represents the default/base stock used only when NO variants are defined. Leave it as-is — when variants are present the server uses the variant stocks. Optionally relabel it to "Base Stock (used when no variants)" by editing its `<label>` text.

- [ ] **Step 5: Build to verify**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 6: Manual verification**

Start server + client. Log in as admin → Rewards → Add Reward.
- [ ] Modal is wider (landscape), two columns
- [ ] Click "Add Variant", enter "Large", stock 5, leave "same as main" checked → price shows the main price greyed out
- [ ] Add another variant "XL", uncheck "same as main", type 150
- [ ] Fill the rest, Create → no error, reward saved
- [ ] Edit the reward → the two variants are pre-loaded with correct prices and toggles

- [ ] **Step 7: Commit**

```bash
git add client/app/admin/rewards/page.js
git commit -m "feat: variant editor in landscape reward modal (add/edit variants + per-variant price)"
```

---

## Self-Review (completed by plan author)

**1. Spec coverage:**
- "Implement the forgotten rewards variant" → Phases 1-3 bring create/edit/serialize/redeem to life.
- "Add fields for rewards variant which the admin can input the variants and its prices" → Task 3.1 (editor) + 3.2 (wired into modal).
- "Admin can input a price different from the main variant's price" → per-variant `pointsRequired` column (Task 1.1) + editor custom-price input (Task 3.1).
- "Option to make the price same as the main variant" → `samePrice` toggle → stores `null` → server inherits parent (Tasks 1.2, 2.2, 2.3, 3.1).
- "If the modal is too narrow, make it landscape and expand sideways" → Task 3.2 widens to `max-w-4xl` with a two-column grid.

**2. Placeholder scan:** No TBD/vague steps. Every code step has complete code. Migration content is exact.

**3. Type/name consistency:** `points_required` (DB/model) ↔ `pointsRequired` (API/serializer) ↔ `pointsRequiredOverride` (raw null-able serializer field the UI reads) are used consistently. `_sync_reward_variants(reward, payload.variants)` signature matches its two call sites. `RewardVariantInputSchema` fields (`id, varietyName, stockQuantity, pointsRequired, imageUrl, isActive`) match what `_sync_reward_variants` reads via `model_dump`. Editor row shape `{id?, varietyName, stockQuantity, pointsRequired, samePrice}` matches `openEditModal` mapping and the `variantsPayload` builder.

**Back-compat guarantees:** Rewards created/edited WITHOUT defining variants keep the legacy single-`Default` variant + `stockQuantity` path. The new `points_required` column is nullable and additive. Existing redemptions are unaffected (removed variants are soft-deactivated, never deleted).
