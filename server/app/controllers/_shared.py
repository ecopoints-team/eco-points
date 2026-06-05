"""
Shared serializer and helper utilities for Domain_Controllers.

All Domain_Controllers in `server/app/controllers/` import their serializer
and request-scoped helpers from this single module so there are no duplicate
definitions.

This module is intentionally framework-glue: it depends on Flask `request`,
the SQLAlchemy session (`db`), and the ORM models. It must not import any
controller module to avoid circular imports.
"""
import json as _json

from flask import request
from sqlalchemy import func

from ..models import AdminLog, RecyclingItem, RewardRedemption, Wallet
from ..middleware import get_user_org_id, ROLE_HIERARCHY, ROLE_PERMISSIONS
from .. import db


# ══════════════════════════════════════════════════════════════════════════
# RBAC HELPER: role-hierarchy level lookup (Phase 2 / Task 6.7)
# ══════════════════════════════════════════════════════════════════════════

def level(role):
    """Return the numeric privilege level of `role` from `ROLE_HIERARCHY`.

    Used by the user-create / user-update controllers to enforce the
    Role_Hierarchy invariant from Requirement 2.6 / 4H.30:

        An actor with role `R_actor` cannot set a target's role to any
        `R_target` where `level(R_target) >= level(R_actor)`.

    Note the strict `>=` comparison: an actor cannot create or assign a
    role at their own level either, only roles strictly below them.

    Unknown / missing roles return -1 so the comparison `level(unknown)
    >= level(actor)` evaluates to True for any admin actor (fail closed:
    we never let an unknown role slip past the hierarchy check from the
    actor side). Symmetrically, an unknown target role yields -1 which
    is below every legitimate level, but unknown target-role values are
    expected to be rejected by request validation upstream rather than
    by this helper.
    """
    return ROLE_HIERARCHY.get(role, -1)


# ══════════════════════════════════════════════════════════════════════════
# SERIALIZERS  (model → camelCase dict for the frontend)
# ══════════════════════════════════════════════════════════════════════════

def _dt(val):
    """Safely format a datetime to ISO string."""
    return val.isoformat() if val else None


def _serialize_address(a):
    if not a:
        return None
    return {'streetAddress': a.street_address, 'barangay': a.barangay,
            'cityMunicipality': a.city_municipality, 'province': a.province,
            'region': a.region, 'zipCode': a.zip_code}


def _get_org_abbreviation(org):
    """Derive a short abbreviation from an organization name.

    e.g. 'Arellano University' → 'AU', 'Polytechnic University' → 'PU'
    Takes the first letter of each capitalized word.
    """
    if not org or not org.name:
        return 'SYS'
    words = [w for w in org.name.split() if w[0].isupper()]
    return ''.join(w[0] for w in words).upper() or 'ORG'


def _serialize_org_type(ot):
    return {'id': ot.id, 'name': ot.name}


def _serialize_organization(o):
    """Organization → frontend LOCATIONS[] shape."""
    machine_count = len(o.rvms) if o.rvms else 0
    user_count = 0
    total_points = 0
    for cg in (o.community_groups or []):
        for u in (cg.users or []):
            user_count += 1
            if u.wallet:
                total_points += u.wallet.points_balance or 0

    addr = _serialize_address(o.address)
    contacts = [{'id': c.id, 'firstName': c.first_name, 'lastName': c.last_name,
                 'email': c.email, 'phoneNumber': c.phone_number}
                for c in (o.contacts or [])]

    return {
        'id': o.id,
        'name': o.name,
        'fullName': o.full_name,
        'orgType': o.org_type_ref.name if o.org_type_ref else None,
        'typeId': o.type_id,
        'address': addr,
        'streetAddress': addr.get('streetAddress') if addr else None,
        'barangay': addr.get('barangay') if addr else None,
        'cityName': addr.get('cityMunicipality') if addr else None,
        # Phase 3 task 8.2 (alignment-doc §4.a): the locations page sends
        # `cityId` on PUT for the city dropdown preselect. The model stores
        # the city as a free-text `city_municipality` string (no FK to a
        # cities table). Decision: drop the city-id concept and key the
        # dropdown off `cityName` (Phase 3 task 8.3). We expose `cityId`
        # as `null` here so the JSON schema is explicit and the page can
        # render the empty-state until 8.3 removes the field from the form.
        'cityId': None,
        'zipCode': addr.get('zipCode') if addr else None,
        'contacts': contacts,
        'contactPerson': f"{contacts[0]['firstName']} {contacts[0]['lastName']}" if contacts else None,
        'contactEmail': contacts[0].get('email') if contacts else None,
        'contactPhone': contacts[0].get('phoneNumber') if contacts else None,
        'status': o.status,
        'createdAt': _dt(o.created_at),
        'machineCount': machine_count,
        'userCount': user_count,
        'totalPoints': total_points,
    }


