import { Router } from "express";
const router = Router();
import * as analyticsController from "./analytics.authorization.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./analytics.authorization.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./analytics.authorization.js";

router.get(
  "/courses",
  isAuthenticated,
  // isAuthorized(["Instructor"]),
  // validation(validators.getCourseSchema),
  analyticsController.coursesAnalytics
);
export default router;
