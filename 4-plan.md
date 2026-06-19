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

## Edit Profile Picture - Modal
- Change the current design and layout of the profile picture.
- Left side shows a circle where it shows the preview of the profile picture the user has currently.
- Right side shows the controls for the user to upload and adjust the profile picture. It is located inside a broken line rounded rectangle with our branding. Inside also shows "Upload Photo" ".png or .jpg files only | max file size: 10mb"
- Below would be the three buttons: Remove, Cancel, Upload
- Clicking "Remove" would show a prompt "Are you sure you want to remove the current profile picture." then Confirm and Cancel buttons.