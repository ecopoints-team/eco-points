# Admin Dashboard Fixes

## Overview

This plan tracks bug fixes and issues found in the admin dashboard during QA and production deployment. This is the first part of the fixes. Make it phased tasks for better task tracking.

## Tasks

### Field Validation

- All the fields on all the menu should have input validations and don't accept white spaces. The input validation shold be aligned on the field asks and the ERD needs.

### Data Fetching

- The admin dashboard is slow at data fetching even on the prod. When the admin access the dashboard first time, it takes too long to load the data and when the admin navigates between the pages, it is slow to fetch the data. It should be fast and responsive.
- Possible use redis cache as my recommendation. It works for leaderboards data fetching and analytics.

### Dashboard Menu

## Found Issues

- `Recycling Analytics` don't show any line graphs and charts. It should show line graphs and charts to show the trend of the data.
- The cards resets the data whenever the admin navigates to other pages and return on the dashboard menu. The data should persist in all pages not only on the dashboard menu.
- Add a refresh button on the menu to refresh the data if the admin wants to.

### Locations Menu

## Found Issues

- `Add New Location Modal` - In the organization type field, the admin should be able to make a new organization type based on the client status. But right now, when the admin tries to add new organization type, it is not saving or adding the new organization type.
- The modal should be aligned on the models and ERD that we have. Refactor the fields based on the ERD needs and its entities.

### Machines Menu

- `Add New Machine Modal` - The Area Placement field should not have an Add button beside it. Remove it and its functionality completely.

### Finalization

- So far, let's fix these issues first.
- These are the only issues that I have found by eye. I want you to comprehensively look for other issues and bugs according to these issues that I have found.
- Don't you limit on these found issues. As much as possible, scan the parts of these issues and their affected areas so that we can fix all the connection/connected parts of the admin and website.

# Admin Dashboard Fixes Part 2

## Question About the last part (On Local dev not prod)

- The task should optimized the `Dashboard Overview`, `Locations`, and `Machines` menu, right? Now, why does the `Analytics` Menu renders the analytics charts and graphs faster than the `Dashboard Overview`? it should be the same I think? since they are just using the same data fetching method right? What's actually happening is whenever I try to wait on the dashboard overview's data to show, I go to analytics then when it renders I will go back to the dashboard overview and then it will render or sometimes even no.
- What are the error logs mentioned in the chat?

## Tasks

### FIRST PRIORITY (Creation of Community Groups)

- Upon creation of location on the `Location` Menu, it should have a field to put the community groups inside that location. We can also add an import of csv with a helper icon modal to show how the format template should be and have a sample template for it as well. This is mainly for school since they have the most community groups they need because of courses (for college), strands (for senior high school), elementary, and kindergarden (for sections). Other than that should be the same.

#### Additional fixes

- On the Organization Type field on the `Add Location` modal, we can add an edit button as well beside the delete button.

### Manage User Modal Realignment

- The `Add User` modal and `Edit User` modal don't have the same entities or fields or values that we need to capture. Refactor the fields based on the ERD needs and its entities.
- The `Add User` and `Edit User` modal should have these features. Since we're a multi-tenant system, the fields inside the modal should change based on the client/customer's organization type or status.Since we have `Location` field on the modal, we can determine the org type of the client/customer so we can determine what field to follow up or to show so let's make it like a flow where the other fields are disabled until the previous field is filled. So, obviously the `Location` field then the `User Type` field then the rest is the corresponding field aligned to the location. Here's tjo follow:

  If the organization type of the location is `University` or `School`, the following fields should be shown:
  - The current fields we got: - Role (Change to User Type): Student, Alumni, Faculty, Staff - Educational Level: Kindergarden, Elementary School, Junior High School (JHS), Senior High School (SHS), and College - For the year level field: - If kindergarden, that's it, no year level needed and community group - If elementary school, the year level goes from 1-6 and then community group - If JHS, the year level goes from grade 7-10 and then community group - If SHS, the year level goes from grade 11-12 and then community group - If College, the year level goes from 1st year - 5th year and then community group
    Other than that, it should be the same still.

  If the organization type of the location is `Community`, the following fields should be shown:
  - The current fields we got:
    - Role (Change to User Type): Resident, Community Official, Community Worker, Business Owner.
    - Then show the community groups field selection based on the location.

  If the organization type of the location is `Corporate`, the following fiels should be shown:
  - The current fields we got:
    - Role (Change to User Type): Employee, Manager, Executive, Contractor, Guest
    - Then show the community groups field selection based on the location.

