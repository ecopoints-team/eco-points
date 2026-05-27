"""
Web Application Controller — parent blueprint.

Phase 1 (task 3.13): this file is reduced to a thin shim. Every handler
that previously lived here has been extracted into a per-domain
controller (`dashboard_controller.py`, `users_controller.py`,
`locations_controller.py`, `machines_controller.py`,
`rewards_controller.py`, `logs_controller.py`,
`leaderboard_controller.py`, `groups_controller.py`,
`analytics_controller.py`, `settings_controller.py`,
`sessions_controller.py`). Those Domain_Controllers are registered as
sub-blueprints of `web_bp` in `server/app/__init__.py` so the externally
visible `/api/web/...` URL inventory stays byte-identical with the
pre-Phase-1 routing surface (Requirements 1.1, 1.2, 1.6, 7.1).

Only the parent blueprint definition and the public health route remain
in this file.

Prefix: /api/web
"""
from flask import Blueprint, jsonify

web_bp = Blueprint('web', __name__, url_prefix='/api/web')


# ══════════════════════════════════════════════════════════════════════════
# HEALTH (public)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'success': True, 'message': 'Web API is running', 'status': 'healthy'}), 200
