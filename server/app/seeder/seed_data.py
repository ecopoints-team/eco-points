"""
Static data constants for the EcoPoints database seeder.
All lists are plain Python — no DB access here.
"""

# ══════════════════════════════════════════════════════════════════════════
# NAMES (Filipino)
# ══════════════════════════════════════════════════════════════════════════

FIRST_NAMES_MALE = [
    'Juan', 'Jose', 'Miguel', 'Carlos', 'Marco', 'Rafael', 'Antonio',
    'Gabriel', 'Andres', 'Ramon', 'Paolo', 'Diego', 'Emilio', 'Lorenzo',
    'Felipe', 'Alejandro', 'Adrian', 'Leo', 'Mateo', 'Sebastian',
    'Christian', 'Mark', 'John', 'Joshua', 'Kevin', 'Ryan', 'James',
    'Daniel', 'Kyle', 'Kenneth',
]

FIRST_NAMES_FEMALE = [
    'Maria', 'Ana', 'Isabella', 'Sofia', 'Gabriela', 'Camille', 'Nicole',
    'Patricia', 'Angela', 'Katherine', 'Bianca', 'Samantha', 'Janine',
    'Christine', 'Ashley', 'Michelle', 'Joy', 'Faith', 'Hope', 'Grace',
    'Francesca', 'Angelica', 'Trisha', 'Hannah', 'Kim', 'Paula',
    'Frances', 'Alyssa', 'Ysabel', 'Charm',
]

LAST_NAMES = [
    'Dela Cruz', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia',
    'Mendoza', 'Torres', 'Villanueva', 'Ramos', 'Gonzales', 'Fernandez',
    'Lopez', 'Martinez', 'Santiago', 'Castillo', 'Rivera', 'Aquino',
    'Navarro', 'Diaz', 'Pascual', 'Perez', 'Morales', 'Salazar',
    'Tan', 'Lim', 'Ong', 'Chua', 'Sy', 'Go',
]

EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com', 'protonmail.com']


# ══════════════════════════════════════════════════════════════════════════
# LOOKUP TABLES
# ══════════════════════════════════════════════════════════════════════════

ORG_TYPE_NAMES = ['University', 'Corporation', 'HOA', 'Barangay', 'Government Agency']

CITY_DEFS = [
    # (name, province, region)
    ('Pasig City', 'Metro Manila', 'NCR'),
    ('Manila', 'Metro Manila', 'NCR'),
    ('Quezon City', 'Metro Manila', 'NCR'),
    ('Makati', 'Metro Manila', 'NCR'),
    ('Taguig', 'Metro Manila', 'NCR'),
    ('Mandaluyong', 'Metro Manila', 'NCR'),
    ('San Juan', 'Metro Manila', 'NCR'),
    ('Marikina', 'Metro Manila', 'NCR'),
]


# ══════════════════════════════════════════════════════════════════════════
# ORGANIZATIONS  (each entry drives groups, RVMs, and user counts)
# ══════════════════════════════════════════════════════════════════════════

