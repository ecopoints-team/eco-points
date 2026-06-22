"""Google reCAPTCHA v2 server-side verification.

Verifies the client-supplied response token against Google's siteverify
endpoint using RECAPTCHA_SECRET_KEY. When the secret is unset AND we are not
in production, verification is skipped (returns ok=True) so local dev / CI do
not require a live secret. Production MUST set the secret.
"""
import os
import requests

SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'


def verify_captcha(token, remote_ip=None):
    """Return (ok: bool, error: str|None)."""
    secret = os.environ.get('RECAPTCHA_SECRET_KEY', '')

    if not secret:
        if os.environ.get('FLASK_ENV') == 'production':
            return False, 'CAPTCHA is not configured on the server'
        return True, None  # dev/test: don't block

    if not token:
        return False, 'CAPTCHA response is required'

    try:
        resp = requests.post(
            SITEVERIFY_URL,
            data={'secret': secret, 'response': token, 'remoteip': remote_ip or ''},
            timeout=5,
        )
        data = resp.json()
    except Exception:
        if os.environ.get('FLASK_ENV') == 'production':
            return False, 'Could not verify CAPTCHA. Please try again.'
        return True, None

    if data.get('success'):
        return True, None
    return False, 'CAPTCHA verification failed. Please try again.'
