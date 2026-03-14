/**
 * EcoPoints — Date Formatting Utilities
 * Converts ISO timestamps to human-readable format.
 */

/**
 * Format ISO timestamp → "Mar 14, 2026 · 4:29 PM"
 */
export function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        + ' · '
        + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format ISO timestamp → "Mar 14, 2026"
 */
export function formatDateShort(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