ORG_DEFS = [
    {
        'name': 'Arellano University',
        'full_name': 'Arellano University - Andres Bonifacio Pasig Campus',
        'org_type': 'University',
        'abbrev': 'AU',
        'street_address': 'Pag-asa St, Caniogan',
        'barangay': 'Caniogan',
        'city': 'Pasig City',
        'zip_code': '1600',
        'contact_person': 'Dr. Lourdes Arellano',
        'contact_email': 'admin@arellano.edu.ph',
        'contact_phone': '+63 2 8641 7371',
        'user_count': 60,
        'groups': [
            ('STEM', 'STEM', 'shs_strand'),
            ('ABM', 'ABM', 'shs_strand'),
            ('HUMSS', 'HUMSS', 'shs_strand'),
            ('Bachelor of Science in IT', 'BSIT', 'college'),
            ('Bachelor of Science in CS', 'BSCS', 'college'),
            ('Campus Staff', 'Staff', 'staff'),
        ],
        'rvms': [
            ('Main Gate RVM', 'Main Gate'),
            ('Canteen RVM', 'Canteen'),
            ('Library RVM', 'Library'),
        ],
    },
    {
        'name': 'PUP Sta. Mesa',
        'full_name': 'Polytechnic University of the Philippines - Sta. Mesa',
        'org_type': 'University',
        'abbrev': 'PUP',
        'street_address': 'Anonas St, Sta. Mesa',
        'barangay': 'Sta. Mesa',
        'city': 'Manila',
        'zip_code': '1016',
        'contact_person': 'Dr. Manuel Lopez',
        'contact_email': 'admin@pup.edu.ph',
        'contact_phone': '+63 2 5335 1787',
        'user_count': 50,
        'groups': [
            ('STEM', 'STEM', 'shs_strand'),
            ('ABM', 'ABM', 'shs_strand'),
            ('Bachelor of Science in IT', 'BSIT', 'college'),
            ('Bachelor of Science in Business Admin', 'BSBA', 'college'),
            ('Bachelor of Science in Nursing', 'BSN', 'college'),
            ('Campus Staff', 'Staff', 'staff'),
        ],
        'rvms': [
            ('Lobby RVM', 'Main Lobby'),
            ('Cafeteria RVM', 'Cafeteria'),
            ('East Wing RVM', 'East Wing'),
        ],
    },
    {
        'name': 'TIP Quezon City',
        'full_name': 'Technological Institute of the Philippines - QC',
        'org_type': 'University',
        'abbrev': 'TIP',
        'street_address': '938 Aurora Blvd, Cubao',
        'barangay': 'Cubao',
        'city': 'Quezon City',
        'zip_code': '1109',
        'contact_person': 'Engr. Roberto Tan',
        'contact_email': 'admin@tip.edu.ph',
        'contact_phone': '+63 2 8911 0964',
        'user_count': 40,
        'groups': [
            ('STEM', 'STEM', 'shs_strand'),
            ('Bachelor of Science in ECE', 'BSECE', 'college'),
            ('Bachelor of Science in CE', 'BSCE', 'college'),
            ('Bachelor of Science in IT', 'BSIT', 'college'),
            ('Campus Staff', 'Staff', 'staff'),
        ],
        'rvms': [
            ('Front Gate RVM', 'Front Gate'),
            ('Engineering Bldg RVM', 'Engineering Building'),
            ('Student Lounge RVM', 'Student Lounge'),
        ],
    },
    {
        'name': 'Greenfield Corp',
        'full_name': 'Greenfield Corporation - Makati HQ',
        'org_type': 'Corporation',
        'abbrev': 'GFC',
        'street_address': '123 Ayala Ave',
        'barangay': 'Bel-Air',
        'city': 'Makati',
        'zip_code': '1226',
        'contact_person': 'Atty. Sofia Reyes',
        'contact_email': 'sustainability@greenfield.com.ph',
        'contact_phone': '+63 2 8812 3456',
        'user_count': 30,
        'groups': [
            ('Engineering', 'ENG', 'college'),
            ('Marketing', 'MKT', 'college'),
            ('Human Resources', 'HR', 'college'),
            ('Admin Staff', 'Staff', 'staff'),
        ],
        'rvms': [
            ('Lobby RVM', 'Ground Floor Lobby'),
            ('Pantry 8F RVM', '8th Floor Pantry'),
            ('Parking RVM', 'Basement Parking'),
        ],
    },
    {
        'name': 'Brgy. San Antonio',
        'full_name': 'Barangay San Antonio - Community Center',
        'org_type': 'Barangay',
        'abbrev': 'BSA',
        'street_address': 'San Antonio Road',
        'barangay': 'San Antonio',
        'city': 'Pasig City',
        'zip_code': '1600',
        'contact_person': 'Kap. Roberto Garcia',
        'contact_email': 'brgy.sanantonio@pasig.gov.ph',
        'contact_phone': '+63 2 8123 4567',
        'user_count': 20,
        'groups': [
            ('Sangguniang Kabataan', 'SK', 'college'),
            ('Senior Citizens', 'SC', 'college'),
            ('Community Staff', 'Staff', 'staff'),
        ],
        'rvms': [
            ('Barangay Hall RVM', 'Barangay Hall'),
            ('Court RVM', 'Basketball Court'),
            ('Park RVM', 'Community Park'),
        ],
    },
]


# ══════════════════════════════════════════════════════════════════════════
# REWARDS
# ══════════════════════════════════════════════════════════════════════════

