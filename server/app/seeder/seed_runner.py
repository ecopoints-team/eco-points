"""
Database seeder for EcoPoints — generates realistic sample data.

Inserts rows in FK-safe order across all 16 tables, with timestamps
spread over the last 90 days and consistent point-balance ledgers.

Large profile:
  ~208 users · 15 RVMs · ~600 sessions · ~1 800 items · ~700 transactions
"""

import random
import uuid
import string
from datetime import datetime, timedelta, timezone, date as date_type

from .. import db
from ..models import (
    OrgType, City, Organization, CommunityGroup, Account, User,
    AccessCredential, RVM, RecyclingSession, RecyclingItem,
    MaintenanceLog, Transaction, Reward, RewardRedemption, AdminLog,
)
from . import seed_data as D


# ── Module-level state (reset on each run) ──────────────────────────────
_emails: set = set()
_usernames: set = set()
_redeem_codes: set = set()
_balances: dict = {}           # account_id → running points balance

DAYS_BACK = 90


# ══════════════════════════════════════════════════════════════════════════
# UTILITY HELPERS
# ══════════════════════════════════════════════════════════════════════════

def _ts(days_max=DAYS_BACK):
    """Random UTC timestamp, biased toward recent dates, during business hours."""
    days = int((random.random() ** 0.5) * days_max)
    hour = random.choices(
        range(7, 21),
        weights=[1, 2, 4, 5, 5, 5, 5, 4, 3, 2, 2, 1, 1, 1],
        k=1,
    )[0]
    base = datetime.now(timezone.utc) - timedelta(days=days)
    return base.replace(
        hour=hour,
        minute=random.randint(0, 59),
        second=random.randint(0, 59),
        microsecond=0,
    )


def _name():
    """Random Filipino full name."""
    pool = D.FIRST_NAMES_MALE + D.FIRST_NAMES_FEMALE
    return f'{random.choice(pool)} {random.choice(D.LAST_NAMES)}'


def _email(name):
    """Generate a unique email from a person's name."""
    base = name.lower().replace(' ', '.').replace("'", '')
    for dom in D.EMAIL_DOMAINS:
        candidate = f'{base}@{dom}'
        if candidate not in _emails:
            _emails.add(candidate)
            return candidate
    # Fallback with random suffix
    candidate = f'{base}{random.randint(1, 9999)}@{random.choice(D.EMAIL_DOMAINS)}'
    _emails.add(candidate)
    return candidate


def _username(name):
    """Generate a unique username (first-initial + last-name)."""
    parts = name.lower().replace("'", '').split()
    base = (parts[0][0] + parts[-1]) if len(parts) > 1 else parts[0]
    base = base.replace(' ', '')
    attempt = base
    i = 1
    while attempt in _usernames:
        attempt = f'{base}{i}'
        i += 1
    _usernames.add(attempt)
    return attempt


def _redeem_code():
    """Generate a unique ECO-XXXXXXXX redemption code."""
    while True:
        code = 'ECO-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        if code not in _redeem_codes:
            _redeem_codes.add(code)
            return code


def _earn(account_id, amount, description, ref_id, ts):
    """Create an *earn* transaction and update the running balance."""
    before = _balances.get(account_id, 0)
    after = before + amount
    _balances[account_id] = after
    return Transaction(
        account_id=account_id,
        transaction_type='earn',
        amount=amount,
        balance_before=before,
        balance_after=after,
        description=description,
        reference_id=str(ref_id),
        created_at=ts,
    )


def _spend(account_id, amount, description, ref_id, ts):
    """Create a *redeem* transaction and update the running balance."""
    before = _balances.get(account_id, 0)
    after = before - amount
    _balances[account_id] = after
    return Transaction(
        account_id=account_id,
        transaction_type='redeem',
        amount=-amount,
        balance_before=before,
        balance_after=after,
        description=description,
        reference_id=str(ref_id),
        created_at=ts,
    )


# ══════════════════════════════════════════════════════════════════════════
# TRUNCATE (for --fresh)
# ══════════════════════════════════════════════════════════════════════════

# Reverse-FK-safe deletion order
_TABLE_ORDER = [
    AdminLog, RewardRedemption, Transaction, Reward,
    MaintenanceLog, RecyclingItem, RecyclingSession,
    AccessCredential, User, Account,
    RVM, CommunityGroup, Organization, City, OrgType,
]