def _serialize_user(u):
    """User → frontend USERS[] / ADMIN_USERS[] shape.

    Phase 3 task 8.2 additions (per `docs/model-ui-alignment.md`):
      - `permissions` — derived from `ROLE_PERMISSIONS[role]` so the
        `users/permissions` page no longer relies on its hard-coded
        `ROLES_DATA` map (Requirement 2.3 / 2.5 + alignment doc §14).
        For v1 the value is a presence-only mapping
        `{ <category>: { view, edit, create, delete, export } }` with
        every flag set to True for every category present in the role's
        permission set. `ROLE_PERMISSIONS` is currently a flat set of
        category names (no per-verb granularity), so the map is the
        simplest faithful projection. A future Phase 4 enrichment can
        replace the boolean tuple with a real per-verb gate without
        changing the JSON shape.
      - Enums (Requirement 3.6): `role` is returned as the canonical
        lowercase string already used in `ROLE_PERMISSIONS`. The model
        column is already lowercase; this comment pins the contract.

    TODO(phase3-task-8.2 / Requirement 3.4): the User model lacks
    columns for `gender`, `age` (or `dateOfBirth`), and `yearLevel`.
    The `profile` page (alignment doc §15) and the `users` admin edit
    modal (§13) both reference these. Phase 3 8.3 must render them as
    empty-state when missing; a future schema-evolution backlog can
    add real columns and replace the empty-state with model-backed
    values.
    """
    org_id = None
    org_name = None
    group_name = None
    if u.community_group:
        cg = u.community_group
        org_id = cg.organization_id
        group_name = cg.abbreviation or cg.name
        if cg.organization:
            org_name = cg.organization.name

    # Phase 3 / Requirement 2.3 + alignment doc §14: project ROLE_PERMISSIONS
    # into a map keyed by category. Non-admin roles (`user`, `dependent`)
    # are absent from ROLE_PERMISSIONS by design and therefore receive an
    # empty `{}` here.
    role_perms = ROLE_PERMISSIONS.get(u.role, set())
    permissions = {
        category: {
            'view': True,
            'edit': True,
            'create': True,
            'delete': True,
            'export': True,
        }
        for category in sorted(role_perms)
    }

    # Enum normalization (Requirement 3.6): the User model stores `role`
    # in lowercase already. Coerce defensively so any legacy uppercased
    # data still serializes as the canonical lowercase value.
    role_value = (u.role or '').lower() or None

    return {
        'id': u.id,
        'displayId': u.display_id,
        'name': u.name,
        'firstName': u.first_name,
        'middleName': u.middle_name,
        'lastName': u.last_name,
        'username': u.username,
        'email': u.email,
        'phone': u.phone,
        'role': role_value,
        'userType': u.user_type,
        'educationalLevel': u.educational_level,
        'yearLevel': u.year_level,
        'communityGroupId': u.community_group_id,
        'isActive': u.is_active,
        'pointsBalance': u.wallet.points_balance if u.wallet else 0,
        'lifetimePoints': u.wallet.lifetime_points if u.wallet else 0,
        'streak': u.wallet.streak if u.wallet else 0,
        'walletId': u.wallet.id if u.wallet else None,
        'locationId': org_id,
        'locationName': org_name,
        'groupName': group_name,
        'lastLogin': _dt(u.last_login),
        'createdAt': _dt(u.created_at),
        'updatedAt': _dt(u.updated_at),
        # Phase 3 task 8.2 — `users/permissions` page.
        'permissions': permissions,
    }


