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