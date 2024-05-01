import { Router } from "express";
const router = Router();
import * as analyticsController from "./analytics.controller.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";

router.get("/courses", isAuthenticated, analyticsController.coursesAnalytics);
export default router;
