import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { todos, InsertTodo } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/todos - Get all todos for the current user
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

    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId));

    res.json(userTodos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

/**
 * POST /api/todos - Create a new todo
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

    const { title, description, dueDate, priority, category, courseId } =
      req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const todoData: InsertTodo = {
      userId,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "medium",
      category,
      courseId,
      isCompleted: 0,
    };

    const result = await db.insert(todos).values(todoData);

    res.json({
      id: result[0].insertId,
      ...todoData,
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

/**
 * PUT /api/todos/:todoId - Update a todo
 */
router.put("/:todoId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { todoId } = req.params;
    const { title, description, dueDate, priority, isCompleted, category } =
      req.body;

    // Verify todo belongs to user
    const todo = await db
      .select()
      .from(todos)
      .where(eq(todos.id, parseInt(todoId)));

    if (!todo.length || todo[0].userId !== userId) {
      return res.status(404).json({ error: "Todo not found" });
    }

    await db
      .update(todos)
      .set({
        title: title || todo[0].title,
        description: description !== undefined ? description : todo[0].description,
        dueDate: dueDate ? new Date(dueDate) : todo[0].dueDate,
        priority: priority || todo[0].priority,
        isCompleted: isCompleted !== undefined ? isCompleted : todo[0].isCompleted,
        category: category !== undefined ? category : todo[0].category,
      })
      .where(eq(todos.id, parseInt(todoId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

/**
 * DELETE /api/todos/:todoId - Delete a todo
 */
router.delete("/:todoId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { todoId } = req.params;

    // Verify todo belongs to user
    const todo = await db
      .select()
      .from(todos)
      .where(eq(todos.id, parseInt(todoId)));

    if (!todo.length || todo[0].userId !== userId) {
      return res.status(404).json({ error: "Todo not found" });
    }

    await db.delete(todos).where(eq(todos.id, parseInt(todoId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

export default router;
