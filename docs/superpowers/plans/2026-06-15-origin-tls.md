# Origin TLS Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the connection between Cloudflare and the origin (Render backend / Cloudflare Pages frontend) is encrypted and validated end-to-end, so the HSTS header the app already advertises is actually backed by real TLS on every hop.

**Architecture:** Production runs on Render (backend) and Cloudflare Pages (frontend), both of which terminate HTTPS automatically with valid certificates. The remaining risk is the **Cloudflare SSL/TLS encryption mode**: if it is set to "Flexible", Cloudflare talks to the origin over plain HTTP even though the browser sees HTTPS. The fix is to set the mode to **Full (strict)**, which forces Cloudflare→origin to use HTTPS and validate the origin's certificate. This is a Cloudflare dashboard configuration change plus verification — no application code change. (The `nginx/default.conf` + `docker-compose.yml` in the repo are a self-hosting setup that is NOT the production path and are out of scope here.)

**Tech Stack:** Cloudflare SSL/TLS settings, Render (auto TLS), `curl` for verification.

---

## Background the engineer needs

- Cloudflare's SSL/TLS "encryption mode" controls the CDN-edge → origin hop:
  - **Flexible** — browser↔Cloudflare is HTTPS, but Cloudflare↔origin is plain HTTP. Insecure: the origin hop can be intercepted, and HSTS is misleading.
  - **Full** — Cloudflare↔origin is HTTPS but the origin cert is NOT validated (a self-signed cert is accepted).
  - **Full (strict)** — Cloudflare↔origin is HTTPS AND the origin certificate must be valid/trusted. This is the target.
- Render serves every service over HTTPS with a valid, publicly-trusted certificate by default, so **Full (strict)** works with Render origins without installing any custom cert.
- The app already sends `Strict-Transport-Security` (HSTS). HSTS is only honest once every hop is real TLS — which Full (strict) guarantees.

---

## File Structure

No code files change. One documentation artifact records the setting and the verification procedure.

| File | Responsibility | Action |
| --- | --- | --- |
| `docs/runbooks/origin-tls.md` | Record the required Cloudflare SSL mode + how to verify it | Create |

---

### Task 1: Set Cloudflare SSL/TLS mode to Full (strict) and verify

**Files:**
- Create: `docs/runbooks/origin-tls.md`

- [ ] **Step 1: Check the current Cloudflare SSL/TLS mode**

In the Cloudflare dashboard → select the `ecopoints.org` zone → **SSL/TLS** → **Overview**. Note the current encryption mode.

Expected finding: if it shows **Flexible**, that is the gap to fix. If it already shows **Full (strict)**, this plan is just documentation (proceed to Step 3).

- [ ] **Step 2: Switch the mode to Full (strict)**

In **SSL/TLS → Overview**, select **Full (strict)**.

> Safe-change note: Full (strict) only works if the origin already serves valid HTTPS. Render does. If any origin (e.g. an API subdomain) does NOT serve HTTPS with a trusted cert, Full (strict) will return HTTP 525/526 for that host — verify in Step 4 immediately after switching, and be ready to revert to the previous mode if a host breaks.

- [ ] **Step 3: Create `docs/runbooks/origin-tls.md`**

Create the file with exactly this content:

```markdown
# Runbook: Origin TLS (Cloudflare encryption mode)

**Required setting:** Cloudflare → SSL/TLS → Overview → **Full (strict)**.

## Why
- Browser↔Cloudflare and Cloudflare↔origin must BOTH be HTTPS for the
  `Strict-Transport-Security` (HSTS) header the app sends to be honest.
- "Flexible" leaves the Cloudflare→origin hop in plaintext — a
  man-in-the-middle risk between the CDN edge and the origin.
- Render serves valid, publicly-trusted certificates automatically, so
  "Full (strict)" works without installing a custom origin certificate.

## Modes (for reference)
| Mode | Browser↔CF | CF↔origin | Origin cert validated? |
| --- | --- | --- | --- |
| Flexible | HTTPS | HTTP | n/a — INSECURE |
| Full | HTTPS | HTTPS | No |
| Full (strict) | HTTPS | HTTPS | Yes ← required |

## Verify
Run from any machine:
```bash
curl -sSI https://ecopoints.org | grep -i strict-transport-security
curl -sSI https://api.ecopoints.org/api/web/health
```
- The first command must print an `strict-transport-security:` header.
- The second must return `HTTP/2 200` (not 525/526, which indicate an
  origin-cert problem under Full (strict)).

## If a host breaks after switching (HTTP 525/526)
That host's origin is not serving a valid cert. Either fix the origin's
HTTPS, or temporarily revert SSL/TLS mode to "Full" for triage. Do NOT
revert to "Flexible".
```

- [ ] **Step 4: Verify end-to-end TLS**

Run from your machine (replace hosts with the real production hostnames if different):

```bash
curl -sSI https://ecopoints.org | grep -i strict-transport-security
```
Expected: a line beginning `strict-transport-security:` is printed.

```bash
curl -sSI https://api.ecopoints.org/api/web/health
```
Expected: `HTTP/2 200`. A `525` or `526` means an origin certificate problem under Full (strict) — see the runbook's triage section.

- [ ] **Step 5: Commit the runbook**

```bash
git add docs/runbooks/origin-tls.md
git commit -m "docs: document required Cloudflare Full (strict) origin TLS"
```

---

## Self-Review

**1. Spec coverage:** Gap = "CF→origin hop encrypted; HSTS currently advertised but origin listens on :80." Reframed correctly for the real Render+Cloudflare hosting: the fix is Cloudflare **Full (strict)** mode (Step 2), verified end-to-end (Step 4), and documented (Step 3). The `:80` origin concern came from the unused self-host nginx config, which is explicitly out of scope. ✅

**2. Placeholder scan:** No TBD/TODO. Exact dashboard path, exact `curl` commands, and expected outputs are given. ✅

**3. Type/name consistency:** Hostnames (`ecopoints.org`, `api.ecopoints.org`) match the CORS allowlist in `server/app/__init__.py` and the nginx `server_name`. Mode name "Full (strict)" is used consistently. ✅

---

## Notes

If you later move OFF Cloudflare or self-host with the repo's `nginx/` setup, origin TLS becomes a different task (install certs in nginx, listen on 443). That is not the current production path.
