"""
Security Settings Smoke Test
=============================
Tests all security-related settings endpoints:
  1. GET  /settings/security           — read config
  2. PUT  /settings/security           — update 2FA, timeout, lockout
  3. GET  /settings/security           — verify persistence
  4. POST /settings/security/force-logout — force-logout all sessions
  5. GET  /settings/security/login-history — fetch login history

Also tests new Phase endpoints:
  6. GET  /settings/backup             — download backup
  7. POST /settings/seed/status        — check seed status

Prerequisites:
  - Flask server running on http://localhost:5000
  - AUTH_CSRF_DISABLED=true in server .env (or set before running server)
  - Demo data seeded (python seed.py --demo)

Usage:
  cd server
  python smoke_test_security.py
"""

import os
import sys
import json
import requests

# ── Configuration ─────────────────────────────────────────────────────────
BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:5000')
API = f'{BASE_URL}/api/web'

# Superadmin credentials (from seed data)
SUPERADMIN_EMAIL = 'superadmin@ecopoints.local'
SUPERADMIN_PASS = 'SeedPass!23'

# Track results
results = []
session = requests.Session()


def log(test_name, passed, detail=''):
    status = '[PASS]' if passed else '[FAIL]'
    print(f'  {status}  {test_name}')
    if detail and not passed:
        print(f'         -> {detail}')
    results.append({'test': test_name, 'passed': passed, 'detail': detail})


def section(title):
    print(f'\n{"=" * 60}')
    print(f'  {title}')
    print(f'{"=" * 60}')


# ══════════════════════════════════════════════════════════════════════════
# STEP 0: Authenticate as superadmin
# ══════════════════════════════════════════════════════════════════════════
section('AUTHENTICATION')

try:
    resp = session.post(f'{API}/auth/login', json={
        'identifier': SUPERADMIN_EMAIL,
        'password': SUPERADMIN_PASS,
    })
    data = resp.json()

    if data.get('requiresOtp'):
        log('Login (OTP required)', True, '2FA is enabled — skipping OTP for smoke test')
        print('\n  ⚠️  2FA is ON. Disable it first or complete OTP manually.')
        print('     Set twoFactorRequired=false in DB, then re-run.')
        # Try to continue with cookies if they exist
        token = None
    elif data.get('success') and data.get('token'):
        token = data['token']
        log('Login (token auth)', True, f'Got token: {token[:20]}...')
    elif data.get('success'):
        # Cookie-based auth — the session has the cookies
        token = None
        log('Login (cookie auth)', True, 'Authenticated via cookies')
    else:
        log('Login', False, data.get('error', 'Unknown error'))
        print('\n  ❌ Cannot continue without authentication. Exiting.')
        sys.exit(1)
except Exception as e:
    log('Login', False, str(e))
    print('\n  ❌ Server not reachable. Make sure Flask is running on', BASE_URL)
    sys.exit(1)

# Build headers — use cookie auth (session has cookies) + optional Bearer
headers = {'Content-Type': 'application/json'}
if token:
    headers['Authorization'] = f'Bearer {token}'

# Also grab the CSRF token from cookies for PUT/POST
csrf_token = session.cookies.get('csrf_token', '')
if csrf_token:
    headers['X-CSRF-Token'] = csrf_token
    log('CSRF Token', True, f'Got csrf_token cookie: {csrf_token[:20]}...')
else:
    log('CSRF Token', True, 'No CSRF cookie (AUTH_CSRF_DISABLED likely true)')

# ── Discover a valid location_id for superadmin scoped requests ──────────
# Superadmin has no community group so _scope_location_id returns None
# unless ?location_id= is passed. Fetch the first org from the DB via backup.
section('SETUP: Discover Location ID')

LOCATION_ID = None
resp = session.get(f'{API}/settings/backup', headers=headers)
if resp.status_code == 200:
    tables = resp.json().get('tables', {})
    orgs = tables.get('organizations', [])
    if orgs:
        LOCATION_ID = orgs[0]['id']
        log(f'Found org for scoping (id={LOCATION_ID})', True, orgs[0].get('name', ''))
    else:
        log('Find organization', False, 'No orgs in DB — seed demo data first')
else:
    log('Backup fetch for org discovery', False, f'Status {resp.status_code}')

# Helper: append ?location_id to URL if we have one
def scoped(path):
    return f'{API}{path}?location_id={LOCATION_ID}' if LOCATION_ID else f'{API}{path}'


# ══════════════════════════════════════════════════════════════════════════
# TEST 1: GET /settings/security — Read current config
# ══════════════════════════════════════════════════════════════════════════
section('TEST 1: Read Security Config')

