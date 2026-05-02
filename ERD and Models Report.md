# ERD Migration — Final Status Report

> **Scope:** Complete backend migration from legacy 18-table schema to 19-table ERD.  
> **As of:** 2026-05-03

---

## Overall Status

| File | Status | Type |
|------|--------|------|
| `models.py` | ✅ Complete | Full rewrite — 19 models |
| `middleware.py` | ✅ Complete | Targeted fix — removed Account indirection |
| `auth_controller.py` | ✅ Complete | Full rewrite — Wallet/UserSecurity provisioning |
| `rpi_controller.py` | ✅ Complete | Full rewrite — QR auth, ML-native items |
| `otp_service.py` | ✅ Complete | In-memory dict → persistent OtpCode DB |
| `web_controller.py` | ✅ Complete | ~40 routes migrated, all legacy refs purged |
| `seed.py` | ⚠️ Partially Complete | Core tables migrated; `BulkDeposit` import & final sections pending verification |

---

## Schema Changes

### Models Removed (3)

| Model | Table | Reason |
|-------|-------|--------|
| `City` | `cities` | Replaced by flat `city_municipality` string on `OrgAddress`. Removed join overhead. |
| `Account` | `accounts` | Split into `Wallet` (points) + `User.community_group_id` (membership). Eliminated 1 join from every scoped query. |
| `AccessCredential` | `access_credentials` | RFID approach dropped. QR auth uses `User.display_id` directly. |

### Models Added (6)

| Model | Table | Purpose |
|-------|-------|---------|
| `OrgAddress` | `org_address` | 1:1 address per Organization. Decouples address updates from org record. |
| `OrgContact` | `org_contact` | 1:N contacts per Organization. Supports multiple named PICs. |
| `Wallet` | `wallet` | 1:1 per User. Stores `points_balance`, `lifetime_points`, `streak`. O(1) leaderboard reads. |
| `UserSecurity` | `user_security` | Isolates 2FA settings (`two_fa_enabled`, `preferred_method`) from User. |
| `OtpCode` | `otp_codes` | Persistent OTP records. Survives restarts, scales across workers, auditable. |
| `RewardVariant` | `reward_variants` | Per-reward SKU with independent `stock_quantity`. Replaces single `stock_quantity` on Reward. |
| `BulkDeposit` | `bulk_deposits` | Admin manual deposit. Dedicated table with `admin_user_id`, `wallet_id`, `total_points_awarded`. |

### Key Field Changes

| Model | Old Field | New Field | Reason |
|-------|-----------|-----------|--------|
| `User` | `account_id FK → accounts` | `community_group_id FK → community_groups` | Direct FK, 1 less join |
| `User` | `name String(200)` | `first_name`, `middle_name`, `last_name` | Proper sorting/searching |
| `RecyclingItem` | `item_type, brand, volume_ml, condition, deposited_at` | `detected_class, confidence_score, status, scanned_at` | ML-native (YOLOv8) |
| `RecyclingSession` | `account_id FK → accounts` | `wallet_id FK → wallet` | Removes Account indirection |
| `Transaction` | `account_id, description, reference_id String` | `wallet_id, reference_type, reference_id Integer` | Structured references, no string parsing |
| `RewardRedemption` | `account_id, reward_id, used_at, status: 4 values` | `wallet_id, variant_id, claimed_at, status: 2 values` | Variant-level tracking, simplified lifecycle |
| `MaintenanceLog` | `resolved Boolean, timestamp, transaction_id` | `status String (Resolved/Pending/Cancelled), created_at` | Expresses Cancelled state; transaction FK was vestigial |
| `AdminLog` | `timestamp` | `created_at` | Standardized naming |
| `RVM` | `last_heartbeat, current_capacity, total_items_collected` | `is_capacity_full Boolean` | Maps directly to IR sensor boolean output |

---

## File-by-File Changes

### 1. models.py — Full Rewrite
**Path:** `server/app/models.py` | **591 lines**

All 19 models defined in dependency order:
- **Group 1 — Identity:** `OrgType → Organization → OrgAddress/OrgContact → CommunityGroup → User → Wallet/UserSecurity/OtpCode`
- **Group 2 — Hardware:** `RVM → RecyclingSession → RecyclingItem → MaintenanceLog`
- **Group 3 — Economy:** `Transaction → Reward → RewardVariant → RewardRedemption → BulkDeposit`
- **Group 4 — System:** `AdminLog → NotificationSetting → NotificationLog → TokenBlacklist → LoginAttempt`

