import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Default user (will add Google auth later)
const DEFAULT_USER: User = {
  id: 1,
  openId: "default-user-123",
  name: "Susmi",
  email: "susmi@student-hub.local",
  loginMethod: "local",
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSignedIn: new Date().toISOString(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // For now, always use default user (will add Google auth later)
  return {
    req: opts.req,
    res: opts.res,
    user: DEFAULT_USER,
  };
}