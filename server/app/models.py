from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
# from enum import Enum


# class UserRole(Enum):
#     ADMIN = 'admin'
#     USER = 'user'
#     MODERATOR = 'moderator'


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120))
    # role = db.Column(db.String(20), default=UserRole.USER.value, nullable=False)
    points_balance = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationship
    scans = db.relationship('QRScan', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # def is_admin(self):
    #     return self.role == UserRole.ADMIN.value

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
    
    # Relationship
    redemptions = db.relationship('RewardRedemption', backref='reward', lazy=True)
    
    def __repr__(self):
        return f'<Reward {self.name}: {self.points_required} points>'


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
    
    # Relationship
    user = db.relationship('User', backref=db.backref('redemptions', lazy=True))
    
    def __repr__(self):
        return f'<RewardRedemption {self.id}: User {self.user_id} - Reward {self.reward_id}>'