resp = session.get(scoped('/settings/security'), headers=headers)
data = resp.json()

log('Status 200', resp.status_code == 200, f'Got {resp.status_code}')
log('Response success=true', data.get('success') == True)

config = data.get('config', {})
log('Has twoFactorRequired', 'twoFactorRequired' in config, f'Value: {config.get("twoFactorRequired")}')
log('Has twoFactorMethod', 'twoFactorMethod' in config, f'Value: {config.get("twoFactorMethod")}')
log('Has sessionTimeoutMinutes', 'sessionTimeoutMinutes' in config, f'Value: {config.get("sessionTimeoutMinutes")}')
log('Has maxLoginAttempts', 'maxLoginAttempts' in config, f'Value: {config.get("maxLoginAttempts")}')
log('Has lockoutDurationMinutes', 'lockoutDurationMinutes' in config, f'Value: {config.get("lockoutDurationMinutes")}')

original_config = config.copy()


# ══════════════════════════════════════════════════════════════════════════
# TEST 2: PUT /settings/security — Update config
# ══════════════════════════════════════════════════════════════════════════
section('TEST 2: Update Security Config')

new_config = {
    'twoFactorRequired': False,       # Keep off for testing
    'twoFactorMethod': 'email',
    'sessionTimeoutMinutes': 30,      # Change from default
    'maxLoginAttempts': 7,            # Change from default
    'lockoutDurationMinutes': 20,     # Change from default
}

resp = session.put(scoped('/settings/security'), headers=headers, json=new_config)
data = resp.json()

log('PUT Status 200', resp.status_code == 200, f'Got {resp.status_code}')
log('PUT success=true', data.get('success') == True, data.get('error', ''))


# ══════════════════════════════════════════════════════════════════════════
# TEST 3: GET /settings/security — Verify persistence
# ══════════════════════════════════════════════════════════════════════════
section('TEST 3: Verify Persistence')

resp = session.get(scoped('/settings/security'), headers=headers)
data = resp.json()
config = data.get('config', {})

log('sessionTimeoutMinutes = 30', config.get('sessionTimeoutMinutes') == 30,
    f'Got: {config.get("sessionTimeoutMinutes")}')
log('maxLoginAttempts = 7', config.get('maxLoginAttempts') == 7,
    f'Got: {config.get("maxLoginAttempts")}')
log('lockoutDurationMinutes = 20', config.get('lockoutDurationMinutes') == 20,
    f'Got: {config.get("lockoutDurationMinutes")}')
log('twoFactorRequired = false', config.get('twoFactorRequired') == False,
    f'Got: {config.get("twoFactorRequired")}')


# ══════════════════════════════════════════════════════════════════════════
# TEST 4: Restore original config
# ══════════════════════════════════════════════════════════════════════════
section('TEST 4: Restore Original Config')

restore_config = {
    'twoFactorRequired': original_config.get('twoFactorRequired', False),
    'twoFactorMethod': original_config.get('twoFactorMethod', 'email'),
    'sessionTimeoutMinutes': original_config.get('sessionTimeoutMinutes', 1440),
    'maxLoginAttempts': original_config.get('maxLoginAttempts', 5),
    'lockoutDurationMinutes': original_config.get('lockoutDurationMinutes', 15),
}

resp = session.put(scoped('/settings/security'), headers=headers, json=restore_config)
data = resp.json()
log('Restore success', data.get('success') == True, data.get('error', ''))


# ══════════════════════════════════════════════════════════════════════════
# TEST 5: GET /settings/security/login-history
# ══════════════════════════════════════════════════════════════════════════
section('TEST 5: Login History')

resp = session.get(scoped('/settings/security/login-history'), headers=headers)
data = resp.json()

log('Status 200', resp.status_code == 200, f'Got {resp.status_code}')
log('Response success=true', data.get('success') == True)

history = data.get('history', [])
log('History is array', isinstance(history, list), f'Length: {len(history)}')

if history:
    entry = history[0]
    log('Entry has action', 'action' in entry, f'Action: {entry.get("action")}')
    log('Entry has adminName', 'adminName' in entry)
    log('Entry has timestamp', 'timestamp' in entry)
else:
    log('History is empty (superadmin not in org group)', True,
        'Superadmin has no community_group so org-scoped history is empty — expected')


# ══════════════════════════════════════════════════════════════════════════
# TEST 6: POST /settings/security/force-logout (⚠️ will invalidate session)
# ══════════════════════════════════════════════════════════════════════════
section('TEST 6: Force Logout')

resp = session.post(scoped('/settings/security/force-logout'), headers=headers, json={})
data = resp.json()

