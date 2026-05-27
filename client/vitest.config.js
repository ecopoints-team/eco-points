/**
 * Vitest configuration for the EcoPoints Client.
 *
 * Static + property tests run by default in the Node environment. Tests that
 * exercise React components (Phase 2 page guards) opt into the `jsdom`
 * environment via `environmentMatchGlobs` for files under `tests/property/**`.
 * Tests live under `tests/**` (relative to this `client/` root). Build
 * artefacts and `node_modules` are excluded explicitly so the file walk
 * inside `tests/static/api-hygiene.test.js` does not race the test runner.
 *
 * The `@vitejs/plugin-react` plugin is registered with an explicit `include`
 * pattern so JSX written inside `.test.js` property tests is transpiled the
 * same way our actual `.jsx` source files are.
 *
 * Phase 1 — Requirements 1.4, 1.8, 1.9
 * Phase 2 — Requirements 2.3, 2.4, 2.5, 2.11
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react({ include: /\.(jsx|js|tsx|ts)$/ })],
    test: {
        environment: 'node',
        environmentMatchGlobs: [
            ['tests/property/**', 'jsdom'],
        ],
        include: ['tests/**/*.test.js'],
        exclude: [
            '**/node_modules/**',
            '**/.next/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/.turbo/**',
        ],
    },
});