def _serialize_rvm(m):
    """RVM → frontend MACHINES[] shape.

    Phase 3 task 8.2 additions (per `docs/model-ui-alignment.md` §10):
      - `currentCapacity` — the `RVM` model has no `current_capacity`
        column today (it is set client-side only by the AddMachine
        modal). Persisting the field is left to a Phase-4 schema-
        evolution backlog item; for now the serializer returns `null`
        and the client renders an empty-state badge.
      - `totalItemsCollected` — derived as
        `COUNT(recycling_items WHERE rvm_id == m.id)` so the bin-status
        indicator on the machines page can read a real number without a
        new column. The query is one cheap aggregate per row, so we do
        it inline; if this becomes hot we can switch to a single
        grouped query in `machines_controller.get_machines`.
      - `lastSync` — derived from `RVM.heartbeat_at` if such a column
        exists. Inspecting the model in `server/app/models.py` shows
        no `heartbeat_at` column today, so we return `null` and the
        client renders an empty-state value. Adding the column is
        likewise a Phase-4 schema-evolution backlog item.
      - Enum normalization (Requirement 3.6): the page renders an
        `Online`/`Offline` label that is already derived from
        `is_online` on the client. The legacy `status` string column
        does not exist on `RVM`; if a future migration adds one, this
        serializer must lowercase it on the way out.
    """
    org_name = m.organization.name if m.organization else None

    # Derived: total items ever collected by this RVM.
    # Cheap single-aggregate query; relies on RecyclingSession having an
    # `rvm_id` column and RecyclingItem joining via session_id.
    try:
        total_items_collected = db.session.query(func.count(RecyclingItem.id))\
            .join(RecyclingItem.session)\
            .filter_by(rvm_id=m.id)\
            .scalar() or 0
    except Exception:
        # Defensive: never let serializer-level query errors poison the
        # whole list response.
        total_items_collected = None

    # Derived: lastSync from RVM.heartbeat_at if the column exists.
    last_sync = None
    heartbeat_at = getattr(m, 'heartbeat_at', None)
    if heartbeat_at is not None:
        last_sync = _dt(heartbeat_at)

    # Derived: currentCapacity from RVM.current_capacity if the column
    # exists; else None. Today the column does not exist (Phase-4 backlog).
    current_capacity = getattr(m, 'current_capacity', None)

    # Enum normalization (Requirement 3.6): `machine.status` is derived
    # from the boolean `is_online` column. The canonical lowercase values
    # are `'online'` and `'offline'`. The UI's `StatusBadge` component
    # currently derives its label from `isOnline` directly; this field
    # provides the canonical enum string so the shared label map in
    # `client/src/lib/enumLabels.js` (Phase 3 task 8.3) can render it
    # without a client-side boolean-to-string conversion.
    status_value = 'online' if m.is_online else 'offline'

    return {
        'id': m.id,
        'machineUuid': m.machine_uuid,
        'name': m.name,
        'locationId': m.organization_id,
        'locationName': m.location_name,
        'orgName': org_name,
        'isOnline': m.is_online,
        'isCapacityFull': m.is_capacity_full,
        'createdAt': _dt(m.created_at),
        # Phase 3 task 8.2 — alignment-doc §10 derived fields.
        'currentCapacity': current_capacity,
        'totalItemsCollected': total_items_collected,
        'lastSync': last_sync,
        # Requirement 3.6 — canonical lowercase enum for machine status.
        'status': status_value,
    }