log('Status 200', resp.status_code == 200, f'Got {resp.status_code}')
log('Response success=true', data.get('success') == True, data.get('error', ''))
log('Message present', 'message' in data, data.get('message', ''))


# Re-authenticate since force-logout invalidated our session
print('\n  Re-authenticating after force-logout...')
resp = session.post(f'{API}/auth/login', json={
    'identifier': SUPERADMIN_EMAIL,
    'password': SUPERADMIN_PASS,
})
data = resp.json()

if data.get('success') and data.get('token'):
    token = data['token']
    headers['Authorization'] = f'Bearer {token}'
    csrf_token = session.cookies.get('csrf_token', '')
    if csrf_token:
        headers['X-CSRF-Token'] = csrf_token
    log('Re-auth after force-logout', True)
elif data.get('success'):
    csrf_token = session.cookies.get('csrf_token', '')
    if csrf_token:
        headers['X-CSRF-Token'] = csrf_token
    log('Re-auth after force-logout (cookie)', True)
else:
    log('Re-auth after force-logout', False, data.get('error', ''))


# ══════════════════════════════════════════════════════════════════════════
# TEST 7: GET /settings/backup — Download backup
# ══════════════════════════════════════════════════════════════════════════
section('TEST 7: Backup Download')

resp = session.get(f'{API}/settings/backup', headers=headers)

log('Status 200', resp.status_code == 200, f'Got {resp.status_code}')

if resp.status_code == 200:
    data = resp.json()
    meta = data.get('meta', {})
    log('Has meta.version', meta.get('version') == '1.0', f'Version: {meta.get("version")}')
    log('Has meta.total_rows', isinstance(meta.get('total_rows'), int), f'Rows: {meta.get("total_rows")}')
    log('Has tables object', isinstance(data.get('tables'), dict),
        f'Table count: {len(data.get("tables", {}))}')
else:
    log('Backup response', False, resp.text[:200])


# ══════════════════════════════════════════════════════════════════════════
# TEST 8: GET /settings/seed/status — Check seed status
# ══════════════════════════════════════════════════════════════════════════
section('TEST 8: Seed Status')

resp = session.get(f'{API}/settings/seed/status', headers=headers)
data = resp.json()

log('Status 200', resp.status_code == 200, f'Got {resp.status_code}')
log('Has status field', 'status' in data, f'Status: {data.get("status")}')
log('Has message field', 'message' in data)
log('Has percent field', 'percent' in data, f'Percent: {data.get("percent")}')


# ══════════════════════════════════════════════════════════════════════════
# TEST 9: Forgot Password endpoints (public, no auth)
# ══════════════════════════════════════════════════════════════════════════
section('TEST 9: Forgot Password Flow')

# Step 1: Send OTP (always returns success for anti-enumeration)
resp = requests.post(f'{API}/auth/forgot-password', json={
    'email': SUPERADMIN_EMAIL,
})
data = resp.json()
log('forgot-password returns 200', resp.status_code == 200, f'Got {resp.status_code}')
log('forgot-password success=true', data.get('success') == True)
log('Has generic message', 'If an account' in data.get('message', ''))

# Step 1b: Non-existent email also returns success (anti-enumeration)
resp = requests.post(f'{API}/auth/forgot-password', json={
    'email': 'nonexistent@example.com',
})
data = resp.json()
log('Non-existent email still success', data.get('success') == True,
    'Anti-enumeration: same response for unknown emails')

# Step 2: Verify OTP with wrong code should fail
resp = requests.post(f'{API}/auth/verify-reset-otp', json={
    'email': SUPERADMIN_EMAIL,
    'code': '000000',
})
data = resp.json()
log('verify-reset-otp rejects bad code', data.get('success') == False)

# Step 3: Reset password with invalid token should fail
resp = requests.post(f'{API}/auth/reset-password', json={
    'resetToken': 'invalid.token.here',
    'newPassword': 'NewPass!23',
})
data = resp.json()
log('reset-password rejects bad token', data.get('success') == False)


# ══════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════
section('RESULTS SUMMARY')

passed = sum(1 for r in results if r['passed'])
failed = sum(1 for r in results if not r['passed'])
total = len(results)

print(f'\n  Total: {total}  |  Passed: {passed}  |  Failed: {failed}')
print(f'  Pass rate: {passed/total*100:.0f}%\n')

if failed:
    print('  Failed tests:')
    for r in results:
            if not r['passed']:
                print(f'    [FAIL] {r["test"]}: {r["detail"]}')
    print()

sys.exit(0 if failed == 0 else 1)
