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

# Pre-task
- Always make an implementation plan on an artifact first, so the developer can review the plan first.
- We will be focusing on the profile page only. Other pages should not be affected on the codebase.

# Main Task
1. Profile Sidebook / Containers
Stack these three cards vertically in a sidebar column:
Main Profile Card: A clean card showing a user avatar placeholder, Name, Username, Role (User Type), Mobile Number, and Organization. Highlight "Total Points" prominently in large, bold green text. Include two action buttons side-by-side at the bottom (e.g., 'Edit Info' and 'Show QR' with soft background hovers).
Active Streak Card: A compact horizontal card with an ambient yellow glow background effect.
Left side: A circular container with an animated, glowing orange flame icon, horizontally next to stacked text: "ACTIVE STREAK" (tiny, gray, uppercase) over "X Days" (large, bold green).
Right side: Stacked text aligned to the right: "Best: X" (bold orange) over "RECORD" (tiny, gray, uppercase).
Organization Rank Card: A card showing the user's current rank. Include a progress bar indicating the points needed to reach the next rank. Below it, add a call-out "motivation box" with a soft orange background and text like "You are X points away from overtaking @username! Keep recycling!".
2. Recent Activity Log
A structured list view of the user's recent transactions.
Layout: A white card container.
List Items: Each row should feature:
An icon on the left (e.g., recycle bin, bottle) centered in a soft, colored circular background.
the middle: The activity description (dark bold text) and the date/time below it (small gray text).
On the right: The point delta, styled positively (e.g., +50 EP, bold emerald text) or negatively (e.g., -20 EP, bold gray/red text).
Pagination: Include a simple, modern pagination footer at the bottom of the list (Previous/Next buttons).
Please provide the complete, modular code for these components. Ensure there are no redacted usernames in the data.
3. Same Header with the Leaderboards
Apply the same changes of the leaderboards header for the profile page.
4. Retain Heatmap feature
Do not change anything on the heatmap. Do not remove or alter design. Keep it as is.
