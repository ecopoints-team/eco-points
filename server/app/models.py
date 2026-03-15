from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from . import db


# ============================================================================
# Group 1: Multi-Tenant Identity (The Core)
# ============================================================================

class OrgType(db.Model):
    """
    Lookup table for organization types (University, Corporation, HOA, etc.).
    Super-admin can add/delete types dynamically.
    """
    __tablename__ = 'org_types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)  # "University", "Corporation"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    organizations = db.relationship('Organization', backref='org_type_ref', lazy=True)

    def __repr__(self):
        return f'<OrgType {self.name}>'


class City(db.Model):
    """
    3NF lookup table for city/municipality normalization.
    Organizations reference this via city_id FK instead of storing flat city strings.
    Super-admin can add/delete cities dynamically.
    """
    __tablename__ = 'cities'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)  # "Pasig City"
    province = db.Column(db.String(200), nullable=True)           # "Metro Manila"
    region = db.Column(db.String(200), nullable=True)             # "NCR"

    # Relationships
    organizations = db.relationship('Organization', backref='city', lazy=True)

    def __repr__(self):
        return f'<City {self.name}>'


class Organization(db.Model):
    """
    The top-level tenant — a school, village, or corporation renting the system.
    Frontend equivalent: LOCATIONS[] (each location = one organization).
    """
    __tablename__ = 'organizations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)              # "Arellano University"
    full_name = db.Column(db.String(500))                         # "Arellano University - Andres Bonifacio Pasig Campus"
    org_type = db.Column(db.String(100), nullable=False)          # "University", "Corporation", "HOA"
    org_type_id = db.Column(db.Integer, db.ForeignKey('org_types.id'), nullable=True, index=True)

    # 3NF Address
    street_address = db.Column(db.String(500))                    # "Pag-asa St, Caniogan"
    barangay = db.Column(db.String(200), nullable=True)           # "Caniogan"
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id'), nullable=True, index=True)
    zip_code = db.Column(db.String(10), nullable=True)            # "1600"

    # Contact
    contact_person = db.Column(db.String(200))
    contact_email = db.Column(db.String(200))
    contact_phone = db.Column(db.String(50))

    status = db.Column(db.String(20), default='Active')           # Active, Inactive
    join_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    community_groups = db.relationship('CommunityGroup', backref='organization', lazy=True, cascade='all, delete-orphan')
    rvms = db.relationship('RVM', backref='organization', lazy=True, cascade='all, delete-orphan')
    rewards = db.relationship('Reward', backref='organization', lazy=True, cascade='all, delete-orphan')
    notification_settings = db.relationship('NotificationSetting', backref='organization', lazy=True, cascade='all, delete-orphan')
    notification_logs = db.relationship('NotificationLog', backref='organization', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Organization {self.name}>'


class CommunityGroup(db.Model):
    """
    Dynamic sub-groups for leaderboards and user classification.
    group_type values:
      - 'shs_strand' : SHS strands (STEM, ABM, HUMSS, etc.)
      - 'college'    : College departments (BSIT, BSN, etc.)
      - 'staff'      : Catch-all group for campus staff (janitors, guards, etc.)
    Each org gets one "Campus Staff" group with group_type='staff'.
    """
    __tablename__ = 'community_groups'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)              # "Bachelor of Science in IT", "Campus Staff"
    abbreviation = db.Column(db.String(50))                       # "BSIT", "STEM"
    group_type = db.Column(db.String(50), nullable=False)         # "shs_strand", "college", "staff"
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
    community_group_id = db.Column(db.Integer, db.ForeignKey('community_groups.id'), nullable=False, index=True)
    account_name = db.Column(db.String(200), nullable=False)      # "Juan Dela Cruz" or "CS Student Council"
    points_balance = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)                     # Consecutive recycling days
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

    role (UserRole enum — 7 values):
      Admin:    superadmin, head_admin, auditor, inventory_officer, technician
      End-user: user, dependent

    user_type (only for role='user'):
      'student', 'faculty', 'staff'

    year_level (only for students):
      'Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year', '4th Year'

    Admin scoping: admin users belong to an Account → CommunityGroup → Organization
    chain. Super-admins use a system-level community group with no org restriction.
    """
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    display_id = db.Column(db.String(30), unique=True, nullable=True, index=True)  # e.g. USER-AU-001, HEAD-AU-002

    # Identity
    name = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=True)
    email = db.Column(db.String(200), unique=True, nullable=True)  # Nullable for dependents/fob-only users
    phone = db.Column(db.String(50), nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)

    # Role & Classification
    role = db.Column(db.String(30), default='user', nullable=False, index=True)
    user_type = db.Column(db.String(20), nullable=True)            # "student", "faculty", "staff" (end-user sub-type)
    year_level = db.Column(db.String(20), nullable=True)           # "1st Year", "Grade 11", etc.

    # Status
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)

    # Two-Factor Authentication
    otp_enabled = db.Column(db.Boolean, default=False)
    otp_method = db.Column(db.String(10), nullable=True)      # "email" or "sms"

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    maintenance_logs = db.relationship('MaintenanceLog', backref='performed_by', lazy=True,
                                        foreign_keys='MaintenanceLog.performed_by_id')
    admin_logs = db.relationship('AdminLog', backref='admin', lazy=True,
                                  foreign_keys='AdminLog.admin_user_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role in ('superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician')

    # ── Role prefix map for display_id ──────────────────────────────
    ROLE_PREFIX = {
        'superadmin': 'SA',
        'head_admin': 'HEAD',
        'auditor': 'AUD',
        'inventory_officer': 'INV',
        'technician': 'TECH',
        'user': 'USER',
        'dependent': 'DEP',
    }

    @staticmethod
    def generate_display_id(role, org_abbreviation):
        """Generate next display_id like USER-AU-001.

        Args:
            role: user role string (e.g. 'user', 'head_admin')
            org_abbreviation: short org name (e.g. 'AU', 'PU'). Use 'SYS' for superadmins.
        Returns:
            str – e.g. 'USER-AU-001'
        """
        prefix = User.ROLE_PREFIX.get(role, 'USER')
        abbr = (org_abbreviation or 'SYS').upper()
        pattern = f'{prefix}-{abbr}-%'

        last = db.session.query(User).filter(User.display_id.like(pattern))\
            .order_by(User.display_id.desc()).first()

        if last and last.display_id:
            try:
                seq = int(last.display_id.rsplit('-', 1)[-1]) + 1
            except ValueError:
                seq = 1
        else:
            seq = 1

        return f'{prefix}-{abbr}-{seq:03d}'

    def __repr__(self):
        return f'<User {self.name} ({self.role})>'


class AccessCredential(db.Model):
    """
    Decouples physical machine access from web login.
    A QR code on a phone or a 10-peso RFID keyfob.
    """
    __tablename__ = 'access_credentials'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
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
# ============================================================================

class RVM(db.Model):
    """
    A physical Reverse Vending Machine (Raspberry Pi).
    Frontend equivalent: MACHINES[].
    """
    __tablename__ = 'rvms'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False, index=True)

    machine_uuid = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)              # "Main Gate RVM"
    location_name = db.Column(db.String(200), nullable=True)      # "Main Gate", "Canteen" (descriptive)
    is_online = db.Column(db.Boolean, default=False)
    last_heartbeat = db.Column(db.DateTime)

    # Capacity (sensors detect bin-full state; no max_capacity needed)
    current_capacity = db.Column(db.Integer, default=0)
    total_items_collected = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    sessions = db.relationship('RecyclingSession', backref='rvm', lazy=True)
    maintenance_logs = db.relationship('MaintenanceLog', backref='rvm', lazy=True)

    def __repr__(self):
        return f'<RVM {self.name} ({"Online" if self.is_online else "Offline"})>'


class RecyclingSession(db.Model):
    """
    Opened when a user taps their QR/fob on the machine.
    Groups multiple RecyclingItems into one visit.
    """
    __tablename__ = 'recycling_sessions'
    id = db.Column(db.Integer, primary_key=True)
    rvm_id = db.Column(db.Integer, db.ForeignKey('rvms.id'), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)

    start_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime, nullable=True)
    total_points_earned = db.Column(db.Integer, default=0)
    item_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active')           # active, completed, timed_out
    session_type = db.Column(db.String(20), default='standard')   # standard, bulk
    notes = db.Column(db.Text, nullable=True)                     # Admin notes for bulk sessions

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
    session_id = db.Column(db.Integer, db.ForeignKey('recycling_sessions.id'), nullable=False, index=True)

    item_type = db.Column(db.String(100), nullable=False)         # "PET Bottle"
    material = db.Column(db.String(100), default='Plastic')       # "Plastic", "Aluminum"
    brand = db.Column(db.String(100), nullable=True)              # "Coca-Cola"
    volume_ml = db.Column(db.Integer, nullable=True)              # 350, 500, 750, 1000
    condition = db.Column(db.String(20), nullable=True)           # "With Label", "No Label", "Rejected"
    weight_grams = db.Column(db.Float, default=0.0)
    points_awarded = db.Column(db.Integer, default=0)
    deposited_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<RecyclingItem {self.item_type} | {self.points_awarded} pts>'


class MaintenanceLog(db.Model):
    """
    Logs maintenance/repair actions on RVMs.
    Frontend equivalent: MACHINE_LOGS[].
    """
    __tablename__ = 'maintenance_logs'
    id = db.Column(db.Integer, primary_key=True)
    rvm_id = db.Column(db.Integer, db.ForeignKey('rvms.id'), nullable=False, index=True)
    performed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    action_type = db.Column(db.String(200), nullable=False)       # "Sensor Error", "Bin Full", "Routine Checkup"
    resolved = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Optional: link to compensation transaction for maintenance staff
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=True)

    def __repr__(self):
        return f'<MaintenanceLog {self.action_type} ({"Resolved" if self.resolved else "Pending"})>'


# ============================================================================
# Group 3: Economy (Points & Rewards)
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
    No SKU — use formatted reward ID instead (e.g. "RWD-001").
    """
    __tablename__ = 'rewards'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False, index=True)

    name = db.Column(db.String(200), nullable=False)              # "EcoPoints T-Shirt"
    description = db.Column(db.Text)
    category = db.Column(db.String(100))                          # "Merchandise", "Voucher", "Sustainable", "Education"
    points_required = db.Column(db.Integer, nullable=False)       # Cost in points
    stock_quantity = db.Column(db.Integer, nullable=True)          # Nullable = infinite digital goods
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
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
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False, index=True)

    points_spent = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')          # "pending", "claimed", "used", "expired"
    redemption_code = db.Column(db.String(50), unique=True, nullable=False)
    redeemed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    used_at = db.Column(db.DateTime, nullable=True)

    @property
    def qr_payload(self):
        return f"REDEEM:{self.redemption_code}"

    def __repr__(self):
        return f'<RewardRedemption {self.redemption_code} ({self.status})>'