def _serialize_reward(r):
    """Reward → frontend REWARDS[] shape.

    Phase 3 task 8.2 additions (per `docs/model-ui-alignment.md` §11):
      - `dispensed` — total quantity that has actually been redeemed.
        Computed as `COUNT(reward_redemptions)` for variants of this
        reward whose `status` is in `('claimed', 'used')`. The legacy
        client initialised this to `0` from the synthetic shape; the
        page can now read a real number. Note that
        `RewardRedemption.points_spent` is already a snapshot of the
        cost-at-redemption-time, but redemption COUNT is the right
        proxy for the "Total Dispensed" stat — each row corresponds to
        one redeemed unit.
    """
    variants = [{'id': v.id, 'varietyName': v.variety_name,
                 'stockQuantity': v.stock_quantity, 'isActive': v.is_active}
                for v in (r.variants or [])]
    total_stock = sum(v.stock_quantity or 0 for v in (r.variants or []))

    # Derived: how many redemptions have been claimed/used. We could
    # iterate `r.variants[*].redemptions` in Python, but a single SQL
    # aggregate is cheaper for rewards with many redemptions.
    variant_ids = [v.id for v in (r.variants or [])]
    if variant_ids:
        try:
            dispensed = db.session.query(func.count(RewardRedemption.id))\
                .filter(
                    RewardRedemption.variant_id.in_(variant_ids),
                    RewardRedemption.status.in_(('claimed', 'used')),
                ).scalar() or 0
        except Exception:
            dispensed = 0
    else:
        dispensed = 0

    return {
        'id': r.id,
        'name': r.name,
        'description': r.description,
        'category': r.category,
        'pointsRequired': r.points_required,
        'stockQuantity': total_stock,
        'variants': variants,
        'imageUrl': r.image_url,
        'isActive': r.is_active,
        'locationId': r.organization_id,
        'locationName': r.organization.name if r.organization else None,
        'createdAt': _dt(r.created_at),
        # Phase 3 task 8.2 — alignment-doc §11 derived field.
        'dispensed': dispensed,
    }


def _serialize_bottle_log(item):
    """RecyclingItem → frontend BOTTLE_LOGS[] shape.

    Phase 3 task 8.2 additions (per `docs/model-ui-alignment.md` §6):
      - `volumeMl` — `RecyclingItem` has no `volume_ml` column today, so
        this returns `null`. Adding the column is left to a Phase-4
        schema-evolution backlog item; until then 8.3 renders the
        empty-state size label.
      - `condition` — `RecyclingItem` has no `condition` column. Today
        the YOLO `detected_class` carries some shape information (e.g.
        `pet_with_label`), but the page expects the canonical
        `With Label` / `No Label` / `Rejected` enum. We return `null`
        here and let 8.3 render the empty-state badge. When a real
        column is added in Phase 4, replace `null` with `item.condition`.
      - `brand` — same status as `volumeMl`/`condition`; returns `null`
        until a column is added.
      - `sessionType` — derived as `'rvm'` for sessions that came from a
        live RVM and `'bulk'` for sessions backfilled by an admin via
        `/api/web/sessions/bulk`. We do not have a `session_type`
        column, but `RecyclingSession.rvm_id` is always set so we
        cannot distinguish the two by presence alone. The bulk-create
        path stamps `start_time == end_time` (see
        `sessions_controller.create_bulk_session`), which is a stable
        proxy for "this session never had a real RVM workflow open".
        Anything else is treated as `'rvm'`. If Phase-4 adds a real
        `session_type` column, replace this heuristic with a column
        read.
    """
    session = item.session
    wallet = session.wallet if session else None
    user = wallet.user if wallet else None
    rvm = session.rvm if session else None
    org = rvm.organization if rvm else None

    # Heuristic: bulk-created sessions stamp start == end so the
    # difference is exactly zero (see sessions_controller). RVM sessions
    # leave `end_time` null until completion.
    session_type = None
    if session is not None:
        if session.end_time and session.start_time and session.end_time == session.start_time:
            session_type = 'bulk'
        else:
            session_type = 'rvm'

    return {
        'id': item.id,
        'sessionId': item.session_id,
        'userId': user.id if user else None,
        'userName': user.name if user else 'Unknown',
        'userEmail': user.email if user else None,
        'locationId': rvm.organization_id if rvm else None,
        'locationName': org.name if org else 'Unknown',
        'machineId': rvm.id if rvm else None,
        'machineName': rvm.name if rvm else 'Unknown',
        'detectedClass': item.detected_class,
        'confidenceScore': float(item.confidence_score) if item.confidence_score else None,
        'pointsAwarded': item.points_awarded,
        'status': item.status,
        'timestamp': _dt(item.scanned_at),
        'scannedAt': _dt(item.scanned_at),
        # Phase 3 task 8.2 — alignment-doc §6 derived fields.
        # `volumeMl`, `condition`, `brand` return `null` until Phase-4
        # adds the corresponding columns to `recycling_items`.
        'volumeMl': getattr(item, 'volume_ml', None),
        'condition': getattr(item, 'condition', None),
        'brand': getattr(item, 'brand', None),
        'sessionType': session_type,
    }


