/**
 * Shared field validation utility for admin forms.
 * Centralises all model-aligned constraints so every modal validates identically.
 */

// ─── Core validator ──────────────────────────────────────────────────
/**
 * Validate a single field against a rule set.
 * @param {Object} rules   – constraint map for one entity, e.g. VALIDATION_RULES.location
 * @param {string} field   – field name (key in `rules`)
 * @param {*}      value   – current field value
 * @returns {string|null}  – error message or null if valid
 */
export function validateField(rules, field, value) {
    const rule = rules[field];
    if (!rule) return null;

    const v = typeof value === 'string' ? value.trim() : value;

    // Reject whitespace-only values for any required field
    if (rule.required && (v === '' || v === null || v === undefined)) {
        return rule.label ? `${rule.label} is required` : 'This field is required';
    }

    // Even for optional fields, reject pure whitespace if a value was typed
    if (typeof value === 'string' && value.length > 0 && v === '') {
        return `${rule.label || 'Field'} cannot be only whitespace`;
    }

    if (rule.maxLength && typeof v === 'string' && v.length > rule.maxLength) {
        return `${rule.label || 'Field'} must be ${rule.maxLength} characters or fewer`;
    }

    if (rule.minLength && typeof v === 'string' && v.length < rule.minLength) {
        return `${rule.label || 'Field'} must be at least ${rule.minLength} characters`;
    }

    if (rule.min !== undefined && typeof v === 'number' && v < rule.min) {
        return `${rule.label || 'Value'} must be at least ${rule.min}`;
    }

    if (rule.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return 'Invalid email format';
    }

    if (rule.type === 'phone' && v && v.replace(/[\s\-]/g, '').length !== 10) {
        return 'Must be 10 digits (9XX XXX XXXX)';
    }

    if (rule.type === 'integer' && v !== '' && v !== undefined) {
        const n = Number(v);
        if (!Number.isInteger(n)) return `${rule.label || 'Value'} must be a whole number`;
        if (rule.min !== undefined && n < rule.min) return `${rule.label || 'Value'} must be at least ${rule.min}`;
    }

    if (rule.pattern && v && !rule.pattern.test(v)) {
        return rule.patternMessage || `${rule.label || 'Field'} format is invalid`;
    }

    return null;
}

/**
 * Validate all fields in a form data object against the rule set.
 * @param {Object} rules    – constraint map, e.g. VALIDATION_RULES.location
 * @param {Object} formData – { fieldName: value }
 * @returns {{ errors: Object, isValid: boolean }}
 */
export function validateAll(rules, formData) {
    const errors = {};
    for (const field of Object.keys(rules)) {
        const err = validateField(rules, field, formData[field]);
        if (err) errors[field] = err;
    }
    return { errors, isValid: Object.keys(errors).length === 0 };
}

// ─── Per-entity rule maps ────────────────────────────────────────────
// Each key corresponds to a form field name.  Constraints are aligned
// to the SQLAlchemy models (String(200), nullable flags, etc).

export const VALIDATION_RULES = {
    location: {
        name:              { required: true, maxLength: 200, label: 'Short Name' },
        fullName:          { required: true, maxLength: 500, label: 'Full Name' },
        orgType:           { required: true, label: 'Organization Type' },
        streetAddress:     { required: true, maxLength: 500, label: 'Street Address' },
        barangay:          { maxLength: 200, label: 'Barangay' },
        cityMunicipality:  { required: true, maxLength: 200, label: 'City/Municipality' },
        province:          { maxLength: 200, label: 'Province' },
        region:            { maxLength: 200, label: 'Region' },
        zipCode:           { maxLength: 10, label: 'ZIP Code' },
        contactPerson:     { required: true, maxLength: 200, label: 'Contact Person' },
        contactEmail:      { required: true, maxLength: 200, type: 'email', label: 'Contact Email' },
        contactPhone:      { required: true, type: 'phone', label: 'Contact Phone' },
    },

    user: {
        name:       { required: true, maxLength: 200, label: 'Full Name' },
        email:      { required: true, maxLength: 200, type: 'email', label: 'Email' },
        password:   { required: true, minLength: 6, maxLength: 128, label: 'Password' },
        username:   { required: true, maxLength: 100, label: 'Username' },
        phone:      { type: 'phone', label: 'Phone' },
    },

    machine: {
        name:          { required: true, maxLength: 200, label: 'Machine Name' },
        machineUuid:   { required: true, maxLength: 200, label: 'Machine UUID' },
        locationName:  { required: true, maxLength: 200, label: 'Location/Area' },
    },

    reward: {
        name:            { required: true, maxLength: 200, label: 'Reward Name' },
        description:     { maxLength: 1000, label: 'Description' },
        category:        { required: true, label: 'Category' },
        pointsRequired:  { required: true, type: 'integer', min: 1, label: 'Points Required' },
        stockQuantity:   { required: true, type: 'integer', min: 0, label: 'Stock Quantity' },
    },

    group: {
        name:              { required: true, maxLength: 200, label: 'Group Name' },
        abbreviation:      { maxLength: 20, label: 'Abbreviation' },
        educationalLevel:  { maxLength: 50, label: 'Educational Level' },
    },
};