def _truncate_all():
    """Delete all rows from every table (keeps schema intact)."""
    print('  Truncating all tables …')
    for model in _TABLE_ORDER:
        db.session.query(model).delete()
    db.session.commit()
    print('  Done.\n')


def _is_empty():
    """True when the organizations table has zero rows."""
    return Organization.query.first() is None


# ══════════════════════════════════════════════════════════════════════════
# STEP 1 – Org Types
# ══════════════════════════════════════════════════════════════════════════

def _seed_org_types():
    print('  [1/14] org_types')
    objs = []
    for name in D.ORG_TYPE_NAMES:
        ot = OrgType(name=name)
        db.session.add(ot)
        objs.append(ot)
    db.session.flush()
    return {ot.name: ot for ot in objs}


# ══════════════════════════════════════════════════════════════════════════
# STEP 2 – Cities
# ══════════════════════════════════════════════════════════════════════════

def _seed_cities():
    print('  [2/14] cities')
    objs = []
    for name, prov, region in D.CITY_DEFS:
        c = City(name=name, province=prov, region=region)
        db.session.add(c)
        objs.append(c)
    db.session.flush()
    return {c.name: c for c in objs}


# ══════════════════════════════════════════════════════════════════════════
# STEP 3 – Organizations
# ══════════════════════════════════════════════════════════════════════════

def _seed_organizations(ot_map, city_map):
    print('  [3/14] organizations')
    orgs = []
    for d in D.ORG_DEFS:
        ot = ot_map.get(d['org_type'])
        city = city_map.get(d['city'])
        org = Organization(
            name=d['name'],
            full_name=d['full_name'],
            org_type=d['org_type'],
            org_type_id=ot.id if ot else None,
            street_address=d['street_address'],
            barangay=d['barangay'],
            city_id=city.id if city else None,
            zip_code=d['zip_code'],
            contact_person=d['contact_person'],
            contact_email=d['contact_email'],
            contact_phone=d['contact_phone'],
            status='Active',
            join_date=date_type.today() - timedelta(days=random.randint(60, 180)),
        )
        db.session.add(org)
        orgs.append((org, d))
    db.session.flush()
    return orgs


# ══════════════════════════════════════════════════════════════════════════
# STEP 4 – Community Groups
# ══════════════════════════════════════════════════════════════════════════

def _seed_groups(orgs):
    print('  [4/14] community_groups')
    org_groups = {}  # org.id → [CommunityGroup, …]
    for org, d in orgs:
        groups = []
        for gname, abbr, gtype in d['groups']:
            cg = CommunityGroup(
                organization_id=org.id,
                name=gname,
                abbreviation=abbr,
                group_type=gtype,
            )
            db.session.add(cg)
            groups.append(cg)
        org_groups[org.id] = groups
    db.session.flush()
    return org_groups


# ══════════════════════════════════════════════════════════════════════════
# STEP 5-6 – Accounts & Users (admins + regulars)
# ══════════════════════════════════════════════════════════════════════════

