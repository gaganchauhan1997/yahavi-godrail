import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export const oauthConnectRouter = Router();

const BASE = () => {
  const d = process.env.REPLIT_DOMAINS?.split(",")[0];
  return d ? `https://${d}` : "http://localhost:80";
};

// ── Twitter/X OAuth 2.0 PKCE ─────────────────────────────────────────────────
oauthConnectRouter.get("/twitter/connect", (req, res) => {
  const workspaceId = req.query.workspaceId ?? "1";
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) { res.status(400).json({ error: "TWITTER_CLIENT_ID not configured" }); return; }
  const state = `twitter:${workspaceId}:${Date.now()}`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${BASE()}/api/oauth/twitter/callback`,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: "challenge",
    code_challenge_method: "plain",
  });
  res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
});

oauthConnectRouter.get("/twitter/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const [, workspaceId] = state.split(":");
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${BASE()}/api/oauth/twitter/callback`,
        code_verifier: "challenge",
      }),
    });
    const tokens = await tokenRes.json() as { access_token: string; refresh_token: string };

    const profileRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const { data: profile } = await profileRes.json() as { data: { id: string; name: string; username: string } };

    await db.insert(socialAccountsTable).values({
      workspaceId: Number(workspaceId),
      platform: "twitter",
      platformUserId: profile.id,
      username: `@${profile.username}`,
      displayName: profile.name,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isActive: true,
      followersCount: 0,
    }).onConflictDoNothing();

    res.redirect(`${BASE()}/accounts?connected=twitter`);
  } catch (err) {
    logger.error({ err }, "Twitter OAuth callback error");
    res.redirect(`${BASE()}/accounts?error=twitter_failed`);
  }
});

// ── LinkedIn OAuth 2.0 ───────────────────────────────────────────────────────
oauthConnectRouter.get("/linkedin/connect", (req, res) => {
  const workspaceId = req.query.workspaceId ?? "1";
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) { res.status(400).json({ error: "LINKEDIN_CLIENT_ID not configured" }); return; }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${BASE()}/api/oauth/linkedin/callback`,
    state: `linkedin:${workspaceId}`,
    scope: "openid profile email w_member_social",
  });
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

oauthConnectRouter.get("/linkedin/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const [, workspaceId] = state.split(":");
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${BASE()}/api/oauth/linkedin/callback`,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const tokens = await tokenRes.json() as { access_token: string };

    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json() as { sub: string; name: string; email: string; picture?: string };

    await db.insert(socialAccountsTable).values({
      workspaceId: Number(workspaceId),
      platform: "linkedin",
      platformUserId: profile.sub,
      username: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
      accessToken: tokens.access_token,
      isActive: true,
      followersCount: 0,
    }).onConflictDoNothing();

    res.redirect(`${BASE()}/accounts?connected=linkedin`);
  } catch (err) {
    logger.error({ err }, "LinkedIn OAuth callback error");
    res.redirect(`${BASE()}/accounts?error=linkedin_failed`);
  }
});

// ── Facebook / Instagram OAuth ───────────────────────────────────────────────
oauthConnectRouter.get("/facebook/connect", (req, res) => {
  const workspaceId = req.query.workspaceId ?? "1";
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) { res.status(400).json({ error: "FACEBOOK_APP_ID not configured" }); return; }
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${BASE()}/api/oauth/facebook/callback`,
    state: `facebook:${workspaceId}`,
    scope: "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,public_profile,email",
  });
  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
});

oauthConnectRouter.get("/facebook/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const [, workspaceId] = state.split(":");
    const appId = process.env.FACEBOOK_APP_ID!;
    const appSecret = process.env.FACEBOOK_APP_SECRET!;

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(`${BASE()}/api/oauth/facebook/callback`)}&client_secret=${appSecret}&code=${code}`
    );
    const tokens = await tokenRes.json() as { access_token: string };

    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email,picture&access_token=${tokens.access_token}`);
    const me = await meRes.json() as { id: string; name: string; email: string; picture?: { data?: { url?: string } } };

    await db.insert(socialAccountsTable).values({
      workspaceId: Number(workspaceId),
      platform: "facebook",
      platformUserId: me.id,
      username: me.email || me.name,
      displayName: me.name,
      avatarUrl: me.picture?.data?.url,
      accessToken: tokens.access_token,
      isActive: true,
      followersCount: 0,
    }).onConflictDoNothing();

    res.redirect(`${BASE()}/accounts?connected=facebook`);
  } catch (err) {
    logger.error({ err }, "Facebook OAuth callback error");
    res.redirect(`${BASE()}/accounts?error=facebook_failed`);
  }
});

// ── Pinterest OAuth ───────────────────────────────────────────────────────────
oauthConnectRouter.get("/pinterest/connect", (req, res) => {
  const workspaceId = req.query.workspaceId ?? "1";
  const clientId = process.env.PINTEREST_APP_ID;
  if (!clientId) { res.status(400).json({ error: "PINTEREST_APP_ID not configured" }); return; }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${BASE()}/api/oauth/pinterest/callback`,
    response_type: "code",
    scope: "boards:read,pins:read,pins:write",
    state: `pinterest:${workspaceId}`,
  });
  res.redirect(`https://www.pinterest.com/oauth/?${params}`);
});

