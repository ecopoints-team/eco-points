# ERD Field Relocation + User-Form Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `educational_level` onto `community_groups`, keep `year_level` on `users` (Option B), drop `group_type`, simplify the Add User / signup forms to `user type → community group (+ student-only year level)`, auto-assign non-students to a default group, and lock organization types to a fixed set of three (University, Corporate, Community) with the custom org-type add/edit/delete feature removed.

**Architecture:** A community group now carries its educational level (a group *is* a College/SHS/etc. cohort), so the user form no longer asks for educational level — it's implied by the chosen group. `year_level` stays on the user because it changes yearly and would otherwise force annual re-grouping. Org-type management collapses to three fixed values, removing the dynamic CRUD added in earlier phases.

**Tech Stack:** Flask + SQLAlchemy + Flask-Migrate (Alembic), Pydantic v2 schemas, Next.js/React admin modals, pytest + Hypothesis.

**Decision record:** Option B chosen (educational_level on group, year_level on user) to avoid annual re-grouping and group explosion. Custom org-type CRUD intentionally removed (reverses Phase 10.4/10.5 work).

---

## Background the engineer needs

Current state (verified):
- `CommunityGroup` (`server/app/models.py`) has: `name`, `abbreviation`, `group_type` (nullable). It does NOT have `educational_level`.
- `User` (`server/app/models.py`) has: `user_type`, `educational_level`, `year_level` (all nullable).
- Target after this change:
  - `CommunityGroup`: `name`, `abbreviation`, **`educational_level`** (new). **`group_type` removed.**
  - `User`: `user_type`, **`year_level`** (kept). **`educational_level` removed.**
- Pydantic schemas live in `server/app/schemas/__init__.py`:
  - `UserCreateSchema`, `UserUpdateSchema`, `RegisterSchema` carry `educationalLevel`, `yearLevel`, `communityGroupId`.
  - `GroupCreateSchema`, `GroupUpdateSchema` carry `groupType`.
- `group_type` is referenced in **~12 test files** as a `CommunityGroup(... group_type='staff')` constructor kwarg. Dropping the column makes those constructors raise `TypeError`. They must all be swept.
- Org-type CRUD endpoints live in `server/app/controllers/locations_controller.py` (`POST/PUT/DELETE /org-types`). Earlier phases (10.4/10.5) added create/edit/delete + UI buttons.
- Tests run from `server/` with `python -m pytest`. `server/pytest.ini` scopes collection to `tests/`.

> ⚠️ This is a schema change against a shared Supabase DB. Take a backup first (`docs/runbooks/db-backup-restore.md`). The migration includes a data step to preserve existing values.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `server/migrations/versions/<rev>_erd_field_relocation.py` | DB migration: group gains `educational_level`, drops `group_type`; user drops `educational_level` | Create |
| `server/app/models.py` | `CommunityGroup` + `User` column changes | Modify |
| `server/app/schemas/__init__.py` | swap `groupType`→`educationalLevel` on group schemas; drop `educationalLevel` from user/register schemas | Modify |
| `server/app/controllers/groups_controller.py` | group create/update/serialize use `educational_level` | Modify |
| `server/app/controllers/locations_controller.py` | community-group bulk create uses `educational_level`; remove org-type CRUD endpoints | Modify |
| `server/app/controllers/users_controller.py` | drop `educational_level`; auto-assign default group for non-students | Modify |
| `server/app/controllers/auth_controller.py` | signup (register) mirrors user-create logic | Modify |
| `server/app/seeder/seed.py` + `demo_seed.py` | stop passing `group_type`; set `educational_level` | Modify |
| `server/tests/**` | sweep `group_type=` fixtures; update strict-acceptance + smoke | Modify |
| `client/app/admin/locations/page.js` | community-group table: Educ Level column (university), no group type; lock org types; remove add/edit/delete org-type buttons | Modify |
| `client/src/components/admin/AddRegularUserModal.jsx` (+ Edit User modal) | remove educational-level field; year level student-only; auto-assign non-students | Modify |
| `client/src/components/pages/LogIn.jsx` | signup side mirrors Add User | Modify |
| `client/src/services/api/{users,locations,groups}.js` | field renames | Modify |
| `ERD.md` | reflect the moved/removed columns | Modify |

