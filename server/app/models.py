import uuid
from datetime import datetime, timezone
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

# ==========================================
# Group 1: The Multi-Tenant Identity (The Core)
# ==========================================

class Organization(db.Model):
    """
    Identifies the client renting the machine (e.g., Taguig State University vs. Acacia Estates).
    """
    __tablename__ = 'organizations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)  # "Taguig State University"
    type = db.Column(db.String(100), nullable=False)  # "University", "Corporation", "HOA"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    community_groups = db.relationship('CommunityGroup', backref='organization', lazy=True)
    rvms = db.relationship('RVM', backref='organization', lazy=True)
    rewards = db.relationship('Reward', backref='organization', lazy=True)

    def __repr__(self):
        return f'<Organization {self.name}>'


class CommunityGroup(db.Model):
    """
    Creates the dynamic sub-groups for leaderboards (e.g., College of Engineering vs. Block 4).
    """
    __tablename__ = 'community_groups'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)  # "College of Engineering"
    group_type = db.Column(db.String(100), nullable=False)  # "College", "Department", "Block"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    accounts = db.relationship('Account', backref='community_group', lazy=True)

    def __repr__(self):
        return f'<CommunityGroup {self.name} ({self.group_type})>'


class Account(db.Model):
    """
    The actual "Wallet" that holds the points. This allows a specific group (e.g., a Student Organization or Department) to pool points.
    """
    __tablename__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    community_group_id = db.Column(db.Integer, db.ForeignKey('community_groups.id'), nullable=False)
    account_name = db.Column(db.String(200), nullable=False)  # "Juan Dela Cruz - 2023-12345" or "CS Student Council"
    points_balance = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    users = db.relationship('User', backref='account', lazy=True)
    access_credentials = db.relationship('AccessCredential', backref='account', lazy=True)
    transactions = db.relationship('Transaction', backref='account', lazy=True)
    redemptions = db.relationship('RewardRedemption', backref='account', lazy=True)

    def __repr__(self):
        return f'<Account {self.account_name} Points: {self.points_balance}>'


class UserRole(Enum):
    SUPERADMIN = 'superadmin'  # Platform owner
    ADMIN = 'admin'             # University/Campus Administrator (e.g., Dean, OSA Director)
    USER = 'user'                # Primary Campus Member (e.g., Student, Faculty)
    MAINTENANCE = 'maintenance'  # Facilities Staff (e.g., Janitorial Services)
    DEPENDENT = 'dependent'      # Limited Access Member (e.g., Service Personnel, Guests)



class User(db.Model):
    """
    The human interacting with the web app. Tied to the Account.
    The Email Field is Nullable: Critical for Dependents (e.g., service staff) who only use fobs.
    """
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)  # "Juan Dela Cruz"
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(20), default=UserRole.USER.value, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.name}>'


class AccessCredential(db.Model):
    """
    Decouples the login from the physical machine. Stores QR Code or RFID fob data.
    """
    __tablename__ = 'access_credentials'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    tag_id = db.Column(db.String(200), unique=True, nullable=False)  # UUID for QR or Serial for RFID
    credential_type = db.Column(db.String(50), default='qr_code')  # 'qr_code', 'rfid'

    # RFID specific fields (Optional/Commented out as requested)
    # rfid_frequency = db.Column(db.String(20)) # e.g. "13.56MHz"
    # rfid_protocol = db.Column(db.String(20)) # e.g. "MIFARE"

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<AccessCredential {self.tag_id} ({self.credential_type})>'

    @property
    def qr_payload(self):
        return f"USER:{self.tag_id}"


# ==========================================
# Group 2: Hardware & IoT (The RVM Operations)
# ==========================================

class RVM(db.Model):
    """
    Represents the physical Raspberry Pi. Tracks location, status, and capacity.
    """
    __tablename__ = 'rvms'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    machine_uuid = db.Column(db.String(100), unique=True, nullable=False)
    location_name = db.Column(db.String(200))
    is_online = db.Column(db.Boolean, default=False)
    last_heartbeat = db.Column(db.DateTime)

    # Capacity tracking for alerts
    current_capacity = db.Column(db.Integer, default=0)
    max_capacity = db.Column(db.Integer, default=100)
    total_items_collected = db.Column(db.Integer, default=0)

    sessions = db.relationship('RecyclingSession', backref='rvm', lazy=True)

    def __repr__(self):
        return f'<RVM {self.machine_uuid} @ {self.location_name}>'


class RecyclingSession(db.Model):
    """
    When a user taps their phone/fob, a session opens.
    """
    __tablename__ = 'recycling_sessions'
    id = db.Column(db.Integer, primary_key=True)
    rvm_id = db.Column(db.Integer, db.ForeignKey('rvms.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    
    start_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime)
    total_points_earned = db.Column(db.Integer, default=0)
    item_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active')  # active, completed, timed_out

    items = db.relationship('RecyclingItem', backref='session', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<RecyclingSession {self.id} Account: {self.account_id}>'


class RecyclingItem(db.Model):
    """
    Logs exactly what was dropped inside during the session.
    """
    __tablename__ = 'recycling_items'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('recycling_sessions.id'), nullable=False)
    item_type = db.Column(db.String(100), nullable=False)  # e.g. "PET Bottle"
    material = db.Column(db.String(100))  # e.g. "Plastic", "Aluminum"
    weight_grams = db.Column(db.Float, default=0.0)
    points_awarded = db.Column(db.Integer, default=0)
    deposited_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<RecyclingItem {self.item_type} - {self.points_awarded} pts>'




class MaintenanceLog(db.Model):
    """
    Logs maintenance actions performed by Maintenance staff on RVMs.
    """
    __tablename__ = 'maintenance_logs'
    id = db.Column(db.Integer, primary_key=True)
    rvm_id = db.Column(db.Integer, db.ForeignKey('rvms.id'), nullable=False)
    performed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # e.g., "emptied_bin", "cleaned_sensor"
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    notes = db.Column(db.Text)

    def __repr__(self):
        return f'<MaintenanceLog {self.action_type} by User {self.performed_by_id}>'


# ==========================================
# Group 3: The Economy (Points & Rewards)
# ==========================================

class Transaction(db.Model):
    """
    The double-entry ledger. Records balance_before and balance_after.
    """
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # earn, redeem, adjustment
    amount = db.Column(db.Integer, nullable=False)  # + for earn, - for redeem
    balance_before = db.Column(db.Integer, nullable=False)
    balance_after = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255))
    reference_id = db.Column(db.String(100))  # e.g. Session ID or Redemption ID
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Transaction {self.id}: {self.amount} pts>'


class Reward(db.Model):
    """
    Stores the zero-cost digital perks offered by the specific Organization.
    """
    __tablename__ = 'rewards'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    points_required = db.Column(db.Integer, nullable=False)
    stock_quantity = db.Column(db.Integer, nullable=True)  # Nullable for infinite digital goods
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    redemptions = db.relationship('RewardRedemption', backref='reward', lazy=True)

    def __repr__(self):
        return f'<Reward {self.name} ({self.points_required} pts)>'


class RewardRedemption(db.Model):
    """
    Acts as the digital voucher.
    """
    __tablename__ = 'reward_redemptions'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, claimed, used, expired
    redemption_code = db.Column(db.String(50), unique=True, nullable=False)
    redeemed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    used_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<RewardRedemption {self.redemption_code}>'

    @property
    def qr_payload(self):
        return f"REDEEM:{self.redemption_code}"