oauthConnectRouter.get("/pinterest/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const [, workspaceId] = state.split(":");
    const clientId = process.env.PINTEREST_APP_ID!;
    const clientSecret = process.env.PINTEREST_APP_SECRET!;

    const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: `${BASE()}/api/oauth/pinterest/callback` }),
    });
    const tokens = await tokenRes.json() as { access_token: string };

    const profileRes = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json() as { username: string; profile_image?: string };

    await db.insert(socialAccountsTable).values({
      workspaceId: Number(workspaceId),
      platform: "pinterest",
      username: profile.username,
      displayName: profile.username,
      avatarUrl: profile.profile_image,
      accessToken: tokens.access_token,
      isActive: true,
      followersCount: 0,
    }).onConflictDoNothing();

    res.redirect(`${BASE()}/accounts?connected=pinterest`);
  } catch (err) {
    logger.error({ err }, "Pinterest OAuth callback error");
    res.redirect(`${BASE()}/accounts?error=pinterest_failed`);
  }
});

// ── TikTok OAuth ─────────────────────────────────────────────────────────────
oauthConnectRouter.get("/tiktok/connect", (req, res) => {
  const workspaceId = req.query.workspaceId ?? "1";
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) { res.status(400).json({ error: "TIKTOK_CLIENT_KEY not configured" }); return; }
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: `${BASE()}/api/oauth/tiktok/callback`,
    response_type: "code",
    scope: "user.info.basic,video.publish",
    state: `tiktok:${workspaceId}`,
  });
  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params}`);
});

oauthConnectRouter.get("/tiktok/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const [, workspaceId] = state.split(":");
    const clientKey = process.env.TIKTOK_CLIENT_KEY!;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${BASE()}/api/oauth/tiktok/callback`,
      }),
    });
    const tokens = await tokenRes.json() as { access_token: string; open_id: string };

    const profileRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const { data } = await profileRes.json() as { data: { user: { open_id: string; display_name: string; avatar_url: string } } };

    await db.insert(socialAccountsTable).values({
      workspaceId: Number(workspaceId),
      platform: "tiktok",
      platformUserId: data.user.open_id,
      username: data.user.display_name,
      displayName: data.user.display_name,
      avatarUrl: data.user.avatar_url,
      accessToken: tokens.access_token,
      isActive: true,
      followersCount: 0,
    }).onConflictDoNothing();

    res.redirect(`${BASE()}/accounts?connected=tiktok`);
  } catch (err) {
    logger.error({ err }, "TikTok OAuth callback error");
    res.redirect(`${BASE()}/accounts?error=tiktok_failed`);
  }
});

// ── YouTube OAuth ─────────────────────────────────────────────────────────────
oauthConnectRouter.get("/youtube/connect", (req, res) => {
  const workspaceId = req.query.workspaceId ?? "1";
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) { res.status(400).json({ error: "VITE_GOOGLE_CLIENT_ID not configured" }); return; }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${BASE()}/api/oauth/youtube/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    access_type: "offline",
    state: `youtube:${workspaceId}`,
    prompt: "consent",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

oauthConnectRouter.get("/youtube/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const [, workspaceId] = state.split(":");
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${BASE()}/api/oauth/youtube/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json() as { access_token: string; refresh_token: string };

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const channelData = await channelRes.json() as { items: Array<{ id: string; snippet: { title: string; thumbnails?: { default?: { url?: string } } } }> };
    const channel = channelData.items?.[0];

    await db.insert(socialAccountsTable).values({
      workspaceId: Number(workspaceId),
      platform: "youtube",
      platformUserId: channel?.id,
      username: channel?.snippet?.title ?? "YouTube Channel",
      displayName: channel?.snippet?.title ?? "YouTube Channel",
      avatarUrl: channel?.snippet?.thumbnails?.default?.url,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isActive: true,
      followersCount: 0,
    }).onConflictDoNothing();

    res.redirect(`${BASE()}/accounts?connected=youtube`);
  } catch (err) {
    logger.error({ err }, "YouTube OAuth callback error");
    res.redirect(`${BASE()}/accounts?error=youtube_failed`);
  }
});

// ── Disconnect ────────────────────────────────────────────────────────────────
oauthConnectRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(socialAccountsTable).set({ isActive: false, accessToken: null, refreshToken: null }).where(eq(socialAccountsTable.id, id));
  res.json({ ok: true });
});
