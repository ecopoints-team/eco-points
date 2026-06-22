# Going Live with Google reCAPTCHA (replacing the test key)

**Audience:** developers deploying EcoPoints to production.
**Current state:** the login form uses Google reCAPTCHA **v2 ("I'm not a robot" checkbox)** via the `react-google-recaptcha` package, but with Google's universal **test site key** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` — which **always passes** and verifies nothing. The captcha is also currently **client-side only**: the widget token is never sent to the backend, so it can be bypassed by calling the login API directly.

This guide takes you from the test key to a real, enforced captcha in two stages:

1. **Stage A — Swap in live keys** (makes the widget real on the front end).
2. **Stage B — Verify server-side** (makes it actually enforce — required for real protection).

> ⚠️ Do Stage B. Stage A alone only changes which widget renders; an attacker who scripts the login endpoint never loads the widget, so without server verification the captcha provides no real protection.

---

## Stage A — Get and install live keys

### A1. Create a reCAPTCHA site in the Google admin console

1. Go to https://www.google.com/recaptcha/admin/create (sign in with the project's Google account).
2. **Label:** `EcoPoints Production`.
3. **reCAPTCHA type:** choose **reCAPTCHA v2** → **"I'm not a robot" Checkbox** (this matches the current widget; do NOT pick v3 or it will require code changes).
4. **Domains:** add every domain the app runs on, e.g.:
   - `ecopoints.org`
   - `www.ecopoints.org`
   - `eco-points-client.pages.dev` (Cloudflare Pages)
   - `localhost` (optional, for local testing against live keys)
5. Accept the terms and **Submit**.
6. Copy the two keys it shows:
   - **Site key** (public — goes in the client)
   - **Secret key** (private — goes in the server, never commit it)

> Keep a separate site for staging vs production if you want isolated metrics/keys.

### A2. Set the client env var

The client reads `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (see `client/src/components/pages/LogIn.jsx`).

- Local: `client/.env.local`
  ```
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<YOUR_LIVE_SITE_KEY>
  ```
- Production (Cloudflare Pages / Vercel / etc.): add the same variable in the hosting dashboard's environment-variables section. It MUST start with `NEXT_PUBLIC_` so Next.js exposes it to the browser at build time. **Rebuild/redeploy** after adding it (Next inlines `NEXT_PUBLIC_*` at build time).

### A3. Remove the hardcoded test-key fallback

In `client/src/components/pages/LogIn.jsx` the `<ReCAPTCHA sitekey=... />` falls back to the test key:

```jsx
sitekey={
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
}
```

Replace the fallback so production fails loudly instead of silently using the always-pass test key:

```jsx
sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
```

If you want a safety net for local dev only:

```jsx
sitekey={
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  (process.env.NODE_ENV !== 'production'
    ? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'  // test key — dev only
    : undefined)
}
```

After A1–A3 the widget is the real Google challenge. But the backend still doesn't check it — continue to Stage B.

---

## Stage B — Enforce the captcha on the server (required)

The flow: the widget produces a **response token** when the user solves it. The client sends that token to the login endpoint. The server calls Google's **siteverify** API with the **secret key** to confirm the token is genuine, unused, and from the right site — and only then proceeds with authentication.

### B1. Add the secret to the server environment

`server/.env` (and the production server's env — never commit the secret):

```
RECAPTCHA_SECRET_KEY=<YOUR_LIVE_SECRET_KEY>
# Optional: when unset in non-production, verification is skipped so local
# dev and the test suite don't need a live secret.
```

The matching test secret (pairs with the test site key, always passes) is `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` — use it only for local manual testing if needed.

### B2. Add a server-side verification helper

Create `server/app/services/captcha_service.py`:

```python
"""Google reCAPTCHA v2 server-side verification.

Verifies the client-supplied response token against Google's siteverify
endpoint using the secret key. When RECAPTCHA_SECRET_KEY is unset, verification
is skipped (returns True) so local dev / CI do not require a live secret —
production MUST set the secret.
"""
import os
import requests


SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'


def verify_captcha(token, remote_ip=None):
    """Return (ok: bool, error: str|None).

    ok=True when the token is valid OR verification is intentionally disabled
    (no secret configured outside production).
    """
    secret = os.environ.get('RECAPTCHA_SECRET_KEY', '')

    # No secret configured: skip in non-production, fail in production.
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
        # Network/timeout: fail closed in production, open in dev.
        if os.environ.get('FLASK_ENV') == 'production':
            return False, 'Could not verify CAPTCHA. Please try again.'
        return True, None

    if data.get('success'):
        return True, None
    # error-codes examples: 'invalid-input-response', 'timeout-or-duplicate'
    return False, 'CAPTCHA verification failed. Please try again.'
