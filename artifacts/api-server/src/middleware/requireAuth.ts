import { Request, Response, NextFunction } from "express";
import { getSessionUser } from "../lib/auth";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies?.session_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }

  (req as Request & { user: typeof user }).user = user;
  next();
}