---

## Phase 1 — Backend schema & migration

### Task 1: Update the `CommunityGroup` and `User` models

**Files:**
- Modify: `server/app/models.py`

- [ ] **Step 1: Update `CommunityGroup`**

Replace the `group_type` column and docstring:

```python
class CommunityGroup(db.Model):
    """
    Dynamic sub-groups for user classification (e.g. BSIT, STEM, IT Dept).

    A group carries its educational_level so the user form does not need to
    ask for it — selecting the group implies the level. year_level lives on
    the User (it changes yearly).

    educational_level values (University org type only):
      Kindergarten, Elementary, JHS, SHS, College. NULL for Corporate/Community.
    """
    __tablename__ = 'community_groups'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'),
                                nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    abbreviation = db.Column(db.String(50))
    educational_level = db.Column(db.String(30), nullable=True)   # Kindergarten, Elementary, JHS, SHS, College
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    users = db.relationship('User', backref='community_group', lazy=True)

    def __repr__(self):
        return f'<CommunityGroup {self.abbreviation or self.name}>'
```

- [ ] **Step 2: Update `User` — remove `educational_level`, keep `year_level`**

In the `User` model, delete the `educational_level` column line:

```python
    user_type = db.Column(db.String(30), nullable=True)           # student, alumni, faculty, staff, resident, employee, etc.
    year_level = db.Column(db.String(30), nullable=True)          # e.g. Grade 11, 3rd Year (student-only)
```

(Remove the `educational_level = db.Column(...)` line entirely.)

- [ ] **Step 3: Commit**

```bash
git add server/app/models.py
git commit -m "model: move educational_level to community_groups, drop group_type, keep year_level on user"
```

---

### Task 2: Create the Alembic migration

**Files:**
- Create: `server/migrations/versions/<rev>_erd_field_relocation.py`

- [ ] **Step 1: Generate the migration skeleton**

Run (from `server/`): `flask db migrate -m "erd field relocation"`
Expected: a new file under `server/migrations/versions/`. Open it and REPLACE the `upgrade`/`downgrade` bodies with the explicit, data-preserving version in Step 2 (autogenerate may not order the data copy correctly).

- [ ] **Step 2: Write explicit upgrade/downgrade**

```python
def upgrade():
    # 1. Add educational_level to community_groups
    with op.batch_alter_table('community_groups', schema=None) as batch_op:
        batch_op.add_column(sa.Column('educational_level', sa.String(length=30), nullable=True))

    # 2. Best-effort data preservation: copy each user's educational_level
    #    onto their community group (last writer wins; groups are cohorts).
    op.execute("""
        UPDATE community_groups cg
        SET educational_level = sub.educational_level
        FROM (
            SELECT community_group_id, MAX(educational_level) AS educational_level
            FROM users
            WHERE educational_level IS NOT NULL
            GROUP BY community_group_id
        ) sub
        WHERE cg.id = sub.community_group_id
    """)

    # 3. Drop group_type from community_groups
    with op.batch_alter_table('community_groups', schema=None) as batch_op:
        batch_op.drop_column('group_type')

    # 4. Drop educational_level from users (year_level stays)
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('educational_level')


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('educational_level', sa.String(length=30), nullable=True))
    with op.batch_alter_table('community_groups', schema=None) as batch_op:
        batch_op.add_column(sa.Column('group_type', sa.String(length=50), nullable=True))
    # Best-effort reverse data copy
    op.execute("""
        UPDATE users u
        SET educational_level = cg.educational_level
        FROM community_groups cg
        WHERE u.community_group_id = cg.id AND cg.educational_level IS NOT NULL
    """)
    with op.batch_alter_table('community_groups', schema=None) as batch_op:
        batch_op.drop_column('educational_level')
```

