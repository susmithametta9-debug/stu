import { Request, Response, NextFunction } from "express";
import { sdk } from "./sdk";

/**
 * Development authentication middleware
 * In dev mode, creates a mock user if authentication fails
 */
export async function devAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Try real authentication first
    const user = await sdk.authenticateRequest(req);
    (req as any).user = user;
    next();
  } catch (error) {
    // In development, create a mock user
    if (process.env.NODE_ENV === "development") {
      console.log("[DevAuth] Using mock user for development");
      (req as any).user = {
        id: 1,
        openId: "dev-user",
        name: "Dev User",
        email: "dev@student-hub.local",
        role: "user",
      };
      next();
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
}
