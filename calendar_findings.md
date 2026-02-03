# Calendar Findings

## Current State
- Calendar page is displaying January 2026
- Shows "0 events" for today
- "Upcoming Deadlines" section visible but cut off
- No assignments or quizzes showing on calendar dates

## Issue
The calendar is not syncing with the 65 assignments and 22 quizzes that have due dates.

## Solution Needed
1. Create schedule_events entries for all assignments and quizzes during upload
2. Update CalendarPage to fetch and display these events
3. Show event indicators on calendar dates
4. Display events in the sidebar when clicking dates
