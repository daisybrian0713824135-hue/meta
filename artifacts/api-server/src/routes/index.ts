import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import packagesRouter from "./packages";
import subscriptionsRouter from "./subscriptions";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import webhookRouter from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(packagesRouter);
router.use(subscriptionsRouter);
router.use(tasksRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(webhookRouter);

export default router;
