import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { workspacesRouter } from "./workspaces";
import { accountsRouter } from "./accounts";
import { postsRouter } from "./posts";
import { mediaRouter } from "./media";
import { labelsRouter } from "./labels";
import { analyticsRouter } from "./analytics";
import { dashboardRouter } from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/workspaces", workspacesRouter);
router.use("/accounts", accountsRouter);
router.use("/posts", postsRouter);
router.use("/media", mediaRouter);
router.use("/labels", labelsRouter);
router.use("/analytics", analyticsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
