import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { authMiddleware } from "./authMiddleware";
import { devAuthMiddleware } from "./devAuthMiddleware";
import coursesRouter from "../routes/courses";
import assignmentsRouter from "../routes/assignments";
import quizzesRouter from "../routes/quizzes";
import filesRouter from "../routes/files";
import notesRouter from "../routes/notes";
import todosRouter from "../routes/todos";
import chatRouter from "../routes/chat";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // REST API routes with authentication
  // Use dev auth middleware in development for easier testing
  const auth = process.env.NODE_ENV === "development" ? devAuthMiddleware : authMiddleware;
  app.use("/api/courses", auth, coursesRouter);
  app.use("/api/assignments", auth, assignmentsRouter);
  app.use("/api/quizzes", auth, quizzesRouter);
  app.use("/api/files", auth, filesRouter);
  app.use("/api/notes", auth, notesRouter);
  app.use("/api/todos", auth, todosRouter);
  app.use("/api/chat", auth, chatRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
