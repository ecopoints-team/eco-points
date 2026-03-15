"""
OTP Service
Generates and verifies time-limited OTP codes for two-factor authentication.
Uses Python's secrets module — no external dependencies needed.
"""
import secrets
import hashlib
import time
from datetime import datetime, timezone

from ..services.notification_service import _send_email, _send_sms


# ── In-memory OTP store (code_hash → expiry) ──
_otp_store = {}

OTP_LENGTH = 6
OTP_TTL_SECONDS = 300  # 5 minutes


def _cleanup_expired():
    """Remove expired OTPs from the store."""
    now = time.time()
    expired = [k for k, v in _otp_store.items() if v['expires'] < now]
    for k in expired:
        del _otp_store[k]


def generate_otp(user_id):
    """Generate a 6-digit OTP code for a user. Returns plain-text code."""
    _cleanup_expired()
    revoke_otp(user_id)

    code = ''.join([str(secrets.randbelow(10)) for _ in range(OTP_LENGTH)])

    _otp_store[f'user_{user_id}'] = {
        'code_hash': hashlib.sha256(code.encode()).hexdigest(),
        'expires': time.time() + OTP_TTL_SECONDS,
        'attempts': 0,
    }

    return code


def verify_otp(user_id, code):
    """Verify an OTP code. Returns (success: bool, error: str|None)"""
    _cleanup_expired()

    key = f'user_{user_id}'
    entry = _otp_store.get(key)

    if not entry:
        return False, 'No OTP pending. Please request a new code.'

    if entry['expires'] < time.time():
        del _otp_store[key]
        return False, 'OTP has expired. Please request a new code.'

    entry['attempts'] += 1
    if entry['attempts'] > 5:
        del _otp_store[key]
        return False, 'Too many attempts. Please request a new code.'

    code_hash = hashlib.sha256(code.encode()).hexdigest()
    if code_hash != entry['code_hash']:
        return False, 'Invalid OTP code.'

    del _otp_store[key]
    return True, None


def revoke_otp(user_id):
    """Remove any pending OTP for a user."""
    key = f'user_{user_id}'
    if key in _otp_store:
        del _otp_store[key]


def send_otp(user, method='email'):
    """Generate and send an OTP to the user via email or SMS.
    Returns (code, success, error)
    """
    code = generate_otp(user.id)

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

    if method == 'sms' and user.phone:
        sms_body = f'[EcoPoints] Your login code: {code}. Expires in 5 minutes.'
        success, error = _send_sms(user.phone, sms_body)
    elif user.email:
        success, error = _send_email(user.email, subject, body)
    else:
        return code, False, 'No contact method available for this user'

    return code, success, error
