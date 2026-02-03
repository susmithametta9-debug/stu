# Assignments Page Findings

## Current State
- ✅ "Add Assignment" button exists (index 12)
- ✅ Assignments are displaying (83 upcoming, 3 overdue, 87 total)
- ✅ Tabs: Upcoming, Due Today, Overdue
- ✅ Assignment cards showing: title, course, due date, points

## What's Needed
According to user requirements:
1. **Canvas Text Parser Button** - Place next to "Add Assignment" button
2. This button should open a dialog where user can paste Canvas assignment text
3. The parser should extract:
   - Assignment titles
   - Due dates
   - Points (if available)
4. Create assignments in database
5. Sync to calendar automatically

## Implementation Plan
1. Add "Parse Canvas Text" button next to "Add Assignment"
2. Create dialog with textarea for pasting Canvas text
3. Create text parser utility to extract assignment data
4. Create API endpoint to bulk create assignments
5. Test with real Canvas assignment text
