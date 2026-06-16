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

## How to set it
1. Cloudflare dashboard → select the `ecopoints.org` zone
2. **SSL/TLS** → **Overview**
3. Select **Full (strict)**

## Verify
Run from any machine:
```bash
curl -sSI https://ecopoints.org | grep -i strict-transport-security
curl -sSI https://api.ecopoints.org/api/web/health
```
- The first command must print a `strict-transport-security:` header.
- The second must return `HTTP/2 200` (not 525/526, which indicate an
  origin-cert problem under Full (strict)).

## If a host breaks after switching (HTTP 525/526)
That host's origin is not serving a valid cert. Either fix the origin's
HTTPS, or temporarily revert SSL/TLS mode to "Full" for triage. Do NOT
revert to "Flexible".
