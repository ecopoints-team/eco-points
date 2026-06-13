/**
 * Shared spreadsheet import helper.
 *
 * Parses `.csv`, `.xls`, and `.xlsx` files into header-keyed JSON rows using
 * SheetJS (`xlsx`). Reused by Location Import (Phase 32) and Bulk Session
 * Import (Phase 33) — DO NOT duplicate parsing logic elsewhere.
 */
import * as XLSX from 'xlsx';

/**
 * Parse a spreadsheet file into rows + headers.
 *
 * @param {File} file - the user-selected file (.csv/.xls/.xlsx)
 * @returns {Promise<{ rows: Object[], headers: string[] }>}
 * @throws {Error} on unparseable, empty, or sheet-less files (user-visible message)
 */
export async function parseSpreadsheet(file) {
    if (!file) throw new Error('No file selected');

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

    const headers = Object.keys(rows[0] || {});
    return { rows, headers };
}
