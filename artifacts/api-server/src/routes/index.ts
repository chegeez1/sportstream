import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sportsRouter from "./sports";
import adminRouter from "./admin";
import v1Router from "./v1";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sportsRouter);
router.use(adminRouter);
router.use("/v1", v1Router);

export default router;
