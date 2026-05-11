import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, socialAccountsTable } from "@workspace/db";
import { eq, gte, and } from "drizzle-orm";
import { GetDashboardOverviewQueryParams } from "@workspace/api-zod";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", async (req, res) => {
  const { workspaceId } = GetDashboardOverviewQueryParams.parse(req.query);
  const now = new Date();

  let allPosts = await db.select().from(postsTable).orderBy(postsTable.createdAt);
  let allAccounts = await db.select().from(socialAccountsTable);

  if (workspaceId) {
    allPosts = allPosts.filter((p) => p.workspaceId === workspaceId);
    allAccounts = allAccounts.filter((a) => a.workspaceId === workspaceId);
  }

  const upcoming = allPosts
    .filter((p) => p.status === "scheduled" && p.scheduledAt && p.scheduledAt > now)
    .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0))
    .slice(0, 5)
    .map(serializePost);

  const topAccounts = allAccounts
    .map((acc) => {
      const accPosts = allPosts.filter((p) =>
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
    })
    .sort((a, b) => b.followersCount - a.followersCount)
    .slice(0, 4);

  res.json({
    totalPosts: allPosts.length,
    scheduledPosts: allPosts.filter((p) => p.status === "scheduled").length,
    publishedPosts: allPosts.filter((p) => p.status === "published").length,
    draftPosts: allPosts.filter((p) => p.status === "draft").length,
    connectedAccounts: allAccounts.length,
    upcomingPosts: upcoming,
    topAccounts,
  });
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