- [ ] **Step 3: Apply locally against a test DB and verify round-trip**

Run (from `server/`): `flask db upgrade`
Expected: completes without error.
Run: `flask db downgrade -1` then `flask db upgrade`
Expected: both succeed (proves reversibility). Then leave the DB upgraded.

- [ ] **Step 4: Commit**

```bash
git add server/migrations/versions/
git commit -m "migration: relocate educational_level to community_groups, drop group_type + users.educational_level"
```

---

### Task 3: Update Pydantic schemas

**Files:**
- Modify: `server/app/schemas/__init__.py`

- [ ] **Step 1: Group schemas — replace `groupType` with `educationalLevel`**

In `GroupCreateSchema` and `GroupUpdateSchema`, and in the two community-group sub-schemas around lines 332 and 361, replace every `groupType: Optional[str] = None` with:

```python
    educationalLevel: Optional[str] = None
```

- [ ] **Step 2: User/register schemas — drop `educationalLevel`**

In `UserCreateSchema`, `UserUpdateSchema`, and `RegisterSchema`, delete the line:

```python
    educationalLevel: Optional[str] = None
```

Keep `yearLevel` and `communityGroupId`.

- [ ] **Step 3: Commit**

```bash
git add server/app/schemas/__init__.py
git commit -m "schemas: educationalLevel on group schemas, drop from user/register schemas"
```

---

## Phase 2 — Backend controllers & serializers

### Task 4: Update groups controller

**Files:**
- Modify: `server/app/controllers/groups_controller.py`

- [ ] **Step 1: Read the file** to find the group serializer and the create/update handlers.

Run: open `server/app/controllers/groups_controller.py`.

- [ ] **Step 2: Replace `group_type`/`groupType` with `educational_level`/`educationalLevel`**

In the serializer dict, change `'groupType': g.group_type` → `'educationalLevel': g.educational_level`.
In create: `group_type=payload.groupType` → `educational_level=payload.educationalLevel`.
In update: `if payload.groupType is not None: group.group_type = ...` → `if payload.educationalLevel is not None: group.educational_level = payload.educationalLevel`.

- [ ] **Step 3: Verify no `group_type` references remain**

