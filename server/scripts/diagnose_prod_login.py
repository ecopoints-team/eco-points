"""
Production Login Diagnostic
============================
Tests the login endpoint directly against the production API to isolate
whether the issue is password verification, CORS, or cookie transport.

Usage:
    cd server
    python scripts/diagnose_prod_login.py
"""
import json
import urllib.request
import urllib.error
import ssl

# ── Configuration ────────────────────────────────────────────────────
API_BASE = 'https://eco-points-api.onrender.com'
LOGIN_URL = f'{API_BASE}/api/web/auth/login'

# Use the default seed password — change if your prod passwords differ.
TEST_CREDENTIALS = [
    {'email': 'superadmin@ecopoints.org', 'password': 'test123'},
    {'email': 'admin@ecopoints.org', 'password': 'test123'},
    # Add your actual prod credentials here (temporarily):
    # {'email': 'your_actual_email@example.com', 'password': 'your_password'},
]


def test_login(email, password):
    """Send a raw POST to the login endpoint and print diagnostics."""
    payload = json.dumps({'email': email, 'password': password}).encode('utf-8')
    req = urllib.request.Request(
        LOGIN_URL,
        data=payload,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://www.ecopoints.org',
        },
    )
    # Allow self-signed certs (remove in strict environments)
    ctx = ssl.create_default_context()

    print(f'\n{"=" * 60}')
    print(f'Testing: {email}')
    print(f'URL:     {LOGIN_URL}')
    print(f'{"=" * 60}')

    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            status = resp.status
            headers = dict(resp.headers)
            body = resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        status = e.code
        headers = dict(e.headers)
        body = e.read().decode('utf-8')
    except Exception as e:
        print(f'  CONNECTION ERROR: {e}')
        return

    print(f'  Status: {status}')

    # Check CORS headers
    acao = headers.get('Access-Control-Allow-Origin', 'MISSING')
    acac = headers.get('Access-Control-Allow-Credentials', 'MISSING')
    print(f'  CORS Origin:      {acao}')
    print(f'  CORS Credentials: {acac}')

    # Check Set-Cookie headers
    cookies = [v for k, v in headers.items() if k.lower() == 'set-cookie']
    if cookies:
        for c in cookies:
            # Truncate the cookie value for security
            parts = c.split(';')
            name_val = parts[0]
            name = name_val.split('=')[0]
            attrs = '; '.join(parts[1:]).strip()
            print(f'  Cookie: {name} → attrs: {attrs}')
    else:
        print(f'  Cookies: NONE SET')

    # Parse response body
    try:
        data = json.loads(body)
        print(f'  Success: {data.get("success")}')
        if data.get('error'):
            print(f'  Error:   {data["error"]}')
        if data.get('user'):
            u = data['user']
            print(f'  User:    {u.get("email")} (role={u.get("role")})')
        if data.get('requires2FA'):
            print(f'  2FA:     Required (method={data.get("otpMethod")})')
    except json.JSONDecodeError:
        print(f'  Body:    {body[:200]}')

    print()
    return status, headers, body


def test_cors_preflight():
    """Send an OPTIONS preflight to check CORS configuration."""
    req = urllib.request.Request(
        LOGIN_URL,
        method='OPTIONS',
        headers={
            'Origin': 'https://www.ecopoints.org',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type',
        },
    )
    ctx = ssl.create_default_context()

    print(f'\n{"=" * 60}')
    print(f'CORS Preflight: OPTIONS {LOGIN_URL}')
    print(f'{"=" * 60}')

    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            status = resp.status
            headers = dict(resp.headers)
    except urllib.error.HTTPError as e:
        status = e.code
        headers = dict(e.headers)
    except Exception as e:
        print(f'  CONNECTION ERROR: {e}')
        return

    print(f'  Status: {status}')
    print(f'  Allow-Origin:      {headers.get("Access-Control-Allow-Origin", "MISSING")}')
    print(f'  Allow-Credentials: {headers.get("Access-Control-Allow-Credentials", "MISSING")}')
    print(f'  Allow-Methods:     {headers.get("Access-Control-Allow-Methods", "MISSING")}')
    print(f'  Allow-Headers:     {headers.get("Access-Control-Allow-Headers", "MISSING")}')


def test_health():
    """Check if the API is reachable."""
    req = urllib.request.Request(f'{API_BASE}/health', method='GET')
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            print(f'\nHealth check: {resp.status} — {resp.read().decode("utf-8")}')
    except Exception as e:
        print(f'\nHealth check FAILED: {e}')


if __name__ == '__main__':
    test_health()
    test_cors_preflight()
    for creds in TEST_CREDENTIALS:
        test_login(creds['email'], creds['password'])

    print('\n' + '=' * 60)
    print('DIAGNOSIS GUIDE:')
    print('=' * 60)
    print('''
If Status=401 + "Invalid credentials":
  → Password hashes in prod DB don't match. Likely the seed
    was run with a different werkzeug version. Fix: re-seed or
    manually reset passwords via flask shell.

If Status=200 but cookies have SameSite=Strict:
  → Cross-site cookie issue. Frontend (ecopoints.org) and API
    (onrender.com) are different sites. SameSite=Strict cookies
    won't be stored by the browser. Fix: change to SameSite=None
    for cross-site or set up a same-site proxy.

If CORS Origin = MISSING or doesn't match ecopoints.org:
  → CORS misconfiguration. The browser blocks the response.

If Status=200 + cookies have SameSite=None + Secure:
  → Cookie transport should work. Check browser DevTools →
    Application → Cookies to verify cookies are stored.
''')