# ============================================================================
# Group 4: Audit Trail
# ============================================================================

class AdminLog(db.Model):
    """
    Tracks all admin actions for accountability.
    Frontend equivalent: ADMIN_LOGS[].
    No 'status' column — every logged action already succeeded.
    """
    __tablename__ = 'admin_logs'
    id = db.Column(db.Integer, primary_key=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    action = db.Column(db.String(100), nullable=False)            # "User Created", "Maintenance Added"
    target = db.Column(db.String(200))                            # ID or name of affected entity
    category = db.Column(db.String(50))                           # "Users", "Machines", "Rewards", "Settings", "Logs"
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<AdminLog {self.action} by User {self.admin_user_id}>'


# ============================================================================
# Group 5: Notifications & Alerts
# ============================================================================

class NotificationSetting(db.Model):
    """
    Per-organization notification configuration.
    Each org can independently enable/disable alert types and channels.
    """
    __tablename__ = 'notification_settings'
    __table_args__ = (
        db.UniqueConstraint('organization_id', 'alert_key', name='uq_org_alert_key'),
    )
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False, index=True)

    alert_key = db.Column(db.String(50), nullable=False)          # "low_reward_stock", "machine_offline", etc.
    email_enabled = db.Column(db.Boolean, default=False)
    sms_enabled = db.Column(db.Boolean, default=False)
    threshold = db.Column(db.Integer, nullable=True)              # e.g. stock qty threshold for low_reward_stock
    recipients_json = db.Column(db.Text, default='[]')            # JSON array of email/phone strings
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<NotificationSetting {self.alert_key} org={self.organization_id}>'


