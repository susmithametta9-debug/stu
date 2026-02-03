# Student Hub - Project TODO

## Core Features

### Canvas ZIP Parser & Data Extraction
- [x] Parse Canvas course export ZIP structure
- [x] Extract course metadata (title, description)
- [x] Extract assignments with due dates and files
- [x] Extract schedule/course outline from wiki pages
- [x] Extract quiz and test information
- [x] Link files to relevant assignments/tests
- [x] Handle file uploads and storage

### Multipage Navigation & Layout
- [x] Create main dashboard/home page
- [x] Build navigation with tab-based interface
- [x] Implement page routing (Dashboard, Courses, Notes, Todo, Upload)
- [x] Create responsive layout for desktop/mobile

### Academic Data Management
- [x] Display courses with parsed data
- [x] Show assignments with due dates
- [ ] Create schedule/calendar view
- [ ] Display course outline/syllabus
- [ ] Manage and edit assignments
- [x] Create modals for tests/quizzes with associated files
- [ ] File preview/download functionality

### OneNote-Style Note-Taking System
- [x] Create subject/course-wise notebook creation
- [x] Create pages within notebooks
- [ ] Rich text editor for notes (currently basic textarea)
- [x] Note organization and hierarchy
- [ ] Search functionality for notes
- [ ] Auto-save notes to database

### Todo List & Task Management
- [x] Create separate todo page
- [x] Add/create todo items
- [x] Mark todos as complete
- [x] Set priorities and due dates
- [x] Organize todos by category
- [x] Delete/edit todos

### Database Schema
- [x] User model
- [x] Course model
- [x] Assignment model
- [x] Quiz/Test model
- [x] File/Attachment model
- [x] Notebook model
- [x] Note/Page model
- [x] Todo model
- [x] Schedule Events model

### Testing & Quality
- [x] Unit tests for Canvas parser
- [ ] Unit tests for API routes
- [ ] Integration tests for file upload
- [ ] UI/E2E tests for main flows

### Deployment
- [ ] Save checkpoint before publishing
- [ ] Deploy to production


## Bug Fixes
- [ ] Fix Canvas ZIP upload endpoint JSON parsing error
- [ ] Verify course data extraction from Canvas ZIP files
- [ ] Test file upload handling with large files
