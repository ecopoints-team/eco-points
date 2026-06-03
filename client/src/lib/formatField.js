// Shared empty-state placeholder helper (Phase 3, task 8.3 / Requirement 3.4).
//
// Apply to every UI read site for a server-supplied field that may be null,
// undefined, or an empty string. Renders a defined placeholder (em dash by
// default) instead of the JS literals `undefined`/`null`/`""`.

export const EMPTY_FIELD_PLACEHOLDER = '\u2014'; // em dash

/**
 * Render a value verbatim, falling back to a defined placeholder when the
 * value is missing.
 *
 * @param {*} value           the server-supplied value (any primitive)
 * @param {string} placeholder fallback string (defaults to em dash)
 * @returns {string|number|boolean} the original value or the placeholder
 */
export function formatField(value, placeholder = EMPTY_FIELD_PLACEHOLDER) {
    if (value === null || value === undefined) return placeholder;
    if (typeof value === 'string' && value.trim() === '') return placeholder;
    return value;
}

export default formatField;