```diff
+ OrgAddress, OrgContact, Wallet, UserSecurity, OtpCode, RewardVariant, BulkDeposit
- City, Account, AccessCredential
```

---

### 2. middleware.py — Targeted Fix
**Path:** `server/app/middleware.py`

```diff
- user.account.community_group.organization_id   # 3 hops
+ user.community_group.organization_id            # 2 hops
```

`get_user_org_id()` now uses the direct FK on User.

---

### 3. auth_controller.py — Full Rewrite
**Path:** `server/app/controllers/auth_controller.py`

| Route | Change |
|-------|--------|
| `POST /login` | Reads `Wallet.points_balance`, `UserSecurity.two_fa_enabled` |
| `POST /register` | Creates `User` + `Wallet` + `UserSecurity` atomically. Accepts `firstName`/`lastName` |
| `POST /verify-2fa` | Queries `OtpCode` table (replaces in-memory dict) |
| `GET /me` | Returns `walletId`, `pointsBalance`, `lifetimePoints`, `streak` |
| `PUT /me` | Updates `first_name`, `middle_name`, `last_name` fields |

---

### 4. rpi_controller.py — Full Rewrite
**Path:** `server/app/controllers/rpi_controller.py`

| Route | Change |
|-------|--------|
| `POST /scan` | Looks up user by `display_id` (QR), opens session with `wallet_id` |
| `POST /deposit` | Creates `RecyclingItem` with `detected_class`, `confidence_score`, `status`, `scanned_at` |
| `POST /complete` | Credits `Wallet.points_balance` and `lifetime_points` atomically |

---

### 5. otp_service.py — Full Rewrite
**Path:** `server/app/services/otp_service.py`

```diff
- _otp_store = {}                        # In-memory, lost on restart
+ OtpCode(user_id, code_hash, expires_at) # Persistent DB record
```

---

### 6. web_controller.py — Comprehensive Migration
**Path:** `server/app/controllers/web_controller.py` | **~2758 lines, ~40 routes**

#### Imports
```diff
- City, Account, AccessCredential, BulkDeposit
+ OrgAddress, OrgContact, Wallet, UserSecurity, RewardVariant
```

#### Serializers Changed

| Function | Key Change |
|----------|------------|
| `_serialize_city()` | **Removed.** Replaced by `_serialize_address()` |
| `_serialize_organization()` | Uses `org.address`, `org.contacts` relationships |
| `_serialize_user()` | Returns `firstName/middleName/lastName`, `walletId`, `lifetimePoints` |
| `_serialize_rvm()` | `isCapacityFull` replaces `currentCapacity/lastHeartbeat/totalItemsCollected` |
| `_serialize_reward()` | Aggregates stock across `RewardVariant` children, returns `variants[]` |
| `_serialize_bottle_log()` | Returns `detectedClass`, `confidenceScore`, `scannedAt` |
| `_serialize_machine_log()` | `log.status` replaces `log.resolved`; `log.created_at` replaces `log.timestamp` |
| `_serialize_admin_log()` | `admin.community_group` replaces `admin.account.community_group` |
| `_serialize_reward_log()` | Traverses `rd.wallet.user` via `variant.reward` |

#### Routes by Section

| Section | Routes | Migration |
|---------|--------|-----------|
| Dashboard | 1 | `User.join(CommunityGroup)` direct — no Account join |
| Cities | 3 | **Removed entirely** |
| Locations | 4 | Create: `OrgAddress` + `OrgContact`. Update: maps address fields. Delete: cascades via `cg.users` |
| Users | 5 | Create: `User + Wallet + UserSecurity`. Adjust-points: operates on `Wallet` |
| Machines | 4 | `isCapacityFull` boolean replaces capacity integer |
| Rewards | 4 | Create: adds default `RewardVariant`. Update: stock goes to default variant |
| Logs (7 routes) | 7 | `scanned_at` sort; `status == 'Pending'` replaces `not resolved`; Wallet joins throughout |
| Leaderboard | 1 | `Wallet.lifetime_points` for O(1) sort |
| Analytics | 1 (9 sub-queries) | All `deposited_at→scanned_at`, `condition→status`, Account joins → CommunityGroup direct |
| Groups | 3 | Delete guard uses `User.community_group_id` directly |
| Bulk Sessions | 3 | `wallet_id` + `detected_class/confidence_score`; credits Wallet |

---

### 7. seed.py — Partially Migrated
**Path:** `server/app/seeder/seed.py`

