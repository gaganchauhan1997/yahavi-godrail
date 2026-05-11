import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable, postsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateAccountBody,
  GetAccountParams,
  DeleteAccountParams,
  ListAccountsQueryParams,
} from "@workspace/api-zod";

export const accountsRouter = Router();

accountsRouter.get("/summary", async (_req, res) => {
  const accounts = await db.select().from(socialAccountsTable);
  const posts = await db.select().from(postsTable);

  const summary = accounts.map((acc) => {
    const accPosts = posts.filter((p) =>
      p.accountIds.split(",").map(Number).includes(acc.id)
    );
    return {
      accountId: acc.id,
      platform: acc.platform,
      username: acc.username,
      avatarUrl: acc.avatarUrl ?? null,
      followersCount: acc.followersCount,
      totalPosts: accPosts.length,
      scheduledPosts: accPosts.filter((p) => p.status === "scheduled").length,
      publishedPosts: accPosts.filter((p) => p.status === "published").length,
    };
  });

  res.json(summary);
});

accountsRouter.get("/", async (req, res) => {
  const { workspaceId } = ListAccountsQueryParams.parse(req.query);
  const rows = workspaceId
    ? await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.workspaceId, workspaceId))
    : await db.select().from(socialAccountsTable);
  res.json(rows.map(serializeAccount));
});

accountsRouter.post("/", async (req, res) => {
  const body = CreateAccountBody.parse(req.body);
  const [row] = await db.insert(socialAccountsTable).values(body).returning();
  res.status(201).json(serializeAccount(row));
});

accountsRouter.get("/:id", async (req, res) => {
  const { id } = GetAccountParams.parse({ id: Number(req.params.id) });
  const [row] = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.id, id));
  if (!row) { res.status(404).json({ error: "Account not found" }); return; }
  res.json(serializeAccount(row));
});

accountsRouter.delete("/:id", async (req, res) => {
  const { id } = DeleteAccountParams.parse({ id: Number(req.params.id) });
  await db.delete(socialAccountsTable).where(eq(socialAccountsTable.id, id));
  res.status(204).send();
});

function serializeAccount(a: typeof socialAccountsTable.$inferSelect) {
  return {
    id: a.id,
    workspaceId: a.workspaceId,
    platform: a.platform,
    username: a.username,
    displayName: a.displayName,
    avatarUrl: a.avatarUrl ?? null,
    followersCount: a.followersCount,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
  };
}