def _serialize_machine_log(log):
    """MaintenanceLog → frontend MACHINE_LOGS[] shape."""
    org = log.rvm.organization if (log.rvm and log.rvm.organization) else None
    return {
        'id': log.id,
        'rvmId': log.rvm_id,
        'machineName': log.rvm.name if log.rvm else 'Unknown',
        'locationId': log.rvm.organization_id if log.rvm else None,
        'locationName': org.name if org else 'Unknown',
        'performedBy': log.performed_by.name if log.performed_by else 'Unknown',
        'performedById': log.performed_by_id,
        'actionType': log.action_type,
        'status': log.status,
        'resolved': log.status == 'Resolved',
        'notes': log.notes,
        'timestamp': _dt(log.created_at),
    }


def _serialize_admin_log(log):
    """AdminLog → frontend ADMIN_LOGS[] shape.

    Phase 3 task 8.2 rename (per `docs/model-ui-alignment.md` §5):
      - The `notes` column on `AdminLog` is currently a JSON envelope
        carrying `{before, after, ip, user_agent, notes}` (see
        `log_action` below; the dedicated columns are scheduled for a
        Phase-4 migration tracked by the `phase4-audit-split` TODO).
        The Admin_UI access-logs page renders `notes` as a human note,
        so we split the envelope on the way out:
          * `notes`  → the inner `notes` string (or `None`).
          * `meta`   → the structured `{before, after, ip, user_agent}`
                       so forensics still has access to the full
                       envelope.
        Pre-Phase-2 rows that wrote a free-form string into `notes`
        instead of a JSON envelope still parse correctly because we
        fall back to returning the raw string verbatim under `notes`
        with `meta = None`.

    Enum normalization (Requirement 3.6): `adminRole` is the user's
    role and is returned as the canonical lowercase string from the
    User model.
    """
    admin = log.admin
    org_id = None
    org_name = None
    if admin and admin.community_group:
        org_id = admin.community_group.organization_id
        if admin.community_group.organization:
            org_name = admin.community_group.organization.name

    raw_notes = log.notes
    note_text = None
    meta = None
    if raw_notes:
        try:
            envelope = _json.loads(raw_notes)
            if isinstance(envelope, dict):
                note_text = envelope.get('notes')
                meta = {
                    'before': envelope.get('before'),
                    'after': envelope.get('after'),
                    'ip': envelope.get('ip'),
                    'userAgent': envelope.get('user_agent'),
                }
            else:
                # JSON-decoded but not a dict — treat as raw text.
                note_text = raw_notes
        except (ValueError, TypeError):
            # Pre-Phase-2 free-form note string.
            note_text = raw_notes

    admin_role = (admin.role.lower() if admin and admin.role else None)

    return {
        'id': log.id,
        'adminUserId': log.admin_user_id,
        'adminName': admin.name if admin else 'Unknown',
        'adminRole': admin_role,
        'action': log.action,
        'target': log.target,
        'category': log.category,
        # Phase 3 task 8.2 — split envelope into human-readable `notes`
        # and structured `meta`.
        'notes': note_text,
        'meta': meta,
        'timestamp': _dt(log.created_at),
        'locationId': org_id,
        'locationName': org_name or 'Global',
    }