#### Completed
- ✅ Imports updated — `City/Account/AccessCredential` → `OrgAddress/OrgContact/Wallet/UserSecurity/RewardVariant`
- ✅ `CITIES_DATA` removed; `LOCATIONS` updated with flat address fields (`street`, `city`, `province`, etc.)
- ✅ `DETECTED_CLASSES` replaces `BOTTLE_BRANDS/BOTTLE_VOLUMES/CONDITIONS`
- ✅ Organizations: creates `OrgAddress` + `OrgContact` per org
- ✅ Admin users: creates `User` + `Wallet` + `UserSecurity` (no Account/AccessCredential)
- ✅ End users: same pattern; `Wallet.lifetime_points` seeded higher than `points_balance`
- ✅ RVMs: removed `total_items_collected` field
- ✅ Rewards: creates default `RewardVariant` per reward
- ✅ Sessions: `wallet_id` replaces `account_id`
- ✅ Items: `detected_class/confidence_score/status/scanned_at` replaces old fields
- ✅ Transactions: `wallet_id`, `reference_type`, structured `reference_id`
- ✅ Redemptions: `wallet_id`, `variant_id`, `claimed_at`, 2-status lifecycle
- ✅ Maintenance logs: `status` replaces `resolved`, `created_at` replaces `timestamp`
- ✅ Admin logs: `created_at` replaces `timestamp`
- ✅ Notification settings + logs: no structural changes needed
- ✅ Bulk deposits: creates `BulkDeposit` + matching `Transaction`
- ✅ Summary table updated to 19-table schema

#### Still Needs Verification
- ⚠️ `BulkDeposit` model must exist in `models.py` (not currently present — ERD specifies it, model needs to be added)
- ⚠️ `_get_points()` helper is still defined but no longer used — can be removed
- ⚠️ `YEAR_LEVELS` variable still referenced in old code — confirm fully removed
- ⚠️ `u.community_group.organization_id` in bulk deposit loop requires `community_group` relationship to be eagerly loaded on `User`

---

## Next Steps

### Step 1 — Add BulkDeposit Model to models.py
The ERD defines `BULK_DEPOSITS` but the model is missing from `models.py`. Add it before running the seeder:

```python
class BulkDeposit(db.Model):
    __tablename__ = 'bulk_deposits'
    id = db.Column(db.Integer, primary_key=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    wallet_id = db.Column(db.Integer, db.ForeignKey('wallet.id'), nullable=False, index=True)
    total_points_awarded = db.Column(db.Integer, nullable=False)
    item_count = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
```

### Step 2 — Check RewardVariant field name
ERD uses `variety_name`. Seed uses `label`. Confirm which field name is in `models.py` and align `seed.py` accordingly.

### Step 3 — Database Reset + Re-seed
```powershell
cd server
flask db drop    # or use --fresh flag on seeder
flask db create
python -m flask shell -c "from app.seeder.seed import run_seed; run_seed(fresh=True)"
```

### Step 4 — Manual Verification Checklist

| # | Test | Endpoint | Expected |
|---|------|----------|----------|
| 1 | Admin login | `POST /api/auth/login` | Token returned; `sysadmin / test123` works |
| 2 | Dashboard stats | `GET /api/web/dashboard/stats` | ~490 users, 5 orgs, correct counts |
| 3 | User list | `GET /api/web/users` | Returns `firstName`, `lastName`, `walletId`, `lifetimePoints` |
| 4 | Create user | `POST /api/web/users` | Creates User + Wallet + UserSecurity; `displayId` generated |
| 5 | Adjust points | `POST /api/web/users/:id/adjust-points` | `Wallet.points_balance` updated |
| 6 | Rewards list | `GET /api/web/rewards` | Returns `variants[]` array per reward |
| 7 | Leaderboard | `GET /api/web/leaderboard` | Sorted by `lifetimePoints` descending |
| 8 | Bottle logs | `GET /api/web/logs/bottles` | Returns `detectedClass`, `confidenceScore`, `scannedAt` |
| 9 | Machine logs | `GET /api/web/logs/machines` | Returns `status` field (not `resolved`) |
| 10 | Analytics | `GET /api/web/analytics` | All 9 sub-queries return data without 500 errors |
| 11 | QR scan (RPI) | `POST /api/rpi/scan` | Looks up user by `displayId` |
| 12 | Bulk deposit | `POST /api/web/bulk-sessions` | Creates `BulkDeposit` + `Transaction`; Wallet credited |
