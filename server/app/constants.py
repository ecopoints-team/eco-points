"""
EcoPoints — Application-wide constants.

These values are FIXED and not configurable via the admin UI.
To change them, update this file and redeploy.
"""

# ── Bottle point values ────────────────────────────────────────────────────
#
# Points awarded per accepted bottle, keyed by size class.
# Size ranges:
#   XS  125 ml – 289 ml   →  3 pts
#   S   290 ml – 350 ml   →  5 pts
#   M   351 ml – 550 ml   →  8 pts
#   L   551 ml – 1000 ml  → 12 pts
#
# This dict is consumed by:
#   - GET /api/rpi/config/points/<org_id>  (RPI firmware fetches on startup)
#   - GET /api/web/settings/points         (admin UI read-only display)
#
# The "WithLabel" / "NoLabel" distinction has been removed — all bottles
# of the same size earn the same points regardless of label presence.

BOTTLE_POINTS = {
    'extraSmall': 3,   # XS: 125 ml – 289 ml
    'small':      5,   # S:  290 ml – 350 ml
    'medium':     8,   # M:  351 ml – 550 ml
    'large':     12,   # L:  551 ml – 1000 ml
}