def _seed_users(orgs, org_groups):
    """Returns (all_regular, admin_users) where all_regular = {org_id: [User]}."""
    print('  [5/14] accounts & users')
    all_regular: dict = {}   # org_id → [User, …]
    admin_users: list = []
    _user_seq: dict = {}     # (prefix, abbrev) → next sequence number

    # Reserve the hard-coded superadmin email
    _emails.add('admin@ecopoints.ph')

    def _did(role, abbrev):
        """Next sequential display_id like USER-AU-001."""
        prefix = User.ROLE_PREFIX.get(role, 'USER')
        key = (prefix, abbrev)
        seq = _user_seq.get(key, 1)
        _user_seq[key] = seq + 1
        return f'{prefix}-{abbrev}-{seq:03d}'

    def _make_admin(role, staff_grp, abbrev, *, name=None, email=None):
        n = name or _name()
        acc = Account(community_group_id=staff_grp.id, account_name=n,
                      points_balance=0, streak=0)
        db.session.add(acc)
        db.session.flush()
        u = User(
            account_id=acc.id,
            display_id=_did(role, abbrev),
            name=n,
            username=_username(n),
            email=email or _email(n),
            role=role,
            user_type=None,
            is_active=True,
            created_at=_ts(120),
        )
        u.set_password('admin123')
        db.session.add(u)
        admin_users.append(u)
        return u

    for idx, (org, d) in enumerate(orgs):
        abbrev = d['abbrev']
        groups = org_groups[org.id]
        staff_grp = next((g for g in groups if g.group_type == 'staff'), groups[0])
        non_staff = [g for g in groups if g.group_type != 'staff']

        # ── Global admins on the first org ──
        if idx == 0:
            _make_admin('superadmin', staff_grp, abbrev,
                        name='System Admin', email='admin@ecopoints.ph')
            _make_admin('auditor', staff_grp, abbrev)
            _make_admin('technician', staff_grp, abbrev)

        # ── Head admin for every org ──
        _make_admin('head_admin', staff_grp, abbrev)

        # ── Regular users ──
        org_type = d['org_type']
        type_pool = (
            D.USER_TYPES_UNIVERSITY if org_type == 'University' else
            D.USER_TYPES_CORPORATE  if org_type == 'Corporation' else
            D.USER_TYPES_BARANGAY
        )
        regulars = []
        for _ in range(d['user_count']):
            uname = _name()
            user_type = random.choice(type_pool)

            # Group assignment
            if user_type in ('staff', 'faculty') or not non_staff:
                grp = staff_grp
            else:
                grp = random.choice(non_staff)

            # Year level (students only)
            year_level = None
            if user_type == 'student':
                if grp.group_type == 'shs_strand':
                    year_level = random.choice(D.YEAR_LEVELS_SHS)
                else:
                    year_level = random.choice(D.YEAR_LEVELS_COLLEGE)

            acc = Account(
                community_group_id=grp.id,
                account_name=uname,
                points_balance=0,
                streak=random.randint(0, 15),
            )
            db.session.add(acc)
            db.session.flush()

            u = User(
                account_id=acc.id,
                display_id=_did('user', abbrev),
                name=uname,
                username=_username(uname),
                email=_email(uname),
                role='user',
                user_type=user_type,
                year_level=year_level,
                is_active=random.random() > 0.05,
                last_login=_ts(30) if random.random() > 0.3 else None,
                created_at=_ts(DAYS_BACK),
            )
            u.set_password('password123')
            db.session.add(u)
            regulars.append(u)
            _balances[acc.id] = 0

        all_regular[org.id] = regulars

    db.session.flush()
    return all_regular, admin_users


# ══════════════════════════════════════════════════════════════════════════
# STEP 7 – Access Credentials
# ══════════════════════════════════════════════════════════════════════════

def _seed_credentials(all_regular):
    print('  [6/14] access_credentials')
    for users in all_regular.values():
        for u in users:
            cred = AccessCredential(
                account_id=u.account_id,
                tag_id=str(uuid.uuid4()),
                credential_type=random.choices(
                    ['qr_code', 'rfid'], weights=[80, 20], k=1
                )[0],
                is_active=u.is_active,
                created_at=u.created_at,
            )
            db.session.add(cred)
    db.session.flush()


# ══════════════════════════════════════════════════════════════════════════
# STEP 8 – RVMs
# ══════════════════════════════════════════════════════════════════════════

def _seed_rvms(orgs):
    print('  [7/14] rvms')
    org_rvms: dict = {}
    for org, d in orgs:
        machines = []
        for rname, rloc in d['rvms']:
            rvm = RVM(
                organization_id=org.id,
                machine_uuid=str(uuid.uuid4()),
                name=rname,
                location_name=rloc,
                is_online=random.random() > 0.15,
                last_heartbeat=_ts(2),
                current_capacity=random.randint(0, 80),
                total_items_collected=0,
                created_at=_ts(120),
            )
            db.session.add(rvm)
            machines.append(rvm)
        org_rvms[org.id] = machines
    db.session.flush()
    return org_rvms


# ══════════════════════════════════════════════════════════════════════════
# STEP 9-10 – Recycling Sessions, Items & Earn Transactions
# ══════════════════════════════════════════════════════════════════════════

