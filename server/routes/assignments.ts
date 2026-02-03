import { Router, Request, Response } from "express";
import { getDb } from "../db";
import {
  courses,
  assignments,
  InsertAssignment,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/assignments/all - Get all assignments for the current user across all courses
 */
router.get("/all", async (req: Request, res: Response) => {
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
 * POST /api/assignments - Create a new assignment
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

    const { courseId, title, description, dueDate, pointsPossible } = req.body;

    // Verify the course belongs to the user
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0 || course[0].userId !== userId) {
      return res.status(403).json({ error: "Course not found or access denied" });
    }

    const now = new Date().toISOString();
    const newAssignment: InsertAssignment = {
      courseId,
      title,
      description: description || null,
      dueDate: dueDate || null,
      pointsPossible: pointsPossible || null,
      submissionType: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(assignments).values(newAssignment).returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

/**
 * PUT /api/assignments/:assignmentId - Update an assignment
 */
router.put("/:assignmentId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { assignmentId } = req.params;
    const { title, description, dueDate, pointsPossible } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the assignment and verify ownership through course
    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, parseInt(assignmentId)))
      .limit(1);

    if (assignment.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, assignment[0].courseId))
      .limit(1);

    if (course.length === 0 || course[0].userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await db
      .update(assignments)
      .set({
        title,
        description: description || null,
        dueDate: dueDate || null,
        pointsPossible: pointsPossible || null,
      })
      .where(eq(assignments.id, parseInt(assignmentId)))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

/**
 * DELETE /api/assignments/:assignmentId - Delete an assignment
 */
router.delete("/:assignmentId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { assignmentId } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the assignment and verify ownership through course
    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, parseInt(assignmentId)))
      .limit(1);

    if (assignment.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, assignment[0].courseId))
      .limit(1);

    if (course.length === 0 || course[0].userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db.delete(assignments).where(eq(assignments.id, parseInt(assignmentId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

/**
 * POST /api/assignments/parse - Parse Canvas text and create assignments
 */
router.post("/parse", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { courseId, text } = req.body;

    if (!courseId || !text) {
      return res.status(400).json({ error: "Course ID and text are required" });
    }

    // Verify the course belongs to the user
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0 || course[0].userId !== userId) {
      return res.status(403).json({ error: "Course not found or access denied" });
    }

    // Import the parser
    const { parseCanvasAssignmentText } = await import("../utils/canvasTextParser");
    const parsedAssignments = parseCanvasAssignmentText(text);

    if (parsedAssignments.length === 0) {
      return res.status(400).json({ error: "No assignments found in text" });
    }

    const createdAssignments = [];
    const now = new Date().toISOString();

    for (const parsed of parsedAssignments) {
      const assignmentData: InsertAssignment = {
        courseId: parseInt(courseId),
        title: parsed.title,
        description: null,
        dueDate: parsed.dueDate,
        pointsPossible: parsed.points,
        submissionType: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.insert(assignments).values(assignmentData).returning();
      createdAssignments.push(result[0]);
    }

    res.json({ 
      count: createdAssignments.length,
      assignments: createdAssignments 
    });
  } catch (error: any) {
    console.error("Error parsing assignments:", error);
    res.status(500).json({ error: "Failed to parse assignments" });
  }
});

export default router;
