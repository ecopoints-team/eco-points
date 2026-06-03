/**
 * Static test for the Phase 4B JWT-storage invariant.
 *
 *   Property Q — No JWT in localStorage (Requirement 4B.16)
 *     With the JWT now delivered via an HttpOnly cookie (see Phase 4B), no
 *     authored client source file may persist a JWT into `localStorage`.
 *     A "JWT key" is detected by literal: any string literal passed to
 *     `localStorage.getItem`, `localStorage.setItem`, or
 *     `localStorage.removeItem` whose value contains the substring
 *     `token` (case-insensitive). This catches the legacy
 *     `'ecopoints_token'` key as well as any future variant such as
 *     `'jwt_token'` or `'auth_token'`.
 *
 *     Pre-existing non-JWT keys (`'ecopoints_theme'`, `'sidebarOpen'`,
 *     `'eco_read_notifs'`) do not contain the substring `token` and are
 *     therefore not flagged.
 *
 * Run via:  `npm test -- tests/static/no-jwt-in-localstorage.test.js`
 */
import { describe, test, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Resolve the client root irrespective of where vitest was invoked from.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_ROOT = path.resolve(__dirname, '..', '..');

// Source extensions we scan. Non-source assets (markdown, images, JSON
// data, etc.) are skipped automatically because they aren't in this
// allowlist.
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// Directory names skipped while walking. `__tests__` and build caches are
// excluded by the property's task contract; vendored deps and VCS metadata
// are excluded for sanity.
const SKIP_DIRS = new Set([
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
    '.turbo',
    '.git',
    '__tests__',
    '__pycache__',
]);

// Property Q must NOT flag this test file itself — it intentionally
// references the JWT key string as a fixture so the regex below is
// readable. Compare on the OS-normalised relative path so this works on
// both Windows and POSIX.
const SELF_RELATIVE = path
    .relative(CLIENT_ROOT, __filename)
    .split(path.sep)
    .join('/');

// Files matching `*.example` or `*.example.<ext>` are documentation
// fixtures, not authored sources, and are excluded by the property's task
// contract.
function isExampleFile(fileName) {
    if (fileName.endsWith('.example')) return true;
    // e.g. `.env.example`, `config.example.js`
    return /\.example(\.[^.]+)?$/.test(fileName);
}

// `localStorage.{getItem,setItem,removeItem}('<key>', ...)` where the key
// literal contains the substring `token` (case-insensitive). Captures the
// method name (group 1) and the offending key literal (group 2). The `i`
// flag on the regex makes the `token` match case-insensitive.
//
// Supports single quotes, double quotes, and template literals (provided
// the literal has no interpolation — interpolated keys are an evasion risk
// but are not used in this codebase; they would also evade any practical
// static check).
const JWT_LOCALSTORAGE_RE =
    /localStorage\s*\.\s*(getItem|setItem|removeItem)\s*\(\s*['"`]([^'"`]*token[^'"`]*)['"`]/gi;

/** Recursively yield every source file under `dir` (absolute paths). */
async function* walkSourceFiles(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
        if (err && err.code === 'ENOENT') return;
        throw err;
    }
    for (const entry of entries) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            yield* walkSourceFiles(abs);
            continue;
        }
        if (!entry.isFile()) continue;
        if (isExampleFile(entry.name)) continue;
        if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;
        yield abs;
    }
}

describe('Property Q — No JWT in localStorage', () => {
    test('no source file under client/ stores a JWT-shaped key in localStorage', async () => {
        const violators = [];

        for await (const absPath of walkSourceFiles(CLIENT_ROOT)) {
            const rel = path
                .relative(CLIENT_ROOT, absPath)
                .split(path.sep)
                .join('/');

            // Exclude this test file — it carries the JWT key literal as a
            // fixture so Property Q can detect it in real sources.
            if (rel === SELF_RELATIVE) continue;

            const source = await fs.readFile(absPath, 'utf8');

            // Reset regex state by recreating it per file (the `g` flag
            // makes it stateful across `exec` calls, but we're using
            // `matchAll` which yields a fresh iterator — still, scope it
            // here for clarity and safety).
            const re = new RegExp(JWT_LOCALSTORAGE_RE.source, JWT_LOCALSTORAGE_RE.flags);
            const matches = [...source.matchAll(re)];
            if (matches.length === 0) continue;

            for (const m of matches) {
                const method = m[1];
                const key = m[2];
                // Compute 1-based line number of the match.
                const offset = m.index ?? 0;
                const line = source.slice(0, offset).split('\n').length;
                violators.push(
                    `${rel}:${line}: localStorage.${method}('${key}', …)`,
                );
            }
        }

        expect(
            violators,
            `JWT must not be persisted in localStorage (Phase 4B). ` +
                `Offending call sites:\n  ${violators.join('\n  ')}`,
        ).toEqual([]);
    });
});
