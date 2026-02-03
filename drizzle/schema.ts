import { integer, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("createdAt").notNull(),
  lastSignedIn: text("lastSignedIn").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Courses table
export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  courseCode: text("courseCode"),
  outline: text("outline"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// Assignments table
export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("dueDate"),
  lockDate: text("lockDate"),
  unlockDate: text("unlockDate"),
  pointsPossible: integer("pointsPossible"),
  submissionType: text("submissionType"),
  isGraded: integer("isGraded").default(0),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

// Quizzes table
export const quizzes = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("dueDate"),
  lockDate: text("lockDate"),
  unlockDate: text("unlockDate"),
  pointsPossible: integer("pointsPossible"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// Attachments table
export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("courseId").references(() => courses.id, { onDelete: "cascade" }),
  assignmentId: integer("assignmentId").references(() => assignments.id, { onDelete: "cascade" }),
  quizId: integer("quizId").references(() => quizzes.id, { onDelete: "cascade" }),
  todoId: integer("todoId").references(() => todos.id, { onDelete: "cascade" }),
  fileName: text("fileName").notNull(),
  fileSize: integer("fileSize"),
  fileType: text("fileType"),
  filePath: text("filePath").notNull(),
  fileData: blob("fileData"), // Store actual file content
  uploadedAt: text("uploadedAt").notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

// Notebooks table
export const notebooks = sqliteTable("notebooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("courseId").references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color").default("#4F46E5"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Notebook = typeof notebooks.$inferSelect;
export type InsertNotebook = typeof notebooks.$inferInsert;

// Notes table
export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  notebookId: integer("notebookId").notNull().references(() => notebooks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  isPinned: integer("isPinned").default(0),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

// Todos table
export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("courseId").references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("dueDate"),
  dayOfWeek: text("dayOfWeek"), // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  priority: text("priority").default("medium"),
  isCompleted: integer("isCompleted").default(0),
  category: text("category"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Todo = typeof todos.$inferSelect;
export type InsertTodo = typeof todos.$inferInsert;

// Schedule Events table
export const scheduleEvents = sqliteTable("scheduleEvents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("startDate").notNull(),
  endDate: text("endDate"),
  eventType: text("eventType"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type InsertScheduleEvent = typeof scheduleEvents.$inferInsert;
