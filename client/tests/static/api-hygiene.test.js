/**
 * Static tests for the Phase 1 Client API hygiene invariants.
 *
 *   Property C — Dead-code-free client API layer (Requirements 1.4, 1.8)
 *     No source file under `client/` may reference the dropped legacy
 *     `apiService.cities` namespace nor the `services/api/cities` module
 *     path. Both substrings are forbidden across `.js/.jsx/.ts/.tsx/.mjs/.cjs`
 *     sources.
 *
 *   Property E — Single-source request layer (Requirement 1.9)
 *     Every per-domain module under `client/src/services/api/` (with the
 *     intentional carve-outs documented below) imports `request` from
 *     `./client` exactly once and contains zero raw `fetch(`, `window.fetch`,
 *     or `new fetch(` references. `client.js` is the single transport and
 *     therefore exempt; `index.js` is a barrel that re-exports the
 *     per-domain modules and makes no `request()` calls of its own, so it is
 *     also exempt from the per-domain "exactly one import" rule.
 *
 * Run via:  `npm test -- tests/static/api-hygiene.test.js`
 */
import { describe, test, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Resolve the client root irrespective of where vitest was invoked from.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_ROOT = path.resolve(__dirname, '..', '..');
const API_DIR = path.join(CLIENT_ROOT, 'src', 'services', 'api');

// Source extensions Property C scans. `.md`, JSON, images, etc. are skipped
// naturally because they are not in this allowlist.
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// Directory names skipped while walking. Build caches and vendored deps may
// contain stale matches that are not part of our authored sources.
const SKIP_DIRS = new Set([
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
    '.turbo',
    '.git',
    '__pycache__',
]);

// The forbidden Property C substrings. The test file is excluded from the
// walk via an explicit relative-path check, so we keep the literals here for
// readability rather than splitting them up.
const FORBIDDEN_SUBSTRINGS = ['apiService.cities', 'services/api/cities'];

// Property C must NOT flag this test file itself (it intentionally contains
// the forbidden substrings as fixtures). Compare on the OS-normalised
// relative path so this works on both Windows and POSIX.
const SELF_RELATIVE = path
    .relative(CLIENT_ROOT, __filename)
    .split(path.sep)
    .join('/');

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
        if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;
        yield abs;
    }
}

describe('Property C — Dead-code-free client API layer', () => {
    test('no source file under client/ references apiService.cities or services/api/cities', async () => {
        const violators = [];
        for await (const absPath of walkSourceFiles(CLIENT_ROOT)) {
            const rel = path
                .relative(CLIENT_ROOT, absPath)
                .split(path.sep)
                .join('/');
            // Exclude this test file — it carries the forbidden literals as
            // fixtures so Property C can detect them in real sources.
            if (rel === SELF_RELATIVE) continue;

            const source = await fs.readFile(absPath, 'utf8');
            for (const needle of FORBIDDEN_SUBSTRINGS) {
                if (source.includes(needle)) {
                    violators.push(`${rel} contains "${needle}"`);
                }
            }
        }

        expect(
            violators,
            `Forbidden legacy references found:\n  ${violators.join('\n  ')}`,
        ).toEqual([]);
    });
});

describe('Property E — Single-source request layer', () => {
    // `client.js` IS the transport — it's the one place a raw `fetch(` is
    // permitted. `index.js` is a barrel that re-exports the per-domain
    // modules and never calls `request()` itself, so it's also exempt from
    // the "exactly one import" rule.
    const EXEMPT_FILES = new Set(['client.js', 'index.js']);

    // `import { request } from './client'` (or './client.js'), allowing
    // optional whitespace and an optional trailing semicolon, anchored to a
    // line on its own.
    const REQUEST_IMPORT_RE =
        /^\s*import\s*\{\s*request\s*\}\s*from\s*['"]\.\/client(?:\.js)?['"]\s*;?\s*$/gm;

    // Forbidden raw fetch usages. `\bfetch\s*\(` catches `fetch(` and
    // `await fetch(`; `window.fetch` and `new fetch(` are matched
    // explicitly for clearer failure messages.
    const RAW_FETCH_PATTERNS = [
        { name: 'fetch(', re: /\bfetch\s*\(/g },
        { name: 'window.fetch', re: /\bwindow\.fetch\b/g },
        { name: 'new fetch(', re: /\bnew\s+fetch\s*\(/g },
    ];

    test('every per-domain module imports request exactly once and contains zero raw fetch references', async () => {
        const entries = await fs.readdir(API_DIR, { withFileTypes: true });

        const targetFiles = entries
            .filter((e) => e.isFile() && e.name.endsWith('.js') && !EXEMPT_FILES.has(e.name))
            .map((e) => e.name)
            .sort();

        // Sanity: there must actually be per-domain modules to test against,
        // otherwise the assertion below would vacuously pass on an empty
        // directory and silently mask the invariant.
        expect(
            targetFiles.length,
            `expected at least one per-domain module under ${API_DIR}`,
        ).toBeGreaterThan(0);

        const importViolations = [];
        const fetchViolations = [];

        for (const fileName of targetFiles) {
            const abs = path.join(API_DIR, fileName);
            const source = await fs.readFile(abs, 'utf8');

            // Reset the regex's `lastIndex` between files (the `g` flag
            // makes it stateful) by re-creating the iterator via `match`.
            const importMatches = source.match(REQUEST_IMPORT_RE) || [];
            if (importMatches.length !== 1) {
                importViolations.push(
                    `${fileName}: expected exactly 1 \`import { request } from './client'\`, ` +
                        `found ${importMatches.length}`,
                );
            }

            for (const { name, re } of RAW_FETCH_PATTERNS) {
                const fetchMatches = source.match(re) || [];
                if (fetchMatches.length > 0) {
                    fetchViolations.push(
                        `${fileName}: contains ${fetchMatches.length} raw "${name}" reference(s)`,
                    );
                }
            }
        }

        expect(
            importViolations,
            `Per-domain modules must import \`request\` from './client' exactly once:\n  ${importViolations.join('\n  ')}`,
        ).toEqual([]);

        expect(
            fetchViolations,
            `Per-domain modules must not contain raw fetch references:\n  ${fetchViolations.join('\n  ')}`,
        ).toEqual([]);
    });
});
