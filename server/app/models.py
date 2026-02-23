import uuid
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from . import db


# ============================================================================
# Group 1: Multi-Tenant Identity (The Core)
# Maps to frontend: LOCATIONS, DEPARTMENTS, USERS, ADMIN_USERS
# ============================================================================

class Organization(db.Model):
    """
    The top-level tenant — a school, village, or corporation renting the system.
    Frontend equivalent: LOCATIONS[] (each location = one organization).
    """
    __tablename__ = 'organizations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)          # "Arellano University"
    full_name = db.Column(db.String(500))                     # "Arellano University - Andres Bonifacio Pasig Campus"
    org_type = db.Column(db.String(100), nullable=False)      # "University", "Corporation", "HOA"
    city = db.Column(db.String(200))                          # "Pasig City"
    street_address = db.Column(db.String(500))                # "Pag-asa St, Caniogan, Pasig"
    contact_person = db.Column(db.String(200))
    contact_email = db.Column(db.String(200))
    contact_phone = db.Column(db.String(50))
    status = db.Column(db.String(20), default='Active')       # Active, Inactive
    join_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    areas = db.relationship('Area', backref='organization', lazy=True, cascade='all, delete-orphan')
    community_groups = db.relationship('CommunityGroup', backref='organization', lazy=True, cascade='all, delete-orphan')
    rvms = db.relationship('RVM', backref='organization', lazy=True, cascade='all, delete-orphan')
    rewards = db.relationship('Reward', backref='organization', lazy=True, cascade='all, delete-orphan')
    bottle_pricing = db.relationship('BottlePricing', backref='organization', lazy=True, cascade='all, delete-orphan')
    admin_logs = db.relationship('AdminLog', backref='organization', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Organization {self.name}>'


class Area(db.Model):
    """
    A physical zone within a location (e.g., Main Gate, Canteen, Library).
    Frontend equivalent: AREAS[].
    """
    __tablename__ = 'areas'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)          # "Main Gate", "Canteen"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    rvms = db.relationship('RVM', backref='area', lazy=True)

    def __repr__(self):
        return f'<Area {self.name}>'


class CommunityGroup(db.Model):
    """
    Dynamic sub-groups for leaderboards and user classification.
    Frontend equivalent: DEPARTMENTS[] + SHS_STRANDS[] (group_type discriminates).
    University: "BSIT" (college), "STEM" (shs_strand)
    Village: "Block 4" (block)
    Corporate: "Floor 12" (floor)
    """
    __tablename__ = 'community_groups'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)          # "Bachelor of Science in IT"
    abbreviation = db.Column(db.String(50))                   # "BSIT"
    group_type = db.Column(db.String(50), nullable=False)     # "college", "shs_strand", "block", "floor", "admin"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    accounts = db.relationship('Account', backref='community_group', lazy=True)

    def __repr__(self):
        return f'<CommunityGroup {self.abbreviation or self.name} ({self.group_type})>'


class Account(db.Model):
    """
    The point wallet. Usually 1:1 with a User, but can be pooled
    (e.g., a Student Council or Department sharing one wallet).
    """
    __tablename__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    community_group_id = db.Column(db.Integer, db.ForeignKey('community_groups.id'), nullable=False)
    account_name = db.Column(db.String(200), nullable=False)  # "Juan Dela Cruz" or "CS Student Council"
    points_balance = db.Column(db.Integer, default=0)
    bottles_collected = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    users = db.relationship('User', backref='account', lazy=True)
    access_credentials = db.relationship('AccessCredential', backref='account', lazy=True)
    transactions = db.relationship('Transaction', backref='account', lazy=True)
    sessions = db.relationship('RecyclingSession', backref='account', lazy=True)
    redemptions = db.relationship('RewardRedemption', backref='account', lazy=True)

    def __repr__(self):
        return f'<Account {self.account_name} | {self.points_balance} pts>'


