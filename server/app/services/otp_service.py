"""
OTP Service
Generates and verifies time-limited OTP codes for two-factor authentication.
Uses the OtpCode model for persistent storage — survives server restarts
and works across multiple worker processes.
"""
import secrets
import hashlib
from datetime import datetime, timezone, timedelta

from .. import db
from ..models import OtpCode
from ..services.notification_service import _send_email


OTP_LENGTH = 6
OTP_TTL_SECONDS = 300  # 5 minutes
MAX_ATTEMPTS = 5


def generate_otp(user_id):
    """Generate a 6-digit OTP code for a user. Returns plain-text code."""
    # Revoke any existing pending OTPs
    revoke_otp(user_id)

    code = ''.join([str(secrets.randbelow(10)) for _ in range(OTP_LENGTH)])
    code_hash = hashlib.sha256(code.encode()).hexdigest()

    otp = OtpCode(
        user_id=user_id,
        code_hash=code_hash,
        sent_to='',  # Will be updated by send_otp
        channel='email',
        is_used=False,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS),
    )
    db.session.add(otp)
    db.session.commit()

    return code


def verify_otp(user_id, code):
    """Verify an OTP code. Returns (success: bool, error: str|None)"""
    now = datetime.now(timezone.utc)

    # Find the latest unused, unexpired OTP for this user
    otp = OtpCode.query.filter(
        OtpCode.user_id == user_id,
        OtpCode.is_used == False,
        OtpCode.expires_at > now,
    ).order_by(OtpCode.created_at.desc()).first()

    if not otp:
        return False, 'No OTP pending. Please request a new code.'

    code_hash = hashlib.sha256(code.encode()).hexdigest()
    if code_hash != otp.code_hash:
        return False, 'Invalid OTP code.'

    # Mark as used
    otp.is_used = True
    db.session.commit()
    return True, None


def revoke_otp(user_id):
    """Mark all pending OTPs for a user as used."""
    OtpCode.query.filter(
        OtpCode.user_id == user_id,
        OtpCode.is_used == False,
    ).update({'is_used': True})
    db.session.commit()


def send_otp(user, method='email'):
    """Generate and send an OTP to the user via email.

    The ``method`` parameter is kept for API compatibility but SMS has been
    removed — all OTPs are sent by email regardless of the value passed.
    Returns (code, success, error)
    """
    code = generate_otp(user.id)

    # Update the OTP record with the sent_to and channel info
    otp = OtpCode.query.filter(
        OtpCode.user_id == user.id,
        OtpCode.is_used == False,
    ).order_by(OtpCode.created_at.desc()).first()

    subject = 'EcoPoints — Your Login Verification Code'
    body = (
        f'<div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">'
        f'<h2 style="color: #059669;">EcoPoints Verification</h2>'
        f'<p>Your login verification code is:</p>'
        f'<div style="background: #f0fdf4; border: 2px solid #059669; border-radius: 12px; '
        f'padding: 20px; text-align: center; margin: 20px 0;">'
        f'<span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">{code}</span>'
        f'</div>'
        f'<p style="color: #64748b; font-size: 14px;">This code expires in 5 minutes. '
        f'Do not share it with anyone.</p>'
        f'</div>'
    )

    if user.email:
        success, error = _send_email(user.email, subject, body)
        if otp:
            otp.sent_to = user.email
            otp.channel = 'email'
            db.session.commit()
    else:
        return code, False, 'No email address available for this user'

    return code, success, error