class NotificationLog(db.Model):
    """
    Audit trail for every notification sent (or attempted).
    """
    __tablename__ = 'notification_logs'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False, index=True)

    alert_key = db.Column(db.String(50), nullable=False)
    channel = db.Column(db.String(10), nullable=False)            # "email" or "sms"
    recipient = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(300))
    body_preview = db.Column(db.String(500))
    status = db.Column(db.String(20), default='sent')             # "sent", "failed", "queued"
    error_message = db.Column(db.Text, nullable=True)
    sent_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<NotificationLog {self.alert_key} → {self.recipient} ({self.status})>'


# ============================================================================
# Group 6: Token Management
# ============================================================================

class TokenBlacklist(db.Model):
    """
    Stores invalidated JWT tokens (on logout).
    Tokens are identified by their 'jti' (JWT ID) claim.
    Expired entries can be periodically cleaned up.
    """
    __tablename__ = 'token_blacklist'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(255), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f'<TokenBlacklist {self.jti}>'


class LoginAttempt(db.Model):
    """Tracks login attempts for security monitoring and account lockout."""
    __tablename__ = 'login_attempts'
    id = db.Column(db.Integer, primary_key=True)
    identifier = db.Column(db.String(200), nullable=False, index=True)
    ip_address = db.Column(db.String(50), nullable=True)
    user_id = db.Column(db.Integer, nullable=True)
    success = db.Column(db.Boolean, default=False)
    failure_reason = db.Column(db.String(100), nullable=True)
    attempted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<LoginAttempt {self.identifier} ({"OK" if self.success else "FAIL"})>'