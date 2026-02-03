import { Router, Request, Response } from "express";
import { getDb } from "../db";
import {
  notebooks,
  notes,
  InsertNotebook,
  InsertNote,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

/**
 * GET /api/notes/all - Get all notes for the current user
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

    // Get all notebooks for the user
    const userNotebooks = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.userId, userId));

    const notebookIds = userNotebooks.map(n => n.id);

    if (notebookIds.length === 0) {
      return res.json([]);
    }

    // Get all notes for those notebooks
    const notePromises = notebookIds.map(notebookId =>
      db.select().from(notes).where(eq(notes.notebookId, notebookId))
    );

    const noteResults = await Promise.all(notePromises);
    const flatNotes = noteResults.flat();

    res.json(flatNotes);
  } catch (error) {
    console.error("Error fetching all notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

/**
 * GET /api/notes/notebooks - Get all notebooks for the current user
 */
router.get("/notebooks", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const userNotebooks = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.userId, userId));

    res.json(userNotebooks);
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    res.status(500).json({ error: "Failed to fetch notebooks" });
  }
});

/**
 * POST /api/notes/notebooks - Create a new notebook
 */
router.post("/notebooks", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { title, description, color } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const now = new Date().toISOString();
    const notebookData: InsertNotebook = {
      userId,
      title,
      description,
      color: color || "#4F46E5",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(notebooks).values(notebookData).returning();

    res.json(result[0]);
  } catch (error) {
    console.error("Error creating notebook:", error);
    res.status(500).json({ error: "Failed to create notebook" });
  }
});

/**
 * GET /api/notes/notebooks/:notebookId/notes - Get all notes in a notebook
 */
router.get("/notebooks/:notebookId/notes", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { notebookId } = req.params;

    // Verify notebook belongs to user
    const notebook = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.id, parseInt(notebookId)));

    if (!notebook.length || notebook[0].userId !== userId) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    const notebookNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.notebookId, parseInt(notebookId)));

    res.json(notebookNotes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

/**
 * POST /api/notes/notebooks/:notebookId/notes - Create a new note
 */
router.post("/notebooks/:notebookId/notes", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { notebookId } = req.params;
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Verify notebook belongs to user
    const notebook = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.id, parseInt(notebookId)));

    if (!notebook.length || notebook[0].userId !== userId) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    const noteData: InsertNote = {
      notebookId: parseInt(notebookId),
      title,
      content,
      isPinned: 0,
    };

    const result = await db.insert(notes).values(noteData);

    res.json({
      id: result[0].insertId,
      ...noteData,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

/**
 * PUT /api/notes/notes/:noteId - Update a note
 */
router.put("/notes/:noteId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { noteId } = req.params;
    const { title, content, isPinned } = req.body;

    // Verify note belongs to user's notebook
    const note = await db
      .select()
      .from(notes)
      .where(eq(notes.id, parseInt(noteId)));

    if (!note.length) {
      return res.status(404).json({ error: "Note not found" });
    }

    const notebook = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.id, note[0].notebookId));

    if (!notebook.length || notebook[0].userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db
      .update(notes)
      .set({
        title: title || note[0].title,
        content: content !== undefined ? content : note[0].content,
        isPinned: isPinned !== undefined ? isPinned : note[0].isPinned,
      })
      .where(eq(notes.id, parseInt(noteId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

/**
 * DELETE /api/notes/notes/:noteId - Delete a note
 */
router.delete("/notes/:noteId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { noteId } = req.params;

    // Verify note belongs to user's notebook
    const note = await db
      .select()
      .from(notes)
      .where(eq(notes.id, parseInt(noteId)));

    if (!note.length) {
      return res.status(404).json({ error: "Note not found" });
    }

    const notebook = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.id, note[0].notebookId));

    if (!notebook.length || notebook[0].userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.delete(notes).where(eq(notes.id, parseInt(noteId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

/**
 * DELETE /api/notes/notebooks/:notebookId - Delete a notebook and all its notes
 */
router.delete("/notebooks/:notebookId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { notebookId } = req.params;

    // Verify notebook belongs to user
    const notebook = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.id, parseInt(notebookId)));

    if (!notebook.length) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    if (notebook[0].userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete all notes in the notebook first
    await db.delete(notes).where(eq(notes.notebookId, parseInt(notebookId)));

    // Delete the notebook
    await db.delete(notebooks).where(eq(notebooks.id, parseInt(notebookId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notebook:", error);
    res.status(500).json({ error: "Failed to delete notebook" });
  }
});

export default router;
