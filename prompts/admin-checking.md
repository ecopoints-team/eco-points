---
description: Admin alignment to Models Checking / Sign up Updates
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

# Main Task

## Phase 1 - Models Alignment

- Thouroughly scan the admin side of the dashboard and check if its aligned with our models.py
- Check if the fields there are aligned with the refined models.py
- Thoroughly check every field modals in each menu's if they're aligned with the latest models.py
- After checking the admin alignment on the new models.py:
    - Plan for refactoring the admin fields that align with the models
    - Plan for api calls, routing, and ebsite reflections of data (This is for adding rewards, user profiles and other related things)

## Phase 2 - Sign up Normalization

- Check the sign up part of our website's modal and make a plan on making the name and other normilized data on the models of ours. 
- List all the fields that is needs to be updated for normalization.
- Make a sectioned plan for this implementation.

