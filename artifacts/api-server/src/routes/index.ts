import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sportsRouter from "./sports";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sportsRouter);
router.use(adminRouter);

export default router;