### Manage Admin Modal Realignment

- The `Add Admin` and `Edit Admin` modal stays the same except the name field. Follow the normalization of the ERD.

### Rewards Inventory Menu Modal Redesigning

- On the category field, the selection should have the delete and edit button like on the `Organization Type` field on the add location modal.

# Admin Dashoard Fixes Part 3

## Console Errors Found

-       ## Error Type
        Console ApiError

        ## Error Message
        INTERNAL SERVER ERROR


            at <unknown> (src/services/api/client.js:211:15)

        ## Code Frame
        209 |             dispatchUnauthorized();
        210 |         }
        > 211 |         throw new ApiError(
            |               ^
        212 |             serverError.code || `HTTP_${response.status}`,
        213 |             serverError.message || response.statusText || `Request failed (${response.status})`,
        214 |             response.status,

        Next.js version: 16.2.6 (Turbopack)

## Tasks

### Bulk Sessions Menu Fixes

- On the `New Bulk Session` modal, make it two side by side pages. The other page is for the items addition with import feature with proper template just like the plan of ours in the community groups for the location modal.

### Pending Fixes

- Do the 14.3 pending on the task tracker.
- Also align the edit modals action on the tables of the `manage user` and `manage admin` modal. The fields should be aligned with their `Add` modals fields that is aligned with the ERD

## Admin Dashboard Fixes Part 4

## Tasks

### Dashboard Overview

- On the `Real-Time Bottle Logs` table, under the confidence column, the the numbers are formatted like this `8565.0%` which is wrong. Where in the `Bottle Logs` menu the numbers are formatted like this `85.65%` which is the right format.

### Locations Menu

- On the `Add Location` modal, make it two paged modal as well like we did on the `New Bulk Session` modal.
- The edit modal should be the same layout of the add modal
- The bottle count of the cards shows NaNk, why is that? don't it fetch the bottles in the location? can we find what's causing it

## Admin Dashboard Fixes Part 5

## Tasks

### Skeleton Loader Redesigning

- Instead of using generic skeleton loader, the loader cards, status cards, tables, and charts should be aligned to the component design of our cards.
- Make sure that this skeleton loader is resuable since all the design of our tables and cards are the same anyway. The different ones are only the `Location Cards` and the `Machine Cards`

### Dashboard Overview

- Make sure that the refresh button of the dashbaord overview will refresh the whole page and not the analytics only. So, instead of putting the refresh button inside the `Super Admin Global Stats Banner`.
- Add a skeleton loading on the `Recycling Analytics` card as well.
- The tables on the summary of the `Real-Time Bottle Logs` should have skeleton loading as well.

### Location Menu

- The cards should have skeleton loading as well.

### Machine Menu

- The cards should have skeleton loading as well.

### User Management Menu

- The cards should have skeleton loading as well.

### Reward Inventory Menu

- The cards should have skeleton loading as well.

### Leaderboards Menu

- Remove this menu and all its functionalities and files. Complete removal of menu.

### Analytics Menu

- The refresh button should activate the skeleton loading of the whole page
- All the cards should have their skeleton loading,

### Bulk Session Menu

- The cards should have skeleton loading as well.

### System Logs Dropdown

- All menu uder this dropdown, all their cards should have skeleton loading.

## Admin Functionality Fixes Part 1

## Tasks

### Core Functionality

- Check if the system right now is still working as a multi-tenant. Where we can deploy the system on different clients with their own admin dashboards and without leaking their informations in other tenants.

### Admin Users

- Currently, when the admin user is logged in, the admin is also logged in on the website, WHICH IS BAD. The user account and admin acount should not have some interconnections to each other whatsoever. They should live separately because that's a security risk as well. The admin user must be different to regular user.

### Rewards Reflection on the Website

- First, check if the rewards shown on the rewards page on the website is mock or the data that we have on the seeded database. If yes, remove it and fetch the data on the database instead. If no, let's connect the rewards menu to the website's rewards page so we can test if we can post a reward on the website.


## Admin Dashbaord UI Fixes 

## Tasks

- Currently, the website and the adin dashboard shares some of the same styling from the general style of ours. Now, I want you to separate the two styles. For instance, the custom dropdown of ours [text](../client/src/components/admin/CustomDropdown.jsx) the website and the admin dashboard are using the same component styling, which is good. But some of the styling affects the UI of the admin dashboard. You can see that almost all the cards on the admin dashbaord becamse radiused corner which is not good. I don't know if it came from the website or somewhere but its not supposed to be like that. 
https://github.com/obra/superpowers/tree/main/skills/brainstorming

## Admin Dashboard Fixes Part 6

## Tasks

### Theme Removal

- Remove the `System Mode` on the dashboard's theme

### Points Config Bad Request Error

-  GET /admin/settings 200 in 1157ms (next.js: 1113ms, application-code: 44ms)
[browser] Failed to load points config: ApiError: BAD REQUEST
    at <unknown> (src/services/api/client.js:211:15)
  209 |             dispatchUnauthorized();
  210 |         }
