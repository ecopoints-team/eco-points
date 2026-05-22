"""
EcoPoints Unified Seeder
~~~~~~~~~~~~~~~~~~~~~~~~
Populates all 19-table ERD with realistic sample data.
Password for ALL seeded users: test123
"""

import uuid
import sys
from datetime import datetime, timezone, timedelta, date

from .. import db
from ..models import (
    OrgType, Organization, OrgAddress, OrgContact, CommunityGroup,
    User, Wallet, UserSecurity, RVM, RecyclingSession, RecyclingItem,
    MaintenanceLog, Transaction, Reward, RewardVariant, RewardRedemption,
    AdminLog, NotificationSetting, NotificationLog,
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

ORG_TYPES_DATA = ['University', 'Corporation', 'HOA']

LOCATIONS = [
    {
        'id': 'LOC-001', 'name': 'Arellano University', 'type': 'University',
        'fullName': 'Arellano University - Andres Bonifacio Pasig Campus',
        'street': 'Pag-asa St, Caniogan', 'barangay': 'Caniogan',
        'city': 'Pasig City', 'province': 'Metro Manila', 'region': 'NCR', 'zip': '1600',
        'contactFirst': 'Josephine', 'contactLast': 'Reyes',
        'contactEmail': 'admin@arellano.edu.ph', 'contactPhone': '(02) 8643-8881',
    },
    {
        'id': 'LOC-002', 'name': 'Polytechnic University', 'type': 'University',
        'fullName': 'Polytechnic University of the Philippines - Main Campus',
        'street': 'Anonas St, Sta. Mesa', 'barangay': 'Sta. Mesa',
        'city': 'Manila', 'province': 'Metro Manila', 'region': 'NCR', 'zip': '1016',
        'contactFirst': 'Manuel', 'contactLast': 'Bautista',
        'contactEmail': 'admin@pup.edu.ph', 'contactPhone': '(02) 5335-1787',
    },
    {
        'id': 'LOC-003', 'name': 'De La Salle University', 'type': 'University',
        'fullName': 'De La Salle University - Manila Campus',
        'street': '2401 Taft Ave, Malate', 'barangay': 'Malate',
        'city': 'Manila', 'province': 'Metro Manila', 'region': 'NCR', 'zip': '1004',
        'contactFirst': 'Raymond', 'contactLast': 'Tan',
        'contactEmail': 'admin@dlsu.edu.ph', 'contactPhone': '(02) 8524-4611',
    },
    {
        'id': 'LOC-004', 'name': 'Ayala Corp HQ', 'type': 'Corporation',
        'fullName': 'Ayala Corporation - Makati Headquarters',
        'street': 'Tower One, Ayala Triangle', 'barangay': 'Bel-Air',
        'city': 'Makati City', 'province': 'Metro Manila', 'region': 'NCR', 'zip': '1226',
        'contactFirst': 'Maria Isabel', 'contactLast': 'Cruz',
        'contactEmail': 'sustainability@ayala.com.ph', 'contactPhone': '(02) 8908-3000',
    },
    {
        'id': 'LOC-005', 'name': 'Greenfield HOA', 'type': 'HOA',
        'fullName': 'Greenfield Residences Homeowners Association',
        'street': '12 Greenfield Ave, Brgy. Holy Spirit', 'barangay': 'Holy Spirit',
        'city': 'Quezon City', 'province': 'Metro Manila', 'region': 'NCR', 'zip': '1127',
        'contactFirst': 'Ricardo', 'contactLast': 'Mendoza',
        'contactEmail': 'admin@greenfieldhoa.ph', 'contactPhone': '(02) 8929-5100',
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
    # ─── Super Admins (no location) ───
    {'name': 'System Administrator', 'username': 'sysadmin', 'email': 'superadmin@ecopoints.com', 'role': 'superadmin', 'locId': None, 'lastLogin': '2026-03-10T08:30:00'},
    {'name': 'Chief Technology Officer', 'username': 'cto', 'email': 'cto@ecopoints.com', 'role': 'superadmin', 'locId': None, 'lastLogin': '2026-03-08T14:20:00'},
    # ─── LOC-001 Arellano (5 admins) ───
    {'name': 'Maria Santos', 'username': 'msantos', 'email': 'head@arellano.edu.ph', 'role': 'head_admin', 'locId': 'LOC-001', 'lastLogin': '2026-03-12T09:15:00'},
    {'name': 'Roberto Garcia', 'username': 'rgarcia', 'email': 'rgarcia@arellano.edu.ph', 'role': 'auditor', 'locId': 'LOC-001', 'lastLogin': '2026-03-11T11:45:00'},
    {'name': 'Elena Cruz', 'username': 'ecruz', 'email': 'ecruz@arellano.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-001', 'lastLogin': '2026-03-10T16:30:00'},
    {'name': 'Carlos Reyes', 'username': 'creyes', 'email': 'tech@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'lastLogin': '2026-03-12T07:45:00'},
    {'name': 'Ana Lim', 'username': 'alim', 'email': 'alim@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'lastLogin': '2026-03-09T15:10:00'},
    # ─── LOC-002 PUP (4 admins) ───
    {'name': 'Rosa Aquino', 'username': 'raquino', 'email': 'head@pup.edu.ph', 'role': 'head_admin', 'locId': 'LOC-002', 'lastLogin': '2026-03-12T09:00:00'},
    {'name': 'Leo Bautista', 'username': 'lbautista', 'email': 'auditor@pup.edu.ph', 'role': 'auditor', 'locId': 'LOC-002', 'lastLogin': '2026-03-11T10:30:00'},
    {'name': 'Carmen Diaz', 'username': 'cdiaz', 'email': 'inventory@pup.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-002', 'lastLogin': '2026-03-10T14:15:00'},
    {'name': 'Rico Fernandez', 'username': 'rfernandez', 'email': 'tech@pup.edu.ph', 'role': 'technician', 'locId': 'LOC-002', 'lastLogin': '2026-03-12T07:45:00'},
    # ─── LOC-003 DLSU (4 admins) ───
    {'name': 'Antonio Uy', 'username': 'auy', 'email': 'head@dlsu.edu.ph', 'role': 'head_admin', 'locId': 'LOC-003', 'lastLogin': '2026-03-11T08:00:00'},
    {'name': 'Bianca Villanueva', 'username': 'bvillanueva', 'email': 'auditor@dlsu.edu.ph', 'role': 'auditor', 'locId': 'LOC-003', 'lastLogin': '2026-03-10T10:00:00'},
    {'name': 'Dante Ramos', 'username': 'dramos', 'email': 'inventory@dlsu.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-003', 'lastLogin': '2026-03-09T13:00:00'},
    {'name': 'Elisa Tan', 'username': 'etan', 'email': 'tech@dlsu.edu.ph', 'role': 'technician', 'locId': 'LOC-003', 'lastLogin': '2026-03-12T06:30:00'},
    # ─── LOC-004 Ayala (3 admins) ───
    {'name': 'Frances Gomez', 'username': 'fgomez', 'email': 'head@ayala.com.ph', 'role': 'head_admin', 'locId': 'LOC-004', 'lastLogin': '2026-03-12T08:30:00'},
    {'name': 'George Lim', 'username': 'glim', 'email': 'auditor@ayala.com.ph', 'role': 'auditor', 'locId': 'LOC-004', 'lastLogin': '2026-03-11T09:45:00'},
    {'name': 'Hannah Sy', 'username': 'hsy', 'email': 'tech@ayala.com.ph', 'role': 'technician', 'locId': 'LOC-004', 'lastLogin': '2026-03-10T07:00:00'},
    # ─── LOC-005 Greenfield HOA (2 admins) ───
    {'name': 'Ivan Torres', 'username': 'itorres', 'email': 'head@greenfieldhoa.ph', 'role': 'head_admin', 'locId': 'LOC-005', 'lastLogin': '2026-03-11T09:00:00'},
    {'name': 'Julia Rivera', 'username': 'jrivera', 'email': 'tech@greenfieldhoa.ph', 'role': 'technician', 'locId': 'LOC-005', 'lastLogin': '2026-03-10T14:00:00'},
]

# Users per location: LOC-001=30, LOC-002=25, LOC-003=20, LOC-004=15, LOC-005=10   Total=100
USERS_PER_LOC = [
    ('LOC-001', 30,  'arellano.edu.ph'),
    ('LOC-002', 25,  'pup.edu.ph'),
    ('LOC-003', 20,  'dlsu.edu.ph'),
    ('LOC-004', 15,  'ayala.com.ph'),
    ('LOC-005', 10,  'greenfieldhoa.ph'),
]

MACHINES_DATA = [
    # LOC-001 Arellano (5 machines)
    {'id': 'RVM-AU-01', 'name': 'Main Gate RVM', 'locId': 'LOC-001', 'area': 'Main Gate', 'online': True, 'bottles': 12400},
    {'id': 'RVM-AU-02', 'name': 'Canteen RVM-A', 'locId': 'LOC-001', 'area': 'Canteen', 'online': True, 'bottles': 9800},
    {'id': 'RVM-AU-03', 'name': 'Canteen RVM-B', 'locId': 'LOC-001', 'area': 'Canteen', 'online': True, 'bottles': 7200},
    {'id': 'RVM-AU-04', 'name': 'Library RVM', 'locId': 'LOC-001', 'area': 'Library', 'online': True, 'bottles': 5600},
    {'id': 'RVM-AU-05', 'name': 'Gym RVM', 'locId': 'LOC-001', 'area': 'Gymnasium', 'online': False, 'bottles': 4200},
    # LOC-002 PUP (4 machines)
    {'id': 'RVM-PU-01', 'name': 'Main Entrance RVM', 'locId': 'LOC-002', 'area': 'Main Entrance', 'online': True, 'bottles': 8900},
    {'id': 'RVM-PU-02', 'name': 'Canteen RVM', 'locId': 'LOC-002', 'area': 'Student Canteen', 'online': True, 'bottles': 7500},
    {'id': 'RVM-PU-03', 'name': 'Library RVM', 'locId': 'LOC-002', 'area': 'Ninoy Aquino Library', 'online': True, 'bottles': 5100},
    {'id': 'RVM-PU-04', 'name': 'Engineering RVM', 'locId': 'LOC-002', 'area': 'Engineering Building', 'online': False, 'bottles': 3200},
    # LOC-003 DLSU (4 machines)
    {'id': 'RVM-DL-01', 'name': 'Taft Gate RVM', 'locId': 'LOC-003', 'area': 'Taft Gate', 'online': True, 'bottles': 7600},
    {'id': 'RVM-DL-02', 'name': 'Henry Sy Hall RVM', 'locId': 'LOC-003', 'area': 'Henry Sy Hall', 'online': True, 'bottles': 6200},
    {'id': 'RVM-DL-03', 'name': 'Gokongwei Hall RVM', 'locId': 'LOC-003', 'area': 'Gokongwei Hall', 'online': True, 'bottles': 4800},
    {'id': 'RVM-DL-04', 'name': 'SJ Walk RVM', 'locId': 'LOC-003', 'area': 'SJ Walk', 'online': False, 'bottles': 2300},
    # LOC-004 Ayala (3 machines)
    {'id': 'RVM-AY-01', 'name': 'Lobby RVM', 'locId': 'LOC-004', 'area': 'Main Lobby', 'online': True, 'bottles': 4500},
    {'id': 'RVM-AY-02', 'name': 'Pantry Floor 12 RVM', 'locId': 'LOC-004', 'area': 'Floor 12 Pantry', 'online': True, 'bottles': 3100},
    {'id': 'RVM-AY-03', 'name': 'Parking Basement RVM', 'locId': 'LOC-004', 'area': 'Basement Parking', 'online': True, 'bottles': 1800},
    # LOC-005 Greenfield (3 machines)
    {'id': 'RVM-GF-01', 'name': 'Clubhouse RVM', 'locId': 'LOC-005', 'area': 'Clubhouse', 'online': True, 'bottles': 3200},
    {'id': 'RVM-GF-02', 'name': 'Gate 1 RVM', 'locId': 'LOC-005', 'area': 'Main Gate', 'online': True, 'bottles': 2400},
    {'id': 'RVM-GF-03', 'name': 'Park RVM', 'locId': 'LOC-005', 'area': 'Central Park', 'online': False, 'bottles': 1100},
]

REWARDS_DATA = [
    # LOC-001
    {'name': 'EcoPoints T-Shirt', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 500, 'stock': 45, 'desc': 'Official EcoPoints branded T-shirt'},
    {'name': 'Metal Straw Set', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 150, 'stock': 120, 'desc': 'Set of 4 reusable metal straws with brush'},
    {'name': 'Bamboo Tumbler', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 800, 'stock': 20, 'desc': '500ml insulated bamboo tumbler'},
    {'name': 'Canteen Voucher (P50)', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 100, 'stock': 500, 'desc': 'P50 canteen food voucher'},
    {'name': 'Canteen Voucher (P100)', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 200, 'stock': 350, 'desc': 'P100 canteen food voucher'},
    {'name': 'School Supplies Kit', 'locId': 'LOC-001', 'cat': 'Education', 'pts': 200, 'stock': 200, 'desc': 'Notebook, pens, and highlighters'},
    # LOC-002
    {'name': 'PUP Eco Tumbler', 'locId': 'LOC-002', 'cat': 'Sustainable', 'pts': 700, 'stock': 30, 'desc': 'PUP-branded eco tumbler'},
    {'name': 'PUP T-Shirt', 'locId': 'LOC-002', 'cat': 'Merchandise', 'pts': 450, 'stock': 50, 'desc': 'PUP EcoPoints branded shirt'},
    {'name': 'Cafeteria Voucher (P50)', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 100, 'stock': 400, 'desc': 'P50 cafeteria voucher'},
    {'name': 'Cafeteria Voucher (P100)', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 200, 'stock': 250, 'desc': 'P100 cafeteria voucher'},
    # LOC-003
    {'name': 'DLSU Eco Bag', 'locId': 'LOC-003', 'cat': 'Merchandise', 'pts': 300, 'stock': 80, 'desc': 'Canvas tote bag with DLSU eco branding'},
    {'name': 'DLSU Tumbler', 'locId': 'LOC-003', 'cat': 'Sustainable', 'pts': 650, 'stock': 40, 'desc': 'Stainless steel tumbler with DLSU logo'},
    {'name': 'Agno Voucher (P50)', 'locId': 'LOC-003', 'cat': 'Voucher', 'pts': 100, 'stock': 300, 'desc': 'P50 Agno cafeteria voucher'},
    {'name': 'Agno Voucher (P100)', 'locId': 'LOC-003', 'cat': 'Voucher', 'pts': 200, 'stock': 200, 'desc': 'P100 Agno cafeteria voucher'},
    # LOC-004
    {'name': 'Ayala Eco Kit', 'locId': 'LOC-004', 'cat': 'Sustainable', 'pts': 400, 'stock': 60, 'desc': 'Bamboo utensil set + metal straw'},
    {'name': 'GCash Voucher (P100)', 'locId': 'LOC-004', 'cat': 'Voucher', 'pts': 200, 'stock': 150, 'desc': 'P100 GCash e-voucher'},
    {'name': 'GCash Voucher (P500)', 'locId': 'LOC-004', 'cat': 'Voucher', 'pts': 1000, 'stock': 30, 'desc': 'P500 GCash e-voucher'},
    # LOC-005
    {'name': 'HOA Eco Tumbler', 'locId': 'LOC-005', 'cat': 'Sustainable', 'pts': 500, 'stock': 35, 'desc': 'Greenfield-branded tumbler'},
    {'name': 'Grocery Voucher (P200)', 'locId': 'LOC-005', 'cat': 'Voucher', 'pts': 400, 'stock': 80, 'desc': 'P200 grocery voucher at SM'},
    {'name': 'Condo Dues Discount', 'locId': 'LOC-005', 'cat': 'Voucher', 'pts': 2000, 'stock': 10, 'desc': 'P500 off next month condo dues'},
]

FIRST_NAMES = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Miguel', 'Ana', 'Juan', 'Maria',
    'Carlos', 'Sofia', 'Luis', 'Andrea', 'Jose', 'Isabella', 'Mark', 'Angela',
    'Daniel', 'Christine', 'Paul', 'Katherine', 'Steven', 'Rachel', 'Kevin', 'Nicole',
    'Gabriel', 'Samantha', 'Nathan', 'Jasmine', 'Ethan', 'Vanessa', 'Joshua', 'Megan',
    'Adrian', 'Trisha', 'Bryan', 'Kimberly', 'Aldrin', 'Clarisse', 'Francis', 'Denise',
]

LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Santos', 'Reyes', 'Cruz',
    'Dela Cruz', 'Villanueva', 'Mendoza', 'Torres', 'Flores', 'Rivera', 'Ramos',
    'Aquino', 'Bautista', 'Diaz', 'Fernandez', 'Gutierrez', 'Tan', 'Lim', 'Uy',
    'Chua', 'Go', 'Sy', 'Ang', 'Co', 'Ong', 'Yu', 'Tiongson',
]

DETECTED_CLASSES = [
    'PET Bottle', 'Aluminum Can', 'Glass Bottle', 'Plastic Cup', 'Tetra Pak',
]

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
        print('[DROP] Dropping all tables...')
        db.drop_all()
        print('[CREATE] Creating all tables...')
        db.create_all()
    else:
        db.create_all()
        if User.query.first():
            print('Database already seeded. Use --fresh to re-seed.')
            return

    # ── 1. Org Types ───────────────────────────────────────────────────
    print('  [ 1/18] Org Types...')
    org_type_map = {}
    for ot_name in ORG_TYPES_DATA:
        ot = OrgType(name=ot_name)
        db.session.add(ot)
        db.session.flush()
        org_type_map[ot_name] = ot
    print(f'         -> {len(org_type_map)} org types')

    # ── 2. Organizations + Address + Contact ──────────────────────────
    print('  [ 2/16] Organizations...')
    org_map = {}  # 'LOC-001' -> Organization
    for loc in LOCATIONS:
        org = Organization(
            name=loc['name'],
            full_name=loc['fullName'],
            type_id=org_type_map[loc['type']].id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()
        addr = OrgAddress(
            organization_id=org.id,
            street_address=loc['street'], barangay=loc['barangay'],
            city_municipality=loc['city'], province=loc['province'],
            region=loc['region'], zip_code=loc['zip'],
        )
        db.session.add(addr)
        contact = OrgContact(
            organization_id=org.id,
            first_name=loc['contactFirst'], last_name=loc['contactLast'],
            email=loc['contactEmail'], phone_number=loc['contactPhone'],
        )
        db.session.add(contact)
        org_map[loc['id']] = org
    print(f'         -> {len(org_map)} organizations + addresses + contacts')

    # ── 3. Community Groups ────────────────────────────────────────────
    print('  [ 3/16] Community Groups...')
    cg_map = {}       # 'LOC-001:BSIT' -> CommunityGroup
    staff_cg = {}     # 'LOC-001' -> campus-staff CommunityGroup

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
    print(f'         -> {total_cg} community groups')

    # ── 4. Admin Users + Wallets ───────────────────────────────────────
    print('  [ 4/16] Admin Users...')
    admin_user_list = []
    for adm in ADMIN_USERS_DATA:
        loc_id = adm['locId']
        cg = global_admin_cg if loc_id is None else staff_cg[loc_id]
        abbr = 'SYS' if loc_id is None else _org_abbr(org_map[loc_id])
        parts = adm['name'].split()

        user = User(
            community_group_id=cg.id,
            first_name=parts[0], last_name=parts[-1],
            middle_name=' '.join(parts[1:-1]) if len(parts) > 2 else None,
            username=adm['username'], email=adm['email'],
            role=adm['role'], user_type='staff', is_active=True,
            last_login=datetime.fromisoformat(adm['lastLogin']).replace(tzinfo=timezone.utc),
        )
        user.set_password(PASSWORD)
        db.session.add(user)
        db.session.flush()
        user.display_id = User.generate_display_id(adm['role'], abbr)

        wallet = Wallet(user_id=user.id, points_balance=0, lifetime_points=0, streak=0)
        db.session.add(wallet)
        sec = UserSecurity(user_id=user.id, two_factor_enabled=False)
        db.session.add(sec)
        admin_user_list.append(user)

    print(f'         -> {len(admin_user_list)} admin users (pw: {PASSWORD})')

    # ── 5. End Users + Wallets (~100) ─────────────────────────────────
    print('  [ 5/16] End Users (~100)...')
    end_user_list = []
    end_users_by_loc = {}  # 'LOC-001' -> [User, ...]
    used_emails = set()
    global_start = datetime(2023, 1, 1, tzinfo=timezone.utc)
    global_end = datetime(2026, 3, 14, tzinfo=timezone.utc)

    for loc_id, count, domain in USERS_PER_LOC:
        loc_users = []
        for i in range(count):
            first = _pick(FIRST_NAMES)
            last = _pick(LAST_NAMES)
            base_email = f'{first.lower()}.{last.lower().replace(" ", "")}@{domain}'
            email = base_email
            suffix = 2
            while email in used_emails:
                email = f'{first.lower()}.{last.lower().replace(" ", "")}{suffix}@{domain}'
                suffix += 1
            used_emails.add(email)

            roll = _rand()
            user_type = None
            group_key = None

            if roll < 0.80:
                user_type = 'student'
                if _rand() < 0.4:
                    group_key = _pick(SHS_STRANDS)['id']
                else:
                    group_key = _pick(COLLEGE_DEPTS)['id']
            elif roll < 0.92:
                user_type = 'faculty'
                group_key = _pick(COLLEGE_DEPTS)['id']
            else:
                user_type = 'staff'

            cg = cg_map.get(f"{loc_id}:{group_key}", staff_cg[loc_id]) if group_key else staff_cg[loc_id]

            pts = _rand_int(0, 5000)
            streak = _rand_int(0, 40)
            loc_idx = [l[0] for l in USERS_PER_LOC].index(loc_id)
            loc_start = global_start + timedelta(days=loc_idx * 60)
            join = _rand_date(loc_start, global_end)

            user = User(
                community_group_id=cg.id,
                first_name=first, last_name=last,
                email=email, role='user', user_type=user_type,
                is_active=True,
                last_login=_rand_date(join, global_end),
                created_at=join,
            )
            user.set_password(PASSWORD)
            db.session.add(user)
            db.session.flush()
            user.display_id = User.generate_display_id('user', _org_abbr(org_map[loc_id]))

            wallet = Wallet(
                user_id=user.id, points_balance=pts,
                lifetime_points=pts + _rand_int(0, 2000),
                streak=streak, updated_at=join,
            )
            db.session.add(wallet)
            sec = UserSecurity(user_id=user.id, two_factor_enabled=False)
            db.session.add(sec)
            end_user_list.append(user)
            loc_users.append(user)

        end_users_by_loc[loc_id] = loc_users

    print(f'         -> {len(end_user_list)} end users')

    # ── 6. RVMs ────────────────────────────────────────────────────────
    print('  [ 6/16] RVMs...')
    rvm_map = {}
    for m in MACHINES_DATA:
        rvm = RVM(
            organization_id=org_map[m['locId']].id,
            machine_uuid=m['id'],
            name=m['name'],
            location_name=m['area'],
            is_online=m['online'],
        )
        db.session.add(rvm)
        db.session.flush()
        rvm_map[m['id']] = rvm
    print(f'         -> {len(rvm_map)} machines')

    # ── 7. Rewards + Variants ──────────────────────────────────────────
    print('  [ 7/16] Rewards...')
    reward_list = []
    for r in REWARDS_DATA:
        reward = Reward(
            organization_id=org_map[r['locId']].id,
            name=r['name'],
            description=r['desc'],
            category=r['cat'],
            points_required=r['pts'],
            is_active=True,
        )
        db.session.add(reward)
        db.session.flush()
        # Default variant
        variant = RewardVariant(
            reward_id=reward.id, variety_name='Default',
            stock_quantity=r['stock'], is_active=True,
        )
        db.session.add(variant)
        reward_list.append(reward)
    print(f'         -> {len(reward_list)} rewards')

    db.session.commit()
    print('  -- Reference data committed --')

    # ── 8-9. Recycling Sessions + Items (~3000 items) ────────────────
    print('  [ 8/16] Recycling Sessions...')
    print('  [ 9/16] Recycling Items (~3000)...')
    log_start = datetime(2023, 1, 15, tzinfo=timezone.utc)
    log_end = datetime(2026, 3, 14, tzinfo=timezone.utc)
    rvm_ids_list = list(rvm_map.keys())

    session_count = 0
    item_count = 0
    current_session = None
    items_in_session = 0

    for _ in range(3000):
        user = _pick(end_user_list)
        rvm_key = _pick(rvm_ids_list)
        rvm = rvm_map[rvm_key]
        det_class = _pick(DETECTED_CLASSES)
        log_dt = _rand_date(log_start, log_end)

        is_rejected = _rand() < 0.1
        pts = 0 if is_rejected else _rand_int(3, 10)
        status = 'Rejected' if is_rejected else 'Accepted'
        conf = round(_rand() * 30 + 70, 2)  # 70-100%

        # Get wallet for this user
        wallet = Wallet.query.filter_by(user_id=user.id).first()
        if not wallet:
            continue

        if current_session is None or items_in_session >= 5 or _rand() < 0.3:
            if current_session is not None:
                current_session.status = 'completed'
                current_session.end_time = log_dt
            current_session = RecyclingSession(
                rvm_id=rvm.id,
                wallet_id=wallet.id,
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
            detected_class=det_class,
            confidence_score=conf,
            points_awarded=pts,
            status=status,
            scanned_at=log_dt,
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
    print(f'         -> {item_count} items in {session_count} sessions')

    # ── 10. Transactions ───────────────────────────────────────────────
    print('  [10/16] Transactions...')
    txn_count = 0

    sessions = RecyclingSession.query.filter(RecyclingSession.total_points_earned > 0).all()
    for sess in sessions:
        wallet = db.session.get(Wallet, sess.wallet_id)
        if not wallet:
            continue
        bal_before = wallet.points_balance
        earned = sess.total_points_earned
        bal_after = bal_before + earned

        txn = Transaction(
            wallet_id=wallet.id,
            transaction_type='earn',
            amount=earned,
            balance_before=bal_before,
            balance_after=bal_after,
            reference_type='recycling_session',
            reference_id=sess.id,
            created_at=sess.end_time or sess.start_time,
        )
        db.session.add(txn)
        wallet.points_balance = bal_after
        txn_count += 1

    for _ in range(25):
        user = _pick(end_user_list)
        wallet = Wallet.query.filter_by(user_id=user.id).first()
        if not wallet:
            continue
        adj = _rand_int(-50, 100)
        bal_before = wallet.points_balance
        bal_after = max(0, bal_before + adj)
        adj_actual = bal_after - bal_before

        txn = Transaction(
            wallet_id=wallet.id,
            transaction_type='adjustment',
            amount=adj_actual,
            balance_before=bal_before,
            balance_after=bal_after,
            reference_type='admin_adjustment',
            reference_id=None,
            created_at=_rand_date(log_start, log_end),
        )
        db.session.add(txn)
        wallet.points_balance = bal_after
        txn_count += 1

    db.session.commit()
    print(f'         -> {txn_count} transactions')

    # ── 11. Reward Redemptions (200) ──────────────────────────────────
    print('  [11/16] Reward Redemptions (200)...')
    statuses = ['claimed', 'pending']
    redeem_txn_count = 0

    for _ in range(200):
        user = _pick(end_user_list)
        reward = _pick(reward_list)
        # Get default variant
        variant = RewardVariant.query.filter_by(reward_id=reward.id, variety_name='Default').first()
        if not variant:
            continue
        wallet = Wallet.query.filter_by(user_id=user.id).first()
        if not wallet:
            continue

        chosen_status = _pick(statuses)
        red_dt = _rand_date(log_start + timedelta(days=30), log_end)
        code = f'RDM-{uuid.uuid4().hex[:8].upper()}'

        rr = RewardRedemption(
            wallet_id=wallet.id,
            variant_id=variant.id,
            points_spent=reward.points_required,
            status=chosen_status,
            redemption_code=code,
            redeemed_at=red_dt,
            claimed_at=red_dt if chosen_status == 'claimed' else None,
        )
        db.session.add(rr)
        db.session.flush()

        bal_before = wallet.points_balance
        spent = reward.points_required
        bal_after = max(0, bal_before - spent)

        txn = Transaction(
            wallet_id=wallet.id,
            transaction_type='redeem',
            amount=-spent,
            balance_before=bal_before,
            balance_after=bal_after,
            reference_type='redemption',
            reference_id=rr.id,
            created_at=red_dt,
        )
        db.session.add(txn)
        wallet.points_balance = bal_after
        redeem_txn_count += 1

    db.session.commit()
    print(f'         -> 200 redemptions + {redeem_txn_count} redeem transactions')

    # ── 12. Maintenance Logs (150) ─────────────────────────────────────
    print('  [12/16] Maintenance Logs (150)...')
    techs = [u for u in admin_user_list if u.role in ('technician', 'head_admin')]

    for _ in range(150):
        rvm = rvm_map[_pick(rvm_ids_list)]
        tech = _pick(techs)
        issue = _pick(ISSUES)
        log_dt = _rand_date(log_start, log_end)
        is_resolved = _rand_bool(0.8)

        ml = MaintenanceLog(
            rvm_id=rvm.id,
            performed_by_id=tech.id,
            action_type=issue,
            status='Resolved' if is_resolved else 'Pending',
            notes='Issue fixed successfully' if is_resolved else 'Awaiting parts/review',
            created_at=log_dt,
        )
        db.session.add(ml)
    db.session.commit()
    print('         -> 150 maintenance logs')

    # ── 13. Admin Logs (250) ───────────────────────────────────────────
    print('  [13/16] Admin Logs (250)...')

    for _ in range(250):
        admin = _pick(admin_user_list)
        action_text, category = _pick(ADMIN_ACTIONS)
        log_dt = _rand_date(log_start, log_end)

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
            created_at=log_dt,
        )
        db.session.add(al)
    db.session.commit()
    print('         -> 250 admin logs')

    # ── 14. Notification Settings (defaults for each org) ──────────────
    print('  [14/16] Notification Settings...')
    from ..services.notification_service import ALERT_TYPES
    notif_count = 0
    for org in org_map.values():
        for key, info in ALERT_TYPES.items():
            ns = NotificationSetting(
                organization_id=org.id,
                alert_key=key,
                email_enabled=True,
                sms_enabled=False,
                threshold=info.get('default_threshold'),
                recipients_json='[]',
                is_active=True,
            )
            db.session.add(ns)
            notif_count += 1
        # Also seed points config row (simulated via NotificationSetting threshold/json)
        pts = NotificationSetting(
            organization_id=org.id,
            alert_key='config_points',
            email_enabled=False,
            sms_enabled=False,
            threshold=None,
            recipients_json='{"smallWithLabel":5,"smallNoLabel":3,"mediumWithLabel":8,"mediumNoLabel":5,"largeWithLabel":10,"largeNoLabel":7}',
            is_active=True,
        )
        db.session.add(pts)
        notif_count += 1
    db.session.commit()
    print(f'         -> {notif_count} notification settings')

    # ── 15. Notification Logs (sample) ─────────────────────────────────
    print('  [15/16] Notification Logs...')
    now = datetime.now(timezone.utc)
    sample_alerts = ['low_reward_stock', 'machine_offline', 'new_user_registered', 'new_redemption']
    nl_count = 0
    for org in org_map.values():
        for i, ak in enumerate(sample_alerts):
            nl = NotificationLog(
                organization_id=org.id,
                alert_key=ak,
                channel='email',
                recipient=f'admin@{org.name.lower().replace(" ", "")}.com',
                subject=f'[EcoPoints] {ak.replace("_", " ").title()} Alert',
                body_preview=f'Sample notification for {ak}',
                status='sent',
                error_message=None,
                sent_at=now - timedelta(hours=i * 6),
            )
            db.session.add(nl)
            nl_count += 1
    db.session.commit()
    print(f'         -> {nl_count} notification logs')

    # ── 16. Bulk Deposits (sample) ─────────────────────────────────────
    print('  [16/16] Bulk Deposits...')
    from ..models import BulkDeposit
    bulk_count = 0
    admins = [u for u in admin_user_list if u.role in ('head_admin', 'superadmin')]
    for org_id, org in org_map.items():
        users_in_org = [u for u in end_user_list if u.community_group.organization_id == org.id]
        if not users_in_org: continue
        
        for _ in range(2):
            user = _pick(users_in_org)
            wallet = Wallet.query.filter_by(user_id=user.id).first()
            admin = _pick(admins)
            
            pts = _rand_int(100, 500)
            items = _rand_int(10, 50)
            
            bd = BulkDeposit(
                admin_user_id=admin.id,
                wallet_id=wallet.id,
                total_points_awarded=pts,
                item_count=items,
                notes=f'User dropped off {items} items. Manual credit.',
                created_at=now - timedelta(days=_rand_int(1, 30))
            )
            db.session.add(bd)
            db.session.flush()
            
            # Create transaction for bulk deposit
            txn = Transaction(
                wallet_id=wallet.id,
                transaction_type='bulk_transaction',
                amount=pts,
                balance_before=wallet.points_balance,
                balance_after=wallet.points_balance + pts,
                reference_type='bulk_deposit',
                reference_id=bd.id,
                created_at=bd.created_at
            )
            db.session.add(txn)
            wallet.points_balance += pts
            bulk_count += 1
            
    db.session.commit()
    print(f'         -> {bulk_count} bulk deposits')

    # ── Summary ────────────────────────────────────────────────────────
    print()
    print('=' * 55)
    print('  SEED COMPLETE - All 19 tables populated')
    print('=' * 55)
    counts = {
        'OrgTypes': OrgType.query.count(),
        'Organizations': Organization.query.count(),
        'OrgAddresses': OrgAddress.query.count(),
        'OrgContacts': OrgContact.query.count(),
        'Community Groups': CommunityGroup.query.count(),
        'Users': User.query.count(),
        'Wallets': Wallet.query.count(),
        'User Security': UserSecurity.query.count(),
        'RVMs': RVM.query.count(),
        'Recycling Sessions': RecyclingSession.query.count(),
        'Recycling Items': RecyclingItem.query.count(),
        'Transactions': Transaction.query.count(),
        'Rewards': Reward.query.count(),
        'Reward Variants': RewardVariant.query.count(),
        'Reward Redemptions': RewardRedemption.query.count(),
        'Maintenance Logs': MaintenanceLog.query.count(),
        'Admin Logs': AdminLog.query.count(),
        'Bulk Deposits': BulkDeposit.query.count(),
        'Notification Settings': NotificationSetting.query.count(),
        'Notification Logs': NotificationLog.query.count(),
    }
    for table, count in counts.items():
        print(f'  {table:.<30s} {count}')
    print()
    print(f'  Admin login:  sysadmin / {PASSWORD}')
    print(f'  All users:    {PASSWORD}')
    print()