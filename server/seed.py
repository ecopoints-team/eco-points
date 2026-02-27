"""
EcoPoints — Database Seed Script (14-Table ERD)
================================================
Populates the database with test data matching the approved
14-table schema. No Area table, no BottlePricing table, no SKU.

Usage:
    cd server
    python seed.py          # wipes & re-seeds
    python seed.py --keep   # only seeds if tables are empty
"""
import sys
import uuid
from datetime import datetime, date, timedelta, timezone
from app import create_app, db
from app.models import (
    City, Organization, CommunityGroup, Account, User, AccessCredential,
    RVM, RecyclingSession, RecyclingItem, MaintenanceLog,
    Transaction, Reward, RewardRedemption, AdminLog,
)

# ── Seeded RNG (matches mockData's createSeededRandom(12345)) ────────────
_seed_state = [12345]

def seeded_random():
    """Mimics the JS mulberry32 PRNG used in mockData.js."""
    _seed_state[0] += 0x6D2B79F5
    t = _seed_state[0] & 0xFFFFFFFF
    t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
    t = (t ^ (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF))) & 0xFFFFFFFF
    return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

def pick(arr):
    return arr[int(seeded_random() * len(arr))]

def rand_int(lo, hi):
    return int(seeded_random() * (hi - lo + 1)) + lo

def rand_date(start, end):
    delta = (end - start).total_seconds()
    return start + timedelta(seconds=seeded_random() * delta)

def rand_bool(p=0.5):
    return seeded_random() < p


# ══════════════════════════════════════════════════════════════════════════
# RAW DATA
# ══════════════════════════════════════════════════════════════════════════

CITIES_DATA = [
    {'name': 'Pasig City', 'province': 'Metro Manila', 'region': 'NCR'},
    {'name': 'Manila', 'province': 'Metro Manila', 'region': 'NCR'},
]

LOCATIONS = [
    {
        'id': 'LOC-001', 'name': 'Arellano University',
        'fullName': 'Arellano University - Andres Bonifacio Pasig Campus',
        'cityIdx': 0, 'streetAddress': 'Pag-asa St, Caniogan, Pasig',
        'barangay': 'Caniogan', 'zipCode': '1600',
        'contactPerson': 'Admin Officer', 'contactEmail': 'admin@arellano.edu.ph',
        'contactPhone': '+63 2 8734 7371', 'joinDate': '2024-06-15', 'status': 'Active',
    },
    {
        'id': 'LOC-002', 'name': 'Polytechnic University',
        'fullName': 'Polytechnic University of the Philippines - Sta. Mesa',
        'cityIdx': 1, 'streetAddress': 'Anonas St, Sta. Mesa, Manila',
        'barangay': 'Sta. Mesa', 'zipCode': '1016',
        'contactPerson': 'Campus Director', 'contactEmail': 'admin@pup.edu.ph',
        'contactPhone': '+63 2 5335 1787', 'joinDate': '2024-09-01', 'status': 'Active',
    },
]