class User(db.Model):
    """
    A human who interacts with the system — admin or end-user.
    Frontend equivalent: ADMIN_USERS[] (admin roles) + USERS[] (end-user roles).

    Roles (matches frontend ROLES keys):
      Admin roles:  super_admin, head_admin, auditor, inventory_officer, technician
      End-user roles: user, maintenance, dependent

    The permissions JSON column stores the same structure as mockData.ROLES[role].permissions:
      { "dashboard": { "view": true, "edit": false }, "users": { ... }, ... }
    Only populated for admin roles. End-users don't need granular permissions.
    """
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=True)  # Scoped location for admins

    # Identity
    name = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=True)
    email = db.Column(db.String(200), unique=True, nullable=True)  # Nullable for dependents/fob-only users
    password_hash = db.Column(db.String(255), nullable=True)
    avatar = db.Column(db.String(10))                              # Initials, e.g. "JD"

    # Role & Permissions
    role = db.Column(db.String(30), default='user', nullable=False, index=True)
    permissions = db.Column(db.JSON, nullable=True)                # Granular RBAC for admin roles

    # Status
    is_active = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(20), default='Offline')           # Online, Offline
    account_health = db.Column(db.String(20), default='Active')    # Active, Inactive
    last_login = db.Column(db.DateTime, nullable=True)

    # Education (end-users at universities)
    education_level = db.Column(db.String(20), nullable=True)      # "shs", "college", null
    strand_id = db.Column(db.String(50), nullable=True)            # FK-like reference to community_group
    department_id = db.Column(db.String(50), nullable=True)        # FK-like reference to community_group
    year_level = db.Column(db.String(20), nullable=True)           # "1st Year", "Grade 11"
    section = db.Column(db.String(10), nullable=True)              # "A", "B", "C"
    user_role = db.Column(db.String(20), nullable=True)            # "Student", "Faculty", "Staff" (end-user sub-type)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    maintenance_logs = db.relationship('MaintenanceLog', backref='performed_by', lazy=True,
                                        foreign_keys='MaintenanceLog.performed_by_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role in ('super_admin', 'head_admin', 'auditor', 'inventory_officer', 'technician')

    def __repr__(self):
        return f'<User {self.name} ({self.role})>'


class AccessCredential(db.Model):
    """
    Decouples physical machine access from web login.
    A QR code on a phone or a 10-peso RFID keyfob.
    """
    __tablename__ = 'access_credentials'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    tag_id = db.Column(db.String(200), unique=True, nullable=False, index=True)  # UUID for QR or serial for RFID
    credential_type = db.Column(db.String(50), default='qr_code')                # 'qr_code', 'rfid'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def qr_payload(self):
        return f"USER:{self.tag_id}"

    def __repr__(self):
        return f'<AccessCredential {self.tag_id} ({self.credential_type})>'


# ============================================================================
# Group 2: Hardware & IoT (RVM Operations)
# Maps to frontend: MACHINES, BOTTLE_LOGS, MACHINE_LOGS, BOTTLE_PRICING
# ============================================================================

class RVM(db.Model):
    """
    A physical Reverse Vending Machine (Raspberry Pi).
    Frontend equivalent: MACHINES[].
    """
    __tablename__ = 'rvms'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'), nullable=True)

    machine_uuid = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)              # "Main Gate RVM"
    status = db.Column(db.String(20), default='Offline')          # Online, Offline, Maintenance
    is_online = db.Column(db.Boolean, default=False)
    last_heartbeat = db.Column(db.DateTime)

    # Capacity
    current_capacity = db.Column(db.Integer, default=0)
    max_capacity = db.Column(db.Integer, default=100)
    total_items_collected = db.Column(db.Integer, default=0)
    total_points_dispensed = db.Column(db.Integer, default=0)

    # Maintenance
    last_maintenance = db.Column(db.Date, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    sessions = db.relationship('RecyclingSession', backref='rvm', lazy=True)
    maintenance_logs = db.relationship('MaintenanceLog', backref='rvm', lazy=True)

    def __repr__(self):
        return f'<RVM {self.name} ({self.status})>'


class RecyclingSession(db.Model):
    """
    Opened when a user taps their QR/fob on the machine.
    Groups multiple RecyclingItems into one visit.
    """
    __tablename__ = 'recycling_sessions'
    id = db.Column(db.Integer, primary_key=True)
    rvm_id = db.Column(db.Integer, db.ForeignKey('rvms.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)

    start_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime, nullable=True)
    total_points_earned = db.Column(db.Integer, default=0)
    item_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active')           # active, completed, timed_out

    # Relationships
    items = db.relationship('RecyclingItem', backref='session', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<RecyclingSession {self.id} ({self.status})>'


class RecyclingItem(db.Model):
    """
    A single bottle deposited during a session.
    Frontend equivalent: BOTTLE_LOGS[] (each log = one item).
    """
    __tablename__ = 'recycling_items'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('recycling_sessions.id'), nullable=False)

    item_type = db.Column(db.String(100), nullable=False)         # "350ml PET"
    brand = db.Column(db.String(100), nullable=True)              # "Coca-Cola"
    volume_ml = db.Column(db.Integer, nullable=True)              # 350
    condition = db.Column(db.String(20), nullable=True)           # "With Label", "No Label", "Rejected"
    size_category = db.Column(db.String(20), nullable=True)       # "Small", "Medium", "Large", "Invalid"
    material = db.Column(db.String(100), default='Plastic')       # "Plastic", "Aluminum"
    weight_grams = db.Column(db.Float, default=0.0)
    points_awarded = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='Accepted')         # "Accepted", "Rejected"
    deposited_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<RecyclingItem {self.item_type} | {self.points_awarded} pts>'


class BottlePricing(db.Model):
    """
    Configurable points table per organization and size category.
    Frontend equivalent: BOTTLE_PRICING (but per-org in DB).
    """
    __tablename__ = 'bottle_pricing'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    size_category = db.Column(db.String(20), nullable=False)      # "small", "medium", "large", "invalid"
    volume_min = db.Column(db.Integer, nullable=False)            # 290
    volume_max = db.Column(db.Integer, nullable=False)            # 350
    volume_label = db.Column(db.String(50))                       # "290-350ml"
    points_with_label = db.Column(db.Integer, default=0)          # 5
    points_no_label = db.Column(db.Integer, default=0)            # 3
    is_rejected = db.Column(db.Boolean, default=False)            # True for "invalid" size

    def __repr__(self):
        return f'<BottlePricing {self.size_category} ({self.volume_label})>'


class MaintenanceLog(db.Model):
    """
    Logs maintenance/repair actions on RVMs.
    Frontend equivalent: MACHINE_LOGS[].
    """
    __tablename__ = 'maintenance_logs'
    id = db.Column(db.Integer, primary_key=True)
    rvm_id = db.Column(db.Integer, db.ForeignKey('rvms.id'), nullable=False)
    performed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    issue = db.Column(db.String(200), nullable=False)             # "Sensor Error", "Bin Full"
    action_type = db.Column(db.String(50))                        # "emptied_bin", "cleaned_sensor"
    cost = db.Column(db.Integer, default=0)                       # Repair cost in whole units
    resolved = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='Pending')          # "Resolved", "Pending"
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Optional: link to compensation transaction for maintenance staff
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=True)

    def __repr__(self):
        return f'<MaintenanceLog {self.issue} ({self.status})>'


