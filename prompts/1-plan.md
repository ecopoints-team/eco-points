---
description: Frontend Refactoring & Hydration Fix Plan
globs: **/*.jsx, **/*.tsx, **/*.css, client/src/**/*
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

# Fix phase 1

- Let's fix the hydration error:

Unhandled Runtime Error
Error: Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error

Text content did not match. Server: "
        :root {
          --filter-btn-size: 56px;
          --filter-stem-open: 128px;
          --filter-bar-top: 72px;
        }

        @media (min-width: 640px) {
          :root {
            --filter-btn-size: 72px;
            --filter-stem-open: 160px;
            --filter-bar-top: 88px;
          }
        }

        .font-heading { font-family: &#x27;Fredoka&#x27;, sans-serif; }
        .font-body { font-family: &#x27;Quicksand&#x27;, sans-serif; }
        .font-data { font-family: &#x27;Space Mono&#x27;, monospace; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s ease-out forwards; }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          100% { transform: rotate(-360deg); }
        }
        .wave-back { animation: spin-slow 4s linear infinite; }
        .wave-front { animation: spin-reverse 5s linear infinite; }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-error-shake { animation: error-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      " Client: "
        :root {
          --filter-btn-size: 56px;
          --filter-stem-open: 128px;
          --filter-bar-top: 72px;
        }

        @media (min-width: 640px) {
          :root {
            --filter-btn-size: 72px;
            --filter-stem-open: 160px;
            --filter-bar-top: 88px;
          }
        }

        .font-heading { font-family: 'Fredoka', sans-serif; }
        .font-body { font-family: 'Quicksand', sans-serif; }
        .font-data { font-family: 'Space Mono', monospace; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s ease-out forwards; }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          100% { transform: rotate(-360deg); }
        }
        .wave-back { animation: spin-slow 4s linear infinite; }
        .wave-front { animation: spin-reverse 5s linear infinite; }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-error-shake { animation: error-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }


### Phase 2: Architectural Restructuring (Admin vs. Website)
**Context:** The current folder structure and file naming conventions are causing confusion between Admin-facing components and Public Website-facing components.
**Task:** 1. Map out a proposed new directory tree (using ASCII format) that cleanly separates `admin` and `website` components, pages, and sections.
2. Establish a clear file naming convention for pages vs. sections to avoid future confusion.
3. List the exact routing and import path updates required across the codebase to support this new structure without triggering build errors.

### Phase 3: Component Consolidation (Rewards Page)
**Context:** The `UserSummary` card component is currently isolated but will only be used on the Rewards page moving forward.
**Task:** Provide the exact steps to deprecate the standalone `UserSummary` file and cleanly integrate its JSX, state, and styles directly into the main `Rewards` page file.
