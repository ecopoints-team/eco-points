"""
EcoPoints Unified Seeder
~~~~~~~~~~~~~~~~~~~~~~~~
Populates all 16 tables with realistic sample data for development and testing.

Tables seeded (in dependency order):
  1. org_types          2. cities              3. organizations
  4. community_groups   5. accounts            6. users
  7. access_credentials 8. rvms                9. recycling_sessions
 10. recycling_items   11. transactions       12. rewards
 13. reward_redemptions 14. maintenance_logs   15. admin_logs

Password for ALL seeded users: test123
"""

import uuid
import sys
from datetime import datetime, timezone, timedelta, date

from .. import db
from ..models import (
    OrgType, City, Organization, CommunityGroup, Account, User,
    AccessCredential, RVM, RecyclingSession, RecyclingItem,
    MaintenanceLog, Transaction, Reward, RewardRedemption, AdminLog,
)


# ══════════════════════════════════════════════════════════════════════════
# SEEDED RANDOM  –  deterministic so every seed run produces the same data
# ══════════════════════════════════════════════════════════════════════════

_seed_state = [12345]


def _mulberry32():
    """Deterministic 32-bit PRNG (Mulberry32)."""
    _seed_state[0] = (_seed_state[0] + 0x6D2B79F5) & 0xFFFFFFFF
    t = _seed_state[0]
    t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
    t = (t ^ ((t ^ (t >> 7)) * (t | 61))) & 0xFFFFFFFF
    return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 0xFFFFFFFF


def _rand():
    return _mulberry32()


def _pick(lst):
    return lst[int(_rand() * len(lst))]


def _rand_int(lo, hi):
    return lo + int(_rand() * (hi - lo + 1))


def _rand_bool(prob=0.5):
    return _rand() < prob


def _rand_date(start, end):
    delta = (end - start).total_seconds()
    return start + timedelta(seconds=int(_rand() * delta))


# ══════════════════════════════════════════════════════════════════════════
# STATIC DATA
# ══════════════════════════════════════════════════════════════════════════

PASSWORD = 'test123'

CITIES_DATA = [
    {'name': 'Pasig City', 'province': 'Metro Manila', 'region': 'NCR'},
    {'name': 'Manila', 'province': 'Metro Manila', 'region': 'NCR'},
    {'name': 'Quezon City', 'province': 'Metro Manila', 'region': 'NCR'},
]

ORG_TYPES_DATA = ['University', 'Corporation', 'HOA']

LOCATIONS = [
    {
        'id': 'LOC-001', 'name': 'Arellano University', 'type': 'University', 'cityIdx': 0,
        'fullName': 'Arellano University - Andres Bonifacio Pasig Campus',
        'streetAddress': 'Pag-asa St, Caniogan', 'barangay': 'Caniogan', 'zipCode': '1600',
        'contactPerson': 'Dr. Josephine Reyes', 'contactEmail': 'admin@arellano.edu.ph',
        'contactPhone': '(02) 8643-8881', 'status': 'Active', 'joinDate': '2024-01-15',
    },
    {
        'id': 'LOC-002', 'name': 'Polytechnic University', 'type': 'University', 'cityIdx': 1,
        'fullName': 'Polytechnic University of the Philippines - Main Campus',
        'streetAddress': 'Anonas St, Sta. Mesa', 'barangay': 'Sta. Mesa', 'zipCode': '1016',
        'contactPerson': 'Engr. Manuel Bautista', 'contactEmail': 'admin@pup.edu.ph',
        'contactPhone': '(02) 5335-1787', 'status': 'Active', 'joinDate': '2024-03-01',
    },
]

