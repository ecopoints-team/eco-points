import uuid
from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from enum import Enum


<<<<<<< Updated upstream
class UserRole(Enum):
    ADMIN = 'admin'
    USER = 'user'
    MODERATOR = 'moderator'
=======
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
    name = db.Column(db.String(200), nullable=False)              # "Pasig City"
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
>>>>>>> Stashed changes


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120))
    role = db.Column(db.String(20), default=UserRole.USER.value, nullable=False)
    points_balance = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    public_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4())) # This prevents people from guessing User IDs
    # Relationship
    scans = db.relationship('QRScan', backref='user', lazy=True)
    recycling_sessions = db.relationship('RecyclingSession', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role == UserRole.ADMIN.value

    def __repr__(self):
        return f'<User {self.username}>'


class QRScan(db.Model):
    __tablename__ = 'qr_scans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    qr_data = db.Column(db.String(500), nullable=False)
    scan_type = db.Column(db.String(50), default='item')  # item, transaction, reward
    item_type = db.Column(db.String(100))  # bottle, can, plastic, etc.
    points_earned = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='completed')  # completed, pending, failed
    location = db.Column(db.String(200))
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<QRScan {self.id} by User {self.user_id}>'


<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # earn, redeem, transfer, refund, adjustment
    amount = db.Column(db.Integer, nullable=False)  # positive for earning, negative for spending
    balance_before = db.Column(db.Integer, nullable=False)
    balance_after = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255))
    reference_type = db.Column(db.String(50))  # qr_scan, reward_redemption, manual, transfer
    reference_id = db.Column(db.Integer)  # ID of related record (scan_id, reward_id, etc.)
    status = db.Column(db.String(20), default='completed')  # completed, pending, failed, reversed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('transactions', lazy=True))
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.transaction_type} {self.amount} points>'


class Reward(db.Model):
    __tablename__ = 'rewards'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    points_required = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(100))  # voucher, discount, product, service
    stock_quantity = db.Column(db.Integer)
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    
    # Relationship
    redemptions = db.relationship('RewardRedemption', backref='reward', lazy=True)
    
    def __repr__(self):
        return f'<Reward {self.name}: {self.points_required} points>'

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # e.g., "Bulacan Rice Farmers Coop"
    partner_type = db.Column(db.String(50)) # e.g., "Farmer", "Retailer"
    location_address = db.Column(db.Text)
    contact_number = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)

    # Relationship: One partner can offer many rewards
    rewards = db.relationship('Reward', backref='partner', lazy=True)
    redemptions = db.relationship(
        'RewardRedemption',
        backref='claim_partner',
        lazy=True,
        foreign_keys='RewardRedemption.claimed_by_partner_id'
    )

class RewardRedemption(db.Model):
    __tablename__ = 'reward_redemptions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, claimed, cancelled, expired
    redemption_code = db.Column(db.String(50), unique=True)
    redeemed_at = db.Column(db.DateTime, default=datetime.utcnow)
    claimed_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    claimed_by_partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    verification_notes = db.Column(db.Text)
    verified_at = db.Column(db.DateTime)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'))
    
    # Relationship
    user = db.relationship('User', backref=db.backref('redemptions', lazy=True))
    transaction = db.relationship(
        'Transaction',
        backref=db.backref('reward_redemption', uselist=False),
        lazy=True,
        foreign_keys='RewardRedemption.transaction_id'
    )
    
    def __repr__(self):
        return f'<RewardRedemption {self.id}: User {self.user_id} - Reward {self.reward_id}>'

class RecyclingSession(db.Model):
    __tablename__ = 'recycling_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    rvm_id = db.Column(db.Integer, db.ForeignKey('rvms.id'))
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    total_points_earned = db.Column(db.Integer, default=0)
    item_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20)) # 'active', 'completed', 'timed_out'
    items = db.relationship('RecyclingItem', backref='session', lazy=True, cascade='all, delete-orphan')

class RVM(db.Model):
    __tablename__ = 'rvms'
    id = db.Column(db.Integer, primary_key=True)
    machine_uuid = db.Column(db.String(100), unique=True) # Unique ID for the Pi
    location_name = db.Column(db.String(100))
    is_online = db.Column(db.Boolean, default=True)
    last_heartbeat = db.Column(db.DateTime)
    total_items_collected = db.Column(db.Integer, default=0)
    sessions = db.relationship('RecyclingSession', backref='rvm', lazy=True)


class RecyclingItem(db.Model):
    __tablename__ = 'recycling_items'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('recycling_sessions.id'), nullable=False)
    item_type = db.Column(db.String(100), nullable=False)
    weight_grams = db.Column(db.Float)
    points_awarded = db.Column(db.Integer, nullable=False)
    deposited_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
<<<<<<< Updated upstream
        return f'<RecyclingItem {self.id} session={self.session_id} points={self.points_awarded}>'
=======
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
>>>>>>> Stashed changes
