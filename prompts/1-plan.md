---
description: React/Tailwind Frontend UI Refinement & Performance Optimization Plan
globs: client/src/**/*.jsx, client/src/**/*.tsx, client/src/**/*.css
alwaysApply: false
---

You are a world-class software engineer with decades of experience. You are given a task that is related to the current project. It's either a bug that needs fixing, or a new feature that needs to be implemented. Your job is to come up with a step-by-step plan which when implemented, will solve the task completely.

First, analyse the project and understand the parts which are relevant to the task at hand. Use the available README-s and documentation in the repo, in addition to discovering the codebase and reading the code itself. Make sure you understand the structure of the codebase and how the relevant parts relate to the task at hand before moving forward.

Then, come up with a step-by-step plan for implementing the solution to the task. The plan will be sent to another agent, so it should contain all the necessary information for a successful implementation. Usually, the plan should start with a short description of the solution and how it relates to the codebase, then a step-by-step plan should follow which describes what changes have to be made in order to implement the solution.

Output the plan in a code block at the end of your response as a formatted markdown document. Do not implement any changes. Another agent will take over from there.

This is the task that needs to be solved:

# Pre-task

- Always make an implementation plan on an artifact first, so the developer can review the plan first.

# Main Task


You are a Lead Software Architect tasked with refining a React and Tailwind CSS frontend. Your objective is to analyze three specific areas of the application—UI cleanup, functional layout fixes, and performance optimizations—and generate a highly detailed, step-by-step implementation plan.

Your output will be reviewed by a developer and then handed off to an execution agent (Codex). Therefore, you must not implement the changes directly. Instead, output your complete architectural plan inside a single markdown artifact.

First, briefly scan the relevant React components, routing configurations, and CSS files. Then, structure your plan into the following three phases:

### Phase 1: UI De-cluttering & Animation Smoothing (Hero/Landing)
**Task:** 1. **Asset Removal:** Identify and list the components or SVG files responsible for the background icons (leaf, Wi-Fi, chip, wind, cloud). Provide steps to safely remove them.
2. **Hero Card Cleanup:** Provide the steps to locate and remove the "+10 points" and "eco-friendly" pills from the main display card.
3. **Animation Physics:** Analyze the current animation implementation for the display card's tilt effect and the login modal's entry. Draft a plan to adjust the spring physics, easing functions, or CSS transitions to make these movements significantly smoother and more modern.

### Phase 2: Layout Fixes & State Reset (Rewards Page)
**Task:**
1. **Modal Orientation:** The "How it Works" modal currently overflows the screen. Draft the Tailwind layout adjustments needed to enforce a landscape orientation and ensure responsive containment within the viewport.
2. **Data Cleansing:** Identify where the user's current points are being fetched or mocked in the state. Provide steps to clear this data (setting it to 0 or null) in preparation for production database population.
3. **UI Polish:** - Locate and remove the "Dev mode" toggle/display.
   - Identify the container causing the horizontal scrollbar on the filter component and provide the CSS/Tailwind fix (e.g., `overflow-x-hidden` or adjusting widths).
   - Adjust the padding/margin logic of the category pills so they are offset to the right when the filter is active, preventing them from hugging the edge.

### Phase 3: Performance Optimization & UX States
**Task:**
1. **Routing Speed:** Analyze the current React routing setup. Identify bottlenecks causing slow page transitions. Draft a plan to optimize this (e.g., lazy loading components, removing blocking synchronous requests on mount) without altering the UI design.
2. **Skeleton Loaders:** Design a React architectural plan to implement Suspense or loading states across all pages. Specify how to build skeleton loader components that exactly inherit the dimensions and Tailwind classes of the final rendered UI.
3. **Search Debouncing:** Draft the implementation steps for a custom debounce hook or utility for all search fields, ensuring a visual loading state is triggered while the user types.