# ============================================================================
# Group 3: Economy (Points & Rewards)
# Maps to frontend: Transactions, REWARDS, REWARDS_LOGS
# ============================================================================

class Transaction(db.Model):
    """
    Double-entry ledger for all point movements.
    Records balance_before and balance_after for audit trail.
    """
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)

    transaction_type = db.Column(db.String(50), nullable=False)   # "earn", "redeem", "adjustment"
    amount = db.Column(db.Integer, nullable=False)                # + for earn, - for redeem
    balance_before = db.Column(db.Integer, nullable=False)
    balance_after = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255))
    reference_id = db.Column(db.String(100))                      # Session ID, Redemption ID, etc.
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Transaction {self.transaction_type} {self.amount:+d} pts>'


class Reward(db.Model):
    """
    A redeemable item offered by a specific Organization.
    Frontend equivalent: REWARDS[].
    """
    __tablename__ = 'rewards'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)

    name = db.Column(db.String(200), nullable=False)              # "EcoPoints T-Shirt"
    sku = db.Column(db.String(50), nullable=True)                 # "EP-TSHIRT-S"
    description = db.Column(db.Text)
    category = db.Column(db.String(100))                          # "Merchandise", "Voucher", "Sustainable"
    points_required = db.Column(db.Integer, nullable=False)       # Cost in points
    stock_quantity = db.Column(db.Integer, nullable=True)          # Nullable = infinite digital goods
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(20), default='Available')        # "Available", "Low Stock", "Out of Stock"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    redemptions = db.relationship('RewardRedemption', backref='reward', lazy=True)

    def __repr__(self):
        return f'<Reward {self.name} ({self.points_required} pts)>'


class RewardRedemption(db.Model):
    """
    A digital voucher created when a user redeems points for a reward.
    Frontend equivalent: REWARDS_LOGS[].
    """
    __tablename__ = 'reward_redemptions'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)

    points_spent = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='Pending')          # "Redeemed", "Pending", "Cancelled", "Expired"
    redemption_code = db.Column(db.String(50), unique=True, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    redeemed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    used_at = db.Column(db.DateTime, nullable=True)

    @property
    def qr_payload(self):
        return f"REDEEM:{self.redemption_code}"

    def __repr__(self):
        return f'<RewardRedemption {self.redemption_code} ({self.status})>'


# ============================================================================
# Group 4: Audit Trail
# Maps to frontend: ADMIN_LOGS
# ============================================================================

class AdminLog(db.Model):
    """
    Tracks all admin actions for accountability.
    Frontend equivalent: ADMIN_LOGS[].
    """
    __tablename__ = 'admin_logs'
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=True)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'), nullable=True)

    action = db.Column(db.String(100), nullable=False)            # "User Created", "Reward Added"
    target = db.Column(db.String(200))                            # ID of affected entity
    category = db.Column(db.String(50))                           # "Users", "Rewards", "Machines", "Settings"
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='Success')          # "Success", "Failed"
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    admin = db.relationship('User', backref='admin_logs', foreign_keys=[admin_id])
    area = db.relationship('Area', backref='admin_logs', foreign_keys=[area_id])

    def __repr__(self):
        return f'<AdminLog {self.action} by User {self.admin_id}>'