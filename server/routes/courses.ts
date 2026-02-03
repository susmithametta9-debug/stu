import { Router, Request, Response } from "express";
import { getDb } from "../db";
import {
  courses,
  assignments,
  quizzes,
  attachments,
  scheduleEvents,
  InsertCourse,
  InsertAssignment,
  InsertQuiz,
  InsertAttachment,
  InsertScheduleEvent,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import { createReadStream } from "fs";
import { join } from "path";
import AdmZip from "adm-zip";
import {
  parseCanvasCourseData,
  flattenFileStructure,
  extractCourseOutline,
} from "../utils/canvasParser";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isZip = file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed" || file.mimetype === "application/x-zip" || file.originalname.toLowerCase().endsWith(".zip");
    if (isZip) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
    }
  },
});

/**
 * GET /api/courses - Get all courses for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const userCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, userId));

    res.json(userCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

/**
 * GET /api/courses/:courseId - Get course details with assignments and quizzes
 */
router.get("/:courseId", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)));

    if (!course.length || course[0].userId !== userId) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.courseId, parseInt(courseId)));

    const courseQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.courseId, parseInt(courseId)));

    res.json({
      ...course[0],
      assignments: courseAssignments,
      quizzes: courseQuizzes,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

/**
 * POST /api/courses/upload - Upload and parse Canvas ZIP file
 */
router.post(
  "/upload",
  (req: Request, res: Response, next) => {
    upload.single("zipFile")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const multerReq = req as any;
      if (!multerReq.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Extract course name from ZIP filename
      // Format: "Sec-004-Spring-2026-CIS-2166-2026-Jan-25_16-27-50-905.zip"
      const zipFilename = multerReq.file.originalname.replace(/\.zip$/i, "");
      let extractedCourseName = "Untitled Course";
      
      // Try to extract meaningful course name from filename
      const courseNameMatch = zipFilename.match(/([A-Z]{2,}[\s-]?\d{3,4})/i);
      if (courseNameMatch) {
        extractedCourseName = courseNameMatch[1].replace(/[-_]/g, " ");
      } else {
        // Use the whole filename cleaned up
        extractedCourseName = zipFilename
          .replace(/[-_]/g, " ")
          .replace(/\d{4}-\w{3}-\d{2}.*$/, "") // Remove timestamp
          .trim();
      }

      // Extract ZIP file from buffer
      const zip = new AdmZip(multerReq.file.buffer);
      const entries = zip.getEntries();

      // Find course-data.js (handle various path structures)
      const courseDataEntry = entries.find(
        (entry: any) => entry.name === "course-data.js" || entry.name.endsWith("/viewer/course-data.js")
      );

      if (!courseDataEntry) {
        return res.status(400).json({
          error: "Invalid Canvas export: course-data.js not found",
        });
      }

      // Parse course data
      const courseDataContent = courseDataEntry.getData().toString("utf8");
      const parsedData = parseCanvasCourseData(courseDataContent);

      // Extract course outline from pages
      const courseOutline = extractCourseOutline(parsedData.pages);

      // Create course in database
      const now = new Date().toISOString();
      // Use extracted course name from filename if parsed name is generic
      const finalCourseName = parsedData.course.name && parsedData.course.name !== "Untitled Course" 
        ? parsedData.course.name 
        : extractedCourseName;
      
      const courseData: InsertCourse = {
        userId,
        title: finalCourseName,
        description: parsedData.course.description,
        courseCode: parsedData.course.code || extractedCourseName,
        outline: courseOutline,
        createdAt: now,
        updatedAt: now,
      };

      const insertedCourse = await db.insert(courses).values(courseData).returning();
      const courseId = insertedCourse[0].id;

      // Insert assignments
      for (const assignment of parsedData.assignments) {
        const assignmentData: InsertAssignment = {
          courseId: courseId as number,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueAt ? new Date(assignment.dueAt).toISOString() : null,
          lockDate: assignment.lockAt ? new Date(assignment.lockAt).toISOString() : null,
          unlockDate: assignment.unlockAt
            ? new Date(assignment.unlockAt).toISOString()
            : null,
          pointsPossible: assignment.pointsPossible || 0,
          submissionType: assignment.submissionTypes,
          isGraded: assignment.graded ? 1 : 0,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(assignments).values(assignmentData);
      }

      // Insert quizzes
      for (const quiz of parsedData.quizzes) {
        const quizData: InsertQuiz = {
          courseId: courseId as number,
          title: quiz.title,
          description: quiz.description,
          dueDate: quiz.dueAt ? new Date(quiz.dueAt).toISOString() : null,
          lockDate: quiz.lockAt ? new Date(quiz.lockAt).toISOString() : null,
          unlockDate: quiz.unlockAt ? new Date(quiz.unlockAt).toISOString() : null,
          pointsPossible: quiz.pointsPossible || 0,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(quizzes).values(quizData);
      }

      // Extract and store files from ZIP
      // Canvas exports store files in viewer/files/ directory
      const fileEntries = entries.filter((entry: any) => 
        !entry.isDirectory && 
        entry.entryName.includes("viewer/files/") &&
        !entry.entryName.endsWith(".js") &&
        !entry.entryName.endsWith(".html")
      );

      console.log(`Found ${fileEntries.length} files in Canvas ZIP`);

      for (const fileEntry of fileEntries) {
        try {
          const fileName = fileEntry.name;
          const fileSize = fileEntry.header.size;
          const fileExt = fileName.split(".").pop() || "unknown";
          const filePath = fileEntry.entryName;
          
          // Extract file data as buffer
          const fileBuffer = fileEntry.getData();
          
          // Store file metadata in database
          const fileData: InsertAttachment = {
            userId,
            courseId: courseId as number,
            fileName: fileName,
            fileSize: fileSize,
            fileType: fileExt,
            filePath: filePath,
            fileData: fileBuffer, // Store actual file data
            uploadedAt: now,
          };

          await db.insert(attachments).values(fileData);
          console.log(`Saved file: ${fileName} (${fileSize} bytes)`);
        } catch (error) {
          console.error(`Error saving file ${fileEntry.name}:`, error);
        }
      }

      res.json({
        success: true,
        courseId,
        course: parsedData.course,
        assignmentCount: parsedData.assignments.length,
        quizCount: parsedData.quizzes.length,
        fileCount: fileEntries.length,
      });
    } catch (error: any) {
      console.error("Error uploading course:", error);
      console.error("Error details:", error.message, error.stack);
      res.status(500).json({
        error: `Failed to upload course: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
);

/**
 * POST /api/courses - Create a new course manually
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { title, courseCode, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Course title is required" });
    }

    const now = new Date().toISOString();
    const courseData: InsertCourse = {
      userId,
      title: title.trim(),
      courseCode: courseCode?.trim() || null,
      description: description?.trim() || null,
      outline: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(courses).values(courseData).returning();
    const createdCourse = result[0];

    res.json(createdCourse);
  } catch (error: any) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

/**
 * DELETE /api/courses/:courseId - Delete a course
 */
router.delete("/:courseId", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)));

    if (!course.length || course[0].userId !== userId) {
      return res.status(404).json({ error: "Course not found" });
    }

    await db
      .delete(courses)
      .where(eq(courses.id, parseInt(courseId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

export default router;

/**
 * GET /api/assignments/all - Get all assignments for the current user across all courses
 */
router.get("/assignments/all", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get all courses for the user
    const userCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, userId));

    const courseIds = userCourses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get all assignments for those courses
    const allAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.courseId, courseIds[0])); // Will be improved with proper SQL

    // Better approach: get assignments for each course
    const assignmentPromises = courseIds.map(courseId =>
      db.select().from(assignments).where(eq(assignments.courseId, courseId))
    );

    const assignmentResults = await Promise.all(assignmentPromises);
    const flatAssignments = assignmentResults.flat();

    res.json(flatAssignments);
  } catch (error) {
    console.error("Error fetching all assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

/**
 * GET /api/quizzes/all - Get all quizzes for the current user across all courses
 */
router.get("/quizzes/all", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get all courses for the user
    const userCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, userId));

    const courseIds = userCourses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get all quizzes for those courses
    const quizPromises = courseIds.map(courseId =>
      db.select().from(quizzes).where(eq(quizzes.courseId, courseId))
    );

    const quizResults = await Promise.all(quizPromises);
    const flatQuizzes = quizResults.flat();

    res.json(flatQuizzes);
  } catch (error) {
    console.error("Error fetching all quizzes:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

/**
 * GET /api/attachments/all - Get all attachments for the current user
 */
router.get("/attachments/all", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const userAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.userId, userId));

    res.json(userAttachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

/**
 * GET /api/attachments/:attachmentId/download - Download an attachment
 */
router.get("/attachments/:attachmentId/download", async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const attachment = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, parseInt(attachmentId)));

    if (!attachment.length || attachment[0].userId !== userId) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // In production, this would serve the file from storage
    res.setHeader('Content-Disposition', `attachment; filename="${attachment[0].fileName}"`);
    res.setHeader('Content-Type', attachment[0].fileType || 'application/octet-stream');
    res.send(attachment[0].filePath);
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res.status(500).json({ error: "Failed to download attachment" });
  }
});