DEPARTMENTS = [
    # SHS Strands
    {'id': 'STEM', 'name': 'Science, Technology, Engineering & Mathematics', 'abbr': 'STEM', 'type': 'shs_strand'},
    {'id': 'ABM', 'name': 'Accountancy, Business & Management', 'abbr': 'ABM', 'type': 'shs_strand'},
    {'id': 'HUMSS', 'name': 'Humanities & Social Sciences', 'abbr': 'HUMSS', 'type': 'shs_strand'},
    {'id': 'GAS', 'name': 'General Academic Strand', 'abbr': 'GAS', 'type': 'shs_strand'},
    {'id': 'TVL-ICT', 'name': 'TVL - Information & Communications Technology', 'abbr': 'TVL-ICT', 'type': 'shs_strand'},
    {'id': 'TVL-HE', 'name': 'TVL - Home Economics', 'abbr': 'TVL-HE', 'type': 'shs_strand'},
    {'id': 'SPORTS', 'name': 'Sports Track', 'abbr': 'SPORTS', 'type': 'shs_strand'},
    # College Departments
    {'id': 'BSN', 'name': 'Bachelor of Science in Nursing', 'abbr': 'BSN', 'type': 'college'},
    {'id': 'BEED', 'name': 'Bachelor of Elementary Education', 'abbr': 'BEED', 'type': 'college'},
    {'id': 'BSIT', 'name': 'Bachelor of Science in Information Technology', 'abbr': 'BSIT', 'type': 'college'},
    {'id': 'BSCS', 'name': 'Bachelor of Science in Computer Science', 'abbr': 'BSCS', 'type': 'college'},
    {'id': 'BSBA', 'name': 'Bachelor of Science in Business Administration', 'abbr': 'BSBA', 'type': 'college'},
    {'id': 'BSMA', 'name': 'Bachelor of Science in Management Accounting', 'abbr': 'BSMA', 'type': 'college'},
    {'id': 'BSA', 'name': 'Bachelor of Science in Accountancy', 'abbr': 'BSA', 'type': 'college'},
    {'id': 'BSP', 'name': 'Bachelor of Science in Psychology', 'abbr': 'BSP', 'type': 'college'},
    {'id': 'BSHM', 'name': 'Bachelor of Science in Hospitality Management', 'abbr': 'BSHM', 'type': 'college'},
    {'id': 'BSTM', 'name': 'Bachelor of Science in Tourism Management', 'abbr': 'BSTM', 'type': 'college'},
    {'id': 'BSCrim', 'name': 'Bachelor of Science in Criminology', 'abbr': 'BSCrim', 'type': 'college'},
    {'id': 'AB-EL', 'name': 'Bachelor of Arts in English Language', 'abbr': 'AB-EL', 'type': 'college'},
    {'id': 'AB-Psych', 'name': 'Bachelor of Arts in Psychology', 'abbr': 'AB-Psych', 'type': 'college'},
    {'id': 'AB-PolSci', 'name': 'Bachelor of Arts in Political Science', 'abbr': 'AB-PolSci', 'type': 'college'},
    {'id': 'DM', 'name': 'Diploma in Midwifery', 'abbr': 'DM', 'type': 'college'},
]

SHS_STRANDS = [d for d in DEPARTMENTS if d['type'] == 'shs_strand']
COLLEGE_DEPTS = [d for d in DEPARTMENTS if d['type'] == 'college']

