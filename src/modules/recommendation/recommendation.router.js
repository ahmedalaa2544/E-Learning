import { Router } from "express";
const router = Router();
import * as recommendationController from "./recommendation.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./recommendation.validation.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./recommendation.authorization.js";
//
router.get("/", isAuthenticated, recommendationController.getRecommendations);
// Route to fetch personalized course recommendations for the user
router.get(
  "/recommendedForYou",
  isAuthenticated,
  recommendationController.recommendedForYou
);

// Route to get information about what similar learners to you are currently viewing
router.get(
  "/learnersAreViewing",
  isAuthenticated,
  recommendationController.learnersAreViewing
);

// Route to fetch course recommendations based on the last course viewed by the user
router.get(
  "/becauseYouViewed",
  isAuthenticated,
  recommendationController.becauseYouViewed
);

// Route to fetch course recommendations based on the last course wishlisted by the user
router.get(
  "/becauseYouWishlsted",
  isAuthenticated,
  recommendationController.becauseYouWishlsted
);

// Route to fetch course recommendations based on the last course purchased by the user
router.get(
  "/becauseYouPurchased",
  isAuthenticated,
  recommendationController.becauseYouPurchased
);

router.get(
  "/popularCourses/:categoryId",
  isAuthenticated,
  recommendationController.popularCourses
);

router.get(
  "/relatedCourses/:courseId",
  isAuthenticated,
  recommendationController.realtedCourses
);
// router.get(
//     "/becauseYouSearched",
//     isAuthenticated,
//     recommendationController.becauseYouSearched
//   );
export default router;
