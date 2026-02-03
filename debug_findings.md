# Data Sync Issue Findings

## Current Status
- **Database**: Contains 65 assignments and 22 quizzes (verified via SQLite query)
- **API Endpoints**: Exist at `/api/assignments/all` and `/api/quizzes/all` (verified in routes/courses.ts)
- **Frontend**: AssignmentsPage is fetching from correct endpoints (`/api/assignments/all`, `/api/quizzes/all`)
- **Display**: Shows "No upcoming assignments or tests" with 0 counts for all categories

## Problem
The frontend is successfully loading the page and making API calls, but receiving empty arrays (0 assignments, 0 quizzes) despite data existing in the database.

## Next Steps
1. Check the API endpoint implementation to see if there's a userId filter issue
2. Verify the dev mode bypass is setting userId correctly
3. Test the API endpoints directly to see what data they return
