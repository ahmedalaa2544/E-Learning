import { Router } from "express";
const router = Router();
import * as recommendationController from "./recommendation.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./recommendation.validation.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./recommendation.authorization.js";

router.get(
  "/",
  isAuthenticated,
  // validation(validators.getCourseSchema),
  recommendationController.getRecommendations
);
export default router;