DEPARTMENTS = [
    # SHS Strands
    {'id': 'STEM', 'name': 'Science, Technology, Engineering, and Mathematics', 'abbr': 'STEM', 'type': 'shs_strand'},
    {'id': 'ABM', 'name': 'Accountancy, Business, and Management', 'abbr': 'ABM', 'type': 'shs_strand'},
    {'id': 'HUMSS', 'name': 'Humanities and Social Sciences', 'abbr': 'HUMSS', 'type': 'shs_strand'},
    {'id': 'GAS', 'name': 'General Academic Strand', 'abbr': 'GAS', 'type': 'shs_strand'},
    {'id': 'HE', 'name': 'Home Economics', 'abbr': 'H.E', 'type': 'shs_strand'},
    {'id': 'ICT', 'name': 'Information Communication Technology', 'abbr': 'ICT', 'type': 'shs_strand'},
    {'id': 'IA', 'name': 'Industrial Arts', 'abbr': 'I.A', 'type': 'shs_strand'},
    # College
    {'id': 'BSN', 'name': 'Bachelor of Science in Nursing', 'abbr': 'BSN', 'type': 'college'},
    {'id': 'BEED', 'name': 'Bachelor of Elementary Education Major in General Education', 'abbr': 'BEED', 'type': 'college'},
    {'id': 'BEED-SPED', 'name': 'Bachelor of Elementary Education (SPED)', 'abbr': 'BEED-SPED', 'type': 'college'},
    {'id': 'BPED', 'name': 'Bachelor of Physical Education', 'abbr': 'BPEd', 'type': 'college'},
    {'id': 'BSED-ENG', 'name': 'Bachelor of Secondary Education - Major in English', 'abbr': 'BSEd-English', 'type': 'college'},
    {'id': 'BSED-MATH', 'name': 'Bachelor of Secondary Education - Major in Mathematics', 'abbr': 'BSEd-Math', 'type': 'college'},
    {'id': 'BSED-FIL', 'name': 'Bachelor of Secondary Education - Major in Filipino', 'abbr': 'BSEd-Filipino', 'type': 'college'},
    {'id': 'BSED-SCI', 'name': 'Bachelor of Secondary Education - Major in Science', 'abbr': 'BSEd-Science', 'type': 'college'},
    {'id': 'BSED-SS', 'name': 'Bachelor of Secondary Education - Major in Social Studies', 'abbr': 'BSEd-SocStud', 'type': 'college'},
    {'id': 'BSED-VE', 'name': 'Bachelor of Secondary Education - Major in Values Education', 'abbr': 'BSEd-ValEd', 'type': 'college'},
    {'id': 'BSBA-MM', 'name': 'BS Business Administration - Major in Marketing Management', 'abbr': 'BSBA-MM', 'type': 'college'},
    {'id': 'BSBA-FM', 'name': 'BS Business Administration - Major in Financial Management', 'abbr': 'BSBA-FM', 'type': 'college'},
    {'id': 'BSAIS', 'name': 'Bachelor of Science in Accounting Information System', 'abbr': 'BSAIS', 'type': 'college'},
    {'id': 'BSIT', 'name': 'Bachelor of Science in Information Technology', 'abbr': 'BSIT', 'type': 'college'},
    {'id': 'BSCS', 'name': 'Bachelor of Science in Computer Science', 'abbr': 'BSCS', 'type': 'college'},
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
    # Super Admins (role=superadmin)
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

# area is now a descriptive string on RVM, not a FK
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

# No SKU — use formatted reward ID instead
REWARDS_DATA = [
    {'name': 'EcoPoints T-Shirt', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 500, 'stock': 45},
    {'name': 'Metal Straw Set', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 150, 'stock': 120},
    {'name': 'Bamboo Tumbler', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 800, 'stock': 20},
    {'name': 'Canvas Tote Bag', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 300, 'stock': 68},
    {'name': 'School Supplies Kit', 'locId': 'LOC-001', 'cat': 'Education', 'pts': 200, 'stock': 200},
    {'name': 'Canteen Voucher (P50)', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 100, 'stock': 500},
    {'name': 'Canteen Voucher (P100)', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 200, 'stock': 350},
    {'name': 'Priority Enrollment', 'locId': 'LOC-001', 'cat': 'Education', 'pts': 5000, 'stock': 10},
    {'name': 'Eco Notebook', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 120, 'stock': 150},
    {'name': 'Laptop Sticker Pack', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 50, 'stock': 300},
    {'name': 'PUP Eco Tumbler', 'locId': 'LOC-002', 'cat': 'Sustainable', 'pts': 700, 'stock': 30},
    {'name': 'PUP T-Shirt', 'locId': 'LOC-002', 'cat': 'Merchandise', 'pts': 450, 'stock': 50},
    {'name': 'Cafeteria Voucher (P50)', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 100, 'stock': 400},
    {'name': 'Cafeteria Voucher (P100)', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 200, 'stock': 250},
    {'name': 'Reusable Straw Kit', 'locId': 'LOC-002', 'cat': 'Sustainable', 'pts': 120, 'stock': 180},
]

FIRST_NAMES = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Miguel','Ana','Juan','Maria','Carlos','Sofia','Luis','Andrea','Jose','Isabella','Mark','Angela','Daniel','Christine','Paul','Katherine','Steven','Rachel','Kevin','Nicole']
LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Santos','Reyes','Cruz','Dela Cruz','Villanueva','Mendoza','Torres','Flores','Rivera','Ramos']
YEAR_LEVELS = ['1st Year','2nd Year','3rd Year','4th Year']

BOTTLE_BRANDS = ['Coca-Cola','Pepsi','Sprite','Royal','Mountain Dew','C2','Nestea','Gatorade','Pocari Sweat','Nature Spring','Summit','Wilkins','Absolute']
BOTTLE_VOLUMES = [350, 500, 750, 1000]
CONDITIONS = ['With Label', 'No Label', 'Rejected']

ISSUES = ['Sensor Error','Bin Full','Network Offline','Printer Jam','Software Update','Routine Checkup','Motor Failure','Display Error']
ADMIN_ACTIONS = [
    ('User Created', 'Users'), ('User Updated', 'Users'), ('User Suspended', 'Users'),
    ('Reward Added', 'Rewards'), ('Reward Stock Updated', 'Rewards'),
    ('Machine Maintained', 'Machines'), ('Machine Status Changed', 'Machines'),
    ('Settings Changed', 'Settings'), ('Exported Logs', 'Logs'), ('Points Adjusted', 'Users'),
]


# ══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════

def get_points(volume, has_label):
    if 290 <= volume <= 350:
        return 5 if has_label else 3
    elif 351 <= volume <= 500:
        return 8 if has_label else 5
    elif 750 <= volume <= 1000:
        return 10 if has_label else 7
    return 0


# ══════════════════════════════════════════════════════════════════════════
# MAIN SEED FUNCTION
# ══════════════════════════════════════════════════════════════════════════

def seed():
    _seed_state[0] = 12345

    print('🗑️  Dropping all tables...')
    db.drop_all()
    print('🏗️  Creating all tables...')
    db.create_all()

    # ── 1. Cities ──────────────────────────────────────────────────────
    print('  [1/11] Cities...')
    city_list = []
    for c in CITIES_DATA:
        city = City(name=c['name'], province=c['province'], region=c['region'])
        db.session.add(city)
        db.session.flush()
        city_list.append(city)
    print(f'       → {len(city_list)} cities')

    # ── 2. Organizations ───────────────────────────────────────────────
    print('  [2/11] Organizations...')
    org_map = {}  # 'LOC-001' → Organization instance
    for loc in LOCATIONS:
        org = Organization(
            name=loc['name'],
            full_name=loc['fullName'],
            org_type='University',
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
    print(f'       → {len(org_map)} organizations')

    # ── 3. Community Groups ────────────────────────────────────────────
    print('  [3/11] Community Groups...')
    cg_map = {}  # 'LOC-001:BSIT' → CommunityGroup instance

    # "Campus Staff" catch-all per org (group_type='staff')
    staff_cg = {}
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

    # "Global Admin" group for superadmins (tied to first org)
    global_admin_cg = CommunityGroup(
        organization_id=org_map['LOC-001'].id,
        name='Global Administration',
        abbreviation='GlobalAdmin',
        group_type='staff',
    )
    db.session.add(global_admin_cg)
    db.session.flush()

    # Departments — create for BOTH orgs (same curriculum)
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
    print(f'       → {total_cg} community groups')

    # ── 4. Admin Users (20) ────────────────────────────────────────────
    print('  [4/11] Admin Users...')
    admin_user_list = []
    for adm in ADMIN_USERS_DATA:
        loc_id = adm['locId']

        # Pick community group: superadmins → global, others → staff group at their org
        if loc_id is None:
            cg = global_admin_cg
        else:
            cg = staff_cg[loc_id]

        acct = Account(
            community_group_id=cg.id,
            account_name=adm['name'],
            points_balance=0,
            streak=0,
        )
        db.session.add(acct)
        db.session.flush()

        user = User(
            account_id=acct.id,
            name=adm['name'],
            username=adm['username'],
            email=adm['email'],
            role=adm['role'],
            is_active=True,
            last_login=datetime.fromisoformat(adm['lastLogin']).replace(tzinfo=timezone.utc),
        )
        user.set_password('test123')
        db.session.add(user)
        db.session.flush()

        cred = AccessCredential(
            account_id=acct.id,
            tag_id=str(uuid.uuid4()),
            credential_type='qr_code',
        )
        db.session.add(cred)
        admin_user_list.append(user)

    print(f'       → {len(admin_user_list)} admin users (all pw: test123)')

    # ── 5. End Users (200) ─────────────────────────────────────────────
    print('  [5/11] End Users (200)...')
    end_user_list = []
    used_emails = set()
    base_date = datetime(2024, 6, 1, tzinfo=timezone.utc)
    end_date = datetime(2026, 2, 27, tzinfo=timezone.utc)

    for i in range(200):
        first = pick(FIRST_NAMES)
        last = pick(LAST_NAMES)
        name = f'{first} {last}'
        base_email = f'{first.lower()}.{last.lower().replace(" ", "")}@arellano.edu.ph'
        email = base_email
        suffix = 2
        while email in used_emails:
            email = f'{first.lower()}.{last.lower().replace(" ", "")}{suffix}@arellano.edu.ph'
            suffix += 1
        used_emails.add(email)

        loc_id = 'LOC-001' if i < 150 else 'LOC-002'

        # Role distribution: 80% Student, 12% Faculty, 8% Staff
        roll = seeded_random()
        user_type = year_level = None
        group_key = None

        if roll < 0.80:
            user_type = 'student'
            if seeded_random() < 0.4:
                # SHS student
                strand = pick(SHS_STRANDS)['id']
                year_level = 'Grade 11' if seeded_random() < 0.5 else 'Grade 12'
                group_key = strand
            else:
                # College student
                dept_id = pick(COLLEGE_DEPTS)['id']
                year_level = pick(YEAR_LEVELS)
                group_key = dept_id
        elif roll < 0.92:
            user_type = 'faculty'
            group_key = pick(COLLEGE_DEPTS)['id']
        else:
            user_type = 'staff'
            # Staff uses the catch-all "Campus Staff" group
            group_key = None

        # Resolve community group
        if group_key:
            cg = cg_map.get(f"{loc_id}:{group_key}", staff_cg[loc_id])
        else:
            cg = staff_cg[loc_id]

        pts = rand_int(0, 5000)
        streak = rand_int(0, 40)
        join = rand_date(base_date, end_date)

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
            last_login=rand_date(join, end_date),
            created_at=join,
        )
        db.session.add(user)
        db.session.flush()

        cred = AccessCredential(
            account_id=acct.id,
            tag_id=str(uuid.uuid4()),
            credential_type='qr_code',
        )
        db.session.add(cred)
        end_user_list.append(user)

    print(f'       → {len(end_user_list)} end users')

    # ── 6. RVMs (10 machines) ──────────────────────────────────────────
    print('  [6/11] RVMs...')
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
    print(f'       → {len(rvm_map)} machines')

    # ── 7. Rewards (15) ────────────────────────────────────────────────
    print('  [7/11] Rewards...')
    reward_list = []
    for r in REWARDS_DATA:
        reward = Reward(
            organization_id=org_map[r['locId']].id,
            name=r['name'],
            category=r['cat'],
            points_required=r['pts'],
            stock_quantity=r['stock'],
            is_active=True,
        )
        db.session.add(reward)
        db.session.flush()
        reward_list.append(reward)
    print(f'       → {len(reward_list)} rewards')

    db.session.commit()
    print('  ── Reference data committed ──')

    # ── 8. Bottle Logs → Sessions + Items (500 items) ──────────────────
    print('  [8/11] Bottle Logs (500 items across sessions)...')
    log_end = datetime(2026, 2, 27, tzinfo=timezone.utc)
    log_start = log_end - timedelta(days=30)
    rvm_ids_list = list(rvm_map.keys())

    session_count = 0
    item_count = 0
    current_session = None
    items_in_session = 0

    for i in range(500):
        user = pick(end_user_list)
        rvm_key = pick(rvm_ids_list)
        rvm = rvm_map[rvm_key]
        brand = pick(BOTTLE_BRANDS)
        volume = pick(BOTTLE_VOLUMES)
        condition = pick(CONDITIONS)
        log_dt = rand_date(log_start, log_end)

        is_rejected = (condition == 'Rejected') or (volume >= 1001)
        has_label = (condition == 'With Label')
        pts = 0 if is_rejected else get_points(volume, has_label)

        # Start a new session every ~5 items
        if current_session is None or items_in_session >= 5 or seeded_random() < 0.3:
            if current_session is not None:
                current_session.status = 'completed'
                current_session.end_time = log_dt
            current_session = RecyclingSession(
                rvm_id=rvm.id,
                account_id=user.account_id,
                start_time=log_dt - timedelta(minutes=rand_int(1, 10)),
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
            weight_grams=round(seeded_random() * 30 + 10, 1),
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
    print(f'       → {item_count} items in {session_count} sessions')

    # ── 9. Maintenance Logs (50) ───────────────────────────────────────
    print('  [9/11] Maintenance Logs (50)...')
    techs = [u for u in admin_user_list if u.role in ('technician', 'head_admin')]
    maint_start = log_end - timedelta(days=60)

    for i in range(50):
        rvm = rvm_map[pick(rvm_ids_list)]
        tech = pick(techs)
        issue = pick(ISSUES)
        log_dt = rand_date(maint_start, log_end)
        resolved = rand_bool(0.8)

        ml = MaintenanceLog(
            rvm_id=rvm.id,
            performed_by_id=tech.id,
            action_type=issue,
            resolved=resolved,
            notes='Issue fixed successfully' if resolved else 'Awaiting parts/review',
            timestamp=log_dt,
        )
        db.session.add(ml)
    db.session.commit()
    print('       → 50 maintenance logs')

    # ── 10. Admin Logs (100) ───────────────────────────────────────────
    print('  [10/11] Admin Logs (100)...')
    admin_log_start = log_end - timedelta(days=14)

    for i in range(100):
        admin = pick(admin_user_list)
        action_text, category = pick(ADMIN_ACTIONS)
        log_dt = rand_date(admin_log_start, log_end)

        if category == 'Users':
            target = f'USR-{rand_int(20240000, 20240199):08d}'
        elif category == 'Rewards':
            target = pick(REWARDS_DATA)['name']
        elif category == 'Machines':
            target = pick(MACHINES_DATA)['name']
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
    print('       → 100 admin logs')

    # ── 11. Reward Redemptions (100) ───────────────────────────────────
    print('  [11/11] Reward Redemptions (100)...')
    statuses = ['claimed', 'pending', 'expired']
    status_weights = [0.7, 0.2, 0.1]

    for i in range(100):
        user = pick(end_user_list)
        reward = pick(reward_list)

        r = seeded_random()
        cumul = 0
        chosen_status = statuses[0]
        for s, w in zip(statuses, status_weights):
            cumul += w
            if r < cumul:
                chosen_status = s
                break

        red_dt = rand_date(log_end - timedelta(days=15), log_end)
        code = f'RDM-{uuid.uuid4().hex[:8].upper()}'

        rr = RewardRedemption(
            account_id=user.account_id,
            reward_id=reward.id,
            points_spent=reward.points_required,
            status=chosen_status,
            redemption_code=code,
            redeemed_at=red_dt,
            used_at=red_dt if chosen_status == 'claimed' else None,
        )
        db.session.add(rr)
    db.session.commit()
    print('       → 100 reward redemptions')

    # ── Summary ────────────────────────────────────────────────────────
    print()
    print('═' * 50)
    print('  ✅ SEED COMPLETE (14-table schema)')
    print('═' * 50)
    counts = {
        'Cities': City.query.count(),
        'Organizations': Organization.query.count(),
        'Community Groups': CommunityGroup.query.count(),
        'Accounts': Account.query.count(),
        'Users': User.query.count(),
        'Access Credentials': AccessCredential.query.count(),
        'RVMs': RVM.query.count(),
        'Recycling Sessions': RecyclingSession.query.count(),
        'Recycling Items': RecyclingItem.query.count(),
        'Rewards': Reward.query.count(),
        'Reward Redemptions': RewardRedemption.query.count(),
        'Transactions': Transaction.query.count(),
        'Maintenance Logs': MaintenanceLog.query.count(),
        'Admin Logs': AdminLog.query.count(),
    }
    for table, count in counts.items():
        print(f'  {table:.<30s} {count}')
    print()
    print('  Admin login:  sysadmin / test123')
    print('  All admins:   test123')
    print()


if __name__ == '__main__':
    keep = '--keep' in sys.argv
    app = create_app()
    with app.app_context():
        if keep and User.query.first():
            print('Database already seeded. Use without --keep to re-seed.')
            sys.exit(0)
        seed()
