---
description: Security Checking Plan
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

- Included in this chat, is our old completed security audit. After a while, we have ran some tests and fixed some security issues, routing issues, API issues, authentication and authorization/permission issues. Now, we need to do an audit again for the record. Here are the things that we need to check:
    - Authentication
        - User data privacy
        - User token and session
        - Password hashing
        - Session management
        - Rate limiting
    - Authorization
        - Role based access control
        - Permission based access control
    - API Security
        - API authentication
        - API authorization
        - API rate limiting
        - API parameter validation
    - Input validation
        - XSS prevention
        - SQL injection prevention
    - Database security
        - Database authentication
        - Database authorization
        - Database connection pooling
    - File upload security
        - File upload authentication
        - File upload authorization
        - File upload parameter validation
    - CORS security
    - QR code security 
    - API Routing Security
    - Admin users permission/authorization
        - Admin roles should have access in admin dashboard and sub-pages/endpoints under /admin (as of now, all are protected by admin_required). 

## Found issue that we need to check

- The old migration, we only have admin users and not an actual regular user. Meaning the routing/redirection of the login modal of ours is redirected to the admin dashboard. This is wha we need to fix:
    - The regular users who logs in through the login modal (not the rpi) should be redirected to the user dashboard, which in this case, is the rewards page, not the admin dashboard.
    - The regular users who logs in through rpi with their QR code should be also redirected to the rewards page, not the admin dashboard. 

