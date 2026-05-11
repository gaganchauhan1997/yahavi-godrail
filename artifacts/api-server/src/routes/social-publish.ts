import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable, postsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const socialPublishRouter = Router();

// Platform-specific publish functions
async function publishToTwitter(account: typeof socialAccountsTable.$inferSelect, content: string, mediaUrls: string[]) {
  if (!account.accessToken) throw new Error("No Twitter access token");
  const body: Record<string, unknown> = { text: content.slice(0, 280) };
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter API error: ${err}`);
  }
  return await res.json();
}

async function publishToLinkedIn(account: typeof socialAccountsTable.$inferSelect, content: string) {
  if (!account.accessToken) throw new Error("No LinkedIn access token");
  const body = {
    author: `urn:li:person:${account.platformUserId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn API error: ${err}`);
  }
  return await res.json();
}

async function publishToFacebook(account: typeof socialAccountsTable.$inferSelect, content: string) {
  if (!account.accessToken) throw new Error("No Facebook access token");
  const url = `https://graph.facebook.com/v19.0/${account.platformUserId}/feed`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content, access_token: account.accessToken }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook API error: ${err}`);
  }
  return await res.json();
}

async function publishToInstagram(account: typeof socialAccountsTable.$inferSelect, content: string, mediaUrls: string[]) {
  if (!account.accessToken) throw new Error("No Instagram access token");
  // Instagram requires a media URL for posts; use first image or text-only (caption only for Reels/Stories)
  const imageUrl = mediaUrls[0];
  if (!imageUrl) throw new Error("Instagram requires at least one image");

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${account.platformUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption: content, access_token: account.accessToken }),
    }
  );
  const container = await containerRes.json() as { id: string };
  if (!container.id) throw new Error("Instagram container creation failed");

  // Step 2: Publish container
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${account.platformUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: account.accessToken }),
    }
  );
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish error: ${err}`);
  }
  return await publishRes.json();
}

async function publishToPinterest(account: typeof socialAccountsTable.$inferSelect, content: string, mediaUrls: string[]) {
  if (!account.accessToken) throw new Error("No Pinterest access token");
  const imageUrl = mediaUrls[0];
  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: content.slice(0, 100),
      description: content,
      board_id: account.platformUserId,
      media_source: imageUrl ? { source_type: "image_url", url: imageUrl } : undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinterest API error: ${err}`);
  }
  return await res.json();
}

// Main publish endpoint — publishes a post to all connected accounts
socialPublishRouter.post("/:id/publish-real", async (req, res) => {
  const postId = Number(req.params.id);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }

  const accountIds = post.accountIds ? post.accountIds.split(",").map(Number).filter(Boolean) : [];
  const mediaUrls = post.mediaUrls ? post.mediaUrls.split(",").filter(Boolean) : [];

  if (accountIds.length === 0) {
    res.status(400).json({ error: "No accounts selected for this post" });
    return;
  }

  const results: Array<{ accountId: number; platform: string; success: boolean; error?: string }> = [];
  let anySuccess = false;

  for (const accountId of accountIds) {
    const [account] = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.id, accountId));
    if (!account) {
      results.push({ accountId, platform: "unknown", success: false, error: "Account not found" });
      continue;
    }

    try {
      switch (account.platform) {
        case "twitter": await publishToTwitter(account, post.content, mediaUrls); break;
        case "linkedin": await publishToLinkedIn(account, post.content); break;
        case "facebook": await publishToFacebook(account, post.content); break;
        case "instagram": await publishToInstagram(account, post.content, mediaUrls); break;
        case "pinterest": await publishToPinterest(account, post.content, mediaUrls); break;
        default:
          throw new Error(`Platform ${account.platform} publishing not yet configured`);
      }
      results.push({ accountId, platform: account.platform, success: true });
      anySuccess = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ accountId, platform: account.platform, success: false, error: msg });
    }
  }

  const newStatus = anySuccess ? "published" : "failed";
  const [updated] = await db.update(postsTable)
    .set({ status: newStatus, publishedAt: anySuccess ? new Date() : null })
    .where(eq(postsTable.id, postId))
    .returning();

  res.json({ post: updated, results });
});
