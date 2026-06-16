# Operational Runbooks

Step-by-step procedures for operating and recovering the EcoPoints platform.

| Runbook | Use when |
| --- | --- |
| [db-backup-restore.md](db-backup-restore.md) | Before risky DB operations; to recover lost data |
| [secret-rotation.md](secret-rotation.md) | A secret leaked, a team member left, or on schedule |
| [staging-environment.md](staging-environment.md) | Standing up or using the pre-production environment |
| [origin-tls.md](origin-tls.md) | Verifying Cloudflare TLS mode is Full (strict) |

## Stack reference

| Layer | Service |
| --- | --- |
| Frontend | Cloudflare Pages |
| Backend | Render (Flask + gunicorn) |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| CI/CD | GitHub Actions + Render/Cloudflare auto-deploy |

See also: `docs/deployment-pipeline.md` and `docs/ci.md`.
