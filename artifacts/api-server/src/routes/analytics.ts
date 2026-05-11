import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, socialAccountsTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import { GetAnalyticsSummaryQueryParams, GetTopPostsQueryParams } from "@workspace/api-zod";

export const analyticsRouter = Router();

analyticsRouter.get("/summary", async (req, res) => {
  const { workspaceId, period = "30d" } = GetAnalyticsSummaryQueryParams.parse(req.query);
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 86400000);

  let posts = await db.select().from(postsTable).where(gte(postsTable.createdAt, since));
  if (workspaceId) posts = posts.filter((p) => p.workspaceId === workspaceId);

  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments, 0);
  const totalShares = posts.reduce((s, p) => s + p.shares, 0);
  const totalReach = posts.reduce((s, p) => s + p.reach, 0);

  // Build time series (posts per day)
  const byDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10);
    byDay[d] = 0;
  }
  for (const p of posts) {
    const d = p.createdAt.toISOString().slice(0, 10);
    if (byDay[d] !== undefined) byDay[d]++;
  }
  const postsOverTime = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  res.json({
    totalPosts: posts.length,
    scheduledPosts: posts.filter((p) => p.status === "scheduled").length,
    publishedPosts: posts.filter((p) => p.status === "published").length,
    totalLikes,
    totalComments,
    totalShares,
    totalReach,
    postsOverTime,
  });
});

analyticsRouter.get("/top-posts", async (req, res) => {
  const { workspaceId, limit = 5 } = GetTopPostsQueryParams.parse(req.query);
  let posts = await db.select().from(postsTable).where(eq(postsTable.status, "published"));
  if (workspaceId) posts = posts.filter((p) => p.workspaceId === workspaceId);

  const accounts = await db.select().from(socialAccountsTable);

  const topPosts = posts
    .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
    .slice(0, limit)
    .map((p) => {
      const accountIdList = p.accountIds.split(",").map(Number).filter(Boolean);
      const account = accounts.find((a) => accountIdList.includes(a.id));
      return {
        id: p.id,
        content: p.content,
        platform: account?.platform ?? "unknown",
        avatarUrl: account?.avatarUrl ?? null,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        reach: p.reach,
        publishedAt: p.publishedAt?.toISOString() ?? p.createdAt.toISOString(),
      };
    });

  res.json(topPosts);
});
