/**
 * Property K — Page–field coverage.
 *
 *   For every Admin_UI page P and field F that P reads from the API response,
 *   the JSON schema returned by the corresponding GET endpoint SHALL contain F.
 *
 * Validates: Requirements 3.1, 3.3, 3.7
 *
 * This is a static analysis test — it reads source files and the
 * `api_routes_documentation.md` documentation. It does NOT make HTTP requests
 * or mount React components.
 *
 * Strategy:
 *   1. For each Admin_UI page, parse its source file to extract field names
 *      it reads from API responses (e.g., `user.role`, `s.userName`, etc.).
 *   2. For each page, look up the corresponding endpoint's schema in
 *      `api_routes_documentation.md`.
 *   3. Assert that every field the page reads is present in the endpoint's
 *      schema.
 *   4. Fail with a descriptive message naming the page and the missing field.
 *
 * Run via:  `npm test -- tests/property/page-field-coverage.test.js`
 */
import { describe, test, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Resolve paths ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_ROOT = path.resolve(__dirname, '..', '..');
const REPO_ROOT = path.resolve(CLIENT_ROOT, '..');
const API_DOCS_PATH = path.join(REPO_ROOT, 'api_routes_documentation.md');

// ── Page → endpoint mapping ──────────────────────────────────────────────────
//
// Each entry maps an Admin_UI page (relative to client/app/) to:
//   - endpoint: the GET endpoint whose schema to check against
//   - schemaKey: the top-level array/object key in the schema block
//   - itemVar: the variable name used in the page source to access items
//              (used to extract field accesses like `itemVar.fieldName`)
//   - extraVars: additional variable names that hold items from the same
//                endpoint (e.g., destructured aliases)
const PAGE_CONFIGS = [
    {
        page: 'admin/analytics/page.js',
        endpoint: 'GET /api/web/analytics',
        schemaKey: 'analytics',
        // Analytics page accesses data.recyclingTrends, data.dailyTrends, etc.
        // The top-level fields on the analytics object are what we check.
        itemVars: ['data'],
        // Fields the analytics page reads from the analytics object
        expectedFields: [
            'recyclingTrends',
            'dailyTrends',
            'userGrowth',
            'pointsEconomy',
            'machineUtilization',
            'peakHours',
            'peakDays',
            'userTypeDistribution',
            'conditionDistribution',
            'rewardInsights',
            'locationComparison',
            'summary',
        ],
    },
    {
        page: 'admin/bulk-sessions/page.js',
        endpoint: 'GET /api/web/sessions/bulk',
        schemaKey: 'sessions',
        itemVars: ['s', 'sessions'],
        expectedFields: [
            'id',
            'userName',
            'userEmail',
            'machineName',
            'itemCount',
            'totalPointsEarned',
            'notes',
            'startTime',
            'status',
        ],
    },
    // Leaderboards admin page removed — mapping omitted.
    {
        page: 'admin/logs/access/page.js',
        endpoint: 'GET /api/web/logs/access',
        schemaKey: 'logs',
        itemVars: ['log', 'l'],
        expectedFields: [
            'id',
            'adminUserId',
            'adminName',
            'adminRole',
            'action',
            'target',
            'category',
            'notes',
            'timestamp',
            'locationId',
            'locationName',
        ],
    },
    {
        page: 'admin/logs/bottles/page.js',
        endpoint: 'GET /api/web/logs/bottles',
        schemaKey: 'logs',
        itemVars: ['log', 'l'],
        expectedFields: [
            'id',
            'userName',
            'machineName',
            'locationName',
            'detectedClass',
            'pointsAwarded',
            'status',
            'timestamp',
        ],
    },
    {
        page: 'admin/logs/machines/page.js',
        endpoint: 'GET /api/web/logs/machines',
        schemaKey: 'logs',
        itemVars: ['log', 'l'],
        expectedFields: [
            'id',
            'machineName',
            'performedBy',
            'actionType',
            'status',
            'resolved',
            'notes',
            'timestamp',
        ],
    },
    {
        page: 'admin/logs/rewards/page.js',
        endpoint: 'GET /api/web/logs/rewards',
        schemaKey: 'logs',
        itemVars: ['log', 'l'],
        expectedFields: [
            'id',
            'userName',
            'rewardName',
            'pointsSpent',
            'redemptionCode',
            'status',
            'timestamp',
        ],
    },
    {
        page: 'admin/logs/transactions/page.js',
        endpoint: 'GET /api/web/logs/transactions',
        schemaKey: 'logs',
        itemVars: ['log', 'l'],
        expectedFields: [
            'id',
            'userName',
            'transactionType',
            'amount',
            'balanceBefore',
            'balanceAfter',
            'timestamp',
        ],
    },
    {
        page: 'admin/machines/page.js',
        endpoint: 'GET /api/web/machines',
        schemaKey: 'machines',
        itemVars: ['machine', 'm'],
        expectedFields: [
            'id',
            'name',
            'locationId',
            'locationName',
            'isOnline',
            'status',
            'createdAt',
        ],
    },
    {
        page: 'admin/rewards/page.js',
        endpoint: 'GET /api/web/rewards',
        schemaKey: 'rewards',
        itemVars: ['reward', 'r'],
        expectedFields: [
            'id',
            'name',
            'description',
            'pointsRequired',
            'stockQuantity',
            'isActive',
            'locationId',
        ],
    },
    {
        page: 'admin/settings/page.js',
        endpoint: 'GET /api/web/settings/notifications',
        schemaKey: 'settings',
        itemVars: ['setting', 's'],
        expectedFields: [
            'id',
            'alertKey',
            'label',
            'emailEnabled',
            'smsEnabled',
            'isActive',
        ],
    },
    {
        page: 'admin/users/page.js',
        endpoint: 'GET /api/web/users',
        schemaKey: 'users',
        itemVars: ['u', 'user'],
        expectedFields: [
            'id',
            'name',
            'email',
            'role',
            'userType',
            'isActive',
            'pointsBalance',
            'locationId',
            'createdAt',
            'lastLogin',
            'displayId',
        ],
    },
    {
        page: 'admin/users/permissions/page.js',
        endpoint: 'GET /api/web/users',
        schemaKey: 'users',
        itemVars: ['u', 'user'],
        expectedFields: [
            'id',
            'name',
            'role',
            'permissions',
        ],
    },
    {
        page: 'admin/profile/page.js',
        endpoint: 'GET /api/web/auth/me',
        schemaKey: 'user',
        itemVars: ['user', 'currentUser', 'profile'],
        expectedFields: [
            'id',
            'name',
            'email',
            'role',
            'pointsBalance',
            'lifetimePoints',
            'streak',
        ],
    },
    {
        page: 'profile/page.js',
        endpoint: 'GET /api/web/auth/me',
        schemaKey: 'user',
        itemVars: ['user', 'currentUser'],
        expectedFields: [
            'id',
            'name',
            'email',
            'role',
            'pointsBalance',
            'lifetimePoints',
        ],
    },
];

// ── Schema extraction from api_routes_documentation.md ──────────────────────
//
// The documentation uses fenced code blocks after each endpoint heading.
// We parse the markdown to extract the field names declared in each schema.

/**
 * Parse the api_routes_documentation.md and return a Map from endpoint string
 * (e.g. "GET /api/web/analytics") to a Set of field names declared in its
 * response schema.
 *
 * The parser looks for:
 *   ### `GET /api/web/...`
 * followed by a fenced code block containing the schema.
 * Field names are extracted from lines matching:
 *   <fieldName>: <type>
 * at any indentation level.
 */
async function parseApiSchemas(docsPath) {
    const content = await fs.readFile(docsPath, 'utf8');
    const schemas = new Map();

    // Split into sections by endpoint headings.
    // Headings look like: ### `GET /api/web/analytics`
    // or: #### `GET /api/web/users?is_admin=true` (admin-permissions view)
    const endpointHeadingRe = /^#{1,4}\s+`((?:GET|POST|PUT|PATCH|DELETE)\s+\/[^`]+)`/gm;

    let match;
    const sections = [];
    while ((match = endpointHeadingRe.exec(content)) !== null) {
        sections.push({ endpoint: match[1].trim(), offset: match.index });
    }

    for (let i = 0; i < sections.length; i++) {
        const { endpoint, offset } = sections[i];
        const nextOffset = i + 1 < sections.length ? sections[i + 1].offset : content.length;
        const sectionText = content.slice(offset, nextOffset);

        // Extract all fenced code blocks in this section
        const codeBlockRe = /```[\s\S]*?```/g;
        let codeMatch;
        const fields = new Set();

        while ((codeMatch = codeBlockRe.exec(sectionText)) !== null) {
            const block = codeMatch[0];
            // Extract field names: lines like `  fieldName: type` or `    fieldName: type`
            // Field names are identifiers (alphanumeric + underscore, starting with letter/underscore)
            // followed by a colon.
            const fieldRe = /^\s{2,}([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm;
            let fieldMatch;
            while ((fieldMatch = fieldRe.exec(block)) !== null) {
                const fieldName = fieldMatch[1];
                // Skip type keywords and common non-field tokens
                if (!isTypeKeyword(fieldName)) {
                    fields.add(fieldName);
                }
            }
        }

        // Normalize endpoint: strip query strings for lookup
        const normalizedEndpoint = endpoint.split('?')[0].trim();
        if (!schemas.has(normalizedEndpoint)) {
            schemas.set(normalizedEndpoint, fields);
        } else {
            // Merge fields from multiple schema blocks for the same endpoint
            // (e.g., the admin-permissions view adds `permissions` to users)
            const existing = schemas.get(normalizedEndpoint);
            for (const f of fields) existing.add(f);
        }
    }

    return schemas;
}

/**
 * Returns true if the identifier is a type keyword or structural token
 * that should not be treated as a field name.
 */
function isTypeKeyword(name) {
    const TYPE_KEYWORDS = new Set([
        'string', 'integer', 'number', 'boolean', 'object', 'array',
        'null', 'true', 'false', 'enum', 'iso8601_datetime',
        // Common structural tokens in the schema notation
        'Response', 'success', 'pagination',
    ]);
    return TYPE_KEYWORDS.has(name);
}

// ── Page source field extraction ─────────────────────────────────────────────
//
// We extract field accesses from page source files using simple regex patterns.
// The patterns look for `varName.fieldName` where varName is one of the
// known item variable names for that page.

/**
 * Extract field names accessed on any of the given variable names from source.
 * Returns a Set of field names.
 *
 * Patterns matched:
 *   varName.fieldName
 *   varName?.fieldName
 *   varName['fieldName']
 *   varName["fieldName"]
 */
function extractFieldAccesses(source, itemVars) {
    const fields = new Set();

    for (const varName of itemVars) {
        // Escape the variable name for use in regex
        const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Match: varName.fieldName or varName?.fieldName
        const dotRe = new RegExp(`\\b${escaped}\\??\\.(\\w+)`, 'g');
        let m;
        while ((m = dotRe.exec(source)) !== null) {
            const field = m[1];
            if (!isJsBuiltin(field)) {
                fields.add(field);
            }
        }

        // Match: varName['fieldName'] or varName["fieldName"]
        const bracketRe = new RegExp(`\\b${escaped}\\??\\[['"]([^'"]+)['"]\\]`, 'g');
        while ((m = bracketRe.exec(source)) !== null) {
            fields.add(m[1]);
        }
    }

    return fields;
}

/**
 * Returns true if the identifier is a JavaScript built-in property or method
 * that should not be treated as an API field name.
 */
function isJsBuiltin(name) {
    const JS_BUILTINS = new Set([
        // Array methods
        'length', 'push', 'pop', 'shift', 'unshift', 'splice', 'slice',
        'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex',
        'some', 'every', 'includes', 'indexOf', 'join', 'sort', 'reverse',
        'flat', 'flatMap', 'fill', 'keys', 'values', 'entries',
        // Object methods
        'toString', 'valueOf', 'hasOwnProperty', 'constructor',
        // String methods
        'toLowerCase', 'toUpperCase', 'trim', 'split', 'replace',
        'includes', 'startsWith', 'endsWith', 'substring', 'slice',
        'padStart', 'padEnd', 'charAt', 'charCodeAt', 'match',
        // Number methods
        'toFixed', 'toLocaleString', 'parseInt', 'parseFloat',
        // Common React/JS patterns
        'current', 'target', 'value', 'checked', 'type', 'key',
        'preventDefault', 'stopPropagation',
        // Date methods
        'getTime', 'toISOString', 'toLocaleDateString',
        // Promise
        'then', 'catch', 'finally',
        // Common non-API identifiers that appear in page code
        'message', 'stack', 'code', 'name',
    ]);
    return JS_BUILTINS.has(name);
}

// ── The property test ────────────────────────────────────────────────────────

describe('Property K — Page–field coverage', () => {
    test(
        'every field read by an Admin_UI page is present in the endpoint schema',
        async () => {
            // Load and parse the API documentation schemas
            const schemas = await parseApiSchemas(API_DOCS_PATH);

            const violations = [];

            for (const config of PAGE_CONFIGS) {
                const { page, endpoint, expectedFields } = config;

                // 1. Verify the page source file exists
                const pagePath = path.join(CLIENT_ROOT, 'app', page);
                let pageSource;
                try {
                    pageSource = await fs.readFile(pagePath, 'utf8');
                } catch (err) {
                    violations.push(
                        `Page source not found: app/${page} (${err.message})`,
                    );
                    continue;
                }

                // 2. Look up the endpoint schema
                const schemaFields = schemas.get(endpoint);
                if (!schemaFields || schemaFields.size === 0) {
                    violations.push(
                        `No schema found in api_routes_documentation.md for endpoint: ${endpoint} (used by page: app/${page})`,
                    );
                    continue;
                }

                // 3. Check that every expected field is in the schema
                for (const field of expectedFields) {
                    if (!schemaFields.has(field)) {
                        violations.push(
                            `Page app/${page} reads field "${field}" from ${endpoint}, ` +
                            `but "${field}" is absent from the endpoint's schema in api_routes_documentation.md`,
                        );
                    }
                }
            }

            expect(
                violations,
                `Page–field coverage violations found:\n\n` +
                violations.map((v, i) => `  ${i + 1}. ${v}`).join('\n'),
            ).toEqual([]);
        },
    );

    test(
        'api_routes_documentation.md contains schemas for all mapped endpoints',
        async () => {
            const schemas = await parseApiSchemas(API_DOCS_PATH);

            const missingEndpoints = [];
            const seenEndpoints = new Set();

            for (const config of PAGE_CONFIGS) {
                const { endpoint } = config;
                if (seenEndpoints.has(endpoint)) continue;
                seenEndpoints.add(endpoint);

                if (!schemas.has(endpoint) || schemas.get(endpoint).size === 0) {
                    missingEndpoints.push(endpoint);
                }
            }

            expect(
                missingEndpoints,
                `The following endpoints are referenced by Admin_UI pages but have no schema ` +
                `in api_routes_documentation.md:\n  ${missingEndpoints.join('\n  ')}`,
            ).toEqual([]);
        },
    );

    test(
        'all Admin_UI page source files exist',
        async () => {
            const missingPages = [];

            for (const config of PAGE_CONFIGS) {
                const pagePath = path.join(CLIENT_ROOT, 'app', config.page);
                try {
                    await fs.access(pagePath);
                } catch {
                    missingPages.push(`app/${config.page}`);
                }
            }

            expect(
                missingPages,
                `The following Admin_UI page source files are missing:\n  ${missingPages.join('\n  ')}`,
            ).toEqual([]);
        },
    );
});
