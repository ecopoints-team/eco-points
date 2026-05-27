"""One-shot helper: dump the live Flask url_map for cross-checking against api_routes_documentation.md."""
import json
import os
import sys

os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-1234567890ABCDEF")
sys.path.insert(0, ".")

from app import create_app  # noqa: E402

app = create_app()
rules = sorted(
    {
        (",".join(sorted(r.methods - {"HEAD", "OPTIONS"})), str(r.rule))
        for r in app.url_map.iter_rules()
    }
)
with open("_live_routes.json", "w", encoding="utf-8") as fh:
    json.dump(rules, fh, indent=2)
print(f"wrote {len(rules)} (method, rule) pairs to _live_routes.json")
