"""
Redis-backed cache for the EcoPoints API.

Provides a caching layer for expensive read-only endpoints (dashboard stats,
leaderboard, analytics) using Redis as the primary store.

Graceful fallback: If Redis is unavailable (connection refused, timeout, etc.),
all cache operations silently degrade to no-ops — the app queries Postgres
directly, just slower. No request ever fails because of cache unavailability.

Configuration:
    REDIS_URL  — Full Redis connection URL (e.g., redis://red-xxx:6379)
                 Defaults to redis://localhost:6379/0 in development.

Phase 2 — Requirement: "Data fetching performance even on prod"
"""
import json
import logging
import os
import time
from functools import wraps

import redis
from flask import request as flask_request

logger = logging.getLogger(__name__)

# ── Singleton Redis client ─────────────────────────────────────────────
_redis_client = None
_redis_available = False


def init_redis(app=None):
    """
    Initialize the Redis connection. Called once from create_app().
    Stores the client in module-level state for use by cache helpers.
    """
    global _redis_client, _redis_available
    redis_url = os.environ.get('REDIS_URL')

    if not redis_url:
        print('[CACHE] REDIS_URL not set — caching disabled, using DB fallback')
        _redis_client = None
        _redis_available = False
        return False

    try:
        _redis_client = redis.from_url(
            redis_url,
            decode_responses=True,  # Return strings, not bytes
            socket_connect_timeout=3,
            socket_timeout=2,
            retry_on_timeout=True,
        )
        # Ping to verify connection
        _redis_client.ping()
        _redis_available = True
        safe_url = redis_url.split('@')[-1] if '@' in redis_url else redis_url
        print(f'[CACHE] Redis connected: {safe_url}')
    except (redis.ConnectionError, redis.TimeoutError, Exception) as e:
        _redis_client = None
        _redis_available = False
        print(f'[CACHE] Redis unavailable ({e}) — caching disabled, DB fallback active')

    return _redis_available


def get_redis():
    """Return the Redis client or None if unavailable."""
    return _redis_client if _redis_available else None


# ── Cache key helpers ──────────────────────────────────────────────────

CACHE_PREFIX = 'eco:'


def _key(namespace, location_id=None):
    """Build a namespaced cache key."""
    loc = str(location_id) if location_id else 'global'
    return f"{CACHE_PREFIX}{namespace}:{loc}"


# ── Core get / set / invalidate ────────────────────────────────────────

def cache_get(key):
    """
    Retrieve a cached value by key. Returns the deserialized Python object
    or None if key is missing, expired, or Redis is unavailable.
    """
    r = get_redis()
    if not r:
        return None
    try:
        raw = r.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except (redis.RedisError, json.JSONDecodeError, Exception) as e:
        logger.debug('cache_get(%s) failed: %s', key, e)
        return None


def cache_set(key, value, ttl_seconds=60):
    """
    Store a JSON-serializable value with a TTL (seconds).
    Silently no-ops if Redis is unavailable.
    """
    r = get_redis()
    if not r:
        return
    try:
        r.setex(key, ttl_seconds, json.dumps(value, default=str))
    except (redis.RedisError, Exception) as e:
        logger.debug('cache_set(%s) failed: %s', key, e)


def cache_delete(key):
    """Delete a specific cache key."""
    r = get_redis()
    if not r:
        return
    try:
        r.delete(key)
    except (redis.RedisError, Exception) as e:
        logger.debug('cache_delete(%s) failed: %s', key, e)


def cache_invalidate(namespace):
    """
    Invalidate all keys under a namespace using SCAN (non-blocking).
    E.g., cache_invalidate('dashboard') deletes eco:dashboard:*.
    """
    r = get_redis()
    if not r:
        return
    try:
        pattern = f"{CACHE_PREFIX}{namespace}:*"
        cursor = 0
        while True:
            cursor, keys = r.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                r.delete(*keys)
            if cursor == 0:
                break
    except (redis.RedisError, Exception) as e:
        logger.debug('cache_invalidate(%s) failed: %s', namespace, e)


def cache_invalidate_all():
    """Flush all EcoPoints cache keys (preserves other Redis data)."""
    r = get_redis()
    if not r:
        return
    try:
        pattern = f"{CACHE_PREFIX}*"
        cursor = 0
        while True:
            cursor, keys = r.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                r.delete(*keys)
            if cursor == 0:
                break
    except (redis.RedisError, Exception) as e:
        logger.debug('cache_invalidate_all failed: %s', e)


# ── Decorator for Flask endpoints ──────────────────────────────────────

def cached_endpoint(namespace, ttl=60, location_param='location_id'):
    """
    Decorator that caches the full JSON response of a Flask route handler.

    Cache key: eco:{namespace}:{location_id|global}

    The decorated route MUST return a tuple of (response, status_code).
    Only 200 responses with success=True are cached.

    Usage:
        @dashboard_bp.route('/stats', methods=['GET'])
        @token_required
        @cached_endpoint('dashboard_stats', ttl=60)
        def get_stats(current_user):
            ...
            return jsonify({...}), 200
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            loc_id = flask_request.args.get(location_param)
            key = _key(namespace, loc_id)

            # Try cache first
            cached = cache_get(key)
            if cached is not None:
                from flask import jsonify as jfy
                return jfy(cached), 200

            # Cache miss — execute the handler
            result = fn(*args, **kwargs)

            # Cache the response if it's a successful 200
            if isinstance(result, tuple) and len(result) == 2:
                response, status = result
                if status == 200:
                    try:
                        data = response.get_json()
                        if data and data.get('success'):
                            cache_set(key, data, ttl)
                    except Exception:
                        pass

            return result
        return wrapper
    return decorator


# ── Leaderboard-specific sorted set helpers ────────────────────────────

def leaderboard_update(user_id, score, location_id=None):
    """
    Update a user's score in the Redis sorted set leaderboard.
    This enables O(log N) ranked queries without hitting Postgres.
    """
    r = get_redis()
    if not r:
        return
    try:
        key = _key('lb_users', location_id)
        r.zadd(key, {str(user_id): score})
    except (redis.RedisError, Exception) as e:
        logger.debug('leaderboard_update failed: %s', e)


def leaderboard_top(n=100, location_id=None):
    """
    Get top N users from the sorted set leaderboard.
    Returns list of (user_id_str, score) tuples, highest first.
    Returns None if Redis is unavailable (caller should fall back to DB).
    """
    r = get_redis()
    if not r:
        return None
    try:
        key = _key('lb_users', location_id)
        return r.zrevrange(key, 0, n - 1, withscores=True)
    except (redis.RedisError, Exception) as e:
        logger.debug('leaderboard_top failed: %s', e)
        return None
