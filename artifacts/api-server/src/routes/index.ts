import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { workspacesRouter } from "./workspaces";
import { accountsRouter } from "./accounts";
import { postsRouter } from "./posts";
import { mediaRouter } from "./media";
import { labelsRouter } from "./labels";
import { analyticsRouter } from "./analytics";
import { dashboardRouter } from "./dashboard";
import { authRouter } from "./auth";
import { oauthConnectRouter } from "./oauth-connect";
import { socialPublishRouter } from "./social-publish";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/oauth", oauthConnectRouter);
router.use("/workspaces", workspacesRouter);
router.use("/accounts", accountsRouter);
router.use("/posts", postsRouter);
router.use("/posts", socialPublishRouter);
router.use("/media", mediaRouter);
router.use("/labels", labelsRouter);
router.use("/analytics", analyticsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
