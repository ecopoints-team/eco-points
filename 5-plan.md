---
description: 
globs: 
alwaysApply: false
---

You are a world-class software engineer with decades of experience. You are given a task that is related to the current project. It's either a bug that needs fixing, or a new feature that needs to be implemented. Your job is to come up with a step-by-step plan which when implemented, will solve the task completely.

First, analyse the project and understand the parts which are relevant to the task at hand. Use the available README-s and documentation in the repo, in addition to discovering the codebase and reading the code itself. Make sure you understand the structure of the codebase and how the relevant parts relate to the task at hand before moving forward.

Then, come up with a step-by-step plan for implementing the solution to the task. The plan will be sent to another agent, so it should contain all the necessary information for a successful implementation. Usually, the plan should start with a short description of the solution and how it relates to the codebase, then a step-by-step plan should follow which describes what changes have to be made in order to implement the solution.

Output the plan in a code block at the end of your response as a formatted markdown document. Do not implement any changes. Another agent will take over from there.

This is the task that needs to be solved:

# Profile Page - Header
- When the logo is clicked, it should redirect to the top of the profile page and not the home page.
- The dropdown of the profile should show the following redirections accordingly:
   - Home
   - Rewards
   - Leaderboard
   Separator
   - Log Out (Add a Pop Up Modal asking if "Are you sure you want to log out?")

# Profile Page
- Add a Footer same with the leaderboard

# Profile Page - Left Side Containers
## General Design Constraints for all 3 cards:
- Global Background: `#F8FAFC` (Slate 50)
- Card Shape: `bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100`
- Hover States: Each card must be fully clickable. They should scale up very slightly, increase shadow, and have their border change color when hovered.

## CARD 1: "Pending Claims" (Interactive Button Card)
- Purpose: A clickable card that opens a modal showing a list of physical items the user has redeemed but not yet collected.
- Layout: Flexbox, horizontally aligned (`justify-between items-center`).
- Left Side (Icon & Text):
   - A circular icon container (`w-12 h-12 rounded-full bg-[#F0FDF4] text-[#10B981]`). Inside, use the Lucide `Ticket` icon. Make the icon and container background invert/change color on group-hover.
   - Text block next to the icon: Main title "Pending Claims" (Dark Green `#064E3B`, Bold, Fredoka). Subtitle "View Tickets" (Small text, Slate-400, Uppercase, Tracking-wider).
- Right Side (Notification Badge):
   - If the user has pending items (> 0), display a bold pill-shaped badge (`bg-[#FBBF24] text-white`). The badge should show the exact number of pending items in bold, monospace font.

## CARD 2: "Active Streak" 
- Purpose: Displays the user's current daily recycling streak.
- Visual Effect: Add a large, highly blurred ambient orange glow (`bg-orange-500/5 blur-xl`) hidden in the bottom-left corner of the card.
- Left Side (Icon & Text):
   - A circular icon container (`bg-orange-50 text-orange-500`). Inside, use the Lucide `Flame` icon. Add an `animate-pulse` effect to the flame.
   - Text block next to the icon: Subtitle "Active Streak" (Small text, Slate-400, Uppercase, Tracking-widest). Main value "[X] Days" (Large text, Dark Green, Space Mono font, Black weight).
- Right Side (Record):
   - Right-aligned text block: "Best: [Y]" (Small text, Orange-500, Black weight). Subtitle "Record" (Very small text, Slate-400, Uppercase).

## CARD 3: "Organization Rank"
- Purpose: Displays the user's leaderboard position and progress to the next rank.
- Visual Effect: Add a large, highly blurred ambient gold glow (`bg-[#FBBF24]/10 blur-2xl`) hidden in the top-right corner of the card.
- Top Section (Title & Rank):
   - Flexbox, `justify-between items-start`.
   - Left side: A small Lucide `Award` icon in a gold box. Next to it, text "Organization Rank" (Small text, Slate-400, Uppercase, Tracking-widest).
   - Right side: Massive rank text (e.g., "#18") (Large text, Dark Green, Space Mono, Black weight).
- Middle Section (Progress Bar):
   - Text row above bar: "Current: [X] EP" (Left) and "Next Rank: [Y] EP" (Right/Orange).
   - The Bar: A thick, pill-shaped background track (`bg-slate-100 h-3.5`) containing an inner track with an Amber-to-Orange gradient (`bg-gradient-to-r from-[#FBBF24] to-[#F59E0B]`). Make the inner track width around 78%. Add a fast shimmer animation overlapping the inner track.
- Bottom Section (Motivation Box):
   - A small card nested inside (`bg-orange-50 rounded-xl p-3`). Text inside: "You are [Z] EP away from overtaking @eco_mark! Keep recycling!"
- Action Footer (Crucial):
   - At the very bottom of the card, spanning the full width. Give it a top border (`border-t border-slate-100`).
   - Create a text-based button centered in this footer: "VIEW LEADERBOARDS ->". Use uppercase, tracking-widest, bold emerald green text. When hovered, the arrow should translate right by a few pixels.