ADMIN_USERS_DATA = [
    # Super Admins
    {'name': 'System Administrator', 'username': 'sysadmin', 'email': 'superadmin@ecopoints.com', 'role': 'superadmin', 'locId': None, 'lastLogin': '2024-06-15T08:30:00'},
    {'name': 'Chief Technology Officer', 'username': 'cto', 'email': 'cto@ecopoints.com', 'role': 'superadmin', 'locId': None, 'lastLogin': '2024-06-13T14:20:00'},
    # Head Admins
    {'name': 'Maria Santos', 'username': 'msantos', 'email': 'head@arellano.edu.ph', 'role': 'head_admin', 'locId': 'LOC-001', 'lastLogin': '2024-06-15T09:15:00'},
    {'name': 'Roberto Garcia', 'username': 'rgarcia', 'email': 'rgarcia@arellano.edu.ph', 'role': 'head_admin', 'locId': 'LOC-001', 'lastLogin': '2024-06-14T11:45:00'},
    {'name': 'Elena Cruz', 'username': 'ecruz', 'email': 'ecruz@arellano.edu.ph', 'role': 'head_admin', 'locId': 'LOC-001', 'lastLogin': '2024-06-12T16:30:00'},
    # Auditors
    {'name': 'Juan Dela Cruz', 'username': 'jdelacruz', 'email': 'auditor@arellano.edu.ph', 'role': 'auditor', 'locId': 'LOC-001', 'lastLogin': '2024-06-15T10:00:00'},
    {'name': 'Angela Reyes', 'username': 'areyes', 'email': 'areyes@arellano.edu.ph', 'role': 'auditor', 'locId': 'LOC-001', 'lastLogin': '2024-06-10T13:20:00'},
    {'name': 'Mark Gonzales', 'username': 'mgonzales', 'email': 'mgonzales@arellano.edu.ph', 'role': 'auditor', 'locId': 'LOC-001', 'lastLogin': '2024-05-11T09:45:00'},
    # Inventory Officers
    {'name': 'Ana Lim', 'username': 'alim', 'email': 'inventory@arellano.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-001', 'lastLogin': '2024-06-15T08:15:00'},
    {'name': 'Patricia Tan', 'username': 'ptan', 'email': 'ptan@arellano.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-001', 'lastLogin': '2024-06-13T15:10:00'},
    {'name': 'Jose Mendoza', 'username': 'jmendoza', 'email': 'jmendoza@arellano.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-001', 'lastLogin': '2024-06-08T10:30:00'},
    # Technicians
    {'name': 'Carlos Reyes', 'username': 'creyes', 'email': 'tech@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'lastLogin': '2024-06-15T07:45:00'},
    {'name': 'Miguel Santos', 'username': 'misantos', 'email': 'msantos@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'lastLogin': '2024-06-14T14:50:00'},
    {'name': 'Fernando Lopez', 'username': 'flopez', 'email': 'flopez@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'lastLogin': '2024-06-11T16:15:00'},
    {'name': 'David Villanueva', 'username': 'dvillanueva', 'email': 'dvillanueva@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'lastLogin': '2024-05-06T11:20:00'},
    # LOC-002 admins
    {'name': 'Rosa Aquino', 'username': 'raquino', 'email': 'head@pup.edu.ph', 'role': 'head_admin', 'locId': 'LOC-002', 'lastLogin': '2024-09-15T09:00:00'},
    {'name': 'Leo Bautista', 'username': 'lbautista', 'email': 'auditor@pup.edu.ph', 'role': 'auditor', 'locId': 'LOC-002', 'lastLogin': '2024-09-14T10:30:00'},
    {'name': 'Carmen Diaz', 'username': 'cdiaz', 'email': 'inventory@pup.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-002', 'lastLogin': '2024-09-13T14:15:00'},
    {'name': 'Rico Fernandez', 'username': 'rfernandez', 'email': 'tech@pup.edu.ph', 'role': 'technician', 'locId': 'LOC-002', 'lastLogin': '2024-09-15T07:45:00'},
    {'name': 'Lorna Gutierrez', 'username': 'lgutierrez', 'email': 'tech2@pup.edu.ph', 'role': 'technician', 'locId': 'LOC-002', 'lastLogin': '2024-09-12T16:00:00'},
]

MACHINES_DATA = [
    {'id': 'RVM-AU-01', 'name': 'Main Gate RVM', 'locId': 'LOC-001', 'area': 'Main Gate', 'online': True, 'bottles': 4520},
    {'id': 'RVM-AU-02', 'name': 'Canteen RVM-A', 'locId': 'LOC-001', 'area': 'Canteen', 'online': True, 'bottles': 3850},
    {'id': 'RVM-AU-03', 'name': 'Canteen RVM-B', 'locId': 'LOC-001', 'area': 'Canteen', 'online': True, 'bottles': 2800},
    {'id': 'RVM-AU-04', 'name': 'Library RVM', 'locId': 'LOC-001', 'area': 'Library', 'online': True, 'bottles': 2100},
    {'id': 'RVM-AU-05', 'name': 'Gym RVM', 'locId': 'LOC-001', 'area': 'Gymnasium', 'online': False, 'bottles': 3100},
    {'id': 'RVM-AU-06', 'name': 'Nursing Bldg RVM', 'locId': 'LOC-001', 'area': 'Nursing Building', 'online': True, 'bottles': 1850},
    {'id': 'RVM-PU-01', 'name': 'Main Entrance RVM', 'locId': 'LOC-002', 'area': 'Main Entrance', 'online': True, 'bottles': 3200},
    {'id': 'RVM-PU-02', 'name': 'Canteen RVM', 'locId': 'LOC-002', 'area': 'Student Canteen', 'online': True, 'bottles': 2900},
    {'id': 'RVM-PU-03', 'name': 'Library RVM', 'locId': 'LOC-002', 'area': 'Ninoy Aquino Library', 'online': False, 'bottles': 1800},
    {'id': 'RVM-PU-04', 'name': 'Engineering RVM', 'locId': 'LOC-002', 'area': 'Engineering Building', 'online': True, 'bottles': 1970},
]

REWARDS_DATA = [
    {'name': 'EcoPoints T-Shirt', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 500, 'stock': 45, 'desc': 'Official EcoPoints branded T-shirt'},
    {'name': 'Metal Straw Set', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 150, 'stock': 120, 'desc': 'Set of 4 reusable metal straws with brush'},
    {'name': 'Bamboo Tumbler', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 800, 'stock': 20, 'desc': '500ml insulated bamboo tumbler'},
    {'name': 'Canvas Tote Bag', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 300, 'stock': 68, 'desc': 'Eco-friendly canvas tote bag'},
    {'name': 'School Supplies Kit', 'locId': 'LOC-001', 'cat': 'Education', 'pts': 200, 'stock': 200, 'desc': 'Notebook, pens, and highlighters'},
    {'name': 'Canteen Voucher (P50)', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 100, 'stock': 500, 'desc': 'P50 canteen food voucher'},
    {'name': 'Canteen Voucher (P100)', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 200, 'stock': 350, 'desc': 'P100 canteen food voucher'},
    {'name': 'Priority Enrollment', 'locId': 'LOC-001', 'cat': 'Education', 'pts': 5000, 'stock': 10, 'desc': 'Priority enrollment slot for next semester'},
    {'name': 'Eco Notebook', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 120, 'stock': 150, 'desc': 'A5 recycled paper notebook'},
    {'name': 'Laptop Sticker Pack', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 50, 'stock': 300, 'desc': '10-piece eco-themed sticker pack'},
    {'name': 'PUP Eco Tumbler', 'locId': 'LOC-002', 'cat': 'Sustainable', 'pts': 700, 'stock': 30, 'desc': 'PUP-branded eco tumbler'},
    {'name': 'PUP T-Shirt', 'locId': 'LOC-002', 'cat': 'Merchandise', 'pts': 450, 'stock': 50, 'desc': 'PUP EcoPoints branded shirt'},
    {'name': 'Cafeteria Voucher (P50)', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 100, 'stock': 400, 'desc': 'P50 cafeteria voucher'},
    {'name': 'Cafeteria Voucher (P100)', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 200, 'stock': 250, 'desc': 'P100 cafeteria voucher'},
    {'name': 'Reusable Straw Kit', 'locId': 'LOC-002', 'cat': 'Sustainable', 'pts': 120, 'stock': 180, 'desc': 'Bamboo straw set with case'},
]

FIRST_NAMES = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Miguel', 'Ana', 'Juan', 'Maria',
    'Carlos', 'Sofia', 'Luis', 'Andrea', 'Jose', 'Isabella', 'Mark', 'Angela',
    'Daniel', 'Christine', 'Paul', 'Katherine', 'Steven', 'Rachel', 'Kevin', 'Nicole',
]

LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Santos', 'Reyes', 'Cruz',
    'Dela Cruz', 'Villanueva', 'Mendoza', 'Torres', 'Flores', 'Rivera', 'Ramos',
]

YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

BOTTLE_BRANDS = [
    'Coca-Cola', 'Pepsi', 'Sprite', 'Royal', 'Mountain Dew', 'C2', 'Nestea',
    'Gatorade', 'Pocari Sweat', 'Nature Spring', 'Summit', 'Wilkins', 'Absolute',
]
BOTTLE_VOLUMES = [350, 500, 750, 1000]
CONDITIONS = ['With Label', 'No Label', 'Rejected']

ISSUES = [
    'Sensor Error', 'Bin Full', 'Network Offline', 'Printer Jam',
    'Software Update', 'Routine Checkup', 'Motor Failure', 'Display Error',
]

ADMIN_ACTIONS = [
    ('User Created', 'Users'), ('User Updated', 'Users'), ('User Suspended', 'Users'),
    ('Reward Added', 'Rewards'), ('Reward Stock Updated', 'Rewards'),
    ('Machine Maintained', 'Machines'), ('Machine Status Changed', 'Machines'),
    ('Settings Changed', 'Settings'), ('Exported Logs', 'Logs'), ('Points Adjusted', 'Users'),
]


# ══════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════

def _get_points(volume, has_label):
    if 290 <= volume <= 350:
        return 5 if has_label else 3
    elif 351 <= volume <= 500:
        return 8 if has_label else 5
    elif 750 <= volume <= 1000:
        return 10 if has_label else 7
    return 0


def _org_abbr(org):
    """Derive a short abbreviation from an Organization name (e.g. 'AU', 'PU')."""
    words = [w for w in org.name.split() if w[0].isupper()]
    return ''.join(w[0] for w in words).upper() or 'ORG'


# ══════════════════════════════════════════════════════════════════════════
# MAIN SEED FUNCTION
# ══════════════════════════════════════════════════════════════════════════

def run_seed(fresh=False):
    """Populate (or re-populate) the database.

    Args:
        fresh: If True, drop and recreate all tables first.
               If False, only seed when the database is empty.
    """
    _seed_state[0] = 12345

    if fresh:
        print('🗑️  Dropping all tables...')
        db.drop_all()
        print('🏗️  Creating all tables...')
        db.create_all()
    else:
        db.create_all()
        if User.query.first():
            print('Database already seeded. Use --fresh to re-seed.')
            return

    # ── 1. Org Types ───────────────────────────────────────────────────
    print('  [ 1/15] Org Types...')
    org_type_map = {}
    for ot_name in ORG_TYPES_DATA:
        ot = OrgType(name=ot_name)
        db.session.add(ot)
        db.session.flush()
        org_type_map[ot_name] = ot
    print(f'         → {len(org_type_map)} org types')

    # ── 2. Cities ──────────────────────────────────────────────────────
    print('  [ 2/15] Cities...')
    city_list = []
    for c in CITIES_DATA:
        city = City(name=c['name'], province=c['province'], region=c['region'])
        db.session.add(city)
        db.session.flush()
        city_list.append(city)
    print(f'         → {len(city_list)} cities')

    # ── 3. Organizations ───────────────────────────────────────────────
    print('  [ 3/15] Organizations...')
    org_map = {}  # 'LOC-001' → Organization
    for loc in LOCATIONS:
        org = Organization(
            name=loc['name'],
            full_name=loc['fullName'],
            org_type=loc['type'],
            org_type_id=org_type_map[loc['type']].id,
            street_address=loc['streetAddress'],
            barangay=loc['barangay'],
            city_id=city_list[loc['cityIdx']].id,
            zip_code=loc['zipCode'],
            contact_person=loc['contactPerson'],
            contact_email=loc['contactEmail'],
            contact_phone=loc['contactPhone'],
            status=loc['status'],
            join_date=date.fromisoformat(loc['joinDate']),
        )
        db.session.add(org)
        db.session.flush()
        org_map[loc['id']] = org
    print(f'         → {len(org_map)} organizations')

    # ── 4. Community Groups ────────────────────────────────────────────
    print('  [ 4/15] Community Groups...')
    cg_map = {}       # 'LOC-001:BSIT' → CommunityGroup
    staff_cg = {}     # 'LOC-001' → campus-staff CommunityGroup

    # "Campus Staff" catch-all per org
    for loc_id, org in org_map.items():
        cg = CommunityGroup(
            organization_id=org.id,
            name='Campus Staff',
            abbreviation='Staff',
            group_type='staff',
        )
        db.session.add(cg)
        db.session.flush()
        staff_cg[loc_id] = cg

    # "Global Administration" group for superadmins
    global_admin_cg = CommunityGroup(
        organization_id=org_map['LOC-001'].id,
        name='Global Administration',
        abbreviation='GlobalAdmin',
        group_type='staff',
    )
    db.session.add(global_admin_cg)
    db.session.flush()

    # SHS strands + college departments for each org
    for org_loc_id, org in org_map.items():
        for dept in DEPARTMENTS:
            cg = CommunityGroup(
                organization_id=org.id,
                name=dept['name'],
                abbreviation=dept['abbr'],
                group_type=dept['type'],
            )
            db.session.add(cg)
            db.session.flush()
            cg_map[f"{org_loc_id}:{dept['id']}"] = cg

    total_cg = len(cg_map) + len(staff_cg) + 1
    print(f'         → {total_cg} community groups')

    # ── 5-6. Admin Accounts + Users (20) ───────────────────────────────
    print('  [ 5/15] Admin Accounts...')
    print('  [ 6/15] Admin Users...')
    admin_user_list = []
    for adm in ADMIN_USERS_DATA:
        loc_id = adm['locId']
        cg = global_admin_cg if loc_id is None else staff_cg[loc_id]

        acct = Account(
            community_group_id=cg.id,
            account_name=adm['name'],
            points_balance=0,
            streak=0,
        )
        db.session.add(acct)
        db.session.flush()

        abbr = 'SYS' if loc_id is None else _org_abbr(org_map[loc_id])

        user = User(
            account_id=acct.id,
            name=adm['name'],
            username=adm['username'],
            email=adm['email'],
            role=adm['role'],
            is_active=True,
            last_login=datetime.fromisoformat(adm['lastLogin']).replace(tzinfo=timezone.utc),
        )
        user.set_password(PASSWORD)
        db.session.add(user)
        db.session.flush()

        user.display_id = User.generate_display_id(adm['role'], abbr)

        cred = AccessCredential(
            account_id=acct.id,
            tag_id=str(uuid.uuid4()),
            credential_type='qr_code',
        )
        db.session.add(cred)
        admin_user_list.append(user)

    print(f'         → {len(admin_user_list)} admin users (pw: {PASSWORD})')

    # ── 7. End-User Accounts + Users (200) ─────────────────────────────
    print('  [ 7/15] End Users (200)...')
    end_user_list = []
    used_emails = set()
    base_date = datetime(2024, 6, 1, tzinfo=timezone.utc)
    end_date = datetime(2026, 2, 27, tzinfo=timezone.utc)

    for i in range(200):
        first = _pick(FIRST_NAMES)
        last = _pick(LAST_NAMES)
        name = f'{first} {last}'
        domain = 'arellano.edu.ph' if i < 150 else 'pup.edu.ph'
        base_email = f'{first.lower()}.{last.lower().replace(" ", "")}@{domain}'
        email = base_email
        suffix = 2
        while email in used_emails:
            email = f'{first.lower()}.{last.lower().replace(" ", "")}{suffix}@{domain}'
            suffix += 1
        used_emails.add(email)

        loc_id = 'LOC-001' if i < 150 else 'LOC-002'

        # Role distribution: 80% Student, 12% Faculty, 8% Staff
        roll = _rand()
        user_type = year_level = None
        group_key = None

        if roll < 0.80:
            user_type = 'student'
            if _rand() < 0.4:
                strand = _pick(SHS_STRANDS)['id']
                year_level = 'Grade 11' if _rand() < 0.5 else 'Grade 12'
                group_key = strand
            else:
                dept_id = _pick(COLLEGE_DEPTS)['id']
                year_level = _pick(YEAR_LEVELS)
                group_key = dept_id
        elif roll < 0.92:
            user_type = 'faculty'
            group_key = _pick(COLLEGE_DEPTS)['id']
        else:
            user_type = 'staff'

        cg = cg_map.get(f"{loc_id}:{group_key}", staff_cg[loc_id]) if group_key else staff_cg[loc_id]

        pts = _rand_int(0, 5000)
        streak = _rand_int(0, 40)
        join = _rand_date(base_date, end_date)

        acct = Account(
            community_group_id=cg.id,
            account_name=name,
            points_balance=pts,
            streak=streak,
            created_at=join,
        )
        db.session.add(acct)
        db.session.flush()

        user = User(
            account_id=acct.id,
            name=name,
            email=email,
            role='user',
            user_type=user_type,
            year_level=year_level,
            is_active=True,
            last_login=_rand_date(join, end_date),
            created_at=join,
        )
        db.session.add(user)
        db.session.flush()

        user.display_id = User.generate_display_id('user', _org_abbr(org_map[loc_id]))

        cred = AccessCredential(
            account_id=acct.id,
            tag_id=str(uuid.uuid4()),
            credential_type='qr_code',
        )
        db.session.add(cred)
        end_user_list.append(user)

    print(f'         → {len(end_user_list)} end users')

    # ── 8. RVMs (10 machines) ──────────────────────────────────────────
    print('  [ 8/15] RVMs...')
    rvm_map = {}
    for m in MACHINES_DATA:
        rvm = RVM(
            organization_id=org_map[m['locId']].id,
            machine_uuid=m['id'],
            name=m['name'],
            location_name=m['area'],
            is_online=m['online'],
            total_items_collected=m['bottles'],
        )
        db.session.add(rvm)
        db.session.flush()
        rvm_map[m['id']] = rvm
    print(f'         → {len(rvm_map)} machines')

    # ── 9. Rewards (15) ────────────────────────────────────────────────
    print('  [ 9/15] Rewards...')
    reward_list = []
    for r in REWARDS_DATA:
        reward = Reward(
            organization_id=org_map[r['locId']].id,
            name=r['name'],
            description=r['desc'],
            category=r['cat'],
            points_required=r['pts'],
            stock_quantity=r['stock'],
            is_active=True,
        )
        db.session.add(reward)
        db.session.flush()
        reward_list.append(reward)
    print(f'         → {len(reward_list)} rewards')

    db.session.commit()
    print('  ── Reference data committed ──')

    # ── 10-11. Recycling Sessions + Items (500 items) ──────────────────
    print('  [10/15] Recycling Sessions...')
    print('  [11/15] Recycling Items (500)...')
    log_end = datetime(2026, 2, 27, tzinfo=timezone.utc)
    log_start = log_end - timedelta(days=30)
    rvm_ids_list = list(rvm_map.keys())

    session_count = 0
    item_count = 0
    current_session = None
    items_in_session = 0

    for _ in range(500):
        user = _pick(end_user_list)
        rvm_key = _pick(rvm_ids_list)
        rvm = rvm_map[rvm_key]
        brand = _pick(BOTTLE_BRANDS)
        volume = _pick(BOTTLE_VOLUMES)
        condition = _pick(CONDITIONS)
        log_dt = _rand_date(log_start, log_end)

        is_rejected = (condition == 'Rejected') or (volume >= 1001)
        has_label = (condition == 'With Label')
        pts = 0 if is_rejected else _get_points(volume, has_label)

        # New session every ~5 items
        if current_session is None or items_in_session >= 5 or _rand() < 0.3:
            if current_session is not None:
                current_session.status = 'completed'
                current_session.end_time = log_dt
            current_session = RecyclingSession(
                rvm_id=rvm.id,
                account_id=user.account_id,
                start_time=log_dt - timedelta(minutes=_rand_int(1, 10)),
                status='active',
                total_points_earned=0,
                item_count=0,
            )
            db.session.add(current_session)
            db.session.flush()
            session_count += 1
            items_in_session = 0

        item = RecyclingItem(
            session_id=current_session.id,
            item_type='PET Bottle',
            material='Plastic',
            brand=brand,
            volume_ml=volume,
            condition=condition,
            weight_grams=round(_rand() * 30 + 10, 1),
            points_awarded=pts,
            deposited_at=log_dt,
        )
        db.session.add(item)
        current_session.item_count = (current_session.item_count or 0) + 1
        current_session.total_points_earned = (current_session.total_points_earned or 0) + pts
        items_in_session += 1
        item_count += 1

    if current_session:
        current_session.status = 'completed'
        current_session.end_time = log_end

    db.session.commit()
    print(f'         → {item_count} items in {session_count} sessions')

    # ── 12. Transactions (earn from sessions + redeem placeholders) ────
    print('  [12/15] Transactions...')
    txn_count = 0

    # Earn transactions from recycling sessions
    sessions = RecyclingSession.query.filter(RecyclingSession.total_points_earned > 0).all()
    for sess in sessions:
        acct = Account.query.get(sess.account_id)
        bal_before = acct.points_balance
        earned = sess.total_points_earned
        bal_after = bal_before + earned

        txn = Transaction(
            account_id=acct.id,
            transaction_type='earn',
            amount=earned,
            balance_before=bal_before,
            balance_after=bal_after,
            description=f'Recycling session #{sess.id}',
            reference_id=f'SESSION-{sess.id}',
            created_at=sess.end_time or sess.start_time,
        )
        db.session.add(txn)
        acct.points_balance = bal_after
        txn_count += 1

    # A few adjustment transactions
    for _ in range(10):
        user = _pick(end_user_list)
        acct = Account.query.get(user.account_id)
        adj = _rand_int(-50, 100)
        bal_before = acct.points_balance
        bal_after = max(0, bal_before + adj)
        adj_actual = bal_after - bal_before

        txn = Transaction(
            account_id=acct.id,
            transaction_type='adjustment',
            amount=adj_actual,
            balance_before=bal_before,
            balance_after=bal_after,
            description='Admin points adjustment',
            reference_id=f'ADJ-{uuid.uuid4().hex[:8].upper()}',
            created_at=_rand_date(log_start, log_end),
        )
        db.session.add(txn)
        acct.points_balance = bal_after
        txn_count += 1

    db.session.commit()
    print(f'         → {txn_count} transactions')

    # ── 13. Reward Redemptions (100) ───────────────────────────────────
    print('  [13/15] Reward Redemptions (100)...')
    statuses = ['claimed', 'pending', 'expired', 'used']
    status_weights = [0.5, 0.2, 0.1, 0.2]
    redeem_txn_count = 0

    for _ in range(100):
        user = _pick(end_user_list)
        reward = _pick(reward_list)

        r = _rand()
        cumul = 0
        chosen_status = statuses[0]
        for s, w in zip(statuses, status_weights):
            cumul += w
            if r < cumul:
                chosen_status = s
                break

        red_dt = _rand_date(log_end - timedelta(days=15), log_end)
        code = f'RDM-{uuid.uuid4().hex[:8].upper()}'

        rr = RewardRedemption(
            account_id=user.account_id,
            reward_id=reward.id,
            points_spent=reward.points_required,
            status=chosen_status,
            redemption_code=code,
            redeemed_at=red_dt,
            used_at=red_dt if chosen_status in ('claimed', 'used') else None,
        )
        db.session.add(rr)
        db.session.flush()

        # Create matching redeem transaction
        acct = Account.query.get(user.account_id)
        bal_before = acct.points_balance
        spent = reward.points_required
        bal_after = max(0, bal_before - spent)

        txn = Transaction(
            account_id=acct.id,
            transaction_type='redeem',
            amount=-spent,
            balance_before=bal_before,
            balance_after=bal_after,
            description=f'Redeemed: {reward.name}',
            reference_id=f'REDEEM-{rr.id}',
            created_at=red_dt,
        )
        db.session.add(txn)
        acct.points_balance = bal_after
        redeem_txn_count += 1

    db.session.commit()
    print(f'         → 100 redemptions + {redeem_txn_count} redeem transactions')

    # ── 14. Maintenance Logs (50) ──────────────────────────────────────
    print('  [14/15] Maintenance Logs (50)...')
    techs = [u for u in admin_user_list if u.role in ('technician', 'head_admin')]
    maint_start = log_end - timedelta(days=60)

    for _ in range(50):
        rvm = rvm_map[_pick(rvm_ids_list)]
        tech = _pick(techs)
        issue = _pick(ISSUES)
        log_dt = _rand_date(maint_start, log_end)
        resolved = _rand_bool(0.8)

        ml = MaintenanceLog(
            rvm_id=rvm.id,
            performed_by_id=tech.id,
            action_type=issue,
            resolved=resolved,
            notes='Issue fixed successfully' if resolved else 'Awaiting parts/review',
            timestamp=log_dt,
            transaction_id=None,
        )
        db.session.add(ml)
    db.session.commit()
    print('         → 50 maintenance logs')

    # ── 15. Admin Logs (100) ───────────────────────────────────────────
    print('  [15/15] Admin Logs (100)...')
    admin_log_start = log_end - timedelta(days=14)

    for _ in range(100):
        admin = _pick(admin_user_list)
        action_text, category = _pick(ADMIN_ACTIONS)
        log_dt = _rand_date(admin_log_start, log_end)

        if category == 'Users':
            target = f'USR-{_rand_int(20240000, 20240199):08d}'
        elif category == 'Rewards':
            target = _pick(REWARDS_DATA)['name']
        elif category == 'Machines':
            target = _pick(MACHINES_DATA)['name']
        else:
            target = '-'

        al = AdminLog(
            admin_user_id=admin.id,
            action=action_text,
            target=target,
            category=category,
            notes=f'{action_text} performed successfully',
            timestamp=log_dt,
        )
        db.session.add(al)
    db.session.commit()
    print('         → 100 admin logs')

    # ── Summary ────────────────────────────────────────────────────────
    print()
    print('═' * 55)
    print('  ✅ SEED COMPLETE — All 16 tables populated')
    print('═' * 55)
    counts = {
        'OrgTypes': OrgType.query.count(),
        'Cities': City.query.count(),
        'Organizations': Organization.query.count(),
        'Community Groups': CommunityGroup.query.count(),
        'Accounts': Account.query.count(),
        'Users': User.query.count(),
        'Access Credentials': AccessCredential.query.count(),
        'RVMs': RVM.query.count(),
        'Recycling Sessions': RecyclingSession.query.count(),
        'Recycling Items': RecyclingItem.query.count(),
        'Transactions': Transaction.query.count(),
        'Rewards': Reward.query.count(),
        'Reward Redemptions': RewardRedemption.query.count(),
        'Maintenance Logs': MaintenanceLog.query.count(),
        'Admin Logs': AdminLog.query.count(),
    }
    for table, count in counts.items():
        print(f'  {table:.<30s} {count}')
    print()
    print(f'  Admin login:  sysadmin / {PASSWORD}')
    print(f'  All users:    {PASSWORD}')
    print()