Run (from `server/`): `python -m pytest tests/property/test_strict_acceptance.py -q -k groups`
(It will fail until Task 9 updates the test bodies — that's expected; this step just confirms the controller imports cleanly.)
Run: `python -c "import app.controllers.groups_controller"` (from `server/`) → Expected: no ImportError.

- [ ] **Step 4: Commit**

```bash
git add server/app/controllers/groups_controller.py
git commit -m "groups: serialize/accept educationalLevel instead of groupType"
```

### Task 5: Update locations controller (community-group bulk create + remove org-type CRUD)

**Files:**
- Modify: `server/app/controllers/locations_controller.py`

- [ ] **Step 1: Community-group bulk create uses `educational_level`**

Where `POST /locations` creates `CommunityGroup` rows from the `communityGroups` array, change the per-group field from `group_type=g.get('groupType')` to `educational_level=g.get('educationalLevel')`.

- [ ] **Step 2: Remove org-type create/edit/delete endpoints**

Delete the `POST /org-types`, `PUT /org-types/<id>`, and `DELETE /org-types/<id>` route handlers (added in Phase 10.4/10.5). Keep any `GET /org-types` listing endpoint if present. Remove now-unused imports/schemas they referenced.

- [ ] **Step 3: Seed the three fixed org types**

Ensure `University`, `Corporate`, `Community` exist. Add this idempotent helper called during app/seed init (or confirm the seeder creates them — see Task 8):

```python
FIXED_ORG_TYPES = ('University', 'Corporate', 'Community')
```

- [ ] **Step 4: Verify import**

Run (from `server/`): `python -c "import app.controllers.locations_controller"` → Expected: no error.

- [ ] **Step 5: Commit**

```bash
git add server/app/controllers/locations_controller.py
git commit -m "locations: community groups use educationalLevel; remove org-type CRUD (fixed to 3 types)"
```

### Task 6: Update users controller (serializer + non-student auto-assign)

**Files:**
- Modify: `server/app/controllers/users_controller.py`

- [ ] **Step 1: Read the file** to find `_serialize_user`, `create_user`, `update_user`.

- [ ] **Step 2: Remove `educationalLevel` from the serializer and writes**

In `_serialize_user`, remove the `'educationalLevel': u.educational_level` key (keep `'yearLevel': u.year_level`).
In create/update, remove any `educational_level=payload.educationalLevel` / `user.educational_level = ...` lines. Keep `year_level` and `community_group_id`.

- [ ] **Step 3: Auto-assign non-students to the default community group (University)**

In `create_user`, after resolving the location/org, add:

```python
    # University org type: alumni / faculty / staff are not part of a course
    # cohort — assign them to the org's default community group automatically.
    NON_STUDENT_AUTO = {'alumni', 'faculty', 'staff'}
    if not payload.communityGroupId and (payload.userType or '').lower() in NON_STUDENT_AUTO:
        default_group = CommunityGroup.query.filter_by(
            organization_id=loc_id
        ).order_by(CommunityGroup.id.asc()).first()
        if default_group:
            community_group_id = default_group.id
```

(Use the existing variable names in the file; `loc_id`/`community_group_id` shown for illustration — match the file's locals.)

- [ ] **Step 4: Verify import**

Run (from `server/`): `python -c "import app.controllers.users_controller"` → Expected: no error.

- [ ] **Step 5: Commit**

```bash
git add server/app/controllers/users_controller.py
git commit -m "users: drop educationalLevel; auto-assign non-students to default group"
```

### Task 7: Mirror the changes in signup (auth_controller register)

**Files:**
- Modify: `server/app/controllers/auth_controller.py`

- [ ] **Step 1: In `register`, remove `educational_level` handling**

Remove any `educational_level=payload.educationalLevel` from the `User(...)` construction. Keep `year_level` and the community-group resolution. Apply the same non-student auto-assign logic as Task 6 Step 3 if the signup form allows non-student types.

- [ ] **Step 2: Verify import + run the auth suite**

Run (from `server/`): `python -m pytest tests/property/test_phase4b_cookie_csrf.py tests/property/test_phase4g_password_policy.py -q`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server/app/controllers/auth_controller.py
git commit -m "auth: register no longer sets educational_level"
```

---

## Phase 3 — Seeder & test sweep

### Task 8: Update seeders

**Files:**
- Modify: `server/app/seeder/seed.py`, `server/app/seeder/demo_seed.py`

- [ ] **Step 1: Remove `group_type` from seed `CommunityGroup(...)` calls**

In `seed.py` `_get_or_create_community_group`, delete `group_type='staff'`. Optionally set `educational_level=None` (default). Ensure the three fixed org types are created (`University`, `Corporate`, `Community`) if the seeder creates org types.

- [ ] **Step 2: Same for `demo_seed.py`** — remove any `group_type=` kwargs; set `educational_level` where a level is meaningful (e.g. `'College'`).

- [ ] **Step 3: Run the seed against the local test DB**

Run (from `server/`): `python -m pytest tests/property/test_phase5_seed.py -q`
Expected: PASS after Step 4's fixture update — if it references `group_type`, fix there.

- [ ] **Step 4: Commit**

```bash
git add server/app/seeder/
git commit -m "seed: drop group_type, set educational_level on groups"
```

### Task 9: Sweep `group_type` out of all test fixtures

**Files (all under `server/tests/`):** `unit/test_users_role_hierarchy.py`, `unit/test_redemption_claim_log.py`, `smoke/test_points_config_scope.py`, `smoke/test_admin_smoke.py`, `property/test_strict_acceptance.py`, `property/test_phase5_seed.py`, `property/test_phase4h_hierarchy_update.py`, `property/test_phase4g_password_policy.py`, `property/test_phase4e_validation.py`, `property/test_phase4c_force_logout.py`, `property/test_phase4b_cookie_csrf.py`, `property/test_audit_completeness.py`

- [ ] **Step 1: Replace constructor kwargs**

In every `CommunityGroup(... group_type='X' ...)`, delete the `group_type='X',` argument. (These groups don't need an educational level for the test to pass.)

- [ ] **Step 2: Fix `test_admin_smoke.py` group-record assertion**

Change the asserted key from `'groupType'` to `'educationalLevel'` (the serializer key) and the CRUD create body `'groupType': 'staff'` → `'educationalLevel': 'College'`.

- [ ] **Step 3: Fix `test_strict_acceptance.py`**

- `_groups_create_body`: `'groupType': 'college'` → `'educationalLevel': 'College'`.
- The groups POST/PUT accepted-keys frozensets: `'groupType'` → `'educationalLevel'`.
- The users create/update accepted-keys frozensets: remove `'educationalLevel'` (keep `'yearLevel'`, `'communityGroupId'`).
- If a `_users_create_body`/`_users_update_body` sets `educationalLevel`, remove that key.

- [ ] **Step 4: Run the full suite**

Run (from `server/`): `python -m pytest -m "not integration" -q`
Expected: all PASS. Fix any remaining `group_type`/`educationalLevel` references the run surfaces.

- [ ] **Step 5: Commit**

```bash
git add server/tests/
git commit -m "tests: sweep group_type fixtures; align group/user schemas to educationalLevel"
```

---

## Phase 4 — Frontend

> Frontend tasks edit existing components. Read each file first, then apply the described change, keeping the file's existing styling/patterns.

### Task 10: API service field renames

**Files:**
- Modify: `client/src/services/api/groups.js`, `client/src/services/api/locations.js`, `client/src/services/api/users.js`

- [ ] **Step 1:** In group create/update payloads, rename `groupType` → `educationalLevel`. In the location community-groups payload, rename each group's `groupType` → `educationalLevel`. In user create/update payloads, remove `educationalLevel` (keep `yearLevel`, `communityGroupId`).
- [ ] **Step 2: Commit**
```bash
git add client/src/services/api/
git commit -m "client api: educationalLevel on group payloads, drop from user payloads"
```

### Task 11: Add/Edit Location modal — community-group fields + org-type lock

**Files:**
- Modify: `client/app/admin/locations/page.js`

- [ ] **Step 1:** In the inline community-groups table, replace the `groupType` input with an **Educational Level** dropdown (Kindergarten, Elementary, JHS, SHS, College) shown **only when the selected org type is University**. For Corporate/Community, show only Name + Abbreviation.
- [ ] **Step 2:** Lock the org-type field to the three fixed values (University, Corporate, Community) and **remove the add/edit/delete buttons** on the org-type dropdown (reverts Phase 10.5 UI).
- [ ] **Step 3:** Update the CSV import template + helper modal: University template columns = `name, abbreviation, educational_level`; Corporate/Community template columns = `name, abbreviation`.
- [ ] **Step 4: Commit**
```bash
git add client/app/admin/locations/page.js
git commit -m "locations UI: educational level on university groups, fixed org types, per-type import templates"
```

### Task 12: Add/Edit User modal — simplified cascade

**Files:**
- Modify: `client/src/components/admin/AddRegularUserModal.jsx` and the Edit User modal component

- [ ] **Step 1:** Remove the Educational Level field/step entirely.
- [ ] **Step 2:** New cascade after Location: `User Type` → then:
  - **University + Student:** Community Group dropdown, then a **Year Level** dropdown whose options derive from the selected group's `educationalLevel` (Kindergarten → none; Elementary → 1–6; JHS → Grade 7–10; SHS → Grade 11–12; College → 1st–5th Year).
  - **University + Alumni/Faculty/Staff:** hide the Community Group field and Year Level (backend auto-assigns the default group).
  - **Corporate/Community:** Community Group dropdown only (no year level, no educational level).
- [ ] **Step 3:** Submit payload: include `communityGroupId` and (student-only) `yearLevel`; never send `educationalLevel`.
- [ ] **Step 4: Commit**
```bash
git add client/src/components/admin/AddRegularUserModal.jsx
git commit -m "user modal: drop educational level; year level student-only; auto-assign non-students"
```

### Task 13: Signup side of the login modal

**Files:**
- Modify: `client/src/components/pages/LogIn.jsx`

- [ ] **Step 1:** Mirror Task 12's field flow on the sign-up form (user type → community group → student-only year level; no educational level).
- [ ] **Step 2: Commit**
```bash
git add client/src/components/pages/LogIn.jsx
git commit -m "signup: mirror simplified Add User field flow"
```

---

## Phase 5 — Docs & verification

### Task 14: Update ERD.md

**Files:**
- Modify: `ERD.md`

- [ ] **Step 1:** In `COMMUNITY_GROUPS`: remove `group_type`, add `string educational_level "Nullable - Kindergarten, Elementary, JHS, SHS, College"`. In `USERS`: remove `educational_level` (keep `year_level`).
- [ ] **Step 2: Commit**
```bash
git add ERD.md
git commit -m "docs: ERD reflects educational_level on community group, year_level on user"
```

### Task 15: Full verification

- [ ] **Step 1: Server suite**

Run (from `server/`): `python -m pytest -m "not integration" -q`
Expected: all PASS, 0 failures.

- [ ] **Step 2: Client suite + build**

Run (from `client/`): `npm test` then `npm run build`
Expected: both pass.

- [ ] **Step 3: Manual smoke**

Start both servers. Create a University location with a College community group (BSIT). Add a Student user → confirm form asks user type → community group → year level (no educational level). Add a Faculty user → confirm no community-group field and it lands in the default group. Confirm org-type field has no add button.

- [ ] **Step 4: Push branch + open PR (after your approval)**

```bash
git push -u origin cleanup/erd-field-relocation
```

---

## Self-Review

**1. Spec coverage (Part 7 notes, under Option B):**
- Move educational_level to group, keep year_level on user → Tasks 1, 2. ✅
- Remove group_type → Tasks 1, 2, 9. ✅
- Community group fields Name/Abbrev/Educ Level (university) → Tasks 3, 4, 5, 11. ✅
- User/signup form: after location → user type + community group (+ student year level), no educational level → Tasks 6, 7, 12, 13. ✅
- Non-students (alumni/faculty/staff) auto default group, no group field → Tasks 6, 12. ✅
- Lock to 3 org types, remove add button → Tasks 5, 11. ✅
- Per-type import templates → Task 11. ✅

**2. Placeholder scan:** Backend code steps are concrete. Frontend steps describe exact files + the precise field transformation (acceptable for editing existing large components; literal final JSX is produced against the live file during execution). No "TBD"/"handle edge cases".

**3. Type/name consistency:** `educational_level` (DB) ↔ `educationalLevel` (JSON/schema) used consistently; `year_level` ↔ `yearLevel` kept; `group_type`/`groupType` removed everywhere. Migration up/down columns match the model changes (group +educational_level −group_type; user −educational_level).

---

## Risks
- **Shared DB migration** — back up first; the data-copy step is best-effort (groups inherit the most common member educational_level).
- **Org-type CRUD removal** reverses shipped Phase 10.4/10.5 work — intentional per decision record.
- **`group_type` test sweep** touches ~12 files — CI will catch any missed reference.
