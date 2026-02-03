# Student Hub - All-in-One Academic Organizer

A comprehensive web application that helps students organize their academic life by integrating Canvas course data, managing assignments, taking notes, and tracking todos all in one place.

## Features

### Canvas Integration
- **Automatic Course Import**: Upload Canvas course exports (ZIP files) to automatically extract and organize course data
- **Smart Data Extraction**: Automatically parses and extracts:
  - Course information (title, code, description)
  - Assignments with due dates and point values
  - Quizzes and tests with deadlines
  - Course files organized by folder
  - Course outline and syllabus
  - Schedule information

### Course Management
- View all imported courses in an organized dashboard
- See assignments and quizzes for each course
- Track due dates and deadlines
- Access course materials and files
- Delete courses when no longer needed

### OneNote-Style Note-Taking
- **Subject-Wise Notebooks**: Create separate notebooks for each course or subject
- **Organized Pages**: Add multiple pages within each notebook for different topics
- **Rich Editing**: Edit and update notes with full formatting support
- **Pin Important Notes**: Mark important notes for quick access
- **Color-Coded Notebooks**: Assign colors to notebooks for visual organization

### Todo List & Task Management
- **Comprehensive Todo System**: Create and manage tasks with:
  - Priority levels (Low, Medium, High)
  - Due dates for deadline tracking
  - Categories and course associations
  - Completion status tracking
- **Smart Filtering**: Filter todos by:
  - Status (Active, Completed, All)
  - Priority level
- **Progress Tracking**: See statistics on active and completed tasks

### Multi-Page Dashboard
- **Intuitive Navigation**: Tab-based interface for easy switching between sections
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **User-Friendly Interface**: Clean, modern UI built with Tailwind CSS and shadcn/ui components

## Getting Started

### Prerequisites
- Node.js 22.x or higher
- pnpm package manager
- MySQL database

### Installation

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables**
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=mysql://user:password@localhost:3306/student_hub
   JWT_SECRET=your-secret-key
   NODE_ENV=development
   ```

3. **Initialize Database**
   ```bash
   pnpm db:push
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`

## Project Structure

```
student-hub/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Home.tsx
│   │   │   └── dashboard/
│   │   │       ├── CoursesPage.tsx
│   │   │       ├── NotesPage.tsx
│   │   │       ├── TodoPage.tsx
│   │   │       └── UploadCoursePage.tsx
│   │   ├── components/    # Reusable components
│   │   └── App.tsx        # Main app component
│   └── index.html
├── server/                # Backend Express application
│   ├── routes/           # API routes
│   │   ├── courses.ts    # Course management endpoints
│   │   ├── notes.ts      # Note management endpoints
│   │   └── todos.ts      # Todo management endpoints
│   ├── utils/            # Utility functions
│   │   ├── canvasParser.ts    # Canvas ZIP parser
│   │   └── __tests__/
│   │       └── canvasParser.test.ts
│   ├── db.ts             # Database connection
│   └── _core/
│       └── index.ts      # Server entry point
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Drizzle ORM schema
└── package.json
```

## API Endpoints

### Courses
- `GET /api/courses` - Get all courses for current user
- `GET /api/courses/:courseId` - Get course details with assignments and quizzes
- `POST /api/courses/upload` - Upload and parse Canvas ZIP file
- `DELETE /api/courses/:courseId` - Delete a course

### Notes
- `GET /api/notes/notebooks` - Get all notebooks
- `POST /api/notes/notebooks` - Create new notebook
- `GET /api/notes/notebooks/:notebookId/notes` - Get notes in notebook
- `POST /api/notes/notebooks/:notebookId/notes` - Create new note
- `PUT /api/notes/notes/:noteId` - Update a note
- `DELETE /api/notes/notes/:noteId` - Delete a note

### Todos
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:todoId` - Update a todo
- `DELETE /api/todos/:todoId` - Delete a todo

## Database Schema

### Tables
- **users**: User authentication and profile
- **courses**: Imported courses from Canvas
- **assignments**: Course assignments with due dates
- **quizzes**: Quizzes and tests
- **attachments**: Files and course materials
- **notebooks**: Note organization by subject
- **notes**: Individual notes within notebooks
- **todos**: Task management items
- **scheduleEvents**: Course schedule and events

## Canvas Export Format

The app accepts Canvas course exports in the standard ZIP format. To export from Canvas:

1. Go to your course in Canvas
2. Click "Settings" in the left sidebar
3. Scroll down and click "Export Course Content"
4. Select "Common Cartridge" format
5. Wait for the export to complete and download the ZIP file
6. Upload the ZIP file in the Student Hub app

## Testing

Run the test suite:
```bash
pnpm test
```

Run tests for specific files:
```bash
pnpm test server/utils/__tests__/canvasParser.test.ts
```

## Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes
- `pnpm lint` - Run linter

### Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express, TypeScript, Drizzle ORM
- **Database**: MySQL
- **Authentication**: Manus OAuth
- **File Handling**: multer, adm-zip

## Features in Development

- Rich text editor for notes (currently using basic textarea)
- Calendar view for assignments and events
- Search functionality for notes and todos
- Course outline/syllabus display
- File preview and download
- Integration with course schedule

## Known Limitations

- File storage is currently in the database; consider S3 integration for production
- Notes use basic textarea; rich text editor can be added with libraries like TipTap or Slate
- Calendar view not yet implemented
- Search functionality not yet implemented

## Future Enhancements

1. **Rich Text Editor**: Integrate TipTap or similar for advanced note formatting
2. **Calendar Integration**: Add calendar view for assignments and events
3. **File Storage**: Migrate to S3 or similar cloud storage
4. **Collaboration**: Add ability to share notes and todos with classmates
5. **Mobile App**: Build native mobile applications
6. **Notifications**: Add email/push notifications for upcoming deadlines
7. **Analytics**: Track study habits and assignment completion rates
8. **AI Assistant**: Add AI-powered study helper and note summarization

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please visit https://help.manus.im or contact the development team.

## Acknowledgments

- Built with [Manus](https://manus.im) web development platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)
- Database ORM by [Drizzle](https://orm.drizzle.team)