REWARD_TEMPLATES = [
    # (name, description, category, points_required, stock_quantity|None=infinite)
    ('EcoPoints T-Shirt', 'Organic cotton t-shirt with EcoPoints logo', 'Merchandise', 500, 50),
    ('Reusable Water Bottle', 'Stainless steel 500ml bottle', 'Merchandise', 300, 100),
    ('Canvas Tote Bag', 'Durable eco-friendly tote bag', 'Merchandise', 200, 80),
    ('Coffee Voucher', 'Free coffee at partner cafes', 'Voucher', 150, None),
    ('Grab 50 GC', 'GrabFood / GrabRide ₱50 gift card', 'Voucher', 250, None),
    ('Notebook Set', 'Recycled paper notebook set (3 pcs)', 'Sustainable', 100, 200),
    ('Bamboo Pen Set', 'Eco-friendly bamboo ballpen set', 'Sustainable', 80, 150),
    ('Movie Ticket', 'Single movie pass at SM Cinema', 'Voucher', 400, None),
    ('Succulent Plant Kit', 'DIY succulent planting kit', 'Sustainable', 350, 40),
    ('Eco Workshop Pass', 'Sustainability workshop attendance', 'Education', 450, 30),
]


# ══════════════════════════════════════════════════════════════════════════
# BOTTLE DEFINITIONS  (used by recycling item seeder)
# ══════════════════════════════════════════════════════════════════════════

BOTTLE_DEFS = [
    # (item_type, material, brand, volume_ml, condition, weight_grams, points)
    ('PET Bottle', 'Plastic', 'Coca-Cola', 350, 'With Label', 12, 2),
    ('PET Bottle', 'Plastic', 'Coca-Cola', 500, 'With Label', 18, 3),
    ('PET Bottle', 'Plastic', 'Coca-Cola', 1000, 'With Label', 30, 4),
    ('PET Bottle', 'Plastic', 'Pepsi', 500, 'With Label', 18, 3),
    ('PET Bottle', 'Plastic', 'Pepsi', 1000, 'No Label', 28, 5),
    ('PET Bottle', 'Plastic', 'Sprite', 350, 'No Label', 10, 3),
    ('PET Bottle', 'Plastic', 'Sprite', 500, 'With Label', 18, 3),
    ('PET Bottle', 'Plastic', 'Royal', 350, 'With Label', 12, 2),
    ('PET Bottle', 'Plastic', 'C2', 500, 'With Label', 16, 3),
    ('PET Bottle', 'Plastic', 'C2', 350, 'No Label', 10, 3),
    ('PET Bottle', 'Plastic', 'Mountain Dew', 500, 'With Label', 18, 3),
    ('PET Bottle', 'Plastic', 'Nestea', 500, 'No Label', 16, 4),
    ('PET Bottle', 'Plastic', 'Summit Water', 500, 'With Label', 14, 3),
    ('PET Bottle', 'Plastic', 'Absolute Water', 350, 'No Label', 10, 3),
    ('PET Bottle', 'Plastic', 'Nature Spring', 500, 'With Label', 14, 3),
]


# ══════════════════════════════════════════════════════════════════════════
# LOG ACTIONS
# ══════════════════════════════════════════════════════════════════════════

MAINTENANCE_ACTIONS = [
    'Sensor Calibration',
    'Bin Emptied',
    'Sensor Error Fix',
    'Software Update',
    'Routine Checkup',
    'Motor Replacement',
    'Display Repair',
    'Camera Cleaning',
]

ADMIN_LOG_ACTIONS = [
    # (action, category)
    ('User Created', 'Users'),
    ('User Updated', 'Users'),
    ('User Deactivated', 'Users'),
    ('Reward Created', 'Rewards'),
    ('Reward Updated', 'Rewards'),
    ('Machine Created', 'Machines'),
    ('Machine Updated', 'Machines'),
    ('Maintenance Added', 'Machines'),
    ('Location Created', 'Locations'),
    ('Location Updated', 'Locations'),
    ('Settings Updated', 'Settings'),
    ('Group Created', 'Users'),
]


# ══════════════════════════════════════════════════════════════════════════
# USER TYPE POOLS  (weighted by org_type)
# ══════════════════════════════════════════════════════════════════════════

USER_TYPES_UNIVERSITY = ['student', 'student', 'student', 'student', 'faculty', 'staff']
USER_TYPES_CORPORATE  = ['staff', 'staff', 'staff', 'faculty']
USER_TYPES_BARANGAY   = ['student', 'staff', 'staff']

YEAR_LEVELS_SHS     = ['Grade 11', 'Grade 12']
YEAR_LEVELS_COLLEGE = ['1st Year', '2nd Year', '3rd Year', '4th Year']
