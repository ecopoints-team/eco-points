// Shared enum-to-label map for Admin_UI rendering.
//
// Phase 3, task 8.3 / Requirement 3.6:
//   The server returns canonical lowercase enum values; the client renders
//   them through this single shared label map so every page agrees on the
//   human-readable form.
//
// Add new enums here rather than introducing inline lookups in pages.

import { formatField, EMPTY_FIELD_PLACEHOLDER } from './formatField';

// ─── User role ───────────────────────────────────────────────────────
const USER_ROLE_LABELS = {
    superadmin: 'Super Admin',
    head_admin: 'Head Admin',
    auditor: 'Auditor',
    technician: 'Technician',
    inventory_officer: 'Inventory Officer',
    user: 'User',
    dependent: 'Dependent',
};

export function userRoleLabel(role) {
    if (role === null || role === undefined || role === '') return EMPTY_FIELD_PLACEHOLDER;
    return USER_ROLE_LABELS[role] || role;
}

// ─── Machine status (RVM) ────────────────────────────────────────────
const MACHINE_STATUS_LABELS = {
    online: 'Online',
    offline: 'Offline',
    maintenance: 'Maintenance',
    full: 'Full',
};

export function machineStatusLabel(status) {
    if (status === null || status === undefined || status === '') return EMPTY_FIELD_PLACEHOLDER;
    return MACHINE_STATUS_LABELS[status] || status;
}

// ─── Reward redemption status ────────────────────────────────────────
const REDEMPTION_STATUS_LABELS = {
    pending: 'Pending',
    claimed: 'Claimed',
    used: 'Used',
    expired: 'Expired',
};

export function redemptionStatusLabel(status) {
    if (status === null || status === undefined || status === '') return EMPTY_FIELD_PLACEHOLDER;
    return REDEMPTION_STATUS_LABELS[status] || status;
}

// ─── Bottle / recycling-item condition ───────────────────────────────
const BOTTLE_CONDITION_LABELS = {
    'With Label': 'With Label',
    'No Label': 'No Label',
    'Rejected': 'Rejected',
    Accepted: 'Accepted',
};

export function bottleConditionLabel(condition) {
    if (condition === null || condition === undefined || condition === '') return EMPTY_FIELD_PLACEHOLDER;
    return BOTTLE_CONDITION_LABELS[condition] || condition;
}

// ─── YOLOv8 detected class (recycling_items.detected_class) ─────────
const DETECTED_CLASS_LABELS = {
    pet_with_label: 'PET (With Label)',
    pet_no_label: 'PET (No Label)',
    pet_crushed: 'PET (Crushed)',
    hdpe: 'HDPE',
    can_aluminum: 'Aluminum Can',
    can_steel: 'Steel Can',
    glass: 'Glass',
    tetra_pak: 'Tetra Pak',
    other_plastic: 'Other Plastic',
    non_recyclable: 'Non-Recyclable',
    unknown: 'Unknown',
};

export function detectedClassLabel(detectedClass) {
    if (detectedClass === null || detectedClass === undefined || detectedClass === '') return EMPTY_FIELD_PLACEHOLDER;
    return DETECTED_CLASS_LABELS[detectedClass] || detectedClass;
}

// ─── Wallet transaction type ─────────────────────────────────────────
const TRANSACTION_TYPE_LABELS = {
    earn: 'Earn',
    redeem: 'Redeem',
    adjustment: 'Adjustment',
    bulk_transaction: 'Bulk Transaction',
};

export function transactionTypeLabel(type) {
    if (type === null || type === undefined || type === '') return EMPTY_FIELD_PLACEHOLDER;
    return TRANSACTION_TYPE_LABELS[type] || type;
}

// ─── End-user demographic type ───────────────────────────────────────
const USER_TYPE_LABELS = {
    student: 'Student',
    faculty: 'Faculty',
    staff: 'Staff',
};

export function userTypeLabel(type) {
    if (type === null || type === undefined || type === '') return EMPTY_FIELD_PLACEHOLDER;
    return USER_TYPE_LABELS[type] || type;
}

// ─── Community-group educational level (free-form server enum) ───────
//
// `educationalLevel` is a free-form string on the server (e.g., "College",
// "SHS", "Elementary"). This helper passes it through and applies the
// standard empty-state, so pages do not have to special-case missing
// values inline.
export function educationalLevelLabel(level) {
    return formatField(level);
}

// Backward-compat alias — old call sites that use `groupTypeLabel(...)`
// will keep working until they're migrated.
export const groupTypeLabel = educationalLevelLabel;

// ─── Recycling-session status ────────────────────────────────────────
const SESSION_STATUS_LABELS = {
    active: 'Active',
    completed: 'Completed',
    timed_out: 'Timed Out',
    error: 'Error',
};

export function sessionStatusLabel(status) {
    if (status === null || status === undefined || status === '') return EMPTY_FIELD_PLACEHOLDER;
    return SESSION_STATUS_LABELS[status] || status;
}

// ─── Notification channel ────────────────────────────────────────────
const NOTIFICATION_CHANNEL_LABELS = {
    email: 'Email',
    sms: 'SMS',
};

export function notificationChannelLabel(channel) {
    if (channel === null || channel === undefined || channel === '') return EMPTY_FIELD_PLACEHOLDER;
    return NOTIFICATION_CHANNEL_LABELS[channel] || channel;
}