```

> `requests` is already a dependency of the server (used elsewhere). If not, add it to `server/requirements.txt`.

### B3. Accept the token in the login schema

In `server/app/schemas/__init__.py`, add a field to `LoginSchema`:

```python
class LoginSchema(_StrictModel):
    email: Optional[str] = None
    username: Optional[str] = None
    identifier: Optional[str] = None
    password: Optional[str] = None
    captchaToken: Optional[str] = None   # reCAPTCHA v2 response token
```

(The schema uses `extra='forbid'`, so this field MUST be declared or the request is rejected.)

### B4. Verify in the login handler

In `server/app/controllers/auth_controller.py::login`, verify the token **before** checking the password. Decide *when* the captcha is required — to mirror the current UX (captcha appears after the first failed attempt), require it only when prior recent failures exist; otherwise require it always. Simplest robust policy: **require the captcha whenever the account/identifier already has a recent failed attempt.**

Add near the top of `login`, after resolving `identifier`/`org_id` and the lockout check:

```python
        from ..services.captcha_service import verify_captcha

        # Require a CAPTCHA once the identifier has any recent failed attempt,
        # mirroring the client UX (widget shows after the first failure).
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
        recent_failures = LoginAttempt.query.filter(
            LoginAttempt.identifier == identifier,
            LoginAttempt.is_success == False,  # noqa: E712
            LoginAttempt.attempted_at >= cutoff,
        ).count()

        if recent_failures > 0:
            ok, captcha_err = verify_captcha(payload.captchaToken, request.remote_addr)
            if not ok:
                _log_attempt(identifier, ip, user.id if user else None, False, 'captcha_failed')
                return jsonify({'success': False, 'error': captcha_err}), 400
```

> Want the captcha on **every** login instead? Drop the `recent_failures` guard and always call `verify_captcha`. Update the client so the widget shows on first load too (see B5 note).

### B5. Send the token from the client

In `client/src/components/pages/LogIn.jsx`:

1. Store the token (not just a boolean). `handleCaptchaChange(value)` already receives the token `value`:
   ```jsx
   const [captchaToken, setCaptchaToken] = useState(null);
   // ...
   const handleCaptchaChange = (value) => {
     if (value) {
       setCaptchaVerified(true);
       setCaptchaToken(value);          // keep the real token
       setError("");
       setTimeout(() => setShowCaptchaPopup(false), 800);
     }
   };
   ```
2. Pass it into the login call. Find the submit handler's `await login(loginCredential, loginPassword)` and include the token. Update the `login` function in `client/src/context/AuthContext.js` and the `auth.login` API helper to forward `captchaToken` in the POST body, e.g.:
   ```jsx
   const data = await login(loginCredential, loginPassword, captchaToken);
   ```
   and in the auth API module:
   ```js
   export async function login(identifier, password, captchaToken) {
     return request('POST', '/auth/login', {
       body: { identifier, password, captchaToken },
     });
   }
   ```
3. Reset the token on failure (next to the existing `recaptchaRef.current.reset()`):
   ```jsx
   setCaptchaToken(null);
   setCaptchaVerified(false);
   ```

### B6. Test it

- **Local (skip mode):** leave `RECAPTCHA_SECRET_KEY` unset and `FLASK_ENV` not `production` → `verify_captcha` returns True, login works without solving (so dev/CI are unblocked).
- **Local (real):** set the **test** site+secret pair → widget renders, token always verifies.
- **Staging/Prod:** set the **live** site key (client) + **live** secret (server) + `FLASK_ENV=production`. Then:
  1. Fail a login once → the widget appears.
  2. Solve it → login proceeds.
  3. Try calling `POST /api/web/auth/login` directly (e.g. curl) after a failed attempt **without** a `captchaToken` → server returns `400 CAPTCHA verification failed`. This confirms server-side enforcement.

---

## Checklist

- [ ] Created a reCAPTCHA **v2 Checkbox** site in Google admin with all production domains.
- [ ] Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (client env, all environments) and redeployed.
- [ ] Removed the hardcoded test-key fallback in `LogIn.jsx`.
- [ ] Set `RECAPTCHA_SECRET_KEY` on the server (prod) — not committed.
- [ ] Added `captcha_service.py`, `captchaToken` in `LoginSchema`, and verification in `login`.
- [ ] Client sends `captchaToken` and resets it on failure.
- [ ] Verified the direct-API bypass is blocked in production.

## Notes & gotchas

- `NEXT_PUBLIC_*` vars are inlined at **build** time — you must rebuild the client after changing the site key, not just restart.
- reCAPTCHA tokens are **single-use** and expire (~2 min). The `timeout-or-duplicate` error means the user solved it but took too long or you sent it twice — reset the widget and retry.
- Keep the **secret key** server-side only. If it ever lands in the client bundle or git, rotate it in the Google admin console.
- If you later want frictionless scoring instead of a checkbox, that's **reCAPTCHA v3** or **Cloudflare Turnstile** — both need different client widgets and a different verify call, so treat that as a separate change.
