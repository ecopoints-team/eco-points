# Bugfix Requirements Document

## Introduction

The admin dashboard has six defects across the Machines menu and the Manage Users menu. Superadmins cannot add, edit, or log maintenance on machines; the machine search crashes with a `TypeError`; the "All locations" user filter omits users from some orgs; and the Add User modal fails with a generic "BAD REQUEST" error. These defects block core admin CRUD operations and prevent QA sign-off.

The bugs group into six bug conditions:

- **C1 — Add Machine**: Submitting the Add Machine modal does not create a machine.
- **C2 — Edit Machine**: Submitting the Edit Machine modal does not persist changes.
- **C3 — Maintenance Log**: Submitting the Maintenance modal does not create a maintenance log.
- **C4 — Machine Search Crash**: Typing in the machine search bar throws `getLocationName is not a function` (temporal-dead-zone / ordering bug at `app/admin/machines/page.js:660`).
- **C5 — All-Locations User Filter**: With "View As" = All locations, newly created users on some orgs (e.g. EPTU) are omitted from the table.
- **C6 — Add User Bad Request**: The Add User modal fails with "BAD REQUEST" instead of succeeding or surfacing the real validation message (password policy mismatch + flat-string error body not surfaced by `ApiError` + possible field/shape mismatch against `UserCreateSchema`).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a superadmin fills the Add Machine modal and clicks submit THEN the system does not create a machine and no new machine card appears
1.2 WHEN an admin changes a field in the Edit Machine modal and clicks save THEN the system does not persist the change and the machine card is unchanged
1.3 WHEN an admin fills the Maintenance modal on a machine and submits THEN the system does not create a maintenance log
1.4 WHEN a user types into the machine search bar THEN the system crashes with `Uncaught TypeError: getLocationName is not a function` at `app/admin/machines/page.js:660` inside the `displayedMachines` useMemo
1.5 WHEN the "View As" filter is set to All locations THEN the system omits newly created users belonging to some organizations (e.g. EPTU) from the Manage Users table
1.6 WHEN an admin fills the Add User modal and submits THEN the system fails with a generic "BAD REQUEST" error instead of creating the user or showing the actual validation reason

### Expected Behavior (Correct)

2.1 WHEN a superadmin fills the Add Machine modal with valid data and clicks submit THEN the system SHALL create the machine via the create endpoint and display the new machine card with the summary "Online" count updated
2.2 WHEN an admin changes a field in the Edit Machine modal and clicks save THEN the system SHALL persist the change via the update endpoint and reflect the updated values on the machine card
2.3 WHEN an admin fills the Maintenance modal on a machine with valid data and submits THEN the system SHALL create a maintenance log via the logs API and reflect the new log
2.4 WHEN a user types into the machine search bar THEN the system SHALL filter machines without crashing, because `getLocationName` is defined before its use in the `displayedMachines` useMemo (hoisted or moved above the memo)
2.5 WHEN the "View As" filter is set to All locations THEN the system SHALL include all users across all organizations in the Manage Users table, including newly created accounts on any org
2.6 WHEN an admin fills the Add User modal and submits THEN the system SHALL apply the same password policy as the server (≥8 chars, one uppercase, one lowercase, one digit) and the same field/shape handling as public registration, succeeding on valid input and surfacing the server's real error message on invalid input instead of "BAD REQUEST"

### Unchanged Behavior (Regression Prevention)

3.1 WHEN machines are loaded for a location THEN the system SHALL CONTINUE TO list existing machines and their online/offline counts correctly
3.2 WHEN a user searches for a term that matches an existing machine name or id THEN the system SHALL CONTINUE TO return matching machines
3.3 WHEN the "View As" filter is set to a specific location (e.g. EPTU) THEN the system SHALL CONTINUE TO show only that location's users
3.4 WHEN public registration is submitted from the login/signup modal THEN the system SHALL CONTINUE TO apply the shared password policy and surface server error messages as already fixed in `LogIn.jsx`
3.5 WHEN an admin submits the Add User modal with input that already passes validation THEN the system SHALL CONTINUE TO create the user with the correct fields per `UserCreateSchema`
3.6 WHEN existing machine cards, edit, and maintenance flows are used for valid non-buggy inputs THEN the system SHALL CONTINUE TO render the machines page without runtime errors
