import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";
import {
  CreatePostBody,
  UpdatePostBody,
  UpdatePostParams,
  DeletePostParams,
  GetPostParams,
  PublishPostParams,
  DuplicatePostParams,
  ListPostsQueryParams,
  GetPostsCalendarQueryParams,
  GetUpcomingPostsQueryParams,
} from "@workspace/api-zod";

export const postsRouter = Router();

postsRouter.get("/calendar", async (req, res) => {
  const { workspaceId, year, month } = GetPostsCalendarQueryParams.parse(req.query);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  let query = db.select().from(postsTable)
    .where(and(gte(postsTable.scheduledAt, start), lt(postsTable.scheduledAt, end)));

  if (workspaceId) {
    query = db.select().from(postsTable).where(
      and(
        eq(postsTable.workspaceId, workspaceId),
        gte(postsTable.scheduledAt, start),
        lt(postsTable.scheduledAt, end)
      )
    );
  }

  const posts = await query;
  const byDate: Record<string, typeof posts> = {};

  for (const post of posts) {
    const d = (post.scheduledAt ?? post.createdAt).toISOString().slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(post);
  }

  const calendarDays = Object.entries(byDate).map(([date, dayPosts]) => ({
    date,
    posts: dayPosts.map(serializePost),
  }));

  res.json(calendarDays);
});

postsRouter.get("/upcoming", async (req, res) => {
  const { workspaceId, limit = 10 } = GetUpcomingPostsQueryParams.parse(req.query);
  const now = new Date();
  const rows = await db.select().from(postsTable).where(
    workspaceId
      ? and(eq(postsTable.workspaceId, workspaceId), eq(postsTable.status, "scheduled"), gte(postsTable.scheduledAt, now))
      : and(eq(postsTable.status, "scheduled"), gte(postsTable.scheduledAt, now))
  ).limit(limit);
  res.json(rows.map(serializePost));
});

postsRouter.get("/", async (req, res) => {
  const { workspaceId, status, accountId, labelId } = ListPostsQueryParams.parse(req.query);
  let rows = await db.select().from(postsTable).orderBy(postsTable.createdAt);
  if (workspaceId) rows = rows.filter((p) => p.workspaceId === workspaceId);
  if (status) rows = rows.filter((p) => p.status === status);
  if (accountId) rows = rows.filter((p) => p.accountIds.split(",").map(Number).includes(accountId));
  if (labelId) rows = rows.filter((p) => p.labelIds.split(",").map(Number).includes(labelId));
  res.json(rows.map(serializePost));
});

postsRouter.post("/", async (req, res) => {
  const body = CreatePostBody.parse(req.body);
  const values = {
    workspaceId: body.workspaceId,
    content: body.content,
    status: body.status ?? "draft",
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    accountIds: (body.accountIds ?? []).join(","),
    mediaUrls: (body.mediaUrls ?? []).join(","),
    labelIds: (body.labelIds ?? []).join(","),
  };
  const [row] = await db.insert(postsTable).values(values).returning();
  res.status(201).json(serializePost(row));
});

postsRouter.get("/:id", async (req, res) => {
  const { id } = GetPostParams.parse({ id: Number(req.params.id) });
  const [row] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!row) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(serializePost(row));
});

postsRouter.patch("/:id", async (req, res) => {
  const { id } = UpdatePostParams.parse({ id: Number(req.params.id) });
  const body = UpdatePostBody.parse(req.body);
  const values: Record<string, unknown> = {};
  if (body.content !== undefined) values.content = body.content;
  if (body.status !== undefined) values.status = body.status;
  if (body.scheduledAt !== undefined) values.scheduledAt = new Date(body.scheduledAt);
  if (body.accountIds !== undefined) values.accountIds = body.accountIds.join(",");
  if (body.mediaUrls !== undefined) values.mediaUrls = body.mediaUrls.join(",");
  if (body.labelIds !== undefined) values.labelIds = body.labelIds.join(",");
  const [row] = await db.update(postsTable).set(values).where(eq(postsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(serializePost(row));
});

postsRouter.delete("/:id", async (req, res) => {
  const { id } = DeletePostParams.parse({ id: Number(req.params.id) });
  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.status(204).send();
});

postsRouter.post("/:id/publish", async (req, res) => {
  const { id } = PublishPostParams.parse({ id: Number(req.params.id) });
  const [row] = await db.update(postsTable)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(postsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(serializePost(row));
});

postsRouter.post("/:id/duplicate", async (req, res) => {
  const { id } = DuplicatePostParams.parse({ id: Number(req.params.id) });
  const [original] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!original) { res.status(404).json({ error: "Post not found" }); return; }
  const [copy] = await db.insert(postsTable).values({
    workspaceId: original.workspaceId,
    content: original.content,
    status: "draft",
    accountIds: original.accountIds,
    mediaUrls: original.mediaUrls,
    labelIds: original.labelIds,
  }).returning();
  res.status(201).json(serializePost(copy));
});

function serializePost(p: typeof postsTable.$inferSelect) {
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    content: p.content,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    accountIds: p.accountIds ? p.accountIds.split(",").map(Number).filter(Boolean) : [],
    mediaUrls: p.mediaUrls ? p.mediaUrls.split(",").filter(Boolean) : [],
    labelIds: p.labelIds ? p.labelIds.split(",").map(Number).filter(Boolean) : [],
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    reach: p.reach,
    createdAt: p.createdAt.toISOString(),
  };
}
