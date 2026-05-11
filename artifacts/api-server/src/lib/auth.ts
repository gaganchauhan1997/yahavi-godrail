import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(sessionsTable).values({ id, userId, expiresAt });
  return id;
}

export async function getSessionUser(sessionId: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session || session.expiresAt < new Date()) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  return user ?? null;
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}

export async function findOrCreateGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.googleId, profile.googleId));
  if (existing) return existing;

  const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, profile.email));
  if (byEmail) {
    const [updated] = await db.update(usersTable)
      .set({ googleId: profile.googleId, avatarUrl: profile.avatarUrl, isEmailVerified: true })
      .where(eq(usersTable.id, byEmail.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(usersTable).values({
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    googleId: profile.googleId,
    isEmailVerified: true,
  }).returning();
  return created;
}