def _serialize_reward_log(rd):
    """RewardRedemption → frontend REWARDS_LOGS[] shape.

    Phase 3 task 8.2 additions (per `docs/model-ui-alignment.md` §8):
      - `timestamp` — derived as `claimed_at or redeemed_at` so the page
        can read a single canonical event time without falling back
        through multiple keys. Both `redeemedAt` and `claimedAt` remain
        on the response for finer-grained detail.

    Enum normalization (Requirement 3.6): `status` is one of
    `pending | claimed | used | expired` per the ERD; the model column
    is lowercase already. Coerce defensively so any uppercased legacy
    rows round-trip as their canonical lowercase values.
    """
    wallet = rd.wallet
    user = wallet.user if wallet else None
    variant = rd.variant
    reward = variant.reward if variant else None
    org_id = reward.organization_id if reward else None
    org = reward.organization if reward else None

    status_value = (rd.status or '').lower() or None

    # `timestamp` mirrors the page's expectation: prefer the claim event
    # if it has fired; otherwise the original redemption time.
    timestamp = _dt(rd.claimed_at) or _dt(rd.redeemed_at)

    return {
        'id': rd.id,
        'walletId': rd.wallet_id,
        'variantId': rd.variant_id,
        'rewardId': reward.id if reward else None,
        'userName': user.name if user else 'Unknown',
        'userEmail': user.email if user else None,
        'rewardName': reward.name if reward else 'Unknown',
        'variantName': variant.variety_name if variant else None,
        'pointsSpent': rd.points_spent,
        'status': status_value,
        'redemptionCode': rd.redemption_code,
        'redeemedAt': _dt(rd.redeemed_at),
        'claimedAt': _dt(rd.claimed_at),
        # Phase 3 task 8.2 — alignment-doc §8 derived fields.
        # `timestamp` — canonical event time (prefer claim, fall back to redeem).
        'timestamp': timestamp,
        # `usedAt` — synonym for `claimedAt` (the model has no separate
        # `used_at` column; the controller stamps `claimed_at` when a
        # redemption transitions `pending → claimed`). The page's
        # status-update response handler reads `usedAt`; Phase 3 task 8.3
        # will rename the page reference to `claimedAt` instead, but we
        # expose the synonym here so both keys are available during the
        # transition window.
        'usedAt': _dt(rd.claimed_at),
        'locationId': org_id,
        'locationName': org.name if org else None,
    }


# ══════════════════════════════════════════════════════════════════════════
# HELPER: location scoping
# ══════════════════════════════════════════════════════════════════════════

def _scope_location_id(current_user):
    """Return the location_id to filter by.
    - Super admins: use ?location_id query param (or None = all).
    - Other admins: forced to their own org.
    """
    if current_user.role == 'superadmin':
        loc = request.args.get('location_id', type=int)
        return loc
    return get_user_org_id(current_user)


# ══════════════════════════════════════════════════════════════════════════
# AUDIT LOG  (Phase 2 / Task 6.8 — Requirement 2.8, 7.2, 7.3)
# ══════════════════════════════════════════════════════════════════════════

def _stringify_target(target):
    """Render an audit-log `target` value as a short identifying string.

    Accepts None (returns None), a plain string (returned as-is), or any
    SQLAlchemy model that exposes one of `name`, `display_id`, or `id`.
    Falls back to `repr()` for unrecognized objects.
    """
    if target is None:
        return None
    if isinstance(target, str):
        return target
    name = getattr(target, 'name', None)
    if name:
        return str(name)
    display_id = getattr(target, 'display_id', None)
    if display_id:
        return str(display_id)
    obj_id = getattr(target, 'id', None)
    if obj_id is not None:
        return f"{type(target).__name__}#{obj_id}"
    return repr(target)


