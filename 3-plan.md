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
- Create Changes on the Following Profile information of the User on the Profile Page.

## Edit Profile Information Fields
- Remove the Profile Picture that can be seen on the Edit Profile Fields.
- Below the "Edit Profile" heading, add the following text: "Update your account details."
- Fix the Modal's Scrollbar. Currently, the scrollbar overlaps on the upper and lower part of the Modal.
- Remove the words "Editable Fields" and "Locked Fields"
- The Phone Number should have a "+63" that cannot be edited or deleted by the user.
- Additionally on the Phone Number, add an input validation where in the user can only input 10 digits starting with the number 9. If the input is invalid, it should display an error message below the input field.
- Format the Fields to the following format:
"User ID" | "Username"
"First Name" | "Middle Name (optional)" | "Last Name"
"Email" | "Phone Number (optional)"
"Organization" | "User Type" | "Community Group"
- Ensure that it will only be one line in case that they have inputted a long input. If it is too long, it should display an ellipsis (...) at the end.

## Edit Profile Picture
- User can only choose .png or .jpg file.
- Only 10mb is the maximum file size.
- User can adjust and crop for the display picture.
- The user has the options to save, cancel, or remove the current profile picture.