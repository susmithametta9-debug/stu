import { Router, Request, Response } from "express";
import { getDb } from "../db";
import {
  courses,
  quizzes,
  InsertQuiz,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/quizzes/all - Get all quizzes for the current user across all courses
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
 * POST /api/quizzes - Create a new quiz
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

    const newQuiz: InsertQuiz = {
      courseId,
      title,
      description: description || null,
      dueDate: dueDate || null,
      pointsPossible: pointsPossible || null,
    };

    const result = await db.insert(quizzes).values(newQuiz).returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

/**
 * PUT /api/quizzes/:quizId - Update a quiz
 */
router.put("/:quizId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { quizId } = req.params;
    const { title, description, dueDate, pointsPossible } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the quiz and verify ownership through course
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, parseInt(quizId)))
      .limit(1);

    if (quiz.length === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, quiz[0].courseId))
      .limit(1);

    if (course.length === 0 || course[0].userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await db
      .update(quizzes)
      .set({
        title,
        description: description || null,
        dueDate: dueDate || null,
        pointsPossible: pointsPossible || null,
      })
      .where(eq(quizzes.id, parseInt(quizId)))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

/**
 * DELETE /api/quizzes/:quizId - Delete a quiz
 */
router.delete("/:quizId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { quizId } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the quiz and verify ownership through course
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, parseInt(quizId)))
      .limit(1);

    if (quiz.length === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, quiz[0].courseId))
      .limit(1);

    if (course.length === 0 || course[0].userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db.delete(quizzes).where(eq(quizzes.id, parseInt(quizId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

export default router;