def _seed_recycling(all_regular, org_rvms, orgs):
    print('  [8/14] recycling_sessions & recycling_items')
    sess_n = 0
    item_n = 0

    for org, d in orgs:
        users = [u for u in all_regular.get(org.id, []) if u.is_active]
        rvms = org_rvms.get(org.id, [])
        if not users or not rvms:
            continue

        num_sessions = int(len(users) * 3)
        for _ in range(num_sessions):
            user = random.choice(users)
            rvm = random.choice(rvms)
            ts = _ts()

            session = RecyclingSession(
                rvm_id=rvm.id,
                account_id=user.account_id,
                start_time=ts,
                end_time=ts + timedelta(minutes=random.randint(1, 5)),
                total_points_earned=0,
                item_count=0,
                status='completed',
            )
            db.session.add(session)
            db.session.flush()

            n_items = random.randint(1, 5)
            total_pts = 0
            for _ in range(n_items):
                bdef = random.choice(D.BOTTLE_DEFS)
                it, mat, brand, vol, cond, wt, pts = bdef
                item = RecyclingItem(
                    session_id=session.id,
                    item_type=it,
                    material=mat,
                    brand=brand,
                    volume_ml=vol,
                    condition=cond,
                    weight_grams=round(wt + random.uniform(-2, 2), 1),
                    points_awarded=pts,
                    deposited_at=ts + timedelta(seconds=random.randint(10, 180)),
                )
                db.session.add(item)
                total_pts += pts
                item_n += 1

            session.total_points_earned = total_pts
            session.item_count = n_items
            rvm.total_items_collected += n_items

            txn = _earn(user.account_id, total_pts,
                        f'Recycling session #{session.id}', session.id, ts)
            db.session.add(txn)
            sess_n += 1

    db.session.flush()
    print(f'         → {sess_n} sessions, {item_n} items')


# ══════════════════════════════════════════════════════════════════════════
# STEP 11 – Rewards
# ══════════════════════════════════════════════════════════════════════════

def _seed_rewards(orgs):
    print('  [9/14] rewards')
    org_rewards: dict = {}
    for org, d in orgs:
        templates = random.sample(D.REWARD_TEMPLATES,
                                  min(5, len(D.REWARD_TEMPLATES)))
        rewards = []
        for rname, desc, cat, pts, stock in templates:
            r = Reward(
                organization_id=org.id,
                name=rname,
                description=desc,
                category=cat,
                points_required=pts,
                stock_quantity=stock,
                image_url=None,
                is_active=True,
                created_at=_ts(120),
            )
            db.session.add(r)
            rewards.append(r)
        org_rewards[org.id] = rewards
    db.session.flush()
    return org_rewards


# ══════════════════════════════════════════════════════════════════════════
# STEP 12 – Reward Redemptions & Spend Transactions
# ══════════════════════════════════════════════════════════════════════════

