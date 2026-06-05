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
    - The current fields we got:
        - Role (Change to User Type): Student, Alumni, Faculty, Staff
        - Educational Level: Kindergarden, Elementary School, Junior High School (JHS), Senior High School (SHS), and College
        - For the year level field:
            - If kindergarden, that's it, no year level needed and community group
            - If elementary school, the year level goes from 1-6 and then community group
            - If JHS, the year level goes from grade 7-10 and then community group
            - If SHS, the year level goes from grade 11-12 and then community group
            - If College, the year level goes from 1st year - 5th year and then community group
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

- On the  `Real-Time Bottle Logs` table, under the confidence column, the the numbers are formatted like this `8565.0%` which is wrong. Where in the `Bottle Logs` menu the numbers are formatted like this `85.65%` which is the right format.

### Locations Menu 

- On the `Add Location` modal, make it two paged modal as well like we did on the `New Bulk Session` modal.
- The edit modal should be the same layout of the add modal
- The bottle count of the cards shows NaNk, why is that? don't it fetch the bottles in the location? can we find what's causing it



