/**
 * Shared spreadsheet import helper.
 *
 * Parses `.csv`, `.xls`, and `.xlsx` files into header-keyed JSON rows using
 * SheetJS (`xlsx`). Reused by Location Import (Phase 32) and Bulk Session
 * Import (Phase 33) — DO NOT duplicate parsing logic elsewhere.
 */
import * as XLSX from 'xlsx';

// Hard caps to mitigate decompression-bomb / DoS via crafted spreadsheets.
// An .xlsx is a ZIP archive — a tiny file can expand to millions of cells.
// We reject oversized files BEFORE parsing, and cap parsed rows as a
// defense-in-depth backstop (feature-level row limits are applied separately).
const MAX_FILE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_PARSED_ROWS = 5000;             // backstop ceiling, independent of feature caps

/**
 * Parse a spreadsheet file into rows + headers.
 *
 * @param {File} file - the user-selected file (.csv/.xls/.xlsx)
 * @param {{ maxBytes?: number }} [opts]
 * @returns {Promise<{ rows: Object[], headers: string[] }>}
 * @throws {Error} on oversized, unparseable, empty, or sheet-less files (user-visible message)
 */
export async function parseSpreadsheet(file, opts = {}) {
    if (!file) throw new Error('No file selected');

    const maxBytes = opts.maxBytes || MAX_FILE_BYTES;
    if (typeof file.size === 'number' && file.size > maxBytes) {
        const mb = (maxBytes / (1024 * 1024)).toFixed(0);
        throw new Error(`File is too large (max ${mb} MB). Split the data into smaller files and try again.`);
    }

    let wb;
    try {
        const buf = await file.arrayBuffer();
        wb = XLSX.read(buf, { type: 'array' });
    } catch {
        throw new Error('Could not read file. Make sure it is a valid CSV, XLS, or XLSX file.');
    }

    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new Error('No sheet found in file');

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) throw new Error('File contains no data rows');
    if (rows.length > MAX_PARSED_ROWS) {
        throw new Error(`File has too many rows (${rows.length}; max ${MAX_PARSED_ROWS}). Split it into smaller files.`);
    }

    const headers = Object.keys(rows[0] || {});
    return { rows, headers };
}
