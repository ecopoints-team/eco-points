---
description: Typography update and Navbar scroll-spy fix
globs: client/src/index.css, client/src/Components/NavBar.jsx
alwaysApply: false
---

# Task: Implement UI Fixes

Update the specific files below. Do not generate a step-by-step plan. Output the exact, updated code. Stop generating after the code is written.

## 1. Typography Update (`client/src/index.css`)

Implement the following global font families:

- Headings (`h1` through `h6`): 'Fredoka', sans-serif.
- Body Text: 'Quicksand', sans-serif.
- Ledger/Data Text (Create a utility class like `.font-ledger` for transaction IDs/balances): 'Space Mono', monospace.

## 2. Navbar Active State Fix (`client/src/Components/NavBar.jsx`)

Refactor the section intersection/scroll tracking logic.

- Issue: When clicking a nav link to skip down the page, the underline animation incorrectly triggers on every intervening section.
- Requirement: Only the final target section should receive the active state class (and trigger the underline) when the scroll finishes, or specifically when clicked.

**Constraints:**

- Provide only the updated code blocks for these two files.
- Ensure the React component retains all existing Tailwind classes outside of this specific fix.