def _seed_redemptions(all_regular, org_rewards, orgs):
    print('  [10/14] reward_redemptions')
    count = 0
    for org, d in orgs:
        users = [u for u in all_regular.get(org.id, []) if u.is_active]
        rewards = org_rewards.get(org.id, [])
        if not users or not rewards:
            continue

        redeemers = random.sample(users, max(1, len(users) // 5))
        for user in redeemers:
            balance = _balances.get(user.account_id, 0)
            for _ in range(random.randint(1, 2)):
                affordable = [r for r in rewards if r.points_required <= balance]
                if not affordable:
                    break
                reward = random.choice(affordable)
                ts = _ts(60)

                rd = RewardRedemption(
                    account_id=user.account_id,
                    reward_id=reward.id,
                    points_spent=reward.points_required,
                    status=random.choices(
                        ['claimed', 'pending', 'used', 'expired'],
                        weights=[40, 30, 20, 10], k=1,
                    )[0],
                    redemption_code=_redeem_code(),
                    redeemed_at=ts,
                    used_at=(ts + timedelta(days=random.randint(1, 14))
                             if random.random() > 0.4 else None),
                )
                db.session.add(rd)
                db.session.flush()

                txn = _spend(user.account_id, reward.points_required,
                             f'Redeemed: {reward.name}', rd.id, ts)
                db.session.add(txn)
                balance = _balances[user.account_id]

                if reward.stock_quantity is not None:
                    reward.stock_quantity = max(0, reward.stock_quantity - 1)
                count += 1

    db.session.flush()
    print(f'         → {count} redemptions')


# ══════════════════════════════════════════════════════════════════════════
# STEP 13 – Maintenance Logs
# ══════════════════════════════════════════════════════════════════════════

def _seed_maintenance(org_rvms, admin_users):
    print('  [11/14] maintenance_logs')
    techs = [u for u in admin_users
             if u.role in ('technician', 'head_admin', 'superadmin')]
    if not techs:
        return
    count = 0
    for rvms in org_rvms.values():
        for rvm in rvms:
            for _ in range(random.randint(2, 6)):
                ml = MaintenanceLog(
                    rvm_id=rvm.id,
                    performed_by_id=random.choice(techs).id,
                    action_type=random.choice(D.MAINTENANCE_ACTIONS),
                    resolved=random.random() > 0.15,
                    notes=f'Routine maintenance on {rvm.name}',
                    timestamp=_ts(),
                )
                db.session.add(ml)
                count += 1
    db.session.flush()
    print(f'         → {count} logs')


# ══════════════════════════════════════════════════════════════════════════
# STEP 14 – Admin Logs
# ══════════════════════════════════════════════════════════════════════════

def _seed_admin_logs(admin_users):
    print('  [12/14] admin_logs')
    if not admin_users:
        return
    count = 0
    for _ in range(150):
        action, category = random.choice(D.ADMIN_LOG_ACTIONS)
        al = AdminLog(
            admin_user_id=random.choice(admin_users).id,
            action=action,
            target=_name(),
            category=category,
            notes=None,
            timestamp=_ts(),
        )
        db.session.add(al)
        count += 1
    db.session.flush()
    print(f'         → {count} logs')


# ══════════════════════════════════════════════════════════════════════════
# FINALIZE – sync Account.points_balance with ledger
# ══════════════════════════════════════════════════════════════════════════

def _finalize_balances():
    """Set each Account.points_balance to its computed running total."""
    print('  [13/14] finalizing account balances')
    for acc_id, balance in _balances.items():
        acc = db.session.get(Account, acc_id)
        if acc:
            acc.points_balance = max(0, balance)
    db.session.flush()


# ══════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════

def run_seed(fresh=False):
    """Main seeder — call from `flask seed` CLI."""

    # Reset module-level uniqueness trackers
    _emails.clear()
    _usernames.clear()
    _redeem_codes.clear()
    _balances.clear()

    if fresh:
        _truncate_all()

    if not _is_empty():
        print('⚠  Database already has data. Run with --fresh to wipe first.')
        return

    print('🌱 Seeding EcoPoints database (Large profile) …\n')

    ot_map   = _seed_org_types()
    city_map = _seed_cities()
    orgs     = _seed_organizations(ot_map, city_map)
    groups   = _seed_groups(orgs)

    all_regular, admin_users = _seed_users(orgs, groups)
    _seed_credentials(all_regular)
    org_rvms = _seed_rvms(orgs)

    _seed_recycling(all_regular, org_rvms, orgs)

    org_rewards = _seed_rewards(orgs)
    _seed_redemptions(all_regular, org_rewards, orgs)

    _seed_maintenance(org_rvms, admin_users)
    _seed_admin_logs(admin_users)

    _finalize_balances()

    # ── Commit everything ──
    print('  [14/14] committing …')
    db.session.commit()

    # ── Summary ──
    print(f'\n✅ Seeding complete!')
    print(f'   Organizations : {Organization.query.count()}')
    print(f'   Com. Groups   : {CommunityGroup.query.count()}')
    print(f'   Users         : {User.query.count()}')
    print(f'   RVMs          : {RVM.query.count()}')
    print(f'   Sessions      : {RecyclingSession.query.count()}')
    print(f'   Bottles       : {RecyclingItem.query.count()}')
    print(f'   Transactions  : {Transaction.query.count()}')
    print(f'   Rewards       : {Reward.query.count()}')
    print(f'   Redemptions   : {RewardRedemption.query.count()}')
    print(f'   Maint. Logs   : {MaintenanceLog.query.count()}')
    print(f'   Admin Logs    : {AdminLog.query.count()}')
    print(f'\n   🔑 Superadmin login:')
    print(f'      Email:    admin@ecopoints.ph')
    print(f'      Password: admin123\n')
