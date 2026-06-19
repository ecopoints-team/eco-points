---
config:
  layout: elk
  theme: forest
---
erDiagram
    ORG_TYPES ||--o{ ORGANIZATIONS : "categorizes"
    ORGANIZATIONS ||--|| ORG_ADDRESS : "is located at"
    ORGANIZATIONS ||--o{ ORG_CONTACT : "has person in charge"
    ORGANIZATIONS ||--o{ COMMUNITY_GROUPS : "has groups"
    ORGANIZATIONS ||--o{ REWARDS : "offers"
    ORGANIZATIONS ||--o{ RVMS : "deploys"
    ORGANIZATIONS ||--o{ NOTIFICATION_SETTINGS : "configures alerts"
    ORGANIZATIONS ||--o{ NOTIFICATION_LOGS : "receives alerts"
    REWARD_CATEGORIES ||--o{ REWARDS : "classifies"
    REWARDS ||--o{ REWARD_ORGANIZATION_ASSIGNMENTS : "shared with"
    ORGANIZATIONS ||--o{ REWARD_ORGANIZATION_ASSIGNMENTS : "receives shared rewards"
    COMMUNITY_GROUPS ||--o{ USERS : "has members"
    USERS ||--|| WALLET: "owns"
    USERS ||--|| USER_SECURITY : "secures account"
    USERS ||--o{ OTP_CODES : "generates"
    USERS ||--o{ ADMIN_LOGS : "performs admin action"
    USERS ||--o{ MAINTENANCE_LOGS : "performs"
    USERS ||--o{ BULK_DEPOSITS : "processes manual deposit"
    RVMS ||--o{ MAINTENANCE_LOGS : "has history"
    RVMS ||--o{ RECYCLING_SESSIONS : "hosts"
    WALLET ||--o{ TRANSACTIONS : "logs"
    WALLET ||--o{ RECYCLING_SESSIONS : "earns from"
    WALLET ||--o{ BULK_DEPOSITS : "receives bulk points"
    WALLET ||--o{ REWARD_REDEMPTIONS : "spends on"
    REWARDS ||--o{ REWARD_VARIANTS : "has options"
    REWARD_VARIANTS ||--o{ REWARD_REDEMPTIONS : "specifically claimed"
    RECYCLING_SESSIONS ||--o{ RECYCLING_ITEMS : "contains"

    ORG_TYPES {
        int id PK
        string name "Fixed: University, Corporate, Community"
        datetime created_at
    }

    ORGANIZATIONS {
        int id PK
        string name "Org Abbreviation"
        string full_name "Full Org Name"
        int type_id FK "Reference -> ORG_TYPES"
        enum status "Active, Inactive"
        datetime force_logout_at "Nullable - Phase 4C force-logout cutoff"
        binary qr_hmac_secret_enc "Nullable - Phase 4A Fernet-encrypted HMAC secret"
        datetime created_at
    }

    ORG_ADDRESS {
        int id PK
        int organization_id FK "Reference -> ORGANIZATIONS"
        string street_address "House/Block/Lot/Street"
        string barangay
        string city_municipality
        string province
        string region
        string zip_code
    }

    ORG_CONTACT {
        int id PK
        int organization_id FK "Reference -> ORGANIZATIONS"
        string first_name "First Name of Person-in-Charge (PIC)"
        string last_name "Last Name of PIC"
        string email "Email Address of PIC | Unique per org"
        string phone_number "Phone Number of PIC | Unique per org"
        datetime created_at
    }

    COMMUNITY_GROUPS {
        int id PK
        int organization_id FK "Reference -> ORGANIZATIONS"
        string name "e.g. BSIT, STEM, IT Dept"
        string abbreviation "Short display name"
        string educational_level "Nullable - Kindergarten, Elementary, JHS, SHS, College | University org type only"
        datetime created_at
    }

    REWARD_CATEGORIES {
        int id PK "Newly Added"
        int organization_id FK "Reference -> ORGANIZATIONS | Newly Added"
        string name "e.g. Merchandise, Voucher, Sustainable | Newly Added"
        datetime created_at "Newly Added"
    }

    REWARDS {
        int id PK
        int organization_id FK "Reference -> ORGANIZATIONS"
        string name "e.g. Pen"
        text description "e.g. Used for Writing"
        int category_id FK "Reference -> REWARD_CATEGORIES | Newly Added (replaces string category)"
        int points_required "Points Needed for Redemption"
        string image_url "Image Storage"
        boolean is_active
        datetime deactivated_at "Nullable - When reward was disabled"
        datetime created_at
    }

    REWARD_REDEMPTIONS {
        int id PK
        int wallet_id FK "References -> WALLET"
        int variant_id FK "References -> REWARD_VARIANTS"
        int points_spent "Locked snapshot of cost"
        enum status "pending, claimed"
        string redemption_code UK "Unique voucher code (Used for QR)"
        datetime redeemed_at "When they clicked 'buy'"
        datetime claimed_at "Nullable - When they actually got the item"
    }

    REWARD_VARIANTS {
        int id PK
        int reward_id FK "Reference -> REWARDS"
        string variety_name "e.g. Red - Medium, Blue - Large"
        int stock_quantity "inventory for item"
        string image_url "Nullable - Variant-specific product image"
        boolean is_active
        datetime created_at
    }

    REWARD_ORGANIZATION_ASSIGNMENTS { "Newly by Tatin"
        int id PK
        int reward_id FK "Reference -> REWARDS (owner org's reward)"
        int organization_id FK "Reference -> ORGANIZATIONS (org receiving access)"
        datetime assigned_at "When superadmin shared this reward"
    }
   
    RVMS {
        int id PK
        int organization_id FK "Reference -> ORGANIZATIONS"
        string machine_uuid UK "Hardware identifier"
        string name "Machine Display Name"
        string location_name "Area Placement | e.g. Cafeteria, Park"
        string api_key_hash "Nullable - Phase 4A BCrypt hash of RVM API key"
        boolean is_capacity_full "Status from IR Sensor"
        boolean is_online
        datetime created_at
    }

    NOTIFICATION_SETTINGS {
        int id PK
        int organization_id FK "Reference -> ORGANIZATIONS"
        string alert_key "e.g. machine_offline, bin_full"
        int threshold "Nullable - Context Dependent | e.g. 10 (lowest stock), NULL (bin_full)"
        boolean email_enabled "Default true"
        boolean sms_enabled "Default false"
        text recipients_json "JSON array of specific emails/phones"
        boolean is_active "Default true"
        datetime created_at
        datetime updated_at "Changes on Notif Settings"
    }

    NOTIFICATION_LOGS {
        int id PK
        int organization_id FK "Reference -> ORGANIZATIONS"
        string alert_key "e.g. machine_offline, bin_full, low_reward_stock"
        string channel "e.g. Email, SMS"
        string recipient "Specific Email or Phone number"
        string subject "Notification Subject Line"
        text body_preview "First 500 chars of body"
        enum status "sent, failed"
        text error_message "Nullable - failure details"
        datetime sent_at
    }

    USERS {
        int id PK
        int community_group_id FK "References -> COMMUNITY_GROUPS"
        string display_id UK "e.g. USER-AU-001"
        string first_name
        string middle_name "Nullable"
        string last_name
        string username UK "Unique login handle"
        string email UK "Required - for Account Access"
        string phone UK "Nullable"
        string password_hash "Required - for Account Access"
        string role "e.g. admin roles and user"
        string user_type "Org-type dependent | student, alumni, faculty, staff, resident, community_official, community_worker, business_owner, employee, manager, executive, contractor, guest"
        string year_level "Nullable - e.g. Grade 11, 3rd Year | Student user_type only"
        boolean is_active
        datetime last_login "Log in Tracking"
        datetime deactivated_at "Nullable - When account was disabled"
        string avatar_url "Nullable - Profile avatar image"
        datetime last_username_change "Nullable - 30-day cooldown enforcement"
        datetime updated_at "Edited Details"
        datetime terms_accepted_at "Data Privacy Act consent timestamp"
        datetime created_at
    }

    WALLET {
        int id PK
        int user_id FK "References -> USERS"
        int points_balance "Current spendable points"
        int lifetime_points "Total ever earned (For leaderboards)"
        int streak "Consecutive recycling days"
        datetime updated_at "Points and Streak Updates"
        datetime created_at
    }

    USER_SECURITY {
        int id PK
        int user_id FK "References -> USERS"
        boolean two_factor_enabled "Default false"
        string preferred_method "email, sms, authenticator"
        datetime updated_at
    }

    OTP_CODES {
        int id PK
        int user_id FK "References -> USERS"
        string code_hash "Hashed 6-digit code"
        string sent_to "Specific email or phone number"
        string channel "email, sms"
        boolean is_used "Default false"
        int attempts "Default 0 - Wrong-code attempt counter"
        datetime expires_at "Current time + 5 minutes"
        datetime created_at
    }

    MAINTENANCE_LOGS {
        int id PK
        int rvm_id FK "References -> RVMS"
        int performed_by_id FK "References -> USERS"
        string action_type "Issue description | e.g. Sensor Replaced"
        enum status "Resolved, Pending, or Cancelled"
        text notes "Detailed repair logs"
        datetime created_at "Exact timestamp of the action"
    }

    ADMIN_LOGS {
        int id PK
        int admin_user_id FK "References -> USERS"
        string action "e.g. Added Reward, Issued Refund, Updated Settings"
        string target "The ID or name of the thing they changed"
        string category "e.g. Users, Machines, Rewards, System"
        text notes "Optional explanation for the change"
        datetime created_at "Exact timestamp of the action"
    }

    TRANSACTIONS {
        int id PK
        int wallet_id FK "References -> WALLET"
        string transaction_type "earn, redeem, bulk_transaction"
        int amount "Positive for earn, Negative for redeem"
        int balance_before "Audit snapshot"
        int balance_after "Audit snapshot"
        string reference_type "session, redemption, admin_log, bulk_deposit"
        int reference_id "The integer ID of the specific event"
        datetime created_at
    }

    RECYCLING_SESSIONS {
        int id PK
        int rvm_id FK "References -> RVMS"
        int wallet_id FK "References -> WALLET"
        int total_points_earned "Sum of points - items"
        int item_count "Number of bottles deposited"
        enum status "active, completed, timed_out, error"
        text notes "Nullable - Free-form notes (bulk-deposit admin modal)"
        datetime start_time
        datetime end_time
    }

    RECYCLING_ITEMS {
        int id PK
        int session_id FK "References -> RECYCLING_SESSIONS"
        string detected_class "YOLOv8 output | e.g., 'coke_bottle', 'sprite_can', 'unknown'"
        int points_awarded "Calculated by backend before saving"
        decimal confidence_score "YOLOv8 accuracy % | e.g. 95.5"
        enum status "Accepted, Rejected"
        datetime scanned_at        
    }

    BULK_DEPOSITS {
        int id PK
        int admin_user_id FK "References -> USERS"
        int wallet_id FK "References -> WALLET"
        int total_points_awarded "Points granted by admin"
        int item_count "For tracking stats"
        text notes "Reasoning | e.g. 'Dropped off 5 bags of bottles'"
        datetime created_at
    }

    TOKEN_BLACKLIST {
        int id PK
        string jti UK "JWT ID - unique token identifier"
        datetime created_at
        datetime expires_at "Token expiry for backend cron job cleanup"
    }

    LOGIN_ATTEMPTS {
        int id PK
        string identifier "Username or email attempted"
        string ip_address "Nullable - Origin of the request"
        int user_id "Nullable - Soft link if the user exists"
        boolean is_success
        string failure_reason "Nullable - e.g. Wrong Password, Banned"
        datetime attempted_at
    }