import { Router, Request, Response } from "express";
import { getDb } from "../db";
import {
  courses,
  attachments,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import multer from "multer";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const router = Router();

/**
 * GET /api/files/all - Get all files for the current user across all courses
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

    // Get all files for the user
    const userFiles = await db
      .select({
        id: attachments.id,
        courseId: attachments.courseId,
        assignmentId: attachments.assignmentId,
        quizId: attachments.quizId,
        fileName: attachments.fileName,
        fileSize: attachments.fileSize,
        fileType: attachments.fileType,
        filePath: attachments.filePath,
        uploadedAt: attachments.uploadedAt,
        courseName: courses.title,
      })
      .from(attachments)
      .leftJoin(courses, eq(attachments.courseId, courses.id))
      .where(eq(attachments.userId, userId));

    res.json(userFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

/**
 * GET /api/files/:fileId/download - Download a specific file
 */
router.get("/:fileId/download", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the file and verify ownership
    const file = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, parseInt(fileId)))
      .limit(1);

    if (file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    if (file[0].userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const fileData = file[0];

    // Set appropriate headers for file download
    res.setHeader("Content-Type", `application/${fileData.fileType}`);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileData.fileName}"`
    );
    res.setHeader("Content-Length", fileData.fileSize || 0);

    // Send file data
    if (fileData.fileData) {
      res.send(fileData.fileData);
    } else {
      res.status(404).json({ error: "File data not found" });
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

/**
 * GET /api/files/:fileId/preview - Preview a file (for images and PDFs)
 */
router.get("/:fileId/preview", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the file and verify ownership
    const file = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, parseInt(fileId)))
      .limit(1);

    if (file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    if (file[0].userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const fileData = file[0];

    // Set appropriate headers for inline display
    let contentType = fileData.fileType || "application/octet-stream";
    // Fix content type if it's just the extension
    if (contentType === "pdf") contentType = "application/pdf";
    if (contentType === "png") contentType = "image/png";
    if (contentType === "jpg" || contentType === "jpeg") contentType = "image/jpeg";
    if (contentType === "gif") contentType = "image/gif";
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileData.fileName}"`
    );
    if (fileData.fileSize) {
      res.setHeader("Content-Length", fileData.fileSize);
    }

    // Send file data
    if (fileData.fileData) {
      res.send(fileData.fileData);
    } else {
      res.status(404).json({ error: "File data not found" });
    }
  } catch (error) {
    console.error("Error previewing file:", error);
    res.status(500).json({ error: "Failed to preview file" });
  }
});

/**
 * DELETE /api/files/:fileId - Delete a file
 */
router.delete("/:fileId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the file and verify ownership
    const file = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, parseInt(fileId)))
      .limit(1);

    if (file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    if (file[0].userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db.delete(attachments).where(eq(attachments.id, parseInt(fileId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

/**
 * POST /api/files/upload - Upload a file
 */
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { courseId } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Store file data as BLOB
    const fileData = req.file.buffer;

    const now = new Date().toISOString();
    const fileRecord = {
      userId,
      courseId: courseId ? parseInt(courseId) : null,
      assignmentId: null,
      quizId: null,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      filePath: `/uploads/${req.file.originalname}`,
      fileData,
      uploadedAt: now,
    };

    const result = await db.insert(attachments).values(fileRecord).returning();

    res.json(result[0]);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
