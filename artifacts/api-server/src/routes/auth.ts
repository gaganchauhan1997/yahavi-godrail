import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  findOrCreateGoogleUser,
} from "../lib/auth";

export const authRouter = Router();

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

function getCallbackBase() {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) return `https://${domains}`;
  return "http://localhost:80";
}

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name: string };
    if (!email || !password || !name) {
      res.status(400).json({ error: "email, password, and name are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      isEmailVerified: false,
    }).returning();
    const sessionToken = await createSession(user.id);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      token: sessionToken,
    });
  } catch (err) {
    req.log.error({ err }, "register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const sessionToken = await createSession(user.id);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      token: sessionToken,
    });
  } catch (err) {
    req.log.error({ err }, "login error");
    res.status(500).json({ error: "Login failed" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.session_token;
  if (token) await deleteSession(token);
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.session_token;
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { getSessionUser } = await import("../lib/auth");
  const user = await getSessionUser(token);
  if (!user) { res.status(401).json({ error: "Session expired" }); return; }
  res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl });
});

authRouter.patch("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.session_token;
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { getSessionUser } = await import("../lib/auth");
  const user = await getSessionUser(token);
  if (!user) { res.status(401).json({ error: "Session expired" }); return; }

  const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string };
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name) updates.name = name;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
  res.json({ id: updated.id, email: updated.email, name: updated.name, avatarUrl: updated.avatarUrl });
});

// ── Google OAuth ─────────────────────────────────────────────────────────────
authRouter.get("/google", (req, res) => {
  const callbackUrl = `${getCallbackBase()}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

authRouter.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query as { code: string };
    if (!code) { res.status(400).send("Missing code"); return; }

    const callbackUrl = `${getCallbackBase()}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json() as { access_token: string; id_token: string };

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json() as { id: string; email: string; name: string; picture: string };

    const user = await findOrCreateGoogleUser({
      googleId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });

    const sessionToken = await createSession(user.id);

    const frontendBase = getCallbackBase();
    res.redirect(`${frontendBase}/?token=${sessionToken}`);
  } catch (err) {
    logger.error({ err }, "Google OAuth callback error");
    res.redirect(`${getCallbackBase()}/?auth_error=google_failed`);
  }
});