def log_action(actor, action, target=None, before=None, after=None,
               category=None, notes=None):
    """Phase 2 / Task 6.8 audit-log helper (Requirement 2.8, 7.2, 7.3).

    Writes one `AdminLog` row capturing:
      - `actor_user_id` (mapped to the `admin_user_id` column)
      - `action`
      - `target`              (string, derived from `target` arg)
      - `category`
      - `before_json` / `after_json`   (structured snapshots)
      - `ip`                  (request.remote_addr)
      - `user_agent`          (User-Agent request header)
      - `notes`               (free-form human-readable note)
      - ISO-8601 `created_at` (model default)

    Per the design (`design.md` → "AdminLog (existing)"), the schema
    currently lacks dedicated columns for `before_json`, `after_json`,
    `ip`, and `user_agent`. Until a Phase 4 migration adds them, the
    structured payload is JSON-encoded into the `notes` column under a
    stable envelope so audit rows remain machine-parseable.
    The columns that ALREADY exist on AdminLog (`admin_user_id`,
    `action`, `target`, `category`, `created_at`) are NOT duplicated
    into the envelope.

    TODO(phase4-audit-split): Add columns `before_json` (JSON),
    `after_json` (JSON), `ip` (String(50)), `user_agent` (String(500))
    to `AdminLog` via a Flask-Migrate revision, then split this envelope
    back out into typed columns and restore `notes` to a free-form text
    column. See `tasks.md` task 6.8 and `design.md` "AdminLog" section.

    The helper calls `db.session.add(log)` but does NOT commit — the
    calling handler is responsible for committing as part of its own
    transactional unit (so a successful mutation and its audit row
    commit atomically, and a failed mutation rolls back the audit row
    too).

    Parameters
    ----------
    actor:
        The acting user (typically `current_user` from `@token_required`).
        `actor.id` is written to `admin_user_id`. May be None for
        system-initiated actions (no actor logged in).
    action:
        Short machine-readable action code (e.g. `"role_hierarchy_violation"`,
        `"permission_denied"`, `"User Created"`).
    target:
        Optional. The entity being acted upon. Accepts a string, an ORM
        instance, or None. ORM instances are stringified via
        `_stringify_target`.
    before / after:
        Optional dicts (or any JSON-serializable value) capturing the
        pre/post state. Both default to None which is encoded as JSON
        `null`. Use this to record "what changed" semantics on mutating
        actions (e.g. `before={'role': 'user'}, after={'role': 'auditor'}`).
    category:
        Optional permission/audit category (e.g. `"users"`, `"settings"`).
    notes:
        Optional free-form human-readable note. Stored inside the JSON
        envelope until the Phase 4 column split lands.
    """
    # Lazy imports keep this helper safe from circular-import flakiness:
    # `middleware.permission_required` calls back into this function, and
    # any module-level `from flask import request` would otherwise be
    # evaluated even when the module is imported during an import cycle.
    from flask import request, has_request_context
    import json as _json
    from ..models import AdminLog

    ip = ''
    user_agent = ''
    if has_request_context():
        try:
            ip = request.remote_addr or ''
        except RuntimeError:
            ip = ''
        try:
            user_agent = request.headers.get('User-Agent', '') or ''
        except RuntimeError:
            user_agent = ''

    target_str = _stringify_target(target)

    # Envelope holds ONLY the fields without a dedicated column.
    # `default=str` lets datetimes / decimals serialize predictably.
    envelope = {
        'before': before,
        'after': after,
        'ip': ip,
        'user_agent': user_agent,
        'notes': notes,
    }
    notes_payload = _json.dumps(envelope, default=str, sort_keys=True)

    log = AdminLog(
        admin_user_id=getattr(actor, 'id', None),
        action=action,
        target=target_str,
        category=category,
        notes=notes_payload,
    )
    db.session.add(log)
    return log


def _log_action(user, action, target=None, category=None, notes=None):
    """Legacy audit-log helper retained for backward compatibility.

    Delegates to `log_action` (Phase 2 / Task 6.8) so every audit row —
    regardless of which controller wrote it — uses the same structured
    `notes` envelope. Pre-Phase-2 callers that pass only positional
    `(user, action, target, category, notes)` continue to work; the
    `before` / `after` snapshots simply default to None.
    """
    return log_action(
        user,
        action,
        target=target,
        before=None,
        after=None,
        category=category,
        notes=notes,
    )


def _paginate(query, default_limit=50, max_limit=200):
    """Apply pagination to a query. Reads ?page= and ?per_page= from request args.
    Returns (items, pagination_meta).
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', default_limit, type=int)
    per_page = min(per_page, max_limit)
    if page < 1:
        page = 1

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, {
        'page': page,
        'perPage': per_page,
        'total': total,
        'totalPages': (total + per_page - 1) // per_page,
    }
