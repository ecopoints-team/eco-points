"""
EcoPoints Phase 2 — Database Seed Script
=========================================
Mirrors client/src/data/mockData.js exactly so the frontend sees
identical data whether it reads from mockData or from the API.

Usage:
    cd server
    python seed.py          # wipes & re-seeds
    python seed.py --keep   # only seeds if tables are empty
"""
import sys
import uuid
import random
from datetime import datetime, date, timedelta, timezone
from app import create_app, db
from app.models import (
    Organization, Area, CommunityGroup, Account, User, AccessCredential,
    RVM, RecyclingSession, RecyclingItem, BottlePricing, MaintenanceLog,
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
# RAW DATA  (copied verbatim from mockData.js)
# ══════════════════════════════════════════════════════════════════════════

CITIES = [
    {'id': 'CITY-001', 'name': 'Pasig City'},
    {'id': 'CITY-002', 'name': 'Manila'},
]

LOCATIONS = [
    {
        'id': 'LOC-001', 'name': 'Arellano University',
        'fullName': 'Arellano University - Andres Bonifacio Pasig Campus',
        'cityId': 'CITY-001', 'streetAddress': 'Pag-asa St, Caniogan, Pasig',
        'contactPerson': 'Admin Officer', 'contactEmail': 'admin@arellano.edu.ph',
        'contactPhone': '+63 2 8734 7371', 'joinDate': '2024-06-15', 'status': 'Active',
    },
    {
        'id': 'LOC-002', 'name': 'Polytechnic University',
        'fullName': 'Polytechnic University of the Philippines - Sta. Mesa',
        'cityId': 'CITY-002', 'streetAddress': 'Anonas St, Sta. Mesa, Manila',
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

AREAS_DATA = [
    {'id': 'AREA-001', 'name': 'Main Gate', 'locId': 'LOC-001'},
    {'id': 'AREA-002', 'name': 'Canteen', 'locId': 'LOC-001'},
    {'id': 'AREA-003', 'name': 'Library', 'locId': 'LOC-001'},
    {'id': 'AREA-004', 'name': 'Gymnasium', 'locId': 'LOC-001'},
    {'id': 'AREA-005', 'name': 'Nursing Building', 'locId': 'LOC-001'},
    {'id': 'AREA-006', 'name': 'Education Building', 'locId': 'LOC-001'},
    {'id': 'AREA-007', 'name': 'IT Building', 'locId': 'LOC-001'},
    {'id': 'AREA-008', 'name': 'Administration Building', 'locId': 'LOC-001'},
    {'id': 'AREA-009', 'name': 'Main Entrance', 'locId': 'LOC-002'},
    {'id': 'AREA-010', 'name': 'Student Canteen', 'locId': 'LOC-002'},
    {'id': 'AREA-011', 'name': 'Ninoy Aquino Library', 'locId': 'LOC-002'},
    {'id': 'AREA-012', 'name': 'Gymnasium Complex', 'locId': 'LOC-002'},
    {'id': 'AREA-013', 'name': 'Engineering Building', 'locId': 'LOC-002'},
]

BOTTLE_PRICING_DATA = {
    'small':   {'min': 290, 'max': 350,  'label': '290-350ml',   'wl': 5,  'nl': 3, 'rej': False},
    'medium':  {'min': 351, 'max': 500,  'label': '351-500ml',   'wl': 8,  'nl': 5, 'rej': False},
    'large':   {'min': 750, 'max': 1000, 'label': '750-1000ml',  'wl': 10, 'nl': 7, 'rej': False},
    'invalid': {'min': 1001,'max': 2000, 'label': '1001-2000ml', 'wl': 0,  'nl': 0, 'rej': True},
}

ROLES_PERMISSIONS = {
    'super_admin': {
        'dashboard': {'view': True, 'edit': True},
        'users': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'machines': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'rewards': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'leaderboards': {'view': True, 'edit': True},
        'logs': {'view': True, 'export': True, 'delete': True},
        'settings': {'view': True, 'edit': True},
    },
    'head_admin': {
        'dashboard': {'view': True, 'edit': True},
        'users': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'machines': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'rewards': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'leaderboards': {'view': True, 'edit': True},
        'logs': {'view': True, 'export': True, 'delete': False},
        'settings': {'view': True, 'edit': True},
    },
    'auditor': {
        'dashboard': {'view': True, 'edit': False},
        'users': {'view': True, 'edit': False, 'delete': False, 'create': False},
        'machines': {'view': True, 'edit': False, 'delete': False, 'create': False},
        'rewards': {'view': True, 'edit': False, 'delete': False, 'create': False},
        'leaderboards': {'view': True, 'edit': False},
        'logs': {'view': True, 'export': True, 'delete': False},
        'settings': {'view': True, 'edit': False},
    },
    'inventory_officer': {
        'dashboard': {'view': True, 'edit': False},
        'users': {'view': False, 'edit': False, 'delete': False, 'create': False},
        'machines': {'view': False, 'edit': False, 'delete': False, 'create': False},
        'rewards': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'leaderboards': {'view': True, 'edit': False},
        'logs': {'view': True, 'export': False, 'delete': False},
        'settings': {'view': True, 'edit': False},
    },
    'technician': {
        'dashboard': {'view': True, 'edit': False},
        'users': {'view': False, 'edit': False, 'delete': False, 'create': False},
        'machines': {'view': True, 'edit': True, 'delete': True, 'create': True},
        'rewards': {'view': False, 'edit': False, 'delete': False, 'create': False},
        'leaderboards': {'view': True, 'edit': False},
        'logs': {'view': True, 'export': False, 'delete': False},
        'settings': {'view': True, 'edit': False},
    },
}

ADMIN_USERS_DATA = [
    # Super Admins
    {'name': 'System Administrator', 'username': 'sysadmin', 'email': 'superadmin@ecopoints.com', 'role': 'super_admin', 'locId': None, 'avatar': 'SA', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-06-15T08:30:00'},
    {'name': 'Chief Technology Officer', 'username': 'cto', 'email': 'cto@ecopoints.com', 'role': 'super_admin', 'locId': None, 'avatar': 'CT', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-06-13T14:20:00'},
    # Head Admins
    {'name': 'Maria Santos', 'username': 'msantos', 'email': 'head@arellano.edu.ph', 'role': 'head_admin', 'locId': 'LOC-001', 'avatar': 'MS', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-06-15T09:15:00'},
    {'name': 'Roberto Garcia', 'username': 'rgarcia', 'email': 'rgarcia@arellano.edu.ph', 'role': 'head_admin', 'locId': 'LOC-001', 'avatar': 'RG', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-06-14T11:45:00'},
    {'name': 'Elena Cruz', 'username': 'ecruz', 'email': 'ecruz@arellano.edu.ph', 'role': 'head_admin', 'locId': 'LOC-001', 'avatar': 'EC', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-06-12T16:30:00'},
    # Auditors
    {'name': 'Juan Dela Cruz', 'username': 'jdelacruz', 'email': 'auditor@arellano.edu.ph', 'role': 'auditor', 'locId': 'LOC-001', 'avatar': 'JD', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-06-15T10:00:00'},
    {'name': 'Angela Reyes', 'username': 'areyes', 'email': 'areyes@arellano.edu.ph', 'role': 'auditor', 'locId': 'LOC-001', 'avatar': 'AR', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-06-10T13:20:00'},
    {'name': 'Mark Gonzales', 'username': 'mgonzales', 'email': 'mgonzales@arellano.edu.ph', 'role': 'auditor', 'locId': 'LOC-001', 'avatar': 'MG', 'status': 'Offline', 'health': 'Inactive', 'lastLogin': '2024-05-11T09:45:00'},
    # Inventory Officers
    {'name': 'Ana Lim', 'username': 'alim', 'email': 'inventory@arellano.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-001', 'avatar': 'AL', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-06-15T08:15:00'},
    {'name': 'Patricia Tan', 'username': 'ptan', 'email': 'ptan@arellano.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-001', 'avatar': 'PT', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-06-13T15:10:00'},
    {'name': 'Jose Mendoza', 'username': 'jmendoza', 'email': 'jmendoza@arellano.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-001', 'avatar': 'JM', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-06-08T10:30:00'},
    # Technicians
    {'name': 'Carlos Reyes', 'username': 'creyes', 'email': 'tech@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'avatar': 'CR', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-06-15T07:45:00'},
    {'name': 'Miguel Santos', 'username': 'misantos', 'email': 'msantos@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'avatar': 'MS', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-06-14T14:50:00'},
    {'name': 'Fernando Lopez', 'username': 'flopez', 'email': 'flopez@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'avatar': 'FL', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-06-11T16:15:00'},
    {'name': 'David Villanueva', 'username': 'dvillanueva', 'email': 'dvillanueva@arellano.edu.ph', 'role': 'technician', 'locId': 'LOC-001', 'avatar': 'DV', 'status': 'Offline', 'health': 'Inactive', 'lastLogin': '2024-05-06T11:20:00'},
    # LOC-002 admins
    {'name': 'Rosa Aquino', 'username': 'raquino', 'email': 'head@pup.edu.ph', 'role': 'head_admin', 'locId': 'LOC-002', 'avatar': 'RA', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-09-15T09:00:00'},
    {'name': 'Leo Bautista', 'username': 'lbautista', 'email': 'auditor@pup.edu.ph', 'role': 'auditor', 'locId': 'LOC-002', 'avatar': 'LB', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-09-14T10:30:00'},
    {'name': 'Carmen Diaz', 'username': 'cdiaz', 'email': 'inventory@pup.edu.ph', 'role': 'inventory_officer', 'locId': 'LOC-002', 'avatar': 'CD', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-09-13T14:15:00'},
    {'name': 'Rico Fernandez', 'username': 'rfernandez', 'email': 'tech@pup.edu.ph', 'role': 'technician', 'locId': 'LOC-002', 'avatar': 'RF', 'status': 'Online', 'health': 'Active', 'lastLogin': '2024-09-15T07:45:00'},
    {'name': 'Lorna Gutierrez', 'username': 'lgutierrez', 'email': 'tech2@pup.edu.ph', 'role': 'technician', 'locId': 'LOC-002', 'avatar': 'LG', 'status': 'Offline', 'health': 'Active', 'lastLogin': '2024-09-12T16:00:00'},
]

MACHINES_DATA = [
    {'id': 'RVM-AU-01', 'name': 'Main Gate RVM', 'locId': 'LOC-001', 'areaId': 'AREA-001', 'status': 'Online', 'bottles': 4520, 'points': 22600, 'maint': '2025-01-20'},
    {'id': 'RVM-AU-02', 'name': 'Canteen RVM-A', 'locId': 'LOC-001', 'areaId': 'AREA-002', 'status': 'Online', 'bottles': 3850, 'points': 19250, 'maint': '2025-01-22'},
    {'id': 'RVM-AU-03', 'name': 'Canteen RVM-B', 'locId': 'LOC-001', 'areaId': 'AREA-002', 'status': 'Online', 'bottles': 2800, 'points': 14000, 'maint': '2025-01-23'},
    {'id': 'RVM-AU-04', 'name': 'Library RVM', 'locId': 'LOC-001', 'areaId': 'AREA-003', 'status': 'Online', 'bottles': 2100, 'points': 10500, 'maint': '2025-01-15'},
    {'id': 'RVM-AU-05', 'name': 'Gym RVM', 'locId': 'LOC-001', 'areaId': 'AREA-004', 'status': 'Maintenance', 'bottles': 3100, 'points': 15500, 'maint': '2025-01-25'},
    {'id': 'RVM-AU-06', 'name': 'Nursing Bldg RVM', 'locId': 'LOC-001', 'areaId': 'AREA-005', 'status': 'Online', 'bottles': 1850, 'points': 9250, 'maint': '2025-01-18'},
    {'id': 'RVM-PU-01', 'name': 'Main Entrance RVM', 'locId': 'LOC-002', 'areaId': 'AREA-009', 'status': 'Online', 'bottles': 3200, 'points': 16000, 'maint': '2025-01-19'},
    {'id': 'RVM-PU-02', 'name': 'Canteen RVM', 'locId': 'LOC-002', 'areaId': 'AREA-010', 'status': 'Online', 'bottles': 2900, 'points': 14500, 'maint': '2025-01-21'},
    {'id': 'RVM-PU-03', 'name': 'Library RVM', 'locId': 'LOC-002', 'areaId': 'AREA-011', 'status': 'Maintenance', 'bottles': 1800, 'points': 9000, 'maint': '2025-01-24'},
    {'id': 'RVM-PU-04', 'name': 'Engineering RVM', 'locId': 'LOC-002', 'areaId': 'AREA-013', 'status': 'Online', 'bottles': 1970, 'points': 9850, 'maint': '2025-01-17'},
]

REWARDS_DATA = [
    {'name': 'EcoPoints T-Shirt', 'sku': 'EP-TSHIRT-S', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 500, 'stock': 45, 'status': 'Available'},
    {'name': 'Metal Straw Set', 'sku': 'EP-STRAW', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 150, 'stock': 120, 'status': 'Available'},
    {'name': 'Bamboo Tumbler', 'sku': 'EP-TUMBLER', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 800, 'stock': 20, 'status': 'Low Stock'},
    {'name': 'Canvas Tote Bag', 'sku': 'EP-TOTE', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 300, 'stock': 68, 'status': 'Available'},
    {'name': 'School Supplies Kit', 'sku': 'EP-SCHOOL', 'locId': 'LOC-001', 'cat': 'Education', 'pts': 200, 'stock': 200, 'status': 'Available'},
    {'name': 'Canteen Voucher (P50)', 'sku': 'EP-VOUCHER-50', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 100, 'stock': 500, 'status': 'Available'},
    {'name': 'Canteen Voucher (P100)', 'sku': 'EP-VOUCHER-100', 'locId': 'LOC-001', 'cat': 'Voucher', 'pts': 200, 'stock': 350, 'status': 'Available'},
    {'name': 'Priority Enrollment', 'sku': 'EP-PRIO', 'locId': 'LOC-001', 'cat': 'Education', 'pts': 5000, 'stock': 10, 'status': 'Low Stock'},
    {'name': 'Eco Notebook', 'sku': 'EP-NOTEBOOK', 'locId': 'LOC-001', 'cat': 'Sustainable', 'pts': 120, 'stock': 150, 'status': 'Available'},
    {'name': 'Laptop Sticker Pack', 'sku': 'EP-STICKER', 'locId': 'LOC-001', 'cat': 'Merchandise', 'pts': 50, 'stock': 300, 'status': 'Available'},
    {'name': 'PUP Eco Tumbler', 'sku': 'PU-TUMBLER', 'locId': 'LOC-002', 'cat': 'Sustainable', 'pts': 700, 'stock': 30, 'status': 'Available'},
    {'name': 'PUP T-Shirt', 'sku': 'PU-TSHIRT', 'locId': 'LOC-002', 'cat': 'Merchandise', 'pts': 450, 'stock': 50, 'status': 'Available'},
    {'name': 'Cafeteria Voucher (P50)', 'sku': 'PU-VOUCHER-50', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 100, 'stock': 400, 'status': 'Available'},
    {'name': 'Cafeteria Voucher (P100)', 'sku': 'PU-VOUCHER-100', 'locId': 'LOC-002', 'cat': 'Voucher', 'pts': 200, 'stock': 250, 'status': 'Available'},
    {'name': 'Reusable Straw Kit', 'sku': 'PU-STRAW', 'locId': 'LOC-002', 'cat': 'Sustainable', 'pts': 120, 'stock': 180, 'status': 'Available'},
]

FIRST_NAMES = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Miguel','Ana','Juan','Maria','Carlos','Sofia','Luis','Andrea','Jose','Isabella','Mark','Angela','Daniel','Christine','Paul','Katherine','Steven','Rachel','Kevin','Nicole']
LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Santos','Reyes','Cruz','Dela Cruz','Villanueva','Mendoza','Torres','Flores','Rivera','Ramos']
SECTIONS = ['A','B','C','D']
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

def get_city_name(city_id):
    return next((c['name'] for c in CITIES if c['id'] == city_id), None)

def get_points(volume, has_label):
    if 290 <= volume <= 350:
        return 5 if has_label else 3
    elif 351 <= volume <= 500:
        return 8 if has_label else 5
    elif 750 <= volume <= 1000:
        return 10 if has_label else 7
    return 0

def get_size_category(volume):
    if 290 <= volume <= 350: return 'Small'
    if 351 <= volume <= 500: return 'Medium'
    if 750 <= volume <= 1000: return 'Large'
    if volume >= 1001: return 'Invalid'
    return 'Unknown'


# ══════════════════════════════════════════════════════════════════════════
# MAIN SEED FUNCTION
# ══════════════════════════════════════════════════════════════════════════

def seed():
    # Reset the PRNG so results are reproducible
    _seed_state[0] = 12345

    print('🗑️  Dropping all tables...')
    db.drop_all()
    print('🏗️  Creating all tables...')
    db.create_all()

    # ── 1. Organizations (from LOCATIONS) ──────────────────────────────
    print('  [1/12] Organizations...')
    org_map = {}  # 'LOC-001' → Organization instance
    for loc in LOCATIONS:
        org = Organization(
            name=loc['name'],
            full_name=loc['fullName'],
            org_type='University',
            city=get_city_name(loc['cityId']),
            street_address=loc['streetAddress'],
            contact_person=loc['contactPerson'],
            contact_email=loc['contactEmail'],
            contact_phone=loc['contactPhone'],
            status=loc['status'],
            join_date=date.fromisoformat(loc['joinDate']),
        )
        db.session.add(org)
        db.session.flush()  # Get the ID
        org_map[loc['id']] = org
    print(f'       → {len(org_map)} organizations')

    # ── 2. Areas ───────────────────────────────────────────────────────
    print('  [2/12] Areas...')
    area_map = {}  # 'AREA-001' → Area instance
    for a in AREAS_DATA:
        area = Area(
            organization_id=org_map[a['locId']].id,
            name=a['name'],
        )
        db.session.add(area)
        db.session.flush()
        area_map[a['id']] = area
    print(f'       → {len(area_map)} areas')

    # ── 3. Community Groups (from DEPARTMENTS) ─────────────────────────
    print('  [3/12] Community Groups...')
    cg_map = {}  # 'BSIT' → CommunityGroup instance
    # Create an "Admin" group for each org (for admin accounts)
    admin_cg = {}
    for loc_id, org in org_map.items():
        cg = CommunityGroup(
            organization_id=org.id,
            name='Administration',
            abbreviation='Admin',
            group_type='admin',
        )
        db.session.add(cg)
        db.session.flush()
        admin_cg[loc_id] = cg
    # A "Global Admin" group for super admins (tied to first org)
    global_admin_cg = CommunityGroup(
        organization_id=org_map['LOC-001'].id,
        name='Global Administration',
        abbreviation='GlobalAdmin',
        group_type='admin',
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
            # Key: "LOC-001:BSIT" so we can look up per-org
            cg_map[f"{org_loc_id}:{dept['id']}"] = cg
    print(f'       → {len(cg_map) + len(admin_cg) + 1} community groups')

    # ── 4. Bottle Pricing (per org) ────────────────────────────────────
    print('  [4/12] Bottle Pricing...')
    bp_count = 0
    for org in org_map.values():
        for size, bp in BOTTLE_PRICING_DATA.items():
            db.session.add(BottlePricing(
                organization_id=org.id,
                size_category=size,
                volume_min=bp['min'],
                volume_max=bp['max'],
                volume_label=bp['label'],
                points_with_label=bp['wl'],
                points_no_label=bp['nl'],
                is_rejected=bp['rej'],
            ))
            bp_count += 1
    print(f'       → {bp_count} pricing rules')

    # ── 5. Admin Users (20) ────────────────────────────────────────────
    print('  [5/12] Admin Users...')
    admin_user_list = []  # ordered list for reference later
    for adm in ADMIN_USERS_DATA:
        loc_id = adm['locId']
        org = org_map.get(loc_id)

        # Pick community group
        if loc_id is None:
            cg = global_admin_cg
        else:
            cg = admin_cg[loc_id]

        # Create Account
        acct = Account(
            community_group_id=cg.id,
            account_name=adm['name'],
            points_balance=0,
            bottles_collected=0,
            streak=0,
        )
        db.session.add(acct)
        db.session.flush()

        # Create User
        user = User(
            account_id=acct.id,
            organization_id=org.id if org else None,
            name=adm['name'],
            username=adm['username'],
            email=adm['email'],
            avatar=adm['avatar'],
            role=adm['role'],
            permissions=ROLES_PERMISSIONS.get(adm['role']),
            is_active=True,
            status=adm['status'],
            account_health=adm['health'],
            last_login=datetime.fromisoformat(adm['lastLogin']),
        )
        user.set_password('test123')
        db.session.add(user)
        db.session.flush()

        # QR credential for the admin
        cred = AccessCredential(
            account_id=acct.id,
            tag_id=str(uuid.uuid4()),
            credential_type='qr_code',
        )
        db.session.add(cred)

        admin_user_list.append(user)
    print(f'       → {len(admin_user_list)} admin users (all pw: test123)')

    # ── 6. End Users (200) ─────────────────────────────────────────────
    print('  [6/12] End Users (200)...')
    end_user_list = []
    used_emails = set()
    base_date = datetime(2024, 6, 1, tzinfo=timezone.utc)
    end_date = datetime(2026, 2, 23, tzinfo=timezone.utc)  # "now" for seed
    thirty_days_ago = end_date - timedelta(days=30)

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
        org = org_map[loc_id]

        # Role distribution: 80% Student, 12% Faculty, 8% Staff
        roll = seeded_random()
        edu_level = strand = dept_id = year_level = section = None
        if roll < 0.80:
            user_role = 'Student'
            if seeded_random() < 0.4:
                edu_level = 'shs'
                strand = pick(SHS_STRANDS)['id']
                year_level = 'Grade 11' if seeded_random() < 0.5 else 'Grade 12'
            else:
                edu_level = 'college'
                dept_id = pick(COLLEGE_DEPTS)['id']
                year_level = pick(YEAR_LEVELS)
            section = pick(SECTIONS)
        elif roll < 0.92:
            user_role = 'Faculty'
            dept_id = pick(COLLEGE_DEPTS)['id']
        else:
            user_role = 'Staff'
            dept_id = pick(COLLEGE_DEPTS)['id']

        # Find the right community group key
        group_key = strand or dept_id
        cg_key = f"{loc_id}:{group_key}" if group_key else None
        cg = cg_map.get(cg_key, admin_cg[loc_id])

        pts = rand_int(0, 5000)
        bottles = rand_int(0, 600)
        streak = rand_int(0, 40)
        join = rand_date(base_date, end_date)

        earliest = max(join, thirty_days_ago - timedelta(days=45))
        last_active = rand_date(earliest, end_date)
        days_since = (end_date - last_active).days
        health = 'Inactive' if days_since > 30 else 'Active'
        status = 'Online' if rand_bool(0.15) else 'Offline'

        acct = Account(
            community_group_id=cg.id,
            account_name=name,
            points_balance=pts,
            bottles_collected=bottles,
            streak=streak,
            created_at=join,
        )
        db.session.add(acct)
        db.session.flush()

        user = User(
            account_id=acct.id,
            organization_id=org.id,
            name=name,
            email=email,
            avatar=f'{first[0]}{last[0]}',
            role='user',
            user_role=user_role,
            education_level=edu_level,
            strand_id=strand,
            department_id=dept_id,
            year_level=year_level,
            section=section,
            status=status,
            account_health=health,
            is_active=True,
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

    # ── 7. RVMs (10 machines) ──────────────────────────────────────────
    print('  [7/12] RVMs...')
    rvm_map = {}  # mock id → RVM instance
    for m in MACHINES_DATA:
        rvm = RVM(
            organization_id=org_map[m['locId']].id,
            area_id=area_map[m['areaId']].id,
            machine_uuid=m['id'],
            name=m['name'],
            status=m['status'],
            is_online=(m['status'] == 'Online'),
            total_items_collected=m['bottles'],
            total_points_dispensed=m['points'],
            last_maintenance=date.fromisoformat(m['maint']),
        )
        db.session.add(rvm)
        db.session.flush()
        rvm_map[m['id']] = rvm
    print(f'       → {len(rvm_map)} machines')

    # ── 8. Rewards (15) ────────────────────────────────────────────────
    print('  [8/12] Rewards...')
    reward_list = []
    for r in REWARDS_DATA:
        reward = Reward(
            organization_id=org_map[r['locId']].id,
            name=r['name'],
            sku=r['sku'],
            category=r['cat'],
            points_required=r['pts'],
            stock_quantity=r['stock'],
            status=r['status'],
            is_active=True,
        )
        db.session.add(reward)
        db.session.flush()
        reward_list.append(reward)
    print(f'       → {len(reward_list)} rewards')

    # Commit what we have so far (all reference data)
    db.session.commit()
    print('  ── Reference data committed ──')

    # ── 9. Bottle Logs → Sessions + Items (500 items) ──────────────────
    print('  [9/12] Bottle Logs (500 items across sessions)...')
    log_end = datetime(2026, 2, 23, tzinfo=timezone.utc)
    log_start = log_end - timedelta(days=30)

    all_rvms = list(rvm_map.values())
    rvm_ids_list = list(rvm_map.keys())

    # Group items into sessions (batch ~5 items per session)
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
        status = 'Rejected' if is_rejected else 'Accepted'

        # Start a new session every ~5 items or if user/rvm changed
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
            item_type=f'{volume}ml PET',
            brand=brand,
            volume_ml=volume,
            condition=condition,
            size_category=get_size_category(volume),
            material='Plastic',
            weight_grams=round(seeded_random() * 30 + 10, 1),
            points_awarded=pts,
            status=status,
            deposited_at=log_dt,
        )
        db.session.add(item)
        current_session.item_count = (current_session.item_count or 0) + 1
        current_session.total_points_earned = (current_session.total_points_earned or 0) + pts
        items_in_session += 1
        item_count += 1

    # Close last session
    if current_session:
        current_session.status = 'completed'
        current_session.end_time = log_end

    db.session.commit()
    print(f'       → {item_count} items in {session_count} sessions')

    # ── 10. Machine Logs (50 maintenance logs) ─────────────────────────
    print('  [10/12] Maintenance Logs (50)...')
    techs = [u for u in admin_user_list if u.role in ('technician', 'head_admin')]
    maint_start = log_end - timedelta(days=60)

    for i in range(50):
        rvm_key = pick(rvm_ids_list)
        rvm = rvm_map[rvm_key]
        tech = pick(techs)
        issue = pick(ISSUES)
        log_dt = rand_date(maint_start, log_end)
        resolved = rand_bool(0.8)

        ml = MaintenanceLog(
            rvm_id=rvm.id,
            performed_by_id=tech.id,
            issue=issue,
            action_type=issue.lower().replace(' ', '_'),
            cost=rand_int(0, 2500),
            resolved=resolved,
            status='Resolved' if resolved else 'Pending',
            notes='Issue fixed successfully' if resolved else 'Awaiting parts/review',
            timestamp=log_dt,
        )
        db.session.add(ml)
    db.session.commit()
    print('       → 50 maintenance logs')

    # ── 11. Admin Logs (100) ───────────────────────────────────────────
    print('  [11/12] Admin Logs (100)...')
    admin_log_start = log_end - timedelta(days=14)
    area_ids_list = list(area_map.keys())

    for i in range(100):
        admin = pick(admin_user_list)
        action_text, category = pick(ADMIN_ACTIONS)
        log_dt = rand_date(admin_log_start, log_end)
        area_key = pick(area_ids_list)
        area = area_map[area_key]

        # Target
        if category == 'Users':
            target = f'USR-{rand_int(20240000, 20240199):08d}'
        elif category == 'Rewards':
            target = pick(REWARDS_DATA)['sku']
        elif category == 'Machines':
            target = pick(MACHINES_DATA)['name']
        else:
            target = '-'

        al = AdminLog(
            admin_id=admin.id,
            organization_id=admin.organization_id,
            area_id=area.id,
            action=action_text,
            target=target,
            category=category,
            notes=f'{action_text} performed successfully',
            status='Success',
            timestamp=log_dt,
        )
        db.session.add(al)
    db.session.commit()
    print('       → 100 admin logs')

    # ── 12. Reward Redemptions (100) ───────────────────────────────────
    print('  [12/12] Reward Redemptions (100)...')
    statuses = ['Redeemed', 'Pending', 'Cancelled']
    status_weights = [0.7, 0.2, 0.1]

    for i in range(100):
        user = pick(end_user_list)
        reward = pick(reward_list)

        # Weighted status
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

        notes_map = {
            'Cancelled': 'User cancelled request',
            'Pending': 'Awaiting approval',
            'Redeemed': 'Reward dispensed successfully',
        }

        rr = RewardRedemption(
            account_id=user.account_id,
            reward_id=reward.id,
            points_spent=reward.points_required,
            quantity=1,
            status=chosen_status,
            redemption_code=code,
            notes=notes_map[chosen_status],
            redeemed_at=red_dt,
            used_at=red_dt if chosen_status == 'Redeemed' else None,
        )
        db.session.add(rr)
    db.session.commit()
    print('       → 100 reward redemptions')

    # ── Summary ────────────────────────────────────────────────────────
    print()
    print('═' * 50)
    print('  ✅ SEED COMPLETE')
    print('═' * 50)
    counts = {
        'Organizations': Organization.query.count(),
        'Areas': Area.query.count(),
        'Community Groups': CommunityGroup.query.count(),
        'Accounts': Account.query.count(),
        'Users': User.query.count(),
        'Access Credentials': AccessCredential.query.count(),
        'RVMs': RVM.query.count(),
        'Bottle Pricing': BottlePricing.query.count(),
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
