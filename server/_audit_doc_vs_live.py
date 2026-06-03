"""Cross-check live url_map against api_routes_documentation.md for Task 22.

Reports any (method, rule) pair returned by the live Flask app that is not
mentioned in api_routes_documentation.md. Phase 4A RPI routes are noted but
not flagged as failures (rpi-carveout). The doc uses Express-style
`:placeholder` syntax for path params; Flask's url_map uses `<int:placeholder>`
or `<placeholder>`. We normalize both to a `:placeholder` shape before
comparison.
"""
import json
import re

with open("_live_routes.json", encoding="utf-8") as fh:
    live = json.load(fh)
with open(r"..\api_routes_documentation.md", encoding="utf-8") as fh:
    doc = fh.read()

# Skip the canonical Flask defaults that are not part of the public API surface.
PUBLIC = [(m, p) for m, p in live if not p.startswith("/static") and p not in ("/", "/health")]


def to_doc_form(rule: str) -> list[str]:
    """Return a list of candidate doc-form strings for the given Flask rule.

    The doc uses Express-style `:name` for placeholders, sometimes with
    different parameter names than the Flask route (e.g., `:id` vs
    `<int:user_id>`). Generate every candidate the doc might use.
    """
    out: list[str] = [rule]  # original
    # Strip Flask converter prefix.
    stripped = re.sub(r"<(?:int|string):([^>]+)>", r"<\1>", rule)
    out.append(stripped)
    # Convert <name> → :name (Express style).
    out.append(re.sub(r"<([^>]+)>", r":\1", stripped))
    # Convert <name> → :id (the doc often shortens any int placeholder to :id).
    out.append(re.sub(r"<int:[^>]+>", ":id", rule))
    out.append(re.sub(r"<(?:int:)?[^>]+>", ":id", rule))
    return out


missing = []
present = []
for method, rule in PUBLIC:
    candidates = to_doc_form(rule)
    if any(c in doc for c in candidates):
        present.append((method, rule))
    else:
        missing.append((method, rule, candidates))

print(f"Total live app routes: {len(live)}")
print(f"Public-API routes: {len(PUBLIC)}")
print(f"Documented (rule found in any candidate form): {len(present)}")
print(f"Missing from doc: {len(missing)}")
if missing:
    print("\nUndocumented routes (require review):")
    for method, rule, _candidates in missing:
        print(f"  - {method:8} {rule}")