> 211 |         throw new ApiError(
      |               ^
  212 |             serverError.code || `HTTP_${response.status}`,
  213 |             serverError.message || response.statusText || `Request failed (${response.status})`,
  214 |             response.status, (app/admin/settings/page.js:76:21)

### Location Import Feature

- Make a csv, xls, and other available file format for importing data. 
- Make a helper icon for information on the import

### Bulk Session Import Feature

- Make a csv, xls, and other available file format for importing data. 
- Make a helper icon for information on the import

  

### Website Polishing Part 1

## Tasks 

- On the sign up side of the log in modal, the fields should be the same as the `Add User` modal on the `User Management` Menu

- The fields on the signup page lost their slight radius, add some as well.


### Admin Dashboard Fixes Part 7

## Tasks

### ERD Field and Admin Dashboard Re-polishing

- On the `Locations Menu`, on its community group field, we will transfer the  string educational_level "Nullable - Kindergarten, Elementary, JHS, SHS, College | Newly Added", string year_level "Nullable - e.g. Grade 11, 3rd Year | Newly Added" column from the ERD to the community group and remove on the users table. Also remove the string group_type "Nullable - e.g. College Dept, SHS Strand" because its necesarry anymore. Here's the new field on the community group:

  - Name field, Abbrev field, Educ Level field, and year level

- Now, since we transfered the column and the field on the commuity group add location modal those columns, we will removing them on the users table and the Add User modal as well as the sign up side of the log in page. Meaning the Add User and Sign up side should look like this now:

  - When the location is selected by the user, the field that will show up next should be user type and community group only now. No educ level and year level anymore.

- We will be updating the import and the helper on the add location import on the community group side on the locations menu. 

- HUGE NOTE: This is ONLY if the user's user type is a student, okay? Other user type should be the same

- If the organization type is university, the user type alumni, faculty, and staff should be automatically included on the default community group. The community group field on the add user and sign up should now show anymore if the user type are these three.

- We will stick into 3 organization type only. University, Corporate, and Community. We will remove the add button beside the organization type field.

- For other organization type, the community group field should stay: Name field and Abrev field only along with its import. Meaning, the import and helper icon  and template for university is different from the Corporate and Community Organization type.


### User Session Fixes Part 1

## Tasks

- This is a serious security and session issue. I will list all the bugs that I hve found.

    - First, `URL` bug. As a non-user or a user with no account, I can access the profile, rewards, and leaderboards on the URL. This is not a win because the non-user should not able to navigate those pages not even access. Add a security layer just like on the /admin url that we have right now and enhance them even more.


### Email Configuration Part 1

## Tasks

- I have updated the env with our resend API. Let's continue configuring it and try testing using the settings on the admin dashboard.


### User Session Fixes Part 2

- When I log in an admin account, for instance, the superadmin account then I change the url from /admin to /profile the super admin account shows an activity on the website which is not a win. We planed before that we will separate the admin accounts to user accounts, right? Here's what's going to happen:

  - We will be planning some session fixes for the following:
    - When an admin account logs in for the admin dashboard (superadmin, admin, auditor, inventory officer, technician), when they change the URL to return to the website's page like the /profile, and /rewards, their account should unauthorized. If the admin wanted a normal account too, they should make another one. That will enhance our RBAC security and limitations. Meaning, the session of the admin acccounts should expire or force log out whenever they change the URL into website's URL. 